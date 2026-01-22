<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\BakongPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class BakongPaymentController extends Controller
{
    protected $bakongService;

    public function __construct(BakongPaymentService $bakongService)
    {
        $this->bakongService = $bakongService;
    }

    /**
     * Generate Bakong QR code for an order
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateQRCode(Request $request)
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|string', // Now accepts pending order IDs
                'currency' => 'sometimes|in:USD,KHR',
            ]);

            $user = Auth::user();
            $orderId = $validated['order_id'];
            
            // Check if this is a pending order (cached)
            if (str_starts_with($orderId, 'pending_')) {
                $orderData = Cache::get("pending_order_{$orderId}");
                
                if (!$orderData || $orderData['user_id'] !== $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pending order not found or expired'
                    ], 404);
                }
                
                $totalAmount = $orderData['total_amount'];
            } else {
                // Regular order lookup (for backward compatibility)
                $order = Order::where('id', $orderId)
                             ->where('user_id', $user->id)
                             ->first();

                if (!$order) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Order not found'
                    ], 404);
                }
                
                $totalAmount = $order->total_amount;
            }

            // Generate QR code
            $currency = $validated['currency'] ?? 'USD';
            $billNumber = 'ORD-' . str_replace('pending_', '', $orderId);
            $storeLabel = config('app.name', 'Bookstore');

            $result = $this->bakongService->generateQRCode(
                (float) $totalAmount,
                $currency,
                $billNumber,
                $storeLabel
            );

            if ($result['success']) {
                // Set QR expiration to 10 minutes from now
                $expiresAt = now()->addMinutes(10);
                
                // Store QR info in cache with the pending order ID
                Cache::put("qr_data_{$orderId}", [
                    'qr_string' => $result['qr_string'],
                    'md5' => $result['md5'],
                    'expires_at' => $expiresAt,
                    'amount' => $result['amount'],
                    'currency' => $result['currency'],
                ], $expiresAt);

                return response()->json([
                    'success' => true,
                    'message' => 'QR code generated successfully',
                    'data' => [
                        'qr_string' => $result['qr_string'],
                        'md5' => $result['md5'],
                        'amount' => $result['amount'],
                        'currency' => $result['currency'],
                        'order_id' => $orderId,
                        'expires_at' => $expiresAt->toISOString(),
                        'bill_number' => $billNumber
                    ]
                ]);
            }

            // Log the error for debugging
            Log::error('Bakong QR Generation Failed', [
                'result' => $result,
                'order_id' => $orderId,
                'amount' => $totalAmount
            ]);

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to generate QR code',
                'error' => $result['error'] ?? 'Unknown error',
                'debug' => config('app.debug') ? $result : null
            ], 500);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('QR Generation Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while generating QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check payment status for an order
     * 
     * @param Request $request
     * @param int $orderId
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkPaymentStatus(Request $request, $orderId)
    {
        try {
            $user = Auth::user();
            
            // Check if this is a pending order
            if (str_starts_with($orderId, 'pending_')) {
                $orderData = Cache::get("pending_order_{$orderId}");
                $qrData = Cache::get("qr_data_{$orderId}");
                
                if (!$orderData || $orderData['user_id'] !== $user->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pending order not found or expired',
                        'expired' => true
                    ], 410);
                }
                
                if (!$qrData) {
                    return response()->json([
                        'success' => false,
                        'message' => 'QR code not found or expired',
                        'expired' => true
                    ], 410);
                }
                
                // Check if QR has expired
                if (now()->isAfter($qrData['expires_at'])) {
                    // Clean up expired data
                    Cache::forget("pending_order_{$orderId}");
                    Cache::forget("qr_data_{$orderId}");
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Payment expired. Please try again.',
                        'expired' => true
                    ], 410);
                }
                
                // Check transaction status using MD5
                $result = $this->bakongService->checkTransactionByMD5($qrData['md5'], false);
                
                if ($result['success'] && isset($result['transaction'])) {
                    $transaction = $result['transaction'];
                    
                    if (isset($transaction['status']) && $transaction['status'] === 'COMPLETED') {
                        Log::info('Payment COMPLETED! Creating order from pending data', ['pending_order_id' => $orderId]);
                        
                        // Create the actual order
                        $orderController = new OrderController();
                        $order = $orderController->createFromPendingOrder($orderId, $transaction['transactionId'] ?? null);
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'Payment completed successfully',
                            'data' => [
                                'order_id' => $order->id,
                                'order_status' => 'paid',
                                'payment_status' => 'completed',
                                'transaction' => $transaction
                            ]
                        ]);
                    }
                }
                
                // Payment not completed yet
                return response()->json([
                    'success' => true,
                    'message' => 'Payment not completed yet',
                    'data' => [
                        'payment_found' => false,
                        'expires_at' => $qrData['expires_at']->toISOString(),
                        'is_expired' => false
                    ]
                ], 200);
            }
            
            // Handle regular orders (for backward compatibility)
            $order = Order::where('id', $orderId)
                         ->where('user_id', $user->id)
                         ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // If payment is already completed, return success
            if ($order->payment_status === 'completed' && $order->payment_transaction_id) {
                return response()->json([
                    'success' => true,
                    'message' => 'Payment already completed',
                    'data' => [
                        'order_status' => 'paid',
                        'payment_status' => 'completed',
                        'transaction_id' => $order->payment_transaction_id
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Order found but payment not completed'
            ], 400);

        } catch (\Exception $e) {
            Log::error('Payment Status Check Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while checking payment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify Bakong account
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyAccount(Request $request)
    {
        try {
            $validated = $request->validate([
                'account_id' => 'required|string'
            ]);

            $exists = $this->bakongService->checkAccountExists($validated['account_id']);

            return response()->json([
                'success' => true,
                'exists' => $exists,
                'message' => $exists ? 'Account exists' : 'Account not found'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while verifying account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Decode QR code
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function decodeQRCode(Request $request)
    {
        try {
            $validated = $request->validate([
                'qr_string' => 'required|string'
            ]);

            $result = $this->bakongService->decodeQRCode($validated['qr_string']);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data']
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while decoding QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Renew Bakong API token (Admin only)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function renewToken(Request $request)
    {
        try {
            // Check if user is admin
            $user = Auth::user();
            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $validated = $request->validate([
                'email' => 'required|email'
            ]);

            $result = $this->bakongService->renewToken($validated['email']);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'token' => $result['token']
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while renewing token',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}