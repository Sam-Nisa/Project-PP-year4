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
                'payment_method' => 'required|in:card,paypal,cod,bakong',
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
                        $message = "Minimum order amount of $" . number_format($discountCode->minimum_amount, 2) . " required";
                    }
                    return response()->json(['error' => $message], 422);
                }
            }

            $totalAmount = $subtotal + $shippingCost + $taxAmount - $discountAmount;

            // Create order with 'paid' status but payment_status as 'pending'
            $order = Order::create([
                'user_id' => $user->id,
                'total_amount' => $totalAmount,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'tax_amount' => $taxAmount,
                'discount_code_id' => $discountCode ? $discountCode->id : null,
                'discount_code' => $discountCode ? $discountCode->code : null,
                'discount_amount' => $discountAmount,
                'status' => 'paid',
                'payment_method' => $request->payment_method,
                'payment_status' => 'pending', // Payment not confirmed yet
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

    // Delete order (User can only delete their own orders)
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $order = Order::where('id', $id)
                         ->where('user_id', $user->id)
                         ->first();

            if (!$order) {
                return response()->json(['error' => 'Order not found'], 404);
            }

            // Only allow deletion of orders with pending payment or cancelled orders
            if (!in_array($order->status, ['cancelled']) && $order->payment_status !== 'pending') {
                return response()->json([
                    'error' => 'Cannot delete orders that have been paid or are being processed'
                ], 422);
            }

            // Delete order items first
            $order->items()->delete();
            
            // Delete the order
            $order->delete();

            return response()->json([
                'message' => 'Order deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete order',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Get all orders for admin (sales tracking)
    public function adminIndex(Request $request)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $query = Order::with(['user:id,name,email', 'items.book:id,title,author_name,price,images_url']);

            // Filter by status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter by payment method
            if ($request->has('payment_method') && $request->payment_method !== 'all') {
                $query->where('payment_method', $request->payment_method);
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Search by order ID or user name
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhereHas('user', function($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            $orders = $query->orderBy('created_at', 'desc')->paginate(20);

            // Calculate statistics
            $stats = [
                'total_orders' => Order::count(),
                'total_revenue' => Order::whereIn('status', ['delivered', 'paid'])->sum('total_amount'),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'completed_orders' => Order::whereIn('status', ['delivered', 'paid'])->count(),
            ];

            return response()->json([
                'message' => 'Orders retrieved successfully',
                'orders' => $orders,
                'stats' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve orders',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Get sales for author (their books only)
    public function authorSales(Request $request)
    {
        try {
            $user = Auth::user();
            
            if ($user->role !== 'author') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Get all order items for books authored by this user
            $query = OrderItem::with(['order.user:id,name,email', 'book:id,title,author_name,price,images_url'])
                ->whereHas('book', function($q) use ($user) {
                    $q->where('author_id', $user->id);
                })
                ->whereHas('order', function($q) {
                    $q->whereIn('status', ['processing', 'shipped', 'delivered', 'paid']);
                });

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereHas('order', function($q) use ($request) {
                    $q->whereDate('created_at', '>=', $request->start_date);
                });
            }
            if ($request->has('end_date')) {
                $query->whereHas('order', function($q) use ($request) {
                    $q->whereDate('created_at', '<=', $request->end_date);
                });
            }

            $sales = $query->orderBy('created_at', 'desc')->paginate(20);

            // Calculate statistics
            $totalRevenue = OrderItem::whereHas('book', function($q) use ($user) {
                $q->where('author_id', $user->id);
            })
            ->whereHas('order', function($q) {
                $q->whereIn('status', ['delivered', 'paid']);
            })
            ->sum('total');

            $totalSold = OrderItem::whereHas('book', function($q) use ($user) {
                $q->where('author_id', $user->id);
            })
            ->whereHas('order', function($q) {
                $q->whereIn('status', ['delivered', 'paid']);
            })
            ->sum('quantity');

            $stats = [
                'total_revenue' => $totalRevenue,
                'total_books_sold' => $totalSold,
                'total_orders' => $sales->total(),
            ];

            return response()->json([
                'message' => 'Sales retrieved successfully',
                'sales' => $sales,
                'stats' => $stats
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve sales',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
