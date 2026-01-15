# 🏦 Bakong Payment Integration Guide

## Overview
This guide will help you integrate Bakong KHQR payment system into your Laravel + Next.js bookstore application.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Getting Your Bakong API Token](#getting-your-bakong-api-token)
3. [Configuration](#configuration)
4. [Backend Setup](#backend-setup)
5. [Testing the Integration](#testing-the-integration)
6. [Frontend Integration](#frontend-integration)
7. [API Endpoints](#api-endpoints)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Already Installed:**
- Bakong KHQR PHP package (`khqr-gateway/bakong-khqr-php`)
- Laravel backend with Order system
- Your Bakong account: `nisa_sam@bkrt` (NISA SAM)

---

## Getting Your Bakong API Token

### Step 1: Register for API Access
1. Visit: **https://api-bakong.nbc.gov.kh/register**
2. Fill in the registration form with your details
3. Use your email address (you'll need this to renew tokens)
4. Submit the form

### Step 2: Receive Your Token
- You will receive an API token via email
- The token is valid for **90 days**
- Save this token securely - you'll need it for configuration

### Step 3: Token Renewal (Every 90 Days)
When your token expires, you can renew it using:
- The API endpoint: `POST /api/bakong/renew-token`
- Or programmatically using the `BakongKHQR::renewToken()` method

---

## Configuration

### Step 1: Update Your `.env` File

Add these lines to your `backend/.env` file:

```env
# Bakong Payment Gateway Configuration
BAKONG_API_TOKEN=your_token_here_from_registration
BAKONG_ACCOUNT_ID=nisa_sam@bkrt
BAKONG_MERCHANT_NAME="NISA SAM"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_MERCHANT_ID=your_merchant_id_if_any
BAKONG_ACQUIRING_BANK="ABA Bank"
BAKONG_MOBILE_NUMBER=your_phone_number
```

### Step 2: Verify Configuration

**Your Current Settings:**
- ✅ Account ID: `nisa_sam@bkrt`
- ✅ Merchant Name: `NISA SAM`
- 🔧 API Token: **You need to add this after registration**
- 🔧 Merchant ID: Optional (can be left empty)
- 🔧 Mobile Number: Optional (your contact number)

---

## Backend Setup

### Files Created/Modified:

1. **✅ Service Class:** `backend/app/Services/BakongPaymentService.php`
   - Handles all Bakong API interactions
   - QR code generation
   - Transaction verification
   - Account validation

2. **✅ Controller:** `backend/app/Http/Controllers/BakongPaymentController.php`
   - API endpoints for payment operations
   - Order payment processing
   - Status checking

3. **✅ Configuration:** `backend/config/services.php`
   - Bakong service configuration
   - Environment variable mapping

4. **✅ Routes:** `backend/routes/api.php`
   - Added Bakong payment routes under `/api/bakong`

5. **✅ Migration:** `backend/database/migrations/2026_01_15_083257_add_bakong_payment_fields_to_orders_table.php`
   - Added payment fields to orders table

6. **✅ Model Update:** `backend/app/Models/Order.php`
   - Added fillable fields for payment data

### Run Migration

```bash
cd backend
php artisan migrate
```

---

## Testing the Integration

### Test 1: Verify Your Bakong Account

```bash
curl -X POST http://localhost:8000/api/bakong/verify-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"account_id": "nisa_sam@bkrt"}'
```

**Expected Response:**
```json
{
  "success": true,
  "exists": true,
  "message": "Account exists"
}
```

### Test 2: Generate QR Code for an Order

First, create an order, then:

```bash
curl -X POST http://localhost:8000/api/bakong/generate-qr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "order_id": 1,
    "currency": "USD"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_string": "00020101021229180014nisa_sam@bkrt...",
    "md5": "abc123...",
    "amount": 25.50,
    "currency": "USD",
    "order_id": 1,
    "bill_number": "ORD-000001"
  }
}
```

### Test 3: Check Payment Status

```bash
curl -X GET http://localhost:8000/api/bakong/payment-status/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## API Endpoints

### 1. Generate QR Code
**POST** `/api/bakong/generate-qr`

**Request:**
```json
{
  "order_id": 1,
  "currency": "USD"  // or "KHR"
}
```

**Response:**
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_string": "...",
    "md5": "...",
    "amount": 25.50,
    "currency": "USD",
    "order_id": 1,
    "bill_number": "ORD-000001"
  }
}
```

### 2. Check Payment Status
**GET** `/api/bakong/payment-status/{orderId}`

**Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "order_status": "paid",
    "transaction": {
      "transactionId": "...",
      "status": "COMPLETED",
      "amount": 25.50
    }
  }
}
```

### 3. Verify Bakong Account
**POST** `/api/bakong/verify-account`

**Request:**
```json
{
  "account_id": "nisa_sam@bkrt"
}
```

### 4. Decode QR Code
**POST** `/api/bakong/decode-qr`

**Request:**
```json
{
  "qr_string": "00020101021229180014nisa_sam@bkrt..."
}
```

### 5. Renew API Token (Admin Only)
**POST** `/api/bakong/renew-token`

**Request:**
```json
{
  "email": "your_registered_email@example.com"
}
```

---

## Frontend Integration

### Example: Payment Page Component

```jsx
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { request } from "../utils/request";
import { useAuthStore } from "../store/authStore";

export default function BakongPayment({ orderId }) {
  const { token } = useAuthStore();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await request(
        "/api/bakong/generate-qr",
        "POST",
        { order_id: orderId, currency: "USD" },
        {},
        token
      );

      if (response.success) {
        setQrData(response.data);
        // Start checking payment status
        checkPaymentStatus();
      }
    } catch (error) {
      console.error("Error generating QR:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await request(
        `/api/bakong/payment-status/${orderId}`,
        "GET",
        null,
        {},
        token
      );

      if (response.success && response.data.order_status === "paid") {
        setPaymentStatus("completed");
        // Redirect to success page
        window.location.href = `/order-success?order_id=${orderId}`;
      } else {
        // Check again after 5 seconds
        setTimeout(checkPaymentStatus, 5000);
      }
    } catch (error) {
      console.error("Error checking payment:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Pay with Bakong</h2>
      
      {!qrData ? (
        <button
          onClick={generateQR}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Generating..." : "Generate QR Code"}
        </button>
      ) : (
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <QRCodeSVG value={qrData.qr_string} size={256} />
          </div>
          
          <div className="mt-4">
            <p className="text-lg font-semibold">
              Amount: ${qrData.amount} {qrData.currency}
            </p>
            <p className="text-sm text-gray-600">
              Order: {qrData.bill_number}
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {paymentStatus === "pending" 
                ? "Scan this QR code with your Bakong app to complete payment"
                : "Payment completed! Redirecting..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Install QR Code Package (Frontend)

```bash
cd frontend
npm install qrcode.react
```

---

## Troubleshooting

### Issue 1: "Unauthorized, not yet requested for token or code invalid"

**Solution:**
- Your API token has expired (tokens last 90 days)
- Renew your token using the `/api/bakong/renew-token` endpoint
- Update your `.env` file with the new token

### Issue 2: "Account not found"

**Solution:**
- Verify your Bakong account ID is correct: `nisa_sam@bkrt`
- Check if the account is active in the Bakong system
- Use the verify-account endpoint to test

### Issue 3: QR Code Generation Fails

**Solution:**
- Check if `BAKONG_API_TOKEN` is set in `.env`
- Verify all required fields are configured
- Check Laravel logs: `backend/storage/logs/laravel.log`

### Issue 4: Payment Status Not Updating

**Solution:**
- Ensure the QR code was generated successfully
- Check if the `payment_qr_md5` field is saved in the order
- Verify your API token is valid
- Check transaction status manually using Bakong dashboard

---

## Important Notes

### Currency Support
- **USD**: US Dollars
- **KHR**: Cambodian Riel

### Payment Flow
1. User creates an order
2. System generates Bakong QR code
3. User scans QR with Bakong app
4. User completes payment in app
5. System checks payment status
6. Order status updates to "paid"

### Security
- API token should be kept secret
- Never expose token in frontend code
- Use environment variables only
- Renew token every 90 days

### Testing
- Use small amounts for testing
- Test with real Bakong account
- Verify account exists before generating QR
- Monitor Laravel logs for errors

---

## Next Steps

1. ✅ **Register for Bakong API** at https://api-bakong.nbc.gov.kh/register
2. ✅ **Get your API token** from email
3. ✅ **Update `.env` file** with your token
4. ✅ **Test account verification** endpoint
5. ✅ **Generate test QR code** for an order
6. ✅ **Implement frontend** payment page
7. ✅ **Test complete payment flow**

---

## Support & Resources

- **Bakong API Documentation**: https://api-bakong.nbc.gov.kh/document
- **Bakong KHQR PHP Package**: https://github.com/davysrp/khqr-gateway
- **National Bank of Cambodia**: https://www.nbc.gov.kh

---

## Summary

Your Bakong integration is now ready! Here's what you have:

✅ Backend service for Bakong operations
✅ API endpoints for payment processing
✅ Database fields for payment tracking
✅ Configuration for your account (`nisa_sam@bkrt`)
✅ Complete payment flow implementation

**What you need to do:**
1. Register at https://api-bakong.nbc.gov.kh/register
2. Get your API token
3. Add token to `.env` file
4. Test the integration
5. Implement frontend payment page

Good luck with your Bakong integration! 🎉
