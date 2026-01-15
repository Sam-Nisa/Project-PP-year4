# Changes Summary

## Overview
Fixed shipping costs, discount code functionality, and Bakong QR payment integration.

## Backend Changes

### 1. Shipping Cost - Set to $0 (FREE SHIPPING)
**File:** `backend/app/Http/Controllers/OrderController.php`
- Changed shipping cost calculation from `$subtotal > 50 ? 0 : 5.0` to `0`
- Removed tax calculation (set to 0)
- All orders now have free shipping

### 2. Payment Method - Added Bakong Support
**Files:**
- `backend/app/Http/Controllers/OrderController.php`
- `backend/database/migrations/2026_01_15_093710_add_bakong_to_payment_method_in_orders_table.php`

**Changes:**
- Added 'bakong' to payment_method validation (was only: card, paypal, cod)
- Created migration to add 'bakong' and 'card' to payment_method enum in database
- Now accepts: cod, paypal, stripe, bank, bakong, card

### 3. Discount Code - Admin Only Creation
**File:** `backend/app/Http/Controllers/DiscountCodeController.php`
- Already implemented: Only admins can create, update, and delete discount codes
- Discount code validation checks for expiration dates
- Expired codes cannot be used (checked in `canBeUsedByUser()` method)
- Users can only validate and apply discount codes at checkout

### 4. Bakong QR Payment Integration
**Files Modified:**
- `backend/app/Services/BakongPaymentService.php`
- `backend/composer.json`

**Changes:**
- Added KHQR namespace to autoload PSR-4 mapping
- Removed external package dependency (using local khqr-gateway folder)
- Fixed QR code generation to properly use MerchantInfo
- Added proper error handling for QR generation
- Fixed mobile number configuration

**Configuration:**
- Uses local `khqr-gateway` folder in backend directory
- Properly configured in `.env` file with:
  - BAKONG_API_TOKEN
  - BAKONG_ACCOUNT_ID
  - BAKONG_MERCHANT_NAME
  - BAKONG_MERCHANT_CITY
  - BAKONG_MOBILE_NUMBER

## Frontend Changes

### 1. Cart Page - Removed Discount Code Functionality
**File:** `frontend/app/(user)/add-to-cart/page.jsx`
- Removed discount code input and validation from cart page
- Removed discount code state management
- Changed shipping display to show "Free" instead of conditional pricing
- Added message: "Apply discount codes at checkout"
- Simplified order total calculation

### 2. Checkout Page - Added Discount Code Functionality
**File:** `frontend/app/(user)/checkout/page.jsx`
- Added discount code input section
- Added discount code validation
- Added apply/remove discount functionality
- Shows applied discount in order summary
- Discount codes can only be applied at checkout, not in cart
- Free shipping displayed (no conditional logic)

### 3. Payment Page
**File:** `frontend/app/(user)/payment/[orderId]/page.jsx`
- Already properly configured for Bakong QR payment
- Generates QR code for orders
- Polls payment status every 5 seconds
- Redirects to success page when payment is confirmed

## Key Features

### Discount Codes
- ✅ Only admins can create discount codes
- ✅ Expired codes cannot be used
- ✅ Codes can only be applied at checkout (not in cart)
- ✅ Validation checks:
  - Code exists and is active
  - Not expired
  - Usage limits not exceeded
  - Minimum order amount met

### Shipping
- ✅ All orders have FREE shipping ($0)
- ✅ No conditional shipping costs
- ✅ Displayed as "Free" in cart and checkout

### Bakong Payment
- ✅ Uses local khqr-gateway library
- ✅ Generates QR codes for orders
- ✅ Checks payment status automatically
- ✅ Proper error handling
- ✅ Configured with merchant details from .env

## Testing Checklist

### Backend
- [ ] Run `composer dump-autoload` in backend directory
- [ ] Test discount code creation (admin only)
- [ ] Test discount code validation at checkout
- [ ] Test expired discount codes are rejected
- [ ] Test Bakong QR generation
- [ ] Test order creation with free shipping

### Frontend
- [ ] Cart page shows free shipping
- [ ] Cart page has no discount code input
- [ ] Checkout page has discount code input
- [ ] Discount code validation works
- [ ] Applied discount shows in order summary
- [ ] Bakong QR payment page works
- [ ] Payment status polling works

## Commands to Run

```bash
# Backend
cd backend
composer dump-autoload
php artisan config:clear
php artisan cache:clear

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables Required

```env
# Bakong Configuration
BAKONG_API_TOKEN=your_token_here
BAKONG_ACCOUNT_ID=your_account@bkrt
BAKONG_MERCHANT_NAME="Your Merchant Name"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_MOBILE_NUMBER=your_phone_number
```

## Notes

1. The khqr-gateway folder in backend directory contains the Bakong payment library
2. Discount codes are validated in real-time at checkout
3. Free shipping applies to all orders regardless of amount
4. Bakong QR codes are generated when user selects Bakong payment method
5. Payment status is checked automatically every 5 seconds
