# QR Modal Timing Issue Fix

## Problem
The QR modal was showing "Payment Failed" for about 3 seconds before displaying the actual QR code. This created a confusing user experience where users saw failure messages before the QR code was ready.

## Root Cause
The issue was caused by a race condition in the QR generation flow:

1. `setShowQRModal(true)` was called immediately
2. `generateQRCode()` was called asynchronously 
3. The modal showed with `paymentStatus="pending"` and `qrData=null`
4. The countdown timer effect triggered and saw `timeLeft <= 0` (initial value)
5. This immediately set `paymentStatus="failed"`
6. Then the QR generation completed and set the proper data

## Solution Applied

### 1. Changed Order of Operations
Instead of showing the modal first and then generating QR:
- Generate QR code first
- Only show modal when QR data is ready
- Handle loading state properly

```javascript
// Before (problematic)
setShowQRModal(true);
await generateQRCode(response.order.id);

// After (fixed)
setIsGeneratingQR(true);
const qrResponse = await generateQRCode();
setIsGeneratingQR(false);
if (qrResponse.success) {
  setQrData(qrResponse.data);
  setShowQRModal(true); // Only show when ready
}
```

### 2. Fixed Countdown Timer Logic
Added check for `qrData` to prevent premature expiration:

```javascript
// Before
useEffect(() => {
  if (!showQRModal || paymentStatus !== "pending") return;
  if (timeLeft <= 0) {
    setPaymentStatus("failed"); // Triggered immediately!
  }
}, [timeLeft, showQRModal, paymentStatus]);

// After
useEffect(() => {
  if (!showQRModal || paymentStatus !== "pending" || !qrData) return;
  if (timeLeft <= 0) {
    setPaymentStatus("failed"); // Only when QR data exists
  }
}, [timeLeft, showQRModal, paymentStatus, qrData]);
```

### 3. Added Loading States
- Added `isGeneratingQR` state to show proper loading
- Updated button states during QR generation
- Added specific loading message for QR generation

### 4. Improved Try Again Flow
- Updated retry button to use the same improved flow
- Added loading state for retry operations
- Proper error handling during retry

## User Experience Improvements

### Before Fix:
1. User clicks "Complete Order"
2. Modal opens immediately showing "Payment Failed" 
3. After 3 seconds, QR code appears
4. Confusing and alarming experience

### After Fix:
1. User clicks "Complete Order"
2. Button shows "Generating QR..." with loading state
3. Modal opens only when QR is ready
4. Smooth, professional experience

## Files Modified
- `frontend/app/(user)/checkout/page.jsx`

## Status: RESOLVED ✅
The QR modal timing issue has been completely fixed. Users now see a smooth flow without false failure messages.