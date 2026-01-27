# Author Bakong Payment API Documentation

## Overview
This API allows authors to set up and manage their Bakong payment information for receiving payments from book sales. Authors can input their Bakong account details, verify their accounts, and test QR code generation.

## Database Schema
New fields added to the `users` table:
- `bakong_account_id` - Bakong account ID (e.g., "author@bkrt")
- `bakong_merchant_name` - Merchant display name
- `bakong_merchant_city` - Merchant city
- `bakong_merchant_id` - Merchant ID (auto-generated from account ID if not provided)
- `bakong_acquiring_bank` - Bank name
- `bakong_mobile_number` - Contact mobile number
- `bakong_account_verified` - Boolean verification status
- `bakong_verified_at` - Timestamp of verification

## API Endpoints

### 1. Get Author's Bakong Information
**Endpoint**: `GET /api/author/bakong/info`
**Authentication**: JWT Bearer token required
**Authorization**: User must have `role = 'author'`

**Response**:
```json
{
  "success": true,
  "data": {
    "bakong_account_id": "author@bkrt",
    "bakong_merchant_name": "John Doe Books",
    "bakong_merchant_city": "Phnom Penh",
    "bakong_merchant_id": "author",
    "bakong_acquiring_bank": "ABA Bank",
    "bakong_mobile_number": "+855123456789",
    "bakong_account_verified": true,
    "bakong_verified_at": "2026-01-27T10:30:00.000000Z"
  }
}
```

### 2. Update Author's Bakong Information
**Endpoint**: `POST /api/author/bakong/info`
**Authentication**: JWT Bearer token required
**Authorization**: User must have `role = 'author'`

**Request Body**:
```json
{
  "bakong_account_id": "author@bkrt",
  "bakong_merchant_name": "John Doe Books",
  "bakong_merchant_city": "Phnom Penh",
  "bakong_merchant_id": "author",
  "bakong_acquiring_bank": "ABA Bank",
  "bakong_mobile_number": "+855123456789"
}
```

**Validation Rules**:
- `bakong_account_id`: Required, string, max 255 chars, must match email format
- `bakong_merchant_name`: Required, string, max 255 chars
- `bakong_merchant_city`: Required, string, max 255 chars
- `bakong_merchant_id`: Optional, string, max 255 chars (auto-generated if not provided)
- `bakong_acquiring_bank`: Required, string, max 255 chars
- `bakong_mobile_number`: Optional, string, max 20 chars, phone number format

**Response**:
```json
{
  "success": true,
  "message": "Bakong payment information updated successfully",
  "data": {
    "bakong_account_id": "author@bkrt",
    "bakong_merchant_name": "John Doe Books",
    "bakong_merchant_city": "Phnom Penh",
    "bakong_merchant_id": "author",
    "bakong_acquiring_bank": "ABA Bank",
    "bakong_mobile_number": "+855123456789",
    "bakong_account_verified": false,
    "bakong_verified_at": null
  }
}
```

### 3. Verify Bakong Account
**Endpoint**: `POST /api/author/bakong/verify`
**Authentication**: JWT Bearer token required
**Authorization**: User must have `role = 'author'`

**Description**: Verifies the author's Bakong account exists using the Bakong API.

**Response (Success)**:
```json
{
  "success": true,
  "message": "Bakong account verified successfully",
  "data": {
    "bakong_account_verified": true,
    "bakong_verified_at": "2026-01-27T10:30:00.000000Z"
  }
}
```

**Response (Account Not Found)**:
```json
{
  "success": false,
  "message": "Bakong account not found or invalid. Please check your account ID."
}
```

### 4. Test QR Code Generation
**Endpoint**: `POST /api/author/bakong/test-qr`
**Authentication**: JWT Bearer token required
**Authorization**: User must have `role = 'author'`

**Description**: Tests QR code generation using the author's Bakong information.

**Request Body**:
```json
{
  "amount": 10.50,
  "currency": "USD"
}
```

**Validation Rules**:
- `amount`: Required, numeric, minimum 0.01
- `currency`: Required, must be "USD" or "KHR"

**Response (Success)**:
```json
{
  "success": true,
  "message": "QR code generated successfully",
  "data": {
    "qr_string": "00020101021229370010A000000727012...",
    "md5": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "amount": 10.50,
    "currency": "USD"
  }
}
```

### 5. Get Acquiring Banks List
**Endpoint**: `GET /api/author/bakong/banks`
**Authentication**: JWT Bearer token required
**Authorization**: User must have `role = 'author'`

**Description**: Returns a list of common acquiring banks in Cambodia.

**Response**:
```json
{
  "success": true,
  "data": [
    "ABA Bank",
    "ACLEDA Bank",
    "Canadia Bank",
    "Cambodia Public Bank",
    "Foreign Trade Bank of Cambodia",
    "Hattha Bank",
    "Maybank Cambodia",
    "Phillip Bank",
    "Prince Bank",
    "SBI Royal Securities",
    "Sathapana Bank",
    "TrueMoney Cambodia",
    "Wing Bank",
    "Woori Bank Cambodia"
  ]
}
```

## Error Responses

### 403 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized. Author access required."
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "bakong_account_id": ["The bakong account id field is required."],
    "bakong_merchant_name": ["The bakong merchant name field is required."]
  }
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to update Bakong information",
  "error": "Database connection error"
}
```

## Usage Flow

1. **Setup**: Author calls `POST /api/author/bakong/info` to input their Bakong payment details
2. **Verification**: Author calls `POST /api/author/bakong/verify` to verify their account exists
3. **Testing**: Author can call `POST /api/author/bakong/test-qr` to test QR generation
4. **Management**: Author can call `GET /api/author/bakong/info` to view current settings

## Security Features

- JWT authentication required for all endpoints
- Role-based authorization (author only)
- Input validation and sanitization
- Account verification through Bakong API
- Automatic verification reset when account ID changes

## Integration Notes

- The system automatically generates `bakong_merchant_id` from `bakong_account_id` if not provided
- Verification status is reset when the account ID changes
- QR code testing uses temporary configuration override
- All Bakong API interactions are logged for debugging

## Frontend Integration

Authors can use these endpoints to:
- Set up their payment information in their dashboard
- Verify their Bakong accounts
- Test payment functionality before going live
- Update their payment details as needed

The API is designed to be user-friendly while maintaining security and data integrity.