# Bakong Payment Integration Guide

This comprehensive guide explains how the Bakong payment system works in your Laravel + Next.js application, including troubleshooting common issues.

## Overview

The Bakong payment system allows users to pay for books using Cambodia's national payment system through QR codes. The system supports both individual author payments and admin-managed payments with automatic routing logic.

## Architecture

### Backend Components

1. **BakongPaymentController** (`app/Http/Controllers/BakongPaymentController.php`)
   - Handles QR code generation with 10-minute expiration
   - Manages payment status checking via MD5 hash
   - Routes payments to appropriate accounts (admin/author)
   - Supports both pending orders and regular orders

2. **BakongPaymentService** (`app/Services/BakongPaymentService.php`)
   - Interfaces with the KHQR library
   - Generates QR codes using merchant information
   - Checks transaction status via Bakong API
   - Handles token management and renewal

3. **KHQR Library** (`khqr-gateway/src/`)
   - Local implementation of Cambodia's KHQR standard
   - Handles QR code generation and validation
   - Provides transaction checking capabilities

### Frontend Components

1. **Payment Page** (`frontend/app/(user)/payment/[orderId]/page.jsx`)
   - Displays QR codes for payment
   - Handles payment status polling every 5 seconds
   - Shows 10-minute countdown timer
   - Automatic redirect on payment success

2. **Checkout Page** (`frontend/app/(user)/checkout/page.jsx`)
   - Creates orders and initiates payment
   - Shows QR modal for immediate payment
   - Handles both cart checkout and "buy now" flows
   - Displays payment routing information

## Payment Flow

### 1. Order Creation
```
User completes checkout → Order created with "pending_" prefix → QR generation initiated
```

### 2. QR Code Generation Process
```
Backend determines payment account → 
Creates merchant info object → 
Calls KHQR library → 
Generates QR with MD5 hash → 
Stores in cache with 10-minute expiration → 
Returns QR data to frontend
```

### 3. Payment Processing
```
User scans QR → 
Makes payment in Bakong app → 
Backend polls MD5 hash every 5 seconds → 
Transaction found → 
Order status updated to "paid" → 
User redirected to success page
```

### 4. Payment Routing Logic

The system automatically determines where payments go based on these rules:

- **Discount Code Applied**: Always → Admin account
- **Multi-Vendor Order**: → Admin account (admin distributes to authors)
- **Single Author Book**: → Author's account (if configured and verified)
- **Admin Created Book**: → Admin account
- **Author Account Not Configured**: → Admin account (fallback)

## Configuration

### Environment Variables (.env)

```env
# Bakong API Configuration
BAKONG_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BAKONG_ACCOUNT_ID=nisa_sam@bkrt
BAKONG_MERCHANT_NAME="NISA SAM"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_MERCHANT_ID=nisa_sam
BAKONG_ACQUIRING_BANK="ABA Bank"
BAKONG_MOBILE_NUMBER=0768362411
BAKONG_QR_EXPIRATION_MINUTES=10
```

### Services Configuration

The Bakong configuration is defined in `config/services.php`:

```php
'bakong' => [
    'api_token' => env('BAKONG_API_TOKEN'),
    'account_id' => env('BAKONG_ACCOUNT_ID'),
    'merchant_name' => env('BAKONG_MERCHANT_NAME'),
    'merchant_city' => env('BAKONG_MERCHANT_CITY', 'Phnom Penh'),
    'merchant_id' => env('BAKONG_MERCHANT_ID'),
    'acquiring_bank' => env('BAKONG_ACQUIRING_BANK'),
    'mobile_number' => env('BAKONG_MOBILE_NUMBER'),
],
```

## QR Code Expiration System

### Backend Implementation (10 minutes)
- QR codes expire exactly 10 minutes after generation
- Expiration time calculated: `now()->addMinutes(10)`
- Stored in cache with automatic cleanup
- Payment status checks stop after expiration

### Frontend Implementation
- Countdown timer shows remaining time
- Automatic expiration handling at 10 minutes
- User prompted to generate new QR after expiration
- Payment polling stops when expired

### Expiration Locations in Code:

**Backend:**
- `BakongPaymentController::generateQRCode()` - Line ~150: Sets `$expiresAt = now()->addMinutes(10)`
- Cache storage with expiration: `Cache::put("qr_data_{$orderId}", [...], $expiresAt)`

**Frontend:**
- `checkout/page.jsx` - Line ~280: `setTimeLeft(diffSeconds)` from backend expires_at
- `payment/[orderId]/page.jsx` - Timer countdown and expiration handling

## API Endpoints

### Generate QR Code
```http
POST /api/bakong/generate-qr
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "order_id": "pending_12345",
  "currency": "USD"
}

Response:
{
  "success": true,
  "data": {
    "qr_string": "00020101021229370010A000000324...",
    "md5": "abc123def456...",
    "amount": "25.99",
    "currency": "USD",
    "expires_at": "2026-02-03T10:30:00.000000Z",
    "account_type": "admin",
    "reason": "discount_code_applied"
  }
}
```

### Check Payment Status
```http
GET /api/bakong/payment-status/{orderId}
Authorization: Bearer {jwt_token}

Response (Pending):
{
  "success": true,
  "message": "Payment not completed yet",
  "data": {
    "payment_found": false,
    "expires_at": "2026-02-03T10:30:00.000000Z",
    "is_expired": false
  }
}

Response (Completed):
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "order_id": 123,
    "order_status": "paid",
    "payment_status": "completed",
    "transaction": {
      "transactionId": "TXN123456",
      "status": "COMPLETED"
    }
  }
}
```

## Database Schema

### Orders Table
```sql
payment_method VARCHAR(50) DEFAULT 'bakong'
payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending'
payment_qr_code TEXT NULL
payment_qr_md5 VARCHAR(32) NULL
payment_transaction_id VARCHAR(255) NULL
qr_expires_at TIMESTAMP NULL
```

### Users Table (Authors)
```sql
bakong_account_id VARCHAR(255) NULL
bakong_merchant_name VARCHAR(255) NULL
bakong_merchant_city VARCHAR(255) NULL
bakong_merchant_id VARCHAR(255) NULL
bakong_acquiring_bank VARCHAR(255) NULL
bakong_mobile_number VARCHAR(20) NULL
bakong_account_verified BOOLEAN DEFAULT FALSE
```

## Common Issues & Solutions

### 1. "Payment Failed - Failed to generate QR code"

**Possible Causes:**
- Invalid or expired Bakong API token
- Missing required configuration fields
- KHQR library not properly loaded
- Network connectivity issues

**Solutions:**
```bash
# Check API token validity
php artisan tinker
>>> $service = new App\Services\BakongPaymentService();
>>> $service->checkAccountExists('test@bkrt');

# Verify configuration
php artisan config:clear
php artisan config:cache

# Check logs
tail -f storage/logs/laravel.log
```

### 2. QR Code Generates But Payment Not Detected

**Possible Causes:**
- MD5 hash mismatch
- Payment made to wrong account
- API token lacks transaction checking permissions
- Network delays in Bakong system

**Solutions:**
```bash
# Check transaction manually
curl -X GET "http://localhost:8000/api/bakong/payment-status/ORDER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify MD5 in cache
php artisan tinker
>>> Cache::get('qr_data_pending_12345');
```

### 3. Frontend Shows "Payment Failed" Immediately

**Possible Causes:**
- JavaScript errors in console
- API endpoint not accessible
- JWT token expired
- CORS issues

**Solutions:**
```javascript
// Check browser console for errors
// Verify API calls in Network tab
// Check JWT token:
localStorage.getItem('token')

// Test API directly:
fetch('/api/bakong/generate-qr', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({order_id: 'test', currency: 'USD'})
})
```

### 4. QR Code Expires Too Quickly

**Issue:** Timer shows wrong countdown or expires immediately

**Solutions:**
- Check server timezone: `php artisan tinker >>> now()`
- Verify frontend timezone handling
- Check expires_at format in API response

## Error Handling & Logging

### Backend Error Responses
```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details",
  "debug": {...} // Only in debug mode
}
```

### Key Log Entries to Monitor
```bash
# QR Generation
grep "Bakong QR Generation" storage/logs/laravel.log

# Payment Status Checks
grep "Payment Status Check" storage/logs/laravel.log

# Errors
grep "ERROR" storage/logs/laravel.log | grep -i bakong
```

## Testing & Debugging

### Test QR Generation
```bash
# Using curl
curl -X POST http://localhost:8000/api/bakong/generate-qr \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "test123", "currency": "USD"}'

# Using PHP artisan tinker
php artisan tinker
>>> $controller = new App\Http\Controllers\BakongPaymentController(new App\Services\BakongPaymentService());
>>> $request = new Illuminate\Http\Request(['order_id' => 'test', 'currency' => 'USD']);
>>> $response = $controller->generateQRCode($request);
```

### Debug Payment Flow
```php
// In BakongPaymentService.php, add logging:
Log::info('QR Generation Request', [
    'amount' => $amount,
    'currency' => $currency,
    'account_id' => $this->bakongAccountId
]);

// Check KHQR response:
Log::info('KHQR Response', [
    'response' => $response,
    'status' => $response->status ?? 'no status'
]);
```

## Security Best Practices

1. **API Token Security**
   - Store in environment variables only
   - Never commit to version control
   - Rotate tokens regularly
   - Monitor token usage

2. **QR Code Security**
   - 10-minute expiration prevents replay attacks
   - MD5 hash prevents tampering
   - Server-side payment verification only

3. **Account Validation**
   - Verify Bakong accounts before processing
   - Validate merchant information
   - Check account ownership

## Performance Optimization

### Caching Strategy
- QR data cached for 10 minutes
- Payment status cached briefly to reduce API calls
- Configuration cached in production

### API Rate Limiting
- Implement rate limiting for QR generation
- Batch payment status checks when possible
- Monitor API usage quotas

## Monitoring & Maintenance

### Key Metrics
- QR generation success rate
- Payment completion rate
- Average payment time
- API response times
- Error rates by type

### Regular Maintenance
```bash
# Clear expired cache entries
php artisan cache:clear

# Check API token expiration
# Monitor payment success rates
# Update KHQR library if needed
# Review error logs weekly
```

### Token Renewal
```http
POST /api/bakong/renew-token
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "email": "your_registered_email@example.com"
}
```

## Troubleshooting Checklist

When QR generation fails, check in this order:

1. ✅ **Environment Configuration**
   - All BAKONG_* variables set in .env
   - No trailing spaces or quotes issues
   - Config cache cleared

2. ✅ **API Token**
   - Token not expired
   - Token has correct permissions
   - Token format is valid JWT

3. ✅ **KHQR Library**
   - Library files present in khqr-gateway/
   - Autoloader includes KHQR namespace
   - No PHP syntax errors in library

4. ✅ **Network & Permissions**
   - Server can reach Bakong API
   - Firewall allows outbound HTTPS
   - SSL certificates valid

5. ✅ **Database & Cache**
   - Cache system working
   - Database connections stable
   - No storage permission issues

6. ✅ **Frontend Integration**
   - API endpoints accessible
   - JWT tokens valid
   - CORS configured correctly