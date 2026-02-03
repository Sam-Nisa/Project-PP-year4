# QR Code Expiration Implementation Guide

This document details exactly where and how the 10-minute QR code expiration is implemented in both backend and frontend.

## Overview

QR codes expire exactly **10 minutes** after generation to prevent replay attacks and ensure payment security. The expiration is handled both server-side (Laravel) and client-side (Next.js).

## Backend Implementation (Laravel)

### 1. Environment Configuration

**File**: `backend/.env`
```env
BAKONG_QR_EXPIRATION_MINUTES=10
```

### 2. QR Generation with Expiration

**File**: `backend/app/Http/Controllers/BakongPaymentController.php`

**Location**: Line ~150 in `generateQRCode()` method

```php
public function generateQRCode(Request $request)
{
    // ... validation and setup code ...

    if ($result['success']) {
        // ⏰ SET QR EXPIRATION TO 10 MINUTES FROM NOW
        $expiresAt = now()->addMinutes(10);
        
        // Store QR info in cache with the pending order ID
        Cache::put("qr_data_{$orderId}", [
            'qr_string' => $result['qr_string'],
            'md5' => $result['md5'],
            'expires_at' => $expiresAt,  // ← EXPIRATION TIME STORED
            'amount' => $result['amount'],
            'currency' => $result['currency'],
            'account_id' => $bakongAccount['account_id'],
            'account_type' => $accountType,
            'reason' => $reason,
        ], $expiresAt);  // ← CACHE EXPIRES AT SAME TIME

        return response()->json([
            'success' => true,
            'message' => 'QR code generated successfully',
            'data' => [
                'qr_string' => $result['qr_string'],
                'md5' => $result['md5'],
                'amount' => $result['amount'],
                'currency' => $result['currency'],
                'order_id' => $orderId,
                'expires_at' => $expiresAt->toISOString(),  // ← SENT TO FRONTEND
                'bill_number' => $billNumber,
                'merchant_name' => $bakongAccount['merchant_name'],
                'author_account' => $bakongAccount['account_id'],
                'account_type' => $accountType,
                'reason' => $reason
            ]
        ]);
    }
}
```

### 3. Payment Status Check with Expiration Handling

**File**: `backend/app/Http/Controllers/BakongPaymentController.php`

**Location**: Line ~250 in `checkPaymentStatus()` method

```php
public function checkPaymentStatus(Request $request, $orderId)
{
    // ... setup code ...

    if (str_starts_with($orderId, 'pending_')) {
        $orderData = Cache::get("pending_order_{$orderId}");
        $qrData = Cache::get("qr_data_{$orderId}");
        
        if (!$qrData) {
            return response()->json([
                'success' => false,
                'message' => 'QR code not found or expired',
                'expired' => true  // ← EXPIRATION FLAG
            ], 410);
        }
        
        // ⏰ CHECK IF QR HAS EXPIRED
        if (now()->isAfter($qrData['expires_at'])) {
            // Clean up expired data
            Cache::forget("pending_order_{$orderId}");
            Cache::forget("qr_data_{$orderId}");
            
            return response()->json([
                'success' => false,
                'message' => 'Payment expired. Please try again.',
                'expired' => true  // ← EXPIRATION FLAG
            ], 410);
        }
        
        // ... continue with payment checking ...
    }
}
```

### 4. Cache Configuration

**File**: `backend/config/cache.php`

The cache system automatically handles expiration cleanup. When `Cache::put()` is called with an expiration time, Laravel automatically removes the data when it expires.

## Frontend Implementation (Next.js)

### 1. Checkout Page QR Modal

**File**: `frontend/app/(user)/checkout/page.jsx`

**Location**: Line ~280 in `generateQRCode()` function

```javascript
const generateQRCode = async (orderId) => {
    try {
        const response = await request(
            "/api/bakong/generate-qr",
            "POST",
            { order_id: orderId, currency: "USD" },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.success) {
            setQrData(response.data);

            // ⏰ CALCULATE REMAINING TIME FROM BACKEND expires_at
            const expiresAt = new Date(response.data.expires_at).getTime();
            const now = Date.now();
            const diffSeconds = Math.max(Math.floor((expiresAt - now) / 1000), 0);

            setTimeLeft(diffSeconds);  // ← SET COUNTDOWN TIMER

            setPaymentStatus("pending");
            startPaymentStatusCheck(orderId);
        }
    } catch (error) {
        // ... error handling ...
    }
};
```

**Location**: Line ~400 in `useEffect` for countdown timer

```javascript
useEffect(() => {
    if (!showQRModal || paymentStatus !== "pending") return;

    // ⏰ CHECK IF TIME EXPIRED
    if (timeLeft <= 0) {
        setPaymentStatus("failed");
        setPaymentError("QR code expired. Please generate a new QR code.");
        stopPaymentStatusCheck();
        return;
    }

    // ⏰ COUNTDOWN TIMER - DECREMENTS EVERY SECOND
    const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
}, [timeLeft, showQRModal, paymentStatus]);
```

**Location**: Line ~500 in `formatTime()` function

```javascript
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
};
```

**Location**: Line ~950 in QR Modal countdown display

```jsx
{/* Countdown Timer */}
<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p className="text-sm text-yellow-800 font-medium text-center">
        ⏳ QR expires in:{" "}
        <span className="font-bold text-yellow-900">
            {formatTime(timeLeft)}  {/* ← DISPLAYS COUNTDOWN */}
        </span>
    </p>
</div>
```

### 2. Payment Page Implementation

**File**: `frontend/app/(user)/payment/[orderId]/page.jsx`

**Location**: Line ~100 in `startPaymentStatusCheck()` function

```javascript
const startPaymentStatusCheck = () => {
    const interval = setInterval(() => {
        if (paymentStatus !== "completed") {
            checkPaymentStatus();
        } else {
            clearInterval(interval);
        }
    }, 5000); // Check every 5 seconds

    // ⏰ EXPIRATION TIMEOUT - 10 MINUTES
    const timeout = setTimeout(() => {
        clearInterval(interval);
        setError("Payment expired. Please generate a new QR code.");
        setQrData(null);
    }, 600000); // 10 minutes = 10 * 60 * 1000 ms

    return () => {
        clearInterval(interval);
        clearTimeout(timeout);
    };
};
```

## Expiration Flow Diagram

```
QR Generation (Backend)
├── Set expires_at = now() + 10 minutes
├── Store in cache with expiration
└── Send expires_at to frontend

Frontend Receives QR Data
├── Calculate remaining seconds
├── Start countdown timer (decrements every second)
├── Start payment polling (every 5 seconds)
└── Set 10-minute timeout

Every Second (Frontend)
├── Decrement timeLeft
├── Update countdown display
└── If timeLeft <= 0: Show expired message

Every 5 Seconds (Frontend)
├── Check payment status via API
├── Backend checks if QR expired
└── If expired: Return 410 status

Backend Cache Expiration
├── Laravel automatically removes expired cache
├── checkPaymentStatus returns "expired" error
└── Frontend handles 410 status code
```

## Key Timing Constants

| Component | Location | Value | Purpose |
|-----------|----------|-------|---------|
| Backend QR Expiration | `BakongPaymentController.php:150` | 10 minutes | Cache and QR validity |
| Frontend Countdown | `checkout/page.jsx:400` | 1 second | Timer update interval |
| Frontend Payment Check | `checkout/page.jsx:350` | 5 seconds | Status polling interval |
| Frontend Timeout | `payment/[orderId]/page.jsx:100` | 10 minutes | Fallback expiration |

## Error Messages

### Backend Error Messages

```json
{
  "success": false,
  "message": "QR code not found or expired",
  "expired": true
}
```

```json
{
  "success": false,
  "message": "Payment expired. Please try again.",
  "expired": true
}
```

### Frontend Error Messages

```javascript
// Countdown expired
"QR code expired. Please generate a new QR code."

// Timeout fallback
"Payment expired. Please generate a new QR code."

// Backend expiration response
"Payment expired. Please try again."
```

## Testing Expiration

### 1. Test Backend Expiration

```bash
# Generate QR code
curl -X POST http://localhost:8000/api/bakong/generate-qr \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "test123", "currency": "USD"}'

# Wait 10+ minutes, then check status
curl -X GET http://localhost:8000/api/bakong/payment-status/test123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should return 410 with expired: true
```

### 2. Test Frontend Countdown

```javascript
// In browser console, speed up timer for testing:
// Modify the countdown interval to 100ms instead of 1000ms
const timer = setInterval(() => {
    setTimeLeft(prev => prev - 1);
}, 100); // Fast countdown for testing
```

### 3. Test Cache Expiration

```php
// In Laravel tinker
php artisan tinker

>>> Cache::put('test_qr', ['data' => 'test'], now()->addSeconds(10));
>>> Cache::get('test_qr'); // Should return data
>>> // Wait 10+ seconds
>>> Cache::get('test_qr'); // Should return null
```

## Troubleshooting Expiration Issues

### 1. QR Expires Too Quickly

**Check**: Server timezone vs frontend timezone
```bash
# Backend timezone
php artisan tinker
>>> now()->toISOString()

# Frontend timezone
console.log(new Date().toISOString())
```

### 2. QR Never Expires

**Check**: Cache configuration and expiration logic
```bash
# Check cache driver
php artisan config:show cache.default

# Check if cache is working
php artisan tinker
>>> Cache::put('test', 'value', now()->addSeconds(5));
>>> Cache::get('test');
```

### 3. Countdown Shows Wrong Time

**Check**: expires_at parsing in frontend
```javascript
// Debug expires_at parsing
console.log('Backend expires_at:', response.data.expires_at);
console.log('Parsed date:', new Date(response.data.expires_at));
console.log('Current time:', new Date());
console.log('Diff seconds:', diffSeconds);
```

## Security Considerations

1. **Server-side Validation**: Always validate expiration on backend
2. **Cache Cleanup**: Expired QR data is automatically removed
3. **No Client Trust**: Frontend countdown is for UX only
4. **Atomic Operations**: Cache operations are atomic to prevent race conditions
5. **Secure Cleanup**: Expired orders and QR data are properly cleaned up

## Performance Notes

1. **Cache Efficiency**: Laravel cache handles expiration efficiently
2. **Memory Usage**: Expired cache entries are automatically garbage collected
3. **Database Impact**: No database queries for expiration checking
4. **Network Traffic**: Minimal - only status checks every 5 seconds
5. **Client Resources**: Single timer per QR code, cleaned up on expiration