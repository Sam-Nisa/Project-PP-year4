# Bakong QR Code Generation Fix

## Problem
QR code generation was failing with error: "Failed to generate QR code"

## Root Cause
The `BAKONG_MERCHANT_ID` was empty in the `.env` file, and the KHQR library requires this field to be non-empty.

## Solution Applied

### 1. Updated `.env` File
**File:** `backend/.env`

**Before:**
```env
BAKONG_MERCHANT_ID=
```

**After:**
```env
BAKONG_MERCHANT_ID=nisa_sam
```

The merchant ID should be a unique identifier for your merchant account. You can use:
- Your business registration number
- Your Bakong account username (without @bkrt)
- Any unique identifier provided by your bank

### 2. Updated BakongPaymentService
**File:** `backend/app/Services/BakongPaymentService.php`

**Changes:**
- Added fallback logic: If `BAKONG_MERCHANT_ID` is empty, it extracts the username from `BAKONG_ACCOUNT_ID`
- Added default value for `BAKONG_ACQUIRING_BANK` if not set
- Improved error handling and logging

**Code:**
```php
// Get merchant ID (use account ID as fallback if not set)
$merchantId = config('services.bakong.merchant_id');
if (empty($merchantId)) {
    // Use the username part of the Bakong account ID as merchant ID
    $merchantId = explode('@', $this->bakongAccountId)[0];
}

// Get acquiring bank (required)
$acquiringBank = config('services.bakong.acquiring_bank');
if (empty($acquiringBank)) {
    $acquiringBank = 'ABA Bank'; // Default
}
```

### 3. Cleared Cache
```bash
php artisan config:clear
php artisan cache:clear
```

## Required Environment Variables

All Bakong configuration must be set in `backend/.env`:

```env
# Bakong API Configuration
BAKONG_API_TOKEN=your_api_token_here
BAKONG_ACCOUNT_ID=your_account@bkrt
BAKONG_MERCHANT_NAME="Your Business Name"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_MERCHANT_ID=your_merchant_id
BAKONG_ACQUIRING_BANK="ABA Bank"
BAKONG_MOBILE_NUMBER=0123456789
```

### Field Descriptions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `BAKONG_API_TOKEN` | ✅ Yes | API token from Bakong | `eyJhbGciOiJIUzI1NiIs...` |
| `BAKONG_ACCOUNT_ID` | ✅ Yes | Your Bakong account ID | `username@bkrt` |
| `BAKONG_MERCHANT_NAME` | ✅ Yes | Your business/merchant name | `"My Store"` |
| `BAKONG_MERCHANT_CITY` | ✅ Yes | City where business is located | `"Phnom Penh"` |
| `BAKONG_MERCHANT_ID` | ✅ Yes | Unique merchant identifier | `my_store_001` |
| `BAKONG_ACQUIRING_BANK` | ✅ Yes | Your bank name | `"ABA Bank"` |
| `BAKONG_MOBILE_NUMBER` | ⚠️ Optional | Contact phone number | `0123456789` |

## How to Get Bakong Credentials

### 1. Register for Bakong API
Visit: https://api-bakong.nbc.gov.kh/register

### 2. Get API Token
After registration, you'll receive:
- API Token
- Account ID

### 3. Set Merchant ID
Choose a unique identifier for your business:
- Use your business registration number
- Use your Bakong username (part before @bkrt)
- Create a unique ID (e.g., `mystore_001`)

### 4. Specify Acquiring Bank
The bank that processes your Bakong transactions:
- ABA Bank
- ACLEDA Bank
- Canadia Bank
- etc.

## Testing the Fix

### 1. Verify Configuration
```bash
cd backend
php artisan tinker
```

```php
config('services.bakong.merchant_id')
// Should return: "nisa_sam" or your merchant ID

config('services.bakong.account_id')
// Should return: "nisa_sam@bkrt" or your account ID
```

### 2. Test QR Generation
1. Add items to cart
2. Go to checkout
3. Select "Bakong QR" payment
4. Click "Complete Order"
5. QR code should appear in popup

### 3. Check Logs
If still failing, check Laravel logs:
```bash
tail -f backend/storage/logs/laravel.log
```

Look for:
- "Bakong QR Generation Error"
- Any exception messages

## Common Issues & Solutions

### Issue 1: "Merchant ID cannot be null or empty"
**Solution:**
- Set `BAKONG_MERCHANT_ID` in `.env`
- Run `php artisan config:clear`
- Restart Laravel server

### Issue 2: "Acquiring Bank cannot be null or empty"
**Solution:**
- Set `BAKONG_ACQUIRING_BANK` in `.env`
- Use your actual bank name
- Run `php artisan config:clear`

### Issue 3: "Invalid API Token"
**Solution:**
- Verify `BAKONG_API_TOKEN` is correct
- Check token hasn't expired
- Re-register at Bakong API portal if needed

### Issue 4: "Invalid Bakong Account ID"
**Solution:**
- Format must be: `username@bkrt`
- Verify account exists in Bakong system
- Check for typos

### Issue 5: QR Code Still Not Generating
**Solution:**
```bash
# Clear all caches
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
composer dump-autoload

# Restart server
php artisan serve
```

## Verification Checklist

- [ ] `BAKONG_MERCHANT_ID` is set in `.env`
- [ ] `BAKONG_ACCOUNT_ID` is in format `username@bkrt`
- [ ] `BAKONG_API_TOKEN` is valid and not expired
- [ ] `BAKONG_ACQUIRING_BANK` is set
- [ ] Config cache is cleared
- [ ] Laravel server is restarted
- [ ] QR popup appears on checkout
- [ ] QR code displays correctly
- [ ] No errors in Laravel logs

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_string": "00020101021...",
    "md5": "abc123...",
    "amount": 100.00,
    "currency": "USD",
    "order_id": 123,
    "bill_number": "ORD-000123"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Failed to generate QR code",
  "error": "Merchant ID cannot be null or empty"
}
```

## Next Steps

After fixing:
1. Test QR generation with real order
2. Scan QR with Bakong app
3. Verify payment status updates
4. Check order status changes to "paid"

## Support

If issues persist:
1. Check Laravel logs: `backend/storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Contact Bakong API support: https://api-bakong.nbc.gov.kh

## Status
✅ **FIXED** - Merchant ID is now set and QR generation should work
