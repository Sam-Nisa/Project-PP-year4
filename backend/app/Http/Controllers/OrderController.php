<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\Book;
use App\Models\DiscountCode;
use App\Models\DiscountCodeUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    // Get all orders for current user
    public function index()
    {
        try {
            $user = Auth::user();
            // Only show orders that are paid AND payment is completed
            $orders = Order::with(['items.book' => function($query) {
                $query->select('id', 'title', 'author_name', 'price', 'images_url');
            }])
            ->where('user_id', $user->id)
            ->where('status', 'paid')
            ->where('payment_status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json([
                'message' => 'Orders retrieved successfully',
                'orders' => $orders
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve orders',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Create a new order from cart
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            $request->validate([
                'payment_method' => 'required|in:bakong', // Only allow Bakong
                'discount_code' => 'nullable|string',
                'shipping_address' => 'required|array',
                'shipping_address.first_name' => 'required|string|max:255',
                'shipping_address.last_name' => 'required|string|max:255',
                'shipping_address.email' => 'required|email',
                'shipping_address.address' => 'required|string|max:500',
                'shipping_address.city' => 'required|string|max:255',
                'shipping_address.zip_code' => 'required|string|max:20',
            ]);

            // Get user's cart
            $cart = Cart::with('items.book')->where('user_id', $user->id)->first();

            if (!$cart || $cart->items->isEmpty()) {
                return response()->json([
                    'error' => 'Cart is empty'
                ], 400);
            }

            DB::beginTransaction();

            // Calculate totals
            $subtotal = 0;
            $orderItems = [];

            foreach ($cart->items as $cartItem) {
                $book = $cartItem->book;
                
                // Check stock availability
                if ($book->stock < $cartItem->quantity) {
                    DB::rollBack();
                    return response()->json([
                        'error' => "Insufficient stock for {$book->title}",
                        'available_stock' => $book->stock
                    ], 400);
                }

                // Calculate price with discount
                $price = floatval($book->price);
                $discountValue = floatval($book->discount_value ?? 0);
                $discountType = $book->discount_type;

                $finalPrice = $price;
                if ($discountType === 'percentage' && $discountValue > 0) {
                    $finalPrice = $price - ($price * $discountValue / 100);
                } elseif ($discountType === 'fixed' && $discountValue > 0) {
                    $finalPrice = max(0, $price - $discountValue);
                }

                $itemTotal = $finalPrice * $cartItem->quantity;
                $subtotal += $itemTotal;

                $orderItems[] = [
                    'book_id' => $book->id,
                    'quantity' => $cartItem->quantity,
                    'price' => $finalPrice,
                    'total' => $itemTotal
                ];
            }

            // Calculate shipping and tax - FREE SHIPPING
            $shippingCost = 0;
            $taxAmount = 0; // No tax

            // Handle discount code if provided
            $discountCode = null;
            $discountAmount = 0;
            
            if ($request->discount_code) {
                $discountCode = DiscountCode::where('code', strtoupper($request->discount_code))->first();
                
                if (!$discountCode || !$discountCode->canBeUsedByUser($user->id)) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'Invalid or expired discount code'
                    ], 422);
                }

                $discountAmount = $discountCode->calculateDiscount($subtotal);
                
                if ($discountAmount <= 0) {
                    DB::rollBack();
                    $message = 'Discount code is valid but no discount applied';
                    if ($discountCode->minimum_amount && $subtotal < $discountCode->minimum_amount) {
                        $message = "Minimum order amount of $" . number_format((float)$discountCode->minimum_amount, 2) . " required";
                    }
                    return response()->json(['error' => $message], 422);
                }
            }

            $totalAmount = $subtotal + $shippingCost + $taxAmount - $discountAmount;

            // For Bakong payment - store order data in cache, don't create order yet
            if ($request->payment_method === 'bakong') {
                // Generate a unique pending order ID
                $pendingOrderId = 'pending_' . time() . '_' . $user->id;
                
                // Store order data in cache for 15 minutes
                $orderData = [
                    'user_id' => $user->id,
                    'total_amount' => $totalAmount,
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'tax_amount' => $taxAmount,
                    'discount_code_id' => $discountCode?->id,
                    'discount_code' => $discountCode?->code,
                    'discount_amount' => $discountAmount,
                    'payment_method' => $request->payment_method,
                    'shipping_address' => $request->shipping_address,
                    'order_items' => $orderItems,
                    'cart_id' => $cart->id,
                ];
                
                Cache::put("pending_order_{$pendingOrderId}", $orderData, now()->addMinutes(15));
                
                DB::commit();
                
                return response()->json([
                    'message' => 'Order prepared for payment',
                    'order' => [
                        'id' => $pendingOrderId,
                        'total_amount' => $totalAmount,
                        'payment_method' => $request->payment_method,
                        'items' => $orderItems
                    ]
                ], 201);
            }

            // For other payment methods - create order immediately (assumed paid)
            $order = Order::create([
                'user_id' => $user->id,
                'total_amount' => $totalAmount,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'tax_amount' => $taxAmount,
                'discount_code_id' => $discountCode?->id,
                'discount_code' => $discountCode?->code,
                'discount_amount' => $discountAmount,
                'status' => 'paid',
                'payment_method' => $request->payment_method,
                'payment_status' => 'completed',
                'shipping_address' => json_encode($request->shipping_address),
            ]);

            // Create order items and update stock
            foreach ($orderItems as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'book_id' => $itemData['book_id'],
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'total' => $itemData['total']
                ]);

                // Update book stock
                $book = Book::find($itemData['book_id']);
                $book->decrement('stock', $itemData['quantity']);
            }

            // Clear the cart
            $cart->items()->delete();

            // Handle discount code usage
            if ($discountCode && $discountAmount > 0) {
                // Record the usage
                DiscountCodeUsage::create([
                    'discount_code_id' => $discountCode->id,
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'discount_amount' => $discountAmount,
                ]);

                // Update usage count
                $discountCode->increment('used_count');
            }

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->load('items.book')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order creation failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to create order',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create order from cached data when Bakong payment is completed
     */
    public function createFromPendingOrder($pendingOrderId, $transactionId = null)
    {
        try {
            // Get cached order data
            $orderData = Cache::get("pending_order_{$pendingOrderId}");
            
            if (!$orderData) {
                throw new \Exception('Pending order data not found or expired');
            }

            DB::beginTransaction();

            // Create the actual order
            $order = Order::create([
                'user_id' => $orderData['user_id'],
                'total_amount' => $orderData['total_amount'],
                'subtotal' => $orderData['subtotal'],
                'shipping_cost' => $orderData['shipping_cost'],
                'tax_amount' => $orderData['tax_amount'],
                'discount_code_id' => $orderData['discount_code_id'],
                'discount_code' => $orderData['discount_code'],
                'discount_amount' => $orderData['discount_amount'],
                'status' => 'paid',
                'payment_method' => $orderData['payment_method'],
                'payment_status' => 'completed',
                'payment_transaction_id' => $transactionId,
                'shipping_address' => json_encode($orderData['shipping_address']),
            ]);

            // Create order items and update stock
            foreach ($orderData['order_items'] as $itemData) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'book_id' => $itemData['book_id'],
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'total' => $itemData['total']
                ]);

                // Update book stock
                $book = Book::find($itemData['book_id']);
                $book->decrement('stock', $itemData['quantity']);
            }

            // Clear the cart
            $cart = Cart::find($orderData['cart_id']);
            if ($cart) {
                $cart->items()->delete();
            }

            // Handle discount code usage
            if ($orderData['discount_code_id'] && $orderData['discount_amount'] > 0) {
                DiscountCodeUsage::create([
                    'discount_code_id' => $orderData['discount_code_id'],
                    'user_id' => $orderData['user_id'],
                    'order_id' => $order->id,
                    'discount_amount' => $orderData['discount_amount'],
                ]);

                $discountCode = DiscountCode::find($orderData['discount_code_id']);
                if ($discountCode) {
                    $discountCode->increment('used_count');
                }
            }

            // Remove cached data
            Cache::forget("pending_order_{$pendingOrderId}");

            DB::commit();

            return $order->load('items.book');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create order from pending: ' . $e->getMessage());
            throw $e;
        }
    }
}