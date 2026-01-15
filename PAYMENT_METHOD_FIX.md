# Payment Method Error Fix

## Problem
API was returning error: `{"payment_method": ["The selected payment method is invalid."]}`

## Root Cause
The `payment_method` validation in `OrderController.php` only allowed: `card`, `paypal`, `cod`

But the frontend was sending `bakong` as the payment method.

Additionally, the database `orders` table had an enum that didn't include `bakong` or `card`.

## Solution

### 1. Updated OrderController Validation
**File:** `backend/app/Http/Controllers/OrderController.php`

**Before:**
```php
'payment_method' => 'required|in:card,paypal,cod',
```

**After:**
```php
'payment_method' => 'required|in:card,paypal,cod,bakong',
```

### 2. Updated Database Enum
**Created Migration:** `2026_01_15_093710_add_bakong_to_payment_method_in_orders_table.php`

**Before:**
```sql
ENUM('cod', 'paypal', 'stripe', 'bank')
```

**After:**
```sql
ENUM('cod', 'paypal', 'stripe', 'bank', 'bakong', 'card')
```

## How to Apply

### Step 1: Run Migration
```bash
cd backend
php artisan migrate
```

### Step 2: Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
```

### Step 3: Test
1. Add items to cart
2. Go to checkout
3. Select "Bakong QR" payment method
4. Complete checkout
5. Should redirect to payment page successfully

## Verification

### Check Database
```sql
SHOW COLUMNS FROM orders WHERE Field = 'payment_method';
```

Should show:
```
Type: enum('cod','paypal','stripe','bank','bakong','card')
```

### Test API
```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "bakong",
    "shipping_address": {
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com",
      "address": "123 Test St",
      "city": "Test City",
      "zip_code": "12345"
    }
  }'
```

Should return success (not validation error).

## Supported Payment Methods

After this fix, the following payment methods are supported:
- ✅ `bakong` - Bakong QR Payment (Primary)
- ✅ `card` - Credit/Debit Card
- ✅ `paypal` - PayPal
- ✅ `cod` - Cash on Delivery
- ✅ `stripe` - Stripe (if configured)
- ✅ `bank` - Bank Transfer (if configured)

## Status
✅ **FIXED** - Migration applied successfully
