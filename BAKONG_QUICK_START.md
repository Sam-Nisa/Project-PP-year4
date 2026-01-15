# 🚀 Bakong Integration - Quick Start

## Your Account Information
- **Account ID**: `nisa_sam@bkrt`
- **Merchant Name**: `NISA SAM`
- **Status**: ✅ Ready to use (after token setup)

---

## 📝 Step-by-Step Setup (5 Minutes)

### Step 1: Get Your API Token
1. Go to: **https://api-bakong.nbc.gov.kh/register**
2. Register with your email
3. You'll receive an API token via email
4. Save this token (valid for 90 days)

### Step 2: Configure Your Application
Open `backend/.env` and add:

```env
BAKONG_API_TOKEN=paste_your_token_here
BAKONG_ACCOUNT_ID=nisa_sam@bkrt
BAKONG_MERCHANT_NAME="NISA SAM"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_MERCHANT_ID=
BAKONG_ACQUIRING_BANK="ABA Bank"
BAKONG_MOBILE_NUMBER=
```

### Step 3: Test Your Setup

**Test 1: Verify Your Account**
```bash
curl -X POST http://localhost:8000/api/bakong/verify-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"account_id": "nisa_sam@bkrt"}'
```

**Expected:** `{"success": true, "exists": true}`

**Test 2: Generate QR Code**
```bash
curl -X POST http://localhost:8000/api/bakong/generate-qr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"order_id": 1, "currency": "USD"}'
```

---

## 🎯 Available API Endpoints

All endpoints require JWT authentication and are prefixed with `/api/bakong`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate-qr` | Generate QR code for order |
| GET | `/payment-status/{orderId}` | Check payment status |
| POST | `/verify-account` | Verify Bakong account exists |
| POST | `/decode-qr` | Decode QR code string |
| POST | `/renew-token` | Renew API token (Admin only) |

---

## 💡 Usage Examples

### Generate Payment QR Code
```javascript
const response = await request(
  "/api/bakong/generate-qr",
  "POST",
  { 
    order_id: 123, 
    currency: "USD" 
  },
  {},
  token
);

// Response:
// {
//   "success": true,
//   "data": {
//     "qr_string": "00020101021229180014nisa_sam@bkrt...",
//     "md5": "abc123...",
//     "amount": 25.50,
//     "currency": "USD"
//   }
// }
```

### Check Payment Status
```javascript
const response = await request(
  `/api/bakong/payment-status/${orderId}`,
  "GET",
  null,
  {},
  token
);

// If paid:
// {
//   "success": true,
//   "message": "Payment completed successfully",
//   "data": {
//     "order_status": "paid",
//     "transaction": {...}
//   }
// }
```

---

## 🔄 Payment Flow

```
1. User creates order
   ↓
2. Call /api/bakong/generate-qr
   ↓
3. Display QR code to user
   ↓
4. User scans with Bakong app
   ↓
5. User completes payment
   ↓
6. Poll /api/bakong/payment-status/{orderId}
   ↓
7. Order status updates to "paid"
   ↓
8. Show success message
```

---

## 📦 Files Created

✅ **Backend Service**: `backend/app/Services/BakongPaymentService.php`
✅ **Controller**: `backend/app/Http/Controllers/BakongPaymentController.php`
✅ **Config**: `backend/config/services.php`
✅ **Routes**: Added to `backend/routes/api.php`
✅ **Model**: Updated `backend/app/Models/Order.php`

---

## 🔧 Configuration Files

### What You Need to Change:

**File**: `backend/.env`
```env
# Add your token here after registration
BAKONG_API_TOKEN=your_token_from_email

# These are already set correctly
BAKONG_ACCOUNT_ID=nisa_sam@bkrt
BAKONG_MERCHANT_NAME="NISA SAM"

# Optional: Add if you have them
BAKONG_MERCHANT_ID=
BAKONG_MOBILE_NUMBER=
```

---

## ⚠️ Important Notes

### Token Expiration
- Tokens expire after **90 days**
- Renew using: `POST /api/bakong/renew-token`
- You'll need your registration email

### Currency Support
- **USD**: US Dollars
- **KHR**: Cambodian Riel

### Security
- ⚠️ Never expose API token in frontend
- ✅ Always use environment variables
- ✅ Token is only used in backend

---

## 🐛 Troubleshooting

### "Unauthorized" Error
→ Your token expired. Renew it using `/api/bakong/renew-token`

### "Account not found"
→ Verify `BAKONG_ACCOUNT_ID=nisa_sam@bkrt` in `.env`

### QR Generation Fails
→ Check if `BAKONG_API_TOKEN` is set in `.env`

### Payment Status Not Updating
→ Ensure QR was generated successfully and `payment_qr_md5` is saved

---

## 📚 Resources

- **Full Guide**: See `BAKONG_INTEGRATION_GUIDE.md`
- **API Docs**: https://api-bakong.nbc.gov.kh/document
- **Register**: https://api-bakong.nbc.gov.kh/register
- **Package**: https://github.com/davysrp/khqr-gateway

---

## ✅ Checklist

- [ ] Register at Bakong API portal
- [ ] Receive API token via email
- [ ] Add token to `.env` file
- [ ] Test account verification
- [ ] Test QR generation
- [ ] Implement frontend payment page
- [ ] Test complete payment flow
- [ ] Set reminder to renew token in 90 days

---

## 🎉 You're Ready!

Your Bakong integration is complete. Just add your API token and start accepting payments!

**Need help?** Check the full guide in `BAKONG_INTEGRATION_GUIDE.md`
