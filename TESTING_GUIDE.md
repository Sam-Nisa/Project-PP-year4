# Testing Guide

## Setup Instructions

### Backend Setup
```bash
cd backend
composer dump-autoload
php artisan config:clear
php artisan cache:clear
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Test Cases

### 1. Free Shipping Test
**Objective:** Verify all orders have free shipping

**Steps:**
1. Add items to cart
2. Go to cart page
3. Verify shipping shows as "Free" (not $5.00)
4. Go to checkout
5. Verify shipping shows as "Free"
6. Complete order
7. Verify order total does not include shipping cost

**Expected Result:**
- Cart shows: Shipping = Free
- Checkout shows: Shipping = Free (in green)
- Order total = Subtotal - Discount (no shipping added)

---

### 2. Discount Code - Cart Page Test
**Objective:** Verify discount codes cannot be applied in cart

**Steps:**
1. Add items to cart
2. Go to cart page
3. Look for discount code input field

**Expected Result:**
- No discount code input field in cart
- Message displays: "Apply discount codes at checkout"

---

### 3. Discount Code - Checkout Test
**Objective:** Verify discount codes work at checkout

**Steps:**
1. Login as admin
2. Go to admin panel → Discount Codes
3. Create a new discount code:
   - Code: TEST10
   - Type: Percentage
   - Value: 10
   - Active: Yes
4. Logout and login as regular user
5. Add items to cart (total > $10)
6. Go to checkout
7. Enter discount code "TEST10"
8. Click "Apply"

**Expected Result:**
- Discount code is validated successfully
- Discount amount is calculated correctly (10% of subtotal)
- Order total is reduced by discount amount
- Green success message shows applied discount

---

### 4. Expired Discount Code Test
**Objective:** Verify expired codes cannot be used

**Steps:**
1. Login as admin
2. Create discount code with:
   - Code: EXPIRED
   - Expires at: Yesterday's date
3. Logout and login as regular user
4. Go to checkout with items in cart
5. Try to apply "EXPIRED" code

**Expected Result:**
- Error message: "This discount code has expired"
- Discount is not applied
- Order total remains unchanged

---

### 5. Admin-Only Discount Creation Test
**Objective:** Verify only admins can create discount codes

**Steps:**
1. Login as regular user (not admin)
2. Try to access `/admin/discount-codes`

**Expected Result:**
- Access denied or redirected
- Cannot create discount codes

**Steps (Admin):**
1. Login as admin
2. Go to `/admin/discount-codes`
3. Click "Create Discount Code"
4. Fill in details and save

**Expected Result:**
- Admin can access discount codes page
- Admin can create new codes
- Code is saved successfully

---

### 6. Bakong QR Payment Test
**Objective:** Verify Bakong QR payment works

**Prerequisites:**
- Valid BAKONG_API_TOKEN in .env
- Valid BAKONG_ACCOUNT_ID in .env

**Steps:**
1. Add items to cart
2. Go to checkout
3. Select "Bakong QR" as payment method
4. Complete checkout
5. Click "Generate QR Code" on payment page
6. Verify QR code is displayed

**Expected Result:**
- QR code generates successfully
- QR code displays with order amount
- Payment status polling starts (checks every 5 seconds)
- Order details show correctly

---

### 7. Discount Code Validation Test
**Objective:** Test various discount code validations

**Test Cases:**

**A. Minimum Order Amount**
1. Create code with minimum amount $50
2. Try to apply with cart total $30
3. Expected: Error "Minimum order amount of $50.00 required"

**B. Usage Limit**
1. Create code with usage limit = 1
2. Use code once successfully
3. Try to use same code again
4. Expected: Error "This discount code has reached its usage limit"

**C. Per-User Limit**
1. Create code with per-user limit = 1
2. Use code once
3. Try to use same code again with same user
4. Expected: Error "You have already used this discount code the maximum number of times"

**D. Inactive Code**
1. Create code and set active = false
2. Try to apply code
3. Expected: Error "This discount code is no longer active"

---

### 8. Order Creation with Discount Test
**Objective:** Verify orders are created correctly with discounts

**Steps:**
1. Add items to cart (subtotal = $100)
2. Go to checkout
3. Apply discount code (10% off)
4. Complete order
5. Check order in database/admin panel

**Expected Result:**
- Order subtotal = $100
- Shipping cost = $0
- Discount amount = $10
- Total amount = $90
- Discount code is recorded in order
- Discount usage count is incremented

---

### 9. Multiple Items with Free Shipping Test
**Objective:** Verify free shipping applies regardless of cart value

**Steps:**
1. Add single item ($5) to cart
2. Verify shipping = Free
3. Add more items (total $100)
4. Verify shipping still = Free
5. Complete checkout
6. Verify order has $0 shipping

**Expected Result:**
- Free shipping for all order amounts
- No conditional shipping logic

---

### 10. Bakong Payment Status Check Test
**Objective:** Verify payment status polling works

**Steps:**
1. Create order with Bakong payment
2. Generate QR code
3. Wait on payment page
4. Observe console/network tab

**Expected Result:**
- API call to check payment status every 5 seconds
- Status updates automatically
- When payment is completed, redirects to success page

---

## Common Issues and Solutions

### Issue 1: Bakong QR Not Generating
**Solution:**
- Check BAKONG_API_TOKEN is valid
- Check BAKONG_ACCOUNT_ID format (should be username@bkrt)
- Run `composer dump-autoload` in backend
- Check backend logs for errors

### Issue 2: Discount Code Not Applying
**Solution:**
- Verify code is active
- Check expiration date
- Verify minimum order amount is met
- Check usage limits

### Issue 3: Shipping Still Showing $5
**Solution:**
- Clear browser cache
- Restart frontend dev server
- Check OrderController.php has `$shippingCost = 0`

### Issue 4: KHQR Class Not Found
**Solution:**
```bash
cd backend
composer dump-autoload
php artisan config:clear
```

---

## Database Verification Queries

### Check Discount Code
```sql
SELECT * FROM discount_codes WHERE code = 'TEST10';
```

### Check Discount Usage
```sql
SELECT * FROM discount_code_usages WHERE discount_code_id = 1;
```

### Check Order with Discount
```sql
SELECT 
  id, 
  subtotal, 
  shipping_cost, 
  discount_amount, 
  discount_code, 
  total_amount 
FROM orders 
WHERE discount_code IS NOT NULL;
```

### Check Order Items
```sql
SELECT 
  o.id as order_id,
  o.total_amount,
  o.shipping_cost,
  o.discount_amount,
  oi.quantity,
  oi.price,
  oi.total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.id = 1;
```

---

## API Testing with Postman/cURL

### Validate Discount Code
```bash
curl -X POST http://localhost:8000/api/discount-codes/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST10",
    "subtotal": 100
  }'
```

### Generate Bakong QR
```bash
curl -X POST http://localhost:8000/api/bakong/generate-qr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "currency": "USD"
  }'
```

### Check Payment Status
```bash
curl -X GET http://localhost:8000/api/bakong/payment-status/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Success Criteria

All tests pass when:
- ✅ Free shipping shows on all pages
- ✅ Discount codes only work at checkout
- ✅ Expired codes are rejected
- ✅ Only admins can create codes
- ✅ Bakong QR generates successfully
- ✅ Payment status polling works
- ✅ Orders are created with correct totals
- ✅ Discount usage is tracked correctly
