# Payment QR Code & MD5 Relationship Guide

## 🎯 Overview

This document explains the relationship between `payment_qr_code` and `payment_qr_md5` fields in the Bakong payment system, their purposes, and how they work together in the payment process.

---

## 📊 Database Fields

### **orders table**
```sql
payment_qr_code    TEXT        -- The actual QR code string (KHQR format)
payment_qr_md5     VARCHAR(32) -- MD5 hash identifier for transaction tracking
```

---

## 🔗 Field Relationship

### **payment_qr_code**
- **Type**: TEXT (long string)
- **Purpose**: Contains the actual KHQR (Khmer QR) string that users scan
- **Format**: EMV QR Code standard format
- **Example**: `00020101021229370010A000000727012700060004abcd01040102020402000314000000000000000052040000530311654041.005802KH5913Your Store Name6010Phnom Penh62070503***6304ABCD`
- **Usage**: Displayed as QR code image for users to scan with Bakong app

### **payment_qr_md5**
- **Type**: VARCHAR(32) (MD5 hash)
- **Purpose**: Unique identifier for tracking tr