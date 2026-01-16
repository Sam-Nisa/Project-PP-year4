# Bakong Payment Process - Complete Source Code Guide

## Overview
This document explains the complete Bakong QR payment integration, including all files involved and the payment flow.

---

## 📁 Files Involved in Bakong Payment

### **Backend Files**

#### 1. **Controller Layer**
- **File**: `backend/app/Http/Controllers/BakongPaymentController.php`
- **Purpose**: Handles HTTP requests for Bakong payment operations
- **Key Methods**:
  - `generateQRCode()` - Generate QR code for an order
  - `checkPaymentStatus()` - Check if payment is completed
  - `verifyAccount()` - Verify Bakong account exists
  - `decodeQRCode()` - Decode QR string
  - `renewToken()` - Renew API token (admin only)

#### 2. **Service Layer**
- **File**: `backend/app/Services/BakongPaymentService.php`
- **Purpose**: Business logic for Bakong payment operations
- **Key Methods**:
  - `generateQRCode()` - Core QR generation logic
  - `checkTransactionByMD5()` - Check transaction status
  - `checkAccountExists()` - Verify account
  - `verifyQRCode()` - Validate QR string
  - `decodeQRCode()` - Decode QR data
  - `renewToken()` - Token renewal

#### 3. **KHQR Gateway Library** (Local Package)
- **Main File**: `backend/khqr-gateway/src/BakongKHQR.php`
- **Purpose**: Core library for Bakong KHQR operations
- **Key Classes**:
  - `BakongKHQR` - Main class for QR operations
  - `MerchantInfo` - Merchant information model
  - `IndividualInfo` - Individual account model
  - `KHQRResponse` - Response wrapper
  - `Transaction` - Transaction checking
  - `Token` - Token management
  - `Account` - Account verification
  - `DeepLink` - Deep link generation

#### 4. **Configuration Files**
- **File**: `backend/config/services.php`
- **Purpose**: Bakong service configuration
- **Configuration Keys**:
  ```php
  'bakong' => [
      'api_token' => env('BAKONG_API_TOKEN'),
      'account_id' => env('BAKONG_ACCOUNT_ID'),
      'merchant_id' => env('BAKONG_MERCHANT_ID'),
      'merchant_name' => env('BAKONG_MERCHANT_NAME'),
      'merchant_city' => env('BAKONG_MERCHANT_CITY', 'Phnom Penh'),
      'acquiring_bank' => env('BAKONG_ACQUIRING_BANK', 'ABA Bank'),
      'mobile_number' => env('BAKONG_MOBILE_NUMBER'),
  ]
  ```

- **File**: `backend/.env`
- **Purpose**: Environment variables
- **Required Variables**:
  ```env
  BAKONG_API_TOKEN=your_api_token_here
  BAKONG_ACCOUNT_ID=yourstore@aba
  BAKONG_MERCHANT_ID=yourstore
  BAKONG_MERCHANT_NAME=Your Store Name
  BAKONG_MERCHANT_CITY=Phnom Penh
  BAKONG_ACQUIRING_BANK=ABA Bank
  BAKONG_MOBILE_NUMBER=+855123456789
  ```

#### 5. **Routes**
- **File**: `backend/routes/api.php`
- **Bakong Routes**:
  ```php
  Route::prefix('bakong')->group(function () {
      Route::post('/generate-qr', [BakongPaymentController::class, 'generateQRCode']);
      Route::get('/payment-status/{orderId}', [BakongPaymentController::class, 'checkPaymentStatus']);
      Route::post('/verify-account', [BakongPaymentController::class, 'verifyAccount']);
      Route::post('/decode-qr', [BakongPaymentController::class, 'decodeQRCode']);
      Route::post('/renew-token', [BakongPaymentController::class, 'renewToken']);
  });
  ```

#### 6. **Database**
- **Migration**: `backend/database/migrations/2026_01_15_093710_add_bakong_to_payment_method_in_orders_table.php`
  - Adds 'bakong' to payment_method enum
  
- **Migration**: `backend/database/migrations/2026_01_15_111254_add_payment_qr_md5_to_orders_table.php`
  - Adds columns: `payment_qr_code`, `payment_qr_md5`, `payment_transaction_id`

- **Model**: `backend/app/Models/Order.php`
  - Stores QR code and payment information

#### 7. **Composer Configuration**
- **File**: `backend/composer.json`
- **Autoload Configuration**:
  ```json
  "autoload": {
      "psr-4": {
          "KHQR\\": "khqr-gateway/src/"
      }
  }
  ```

### **Frontend Files**

#### 1. **Checkout Page**
- **File**: `frontend/app/(user)/checkout/page.jsx`
- **Purpose**: Main checkout page with QR popup
- **Key Features**:
  - Payment method selection (including Bakong)
  - QR code generation on order completion
  - QR popup modal with auto-refresh
  - Payment status checking every 5 seconds
  - Success animation and redirect

#### 2. **Order History Page**
- **File**: `frontend/app/profile/[id]/orders/page.jsx`
- **Purpose**: View past orders and complete pending payments
- **Key Features**:
  - Display all user orders
  - "Complete Payment" button for pending Bakong orders
  - Reopen QR popup for unpaid orders

---

## 🔄 Payment Flow

### **Step 1: User Selects Bakong Payment**
```
User → Checkout Page → Selects "Bakong QR" → Clicks "Complete Order"
```

**Frontend Code** (`checkout/page.jsx`):
```javascript
const handleSubmit = async (e) => {
  // Create order first
  const orderResponse = await request('/api/orders', 'POST', orderData, {}, token);
  
  // If Bakong selected, generate QR
  if (paymentMethod === 'bakong') {
    await generateQRCode(orderResponse.order.id);
  }
};
```

### **Step 2: Generate QR Code**
```
Frontend → POST /api/bakong/generate-qr → BakongPaymentController → BakongPaymentService → BakongKHQR Library
```

**Request**:
```javascript
POST /api/bakong/generate-qr
{
  "order_id": 123,
  "currency": "USD"
}
```

**Backend Flow**:
1. **BakongPaymentController.php** receives request
2. Validates order belongs to user
3. Calls **BakongPaymentService.php** `generateQRCode()`
4. Service creates **MerchantInfo** object with:
   - Amount
   - Currency (USD/KHR)
   - Merchant details
   - Bill number
5. Calls **BakongKHQR::generateMerchant()** from library
6. Library generates KHQR string and MD5 hash
7. Saves QR code and MD5 to order table
8. Returns QR string to frontend

**Response**:
```json
{
  "success": true,
  "data": {
    "qr_string": "00020101021229370...",
    "md5": "abc123def456...",
    "amount": 25.50,
    "currency": "USD",
    "order_id": 123,
    "bill_number": "ORD-000123"
  }
}
```

### **Step 3: Display QR Code**
```
Frontend receives QR string → Displays in popup modal → User scans with Bakong app
```

**Frontend Code**:
```javascript
// Show QR popup
setShowQRPopup(true);
setQrData(result.data);

// Display QR using react-qr-code
<QRCodeSVG value={qrData.qr_string} size={256} />
```

### **Step 4: Auto-Check Payment Status**
```
Frontend polls every 5 seconds → GET /api/bakong/payment-status/{orderId} → Check transaction by MD5
```

**Frontend Code**:
```javascript
useEffect(() => {
  if (showQRPopup && qrData) {
    const interval = setInterval(async () => {
      await checkPaymentStatus(qrData.order_id);
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }
}, [showQRPopup, qrData]);
```

**Backend Flow**:
1. **BakongPaymentController.php** `checkPaymentStatus()`
2. Gets order and payment_qr_md5
3. Calls **BakongPaymentService.php** `checkTransactionByMD5()`
4. Service calls **BakongKHQR** `checkTransactionByMD5()` with API token
5. Library queries Bakong API for transaction status
6. If status is "COMPLETED":
   - Updates order status to 'paid'
   - Updates payment_status to 'completed'
   - Saves transaction ID
7. Returns status to frontend

**Response (Completed)**:
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "order_status": "paid",
    "transaction": {
      "status": "COMPLETED",
      "transactionId": "TXN123456",
      "amount": 25.50
    }
  }
}
```

### **Step 5: Payment Confirmed**
```
Frontend receives "paid" status → Shows success animation → Redirects to order success page
```

**Frontend Code**:
```javascript
if (result.success && result.data.order_status === 'paid') {
  setPaymentSuccess(true);
  setTimeout(() => {
    router.push('/order-success');
  }, 2000);
}
```

---

## 🔑 Key Components

### **1. KHQR Library Classes**

#### **BakongKHQR.php**
- Main entry point for all KHQR operations
- Static methods for QR generation, verification, decoding
- Instance methods for transaction checking (requires token)

#### **MerchantInfo Model**
```php
new MerchantInfo(
    bakongAccountID: 'yourstore@aba',
    merchantName: 'Your Store',
    merchantCity: 'Phnom Penh',
    merchantID: 'yourstore',
    acquiringBank: 'ABA Bank',
    currency: KHQRData::CURRENCY_USD,
    amount: 25.50,
    mobileNumber: '+855123456789',
    billNumber: 'ORD-000123',
    storeLabel: 'Bookstore'
);
```

#### **Transaction API**
- `checkTransactionByMD5()` - Check by MD5 hash
- `checkTransactionByFullHash()` - Check by full hash
- `checkTransactionByShortHash()` - Check by short hash
- `checkTransactionByInstructionReference()` - Check by reference

### **2. Database Schema**

**orders table**:
```sql
payment_method ENUM('card', 'paypal', 'cod', 'bakong')
payment_qr_code TEXT
payment_qr_md5 VARCHAR(32)
payment_transaction_id VARCHAR(255)
status ENUM('pending', 'paid', 'cancelled', 'completed')
```

### **3. Frontend Components**

**QR Popup Modal**:
- Displays QR code
- Shows payment instructions
- Auto-checks payment status
- Success animation
- Error handling

---

## 🛠️ Configuration Steps

### **1. Install KHQR Library**
```bash
cd backend
composer dump-autoload
```

### **2. Configure Environment**
Edit `backend/.env`:
```env
BAKONG_API_TOKEN=your_token
BAKONG_ACCOUNT_ID=yourstore@aba
BAKONG_MERCHANT_ID=yourstore
BAKONG_MERCHANT_NAME=Your Store Name
BAKONG_MERCHANT_CITY=Phnom Penh
BAKONG_ACQUIRING_BANK=ABA Bank
BAKONG_MOBILE_NUMBER=+855123456789
```

### **3. Run Migrations**
```bash
php artisan migrate
```

### **4. Test QR Generation**
```bash
# Test endpoint
POST http://localhost:8000/api/bakong/generate-qr
{
  "order_id": 1,
  "currency": "USD"
}
```

---

## 🔍 Debugging

### **Check Logs**
```bash
tail -f backend/storage/logs/laravel.log
```

### **Common Issues**

1. **"Failed to generate QR code"**
   - Check BAKONG_MERCHANT_ID is set
   - Verify all required .env variables
   - Check composer autoload

2. **"Column not found: payment_qr_md5"**
   - Run migrations: `php artisan migrate`

3. **"Payment status not updating"**
   - Verify BAKONG_API_TOKEN is valid
   - Check transaction exists in Bakong system
   - Ensure MD5 hash is saved correctly

---

## 📊 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/bakong/generate-qr` | Generate QR code for order |
| GET | `/api/bakong/payment-status/{orderId}` | Check payment status |
| POST | `/api/bakong/verify-account` | Verify Bakong account |
| POST | `/api/bakong/decode-qr` | Decode QR string |
| POST | `/api/bakong/renew-token` | Renew API token (admin) |

---

## ✅ Complete File List

### Backend
1. `backend/app/Http/Controllers/BakongPaymentController.php`
2. `backend/app/Services/BakongPaymentService.php`
3. `backend/khqr-gateway/src/BakongKHQR.php`
4. `backend/khqr-gateway/src/Api/Transaction.php`
5. `backend/khqr-gateway/src/Api/Token.php`
6. `backend/khqr-gateway/src/Api/Account.php`
7. `backend/khqr-gateway/src/Api/DeepLink.php`
8. `backend/khqr-gateway/src/Models/MerchantInfo.php`
9. `backend/khqr-gateway/src/Models/KHQRResponse.php`
10. `backend/khqr-gateway/src/Helpers/KHQRData.php`
11. `backend/khqr-gateway/src/Helpers/Utils.php`
12. `backend/khqr-gateway/src/Helpers/EMV.php`
13. `backend/config/services.php`
14. `backend/.env`
15. `backend/routes/api.php`
16. `backend/composer.json`
17. `backend/database/migrations/2026_01_15_093710_add_bakong_to_payment_method_in_orders_table.php`
18. `backend/database/migrations/2026_01_15_111254_add_payment_qr_md5_to_orders_table.php`

### Frontend
1. `frontend/app/(user)/checkout/page.jsx`
2. `frontend/app/profile/[id]/orders/page.jsx`
3. `frontend/app/utils/request.js`

---

## 🎯 Summary

The Bakong payment process involves:
1. **Controller** handles HTTP requests
2. **Service** contains business logic
3. **KHQR Library** generates QR codes and checks transactions
4. **Frontend** displays QR and polls for payment status
5. **Database** stores QR codes and transaction info

All files work together to provide a seamless Bakong QR payment experience!
