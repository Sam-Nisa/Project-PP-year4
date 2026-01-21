# New Checkout System - No Database Orders Until Payment

## Overview
This implementation completely removes "pending" status and prevents unpaid orders from being stored in the database. Orders are only created after successful payment confirmation.

## Key Changes

### 1. Database Changes
- **Migration**: `2026_01_21_084728_update_order_status_enum_for_processing_default.php`
- **Status Enum**: Only contains: `'processing', 'completed', 'shipped', 'delivered', 'cancelled'`
- **Default Status**: `'processing'` (orders are only created after payment)
- **No Unpaid Orders**: Database only contains paid, confirmed orders

### 2. New Checkout Flow
1. **Prepare Checkout**: Creates temporary session in cache (15 minutes)
2. **Generate QR**: Creates payment QR for session (10 minutes)
3. **Payment Check**: Monitors payment status, creates order only when paid
4. **Auto Cleanup**: Cache sessions expire automatically

### 3. Controllers

#### CheckoutController (New)
- `prepareCheckout()`: Creates checkout session in cache
- `generatePaymentQR()`: Generates QR for checkout session
- `checkPaymentStatus()`: Checks payment and creates order if paid

#### OrderController (Updated)
- Removed `store()` method (orders created via checkout only)
- Updated status references (no more 'pending' or 'paid')
- Only confirmed orders exist in database

### 4. Cache-Based Sessions
- **Storage**: Redis/File cache (configurable)
- **Checkout Session**: 15 minutes expiration
- **QR Code**: 10 minutes expiration
- **Auto Cleanup**: No manual cleanup needed

## New API Endpoints

### 1. Prepare Checkout
**Endpoint**: `POST /api/checkout/prepare`

**Request**:
```json
{
  "payment_method": "bakong",
  "discount_code": "SAVE10",
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "city": "Phnom Penh",
    "zip_code": "12345"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Checkout session prepared",
  "checkout_session_id": "checkout_3_abc123def4",
  "data": {
    "total_amount": 25.50,
    "subtotal": 30.00,
    "discount_amount": 4.50,
    "items_count": 2,
    "expires_at": "2026-01-21T09:00:00.000000Z"
  }
}
```

### 2. Generate Payment QR
**Endpoint**: `POST /api/checkout/generate-qr`

**Request**:
```json
{
  "checkout_session_id": "checkout_3_abc123def4",
  "currency": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_string": "00020101021...",
    "md5": "abc123...",
    "amount": 25.50,
    "currency": "USD",
    "checkout_session_id": "checkout_3_abc123def4",
    "expires_at": "2026-01-21T08:55:00.000000Z",
    "bill_number": "CHECKOUT-23def4"
  }
}
```

### 3. Check Payment Status
**Endpoint**: `POST /api/checkout/check-payment`

**Request**:
```json
{
  "checkout_session_id": "checkout_3_abc123def4"
}
```

**Response (Payment Completed)**:
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "order": {
      "id": 123,
      "status": "processing",
      "total_amount": 25.50,
      "payment_transaction_id": "TXN123456",
      "items": [...]
    },
    "transaction": {
      "transactionId": "TXN123456",
      "status": "COMPLETED"
    }
  }
}
```

**Response (Payment Pending)**:
```json
{
  "success": true,
  "message": "Payment not completed yet",
  "data": {
    "payment_found": false,
    "expires_at": "2026-01-21T08:55:00.000000Z",
    "is_expired": false
  }
}
```

**Response (Expired)**:
```json
{
  "success": false,
  "message": "Payment QR code has expired. Please try again.",
  "expired": true
}
```
**Status Code**: `410 Gone`

## Order Status Flow

### New Status Meanings
- **'processing'**: Order confirmed and paid, being prepared
- **'completed'**: Order fully processed
- **'shipped'**: Order sent to customer  
- **'delivered'**: Order received by customer
- **'cancelled'**: Order cancelled

### Status Flow
1. **Payment Confirmed** → Order created with status `'processing'`
2. **Order Prepared** → Status remains `'processing'` or moves to `'completed'`
3. **Order Shipped** → Status `'shipped'`
4. **Order Delivered** → Status `'delivered'`

## Benefits

### ✅ **Clean Database**
- No unpaid orders cluttering the database
- Only confirmed, paid orders exist
- No cleanup jobs needed

### ✅ **Better User Experience**
- Clear checkout flow
- Real-time payment status
- Automatic session expiration

### ✅ **Improved Performance**
- No database writes until payment confirmed
- Cache-based sessions are faster
- Automatic cleanup via cache expiration

### ✅ **Security**
- No sensitive data in database until paid
- Session-based approach prevents data leaks
- Automatic expiration prevents stale data

## Frontend Integration

### New Checkout Flow
```javascript
// 1. Prepare checkout
const checkoutResponse = await fetch('/api/checkout/prepare', {
  method: 'POST',
  body: JSON.stringify(checkoutData)
});
const { checkout_session_id } = await checkoutResponse.json();

// 2. Generate QR
const qrResponse = await fetch('/api/checkout/generate-qr', {
  method: 'POST',
  body: JSON.stringify({ checkout_session_id })
});
const { qr_string, expires_at } = await qrResponse.json();

// 3. Show QR and poll for payment
const pollPayment = setInterval(async () => {
  const statusResponse = await fetch('/api/checkout/check-payment', {
    method: 'POST',
    body: JSON.stringify({ checkout_session_id })
  });
  
  if (statusResponse.status === 200) {
    const result = await statusResponse.json();
    if (result.data.order) {
      // Payment successful - redirect to success page
      clearInterval(pollPayment);
      window.location.href = '/order-success';
    }
  } else if (statusResponse.status === 410) {
    // Expired - show error and restart
    clearInterval(pollPayment);
    alert('Payment expired. Please try again.');
  }
}, 3000); // Check every 3 seconds
```

### Error Handling
- `410 Gone`: Session/QR expired - restart checkout
- `404 Not Found`: Invalid session ID
- `400 Bad Request`: Missing QR code

## Cache Configuration

### Redis (Recommended)
```env
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### File Cache (Alternative)
```env
CACHE_DRIVER=file
```

## Testing

### Test Checkout Flow
1. Add items to cart
2. Call `/api/checkout/prepare`
3. Call `/api/checkout/generate-qr`
4. Simulate payment via Bakong
5. Call `/api/checkout/check-payment`
6. Verify order created in database

### Test Expiration
1. Prepare checkout session
2. Wait 15+ minutes
3. Try to generate QR → Should fail with session expired
4. Generate QR and wait 10+ minutes
5. Check payment → Should return 410 Gone

## Migration Notes

### Existing Orders
- All existing orders were migrated to 'processing' status
- No data loss occurred
- Old orders remain functional

### API Compatibility
- Old `/api/orders` POST endpoint removed
- New checkout endpoints replace order creation
- Order viewing/listing endpoints unchanged

## Security Considerations

1. **Session Security**: Checkout sessions tied to user ID
2. **Expiration**: Automatic cleanup prevents stale data
3. **Payment Verification**: Orders only created with confirmed transactions
4. **Cache Isolation**: Each user's sessions are isolated

This new system ensures that your database only contains confirmed, paid orders while providing a smooth checkout experience!