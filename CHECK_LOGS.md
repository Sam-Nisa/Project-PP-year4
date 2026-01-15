# Check Bakong QR Generation Logs

## Steps to Debug

### 1. Clear the logs
```bash
cd backend
Clear-Content "storage/logs/laravel.log"
```

### 2. Try to generate QR code
1. Go to your website
2. Add items to cart
3. Go to checkout
4. Select "Bakong QR" payment
5. Click "Complete Order"
6. Wait for the error

### 3. Check the logs
```bash
Get-Content "storage/logs/laravel.log" -Tail 100
```

## What to Look For

The logs will show:
- ✅ "Bakong QR Generation Started" - Input parameters
- ✅ "Bakong Configuration" - All config values
- ✅ "Calling BakongKHQR::generateMerchant" - Before API call
- ✅ "Bakong Response" - API response
- ✅ "QR Generation Successful" OR "QR Generation Failed"
- ❌ Any error messages

## Common Issues

### Issue 1: Config values are null
**Log shows:** `account_id => null` or `merchant_name => null`

**Solution:**
```bash
php artisan config:clear
php artisan cache:clear
```

### Issue 2: KHQR Exception
**Log shows:** "Bakong QR Generation Error (KHQR Exception)"

**Solution:** Check the error message for specific field issues

### Issue 3: General Exception
**Log shows:** "Bakong QR Generation Error (General Exception)"

**Solution:** Check the trace for the exact error location

## Send Me the Logs

After trying to generate QR, run:
```bash
Get-Content "backend/storage/logs/laravel.log" -Tail 100
```

And share the output so I can see exactly what's happening!
