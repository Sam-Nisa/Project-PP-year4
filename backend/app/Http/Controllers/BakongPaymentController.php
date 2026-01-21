<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\BakongPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
                'order_id' => 'required|exists:orders,id',
                'currency' => 'sometimes|in:USD,KHR',
            ]);

            $user = Auth::user();
            $order = Order::where('id', $validated['order_id'])
                         ->where('user_id', $user->id)
                         ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Generate QR code
            $currency = $validated['currency'] ?? 'USD';
            $billNumber = 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT);
            $storeLabel = config('app.name', 'Bookstore');

            $result = $this->bakongService->generateQRCode(
                (float) $order->total_amount,
                $currency,
                $billNumber,
                $storeLabel
            );

            if ($result['success']) {
                // Set QR expiration to 10 minutes from now
                $expiresAt = now()->addMinutes(10);
                
                // Update order with QR info and expiration
                $order->update([
                    'payment_qr_code' => $result['qr_string'],
                    'payment_qr_md5' => $result['md5'],
                    'qr_expires_at' => $expiresAt,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'QR code generated successfully',
                    'data' => [
                        'qr_string' => $result['qr_string'],
                        'md5' => $result['md5'],
                        'amount' => $result['amount'],
                        'currency' => $result['currency'],
                        'order_id' => $order->id,
                        'expires_at' => $expiresAt->toISOString(),
                        'bill_number' => $billNumber
                    ]
                ]);
            }

            // Log the error for debugging
            Log::error('Bakong QR Generation Failed', [
                'result' => $result,
                'order_id' => $order->id,
                'amount' => $order->total_amount
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
            $order = Order::where('id', $orderId)
                         ->where('user_id', $user->id)
                         ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            // Check if QR code has expired (10 minutes)
            if ($order->qr_expires_at && $order->qr_expires_at->isPast()) {
                // Delete the expired order if payment is still pending
                if ($order->payment_status === 'pending' || !$order->payment_transaction_id) {
                    $order->items()->delete();
                    $order->delete();
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Payment expired. Order has been cancelled and removed.',
                        'expired' => true
                    ], 410); // 410 Gone
                }
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

            if (!$order->payment_qr_md5) {
                return response()->json([
                    'success' => false,
                    'message' => 'No payment QR code found for this order'
                ], 400);
            }

            // Check transaction status
            $result = $this->bakongService->checkTransactionByMD5($order->payment_qr_md5, false);

            Log::info('Payment check result', ['result' => $result]);

            if ($result['success'] && isset($result['transaction'])) {
                $transaction = $result['transaction'];

                Log::info('Transaction found', ['transaction' => $transaction]);

                // Update order when payment is successful
                if (isset($transaction['status']) && $transaction['status'] === 'COMPLETED') {
                    Log::info('Payment COMPLETED! Updating order', ['order_id' => $orderId]);
                    
                    $order->update([
                        'payment_status' => 'completed', // Mark payment as completed
                        'payment_transaction_id' => $transaction['transactionId'] ?? null,
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Payment completed successfully',
                        'data' => [
                            'order_status' => 'paid',
                            'payment_status' => 'completed',
                            'transaction' => $transaction
                        ]
                    ]);
                }
            }

            Log::info('Payment not found yet (normal)');

            // Payment not found yet - return pending status
            return response()->json([
                'success' => true,
                'message' => 'Payment not completed yet',
                'data' => [
                    'order_status' => $order->status,
                    'payment_status' => $order->payment_status, // Show actual payment status
                    'payment_found' => false,
                    'expires_at' => $order->qr_expires_at ? $order->qr_expires_at->toISOString() : null,
                    'is_expired' => $order->qr_expires_at ? $order->qr_expires_at->isPast() : false
                ]
            ], 200);

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