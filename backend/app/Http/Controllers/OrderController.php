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

class OrderController extends Controller
{
    // Get all orders for current user
    public function index()
    {
        try {
            $user = Auth::user();
            $orders = Order::with(['items.book' => function($query) {
                $query->select('id', 'title', 'author_name', 'price', 'images_url');
            }])
            ->where('user_id', $user->id)
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
                'payment_method' => 'required|in:card,paypal,cod',
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

            // Calculate shipping and tax
            $shippingCost = $subtotal > 50 ? 0 : 5.0;
            $taxAmount = $subtotal * 0.095; // 9.5% tax

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
                        $message = "Minimum order amount of $" . number_format($discountCode->minimum_amount, 2) . " required";
                    }
                    return response()->json(['error' => $message], 422);
                }
            }

            $totalAmount = $subtotal + $shippingCost + $taxAmount - $discountAmount;

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'total_amount' => $totalAmount,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'tax_amount' => $taxAmount,
                'discount_code_id' => $discountCode ? $discountCode->id : null,
                'discount_code' => $discountCode ? $discountCode->code : null,
                'discount_amount' => $discountAmount,
                'status' => 'pending',
                'payment_method' => $request->payment_method,
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

                // Increment usage count
                $discountCode->incrementUsage();
            }

            DB::commit();

            // Load the order with items for response
            $order->load(['items.book' => function($query) {
                $query->select('id', 'title', 'author_name', 'images_url');
            }]);

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to create order',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // View single order
    public function show($id)
    {
        try {
            $user = Auth::user();
            $order = Order::with(['items.book' => function($query) {
                $query->select('id', 'title', 'author_name', 'price', 'images_url');
            }])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

            if (!$order) {
                return response()->json(['error' => 'Order not found'], 404);
            }

            return response()->json([
                'message' => 'Order retrieved successfully',
                'order' => $order
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve order',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
