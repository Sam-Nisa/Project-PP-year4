# Payment Process Fix - Complete Implementation

## Problem Statement
Orders were being created and stored in the database immediately when checkout was submitted, even before payment confirmation. This meant incomplete/failed payments would show up in user order history, which was not the desired behavior.

## Solution Overview
Implemented a **temporary order system** where:
1. Bakong orders are created with `status='temporary'` until payment is confirmed
2. Only confirmed orders (non-temporary) appear in order history
3. Temporary and expired orders are automatically cleaned up from the database
4. Orders are only confirmed when payment is successfully completed

## Changes Made

### 1. Database Schema Updates
- **Migration**: `2026_01_22_071822_update_orders_status_enum_add_temporary.php`
- Added `'temporary'` to the orders status enum
- This allows orders to exist in a temporary state before payment confirmation

### 2. Order Creation Logic (`OrderController.php`)
```php
// Before: All orders created with status='paid'
'status' => 'paid',
'payment_status' => 'pending',

// After: Bakong orders start as temporary
$orderStatus = $request->payment_method === 'bakong' ? 'temporary' : 'paid';
$paymentStatus = $request->payment_method === 'bakong' ? 'pending' : 'completed';
```

### 3. Order Model Updates (`Order.php`)
- Added new scopes:
  - `scopeConfirmed()` - Excludes temporary orders
  - `scopeTemporary()` - Gets only temporary orders
- Updated existing scopes for better cleanup logic

### 4. Order History Filtering (`OrderController::index()`)
```php
// Only show confirmed orders in user order history
$orders = Order::with(['items.book'])
    ->where('user_id', $user->id)
    ->confirmed() // NEW: Excludes temporary orders
    ->orderBy('created_at', 'desc')
    ->get();
```

### 5. Payment Confirmation (`BakongPaymentController.php`)
```php
// When payment is confirmed, convert temporary order to confirmed
$order->update([
    'status' => 'paid', // NEW: Confirm the order
    'payment_status' => 'completed',
    'payment_transaction_id' => $transaction['transactionId'] ?? null,
]);
```

### 6. Enhanced Cleanup System (`CleanupExpiredOrders.php`)
- Now cleans up both expired QR orders AND temporary orders
- Temporary orders older than 1 hour are automatically deleted
- Better logging and error handling
- Handles both types of cleanup in one command

### 7. Frontend Error Handling (`checkout/page.jsx`)
- Added handling for HTTP 410 (Gone) when orders are deleted due to expiration
- Better user feedback when payment expires
- Graceful error messages for different failure scenarios

## Payment Flow - Before vs After

### Before (Problematic)
1. User submits checkout → Order created with `status='paid'`
2. Order immediately appears in order history
3. If payment fails/expires → Order remains in database and history
4. User sees failed orders in their order history

### After (Fixed)
1. User submits checkout → Order created with `status='temporary'`
2. Order does NOT appear in order history yet
3. User scans QR and pays → Order updated to `status='paid'`
4. Order now appears in order history
5. If payment fails/expires → Order is deleted from database
6. User only sees successfully paid orders in history

## Database States

### Order Status Flow
```
Bakong Payment:
temporary → paid (on successful payment)
temporary → deleted (on expiration/failure)

Other Payments:
paid (immediate, assumed successful)
```

### Cleanup Criteria
Orders are deleted if they meet ANY of these conditions:
1. **Expired QR**: `qr_expires_at < now()` AND `payment_status = 'pending'` AND no transaction ID
2. **Old Temporary**: `status = 'temporary'` AND `created_at < 1 hour ago`

## Testing the Implementation

### 1. Test Order Creation
```bash
# Create a Bakong order - should be temporary
POST /api/orders with payment_method=bakong
# Check database: status should be 'temporary'
```

### 2. Test Order History
```bash
# Get user orders - temporary orders should not appear
GET /api/orders
# Should only return confirmed orders
```

### 3. Test Payment Confirmation
```bash
# Simulate successful payment
# Order status should change from 'temporary' to 'paid'
```

### 4. Test Cleanup
```bash
php artisan orders:cleanup-expired
# Should remove expired and old temporary orders
```

## Configuration Requirements

### Scheduled Task Setup
Add to your cron/task scheduler:
```bash
# Run cleanup every 15 minutes
*/15 * * * * php /path/to/artisan orders:cleanup-expired
```

### Environment Variables
Ensure these Bakong settings are configured:
```env
BAKONG_API_TOKEN=your_token
BAKONG_ACCOUNT_ID=your_account
BAKONG_MERCHANT_NAME=your_store_name
BAKONG_MERCHANT_CITY=your_city
```

## Benefits of This Implementation

1. **Clean Order History**: Users only see orders they actually paid for
2. **Automatic Cleanup**: Failed/expired orders don't clutter the database
3. **Better UX**: Clear feedback when payments expire or fail
4. **Data Integrity**: No orphaned orders from incomplete payments
5. **Scalable**: Automatic cleanup prevents database bloat over time

## Monitoring and Maintenance

### Log Monitoring
- Check Laravel logs for cleanup activity
- Monitor for payment confirmation issues
- Watch for QR generation failures

### Database Monitoring
- Monitor growth of orders table
- Check for accumulation of temporary orders (indicates cleanup issues)
- Verify payment_status transitions are working

### Performance Considerations
- Cleanup command is lightweight and safe to run frequently
- Database indexes on `status`, `payment_status`, and `qr_expires_at` recommended
- Consider archiving very old confirmed orders if needed

## Rollback Plan
If issues arise, you can:
1. Revert the migration to remove 'temporary' status
2. Update OrderController to always create orders as 'paid'
3. Remove the confirmed() scope from order history queries
4. Disable the enhanced cleanup command

The system will fall back to the previous behavior while maintaining data integrity.