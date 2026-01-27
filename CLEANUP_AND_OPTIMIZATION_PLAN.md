# Database Cleanup and Payment Process Optimization

## 🗑️ Files and Tables to Remove

### 1. Unused Database Tables and Migrations

#### Tables to Drop:
- `coupons` - Not implemented (returns 501 errors)
- `order_coupons` - Not implemented (returns 501 errors)
- `inventory_logs` - Not being used in current implementation
- `personal_access_tokens` - Using JWT instead

#### Unused Migration Files to Remove:
- `2025_10_06_065249_create_coupons_table.php`
- `2025_10_06_065457_create_order_coupons_table.php`
- `2025_10_06_065708_create_inventory_logs_table.php`
- `2025_10_02_091653_create_personal_access_tokens_table.php`

#### Redundant/Conflicting Migrations:
- `2026_01_21_084728_update_order_status_enum_for_processing_default.php`
- `2026_01_21_090052_revert_to_paid_status_default.php`
- `2026_01_21_091845_add_paid_status_back_to_orders.php`
- `2026_01_22_071822_update_orders_status_enum_add_temporary.php`

### 2. Unused Order Fields

Since we're using cache-based approach, these fields are no longer needed:
- `payment_qr_code` - QR stored in cache now
- `qr_expires_at` - Expiration handled by cache
- `payment_qr_md5` - MD5 stored in cache now

### 3. Unused Controller Files
- `CouponController.php` - Not implemented
- `OrderCouponController.php` - Not implemented
- `InventoryLogController.php` - Not being used

## 🚀 Performance Optimizations

### 1. Database Optimizations

#### Add Strategic Indexes:
```sql
-- Orders table indexes for faster queries
ALTER TABLE orders ADD INDEX idx_user_status_payment (user_id, status, payment_status);
ALTER TABLE orders ADD INDEX idx_created_at (created_at);

-- Books table indexes for search and filtering
ALTER TABLE books ADD INDEX idx_title_author (title, author_name);
ALTER TABLE books ADD INDEX idx_genre_price (genre_id, price);

-- Cart optimization
ALTER TABLE cart_items ADD INDEX idx_user_book (user_id, book_id);
```

#### Optimize Order Queries:
```php
// Instead of loading all relationships, only load what's needed
Order::select('id', 'user_id', 'total_amount', 'status', 'payment_status', 'created_at')
    ->with(['items:id,order_id,book_id,quantity,price', 'items.book:id,title,author_name,images_url'])
    ->where('user_id', $userId)
    ->where('status', 'paid')
    ->where('payment_status', 'completed')
    ->orderBy('created_at', 'desc')
    ->get();
```

### 2. Cache Optimizations

#### Implement Redis for Better Performance:
```env
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

#### Cache Frequently Accessed Data:
```php
// Cache book data for 1 hour
$books = Cache::remember('books.popular', 3600, function () {
    return Book::with('genre')->where('is_featured', true)->get();
});

// Cache user cart for 30 minutes
$cart = Cache::remember("cart.user.{$userId}", 1800, function () use ($userId) {
    return Cart::with('items.book')->where('user_id', $userId)->first();
});
```

### 3. API Response Optimizations

#### Reduce Payload Size:
```php
// Only return necessary fields
return response()->json([
    'orders' => $orders->map(function ($order) {
        return [
            'id' => $order->id,
            'total_amount' => $order->total_amount,
            'status' => $order->status,
            'created_at' => $order->created_at->format('Y-m-d H:i:s'),
            'items_count' => $order->items->count(),
            'items' => $order->items->map(function ($item) {
                return [
                    'book_title' => $item->book->title,
                    'quantity' => $item->quantity,
                    'price' => $item->price
                ];
            })
        ];
    })
]);
```

### 4. Payment Process Optimizations

#### Reduce Polling Frequency:
```javascript
// Smart polling: start fast, then slow down
let pollCount = 0;
const pollPayment = () => {
    const interval = pollCount < 6 ? 2000 : // First 6 checks: every 2 seconds
                    pollCount < 20 ? 5000 : // Next 14 checks: every 5 seconds  
                    10000; // After that: every 10 seconds
    
    setTimeout(checkPaymentStatus, interval);
    pollCount++;
};
```

#### Optimize QR Generation:
```php
// Cache merchant info to avoid recreating
private static $merchantInfoCache = null;

public function generateQRCode($amount, $currency, $billNumber, $storeLabel)
{
    if (!self::$merchantInfoCache) {
        self::$merchantInfoCache = [
            'bakongAccountID' => $this->bakongAccountId,
            'merchantName' => $this->merchantName,
            'merchantCity' => $this->merchantCity,
            'merchantID' => $this->getMerchantId(),
            'acquiringBank' => $this->getAcquiringBank(),
        ];
    }
    
    $merchantInfo = new MerchantInfo(
        ...self::$merchantInfoCache,
        currency: $currency === 'USD' ? KHQRData::CURRENCY_USD : KHQRData::CURRENCY_KHR,
        amount: $amount,
        billNumber: $billNumber,
        storeLabel: $storeLabel
    );
    
    // ... rest of the method
}
```

## 🛠️ Implementation Steps

### Step 1: Remove Unused Tables and Files
### Step 2: Optimize Database Schema
### Step 3: Implement Caching Strategy
### Step 4: Optimize API Responses
### Step 5: Improve Payment Polling

## 📊 Expected Performance Improvements

- **Database Queries**: 40-60% faster with proper indexes
- **API Response Time**: 30-50% faster with optimized queries
- **Payment Verification**: 20-30% faster with smart polling
- **Memory Usage**: 25-35% reduction by removing unused data
- **Storage**: 15-20% reduction by removing unused tables

## 🔧 Monitoring and Maintenance

### Add Performance Monitoring:
```php
// Log slow queries
DB::listen(function ($query) {
    if ($query->time > 1000) { // Log queries taking more than 1 second
        Log::warning('Slow Query', [
            'sql' => $query->sql,
            'time' => $query->time,
            'bindings' => $query->bindings
        ]);
    }
});
```

### Cache Monitoring:
```php
// Monitor cache hit rates
$cacheStats = [
    'hits' => Cache::get('cache.hits', 0),
    'misses' => Cache::get('cache.misses', 0),
    'hit_rate' => Cache::get('cache.hits', 0) / (Cache::get('cache.hits', 0) + Cache::get('cache.misses', 1)) * 100
];
```