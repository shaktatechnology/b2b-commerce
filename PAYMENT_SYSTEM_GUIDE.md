# Complete Payment System Implementation Guide

## Overview
This document provides a complete guide to the newly implemented payment system supporting both **PayPal** and **eSewa** payment gateways.

## Architecture

```
User Flow:
1. Create Order (Cart → Checkout)
2. Select Payment Gateway
3. PayPal → PayPal Buttons.js → Capture → Verification
   eSewa → Auto-submit Form → eSewa Redirect → Verification
4. Payment Verified → Update Order Status
5. Show Order Confirmation
```

## Components & Files

### Frontend Implementation

#### 1. Payment Page (`src/app/payment/page.tsx`)
- Acts as router for different payment gateways
- Loads payment configuration from backend
- Routes to PayPalPaymentForm or EsewaPaymentForm based on gateway

#### 2. PayPal Payment Form (`src/components/checkout/PaypalPaymentForm.tsx`)
- Loads PayPal Buttons.js SDK dynamically
- Implements `createOrder` callback to create order on PayPal API
- Implements `onApprove` callback to capture payment
- Handles errors and redirects to confirmation page

#### 3. eSewa Payment Form (`src/components/checkout/EsewaPaymentForm.tsx`)
- Already implemented (existing)
- Auto-submits form to eSewa sandbox
- Uses HMAC-SHA256 signature for authentication

#### 4. Payment Verification (`src/app/payment-verify/page.tsx`)
- Handles eSewa callback redirect
- Verifies payment with backend
- Clears cart on success
- Redirects to order confirmation

#### 5. Order Confirmation (`src/app/order-confirmation/page.tsx`)
- Displays successful order details
- Shows order number, status, payment status
- Provides next steps information

### Backend Implementation

#### 1. PayPal Controller (`app/Http/Controllers/Api/Payment/PayPalController.php`)

**POST `/api/paypal/create-order`**
- Validates payment ID and amount
- Calls PayPal API to create order
- Returns `paypal_order_id` for Buttons.js approval flow

**POST `/api/paypal/capture-order`**
- Calls PayPal API to capture payment
- Verifies transaction with PayPal
- Updates Payment record with `status='completed'`
- Updates Order with `payment_status='paid'`

**GET `/api/paypal/return`**
- Handles PayPal redirect return
- Validates return parameters
- Stores PayPal order ID in payment record

#### 2. eSewa Controller (`app/Http/Controllers/Api/Payment/EsewaController.php`)

**POST `/api/esewa/success`**
- Receives eSewa callback with transaction details
- Verifies HMAC-SHA256 signature
- Updates Payment and Order records

**POST `/api/esewa/failure`**
- Receives failure callback
- Marks payment as failed

**Signature Verification:**
```
Formula: "total_amount=X,transaction_uuid=Y,product_code=Z"
Encoding: HMAC-SHA256 with base64 encoding
```

#### 3. Payment Service (`app/Services/Payment/PaymentService.php`)
- Generates eSewa signature with correct format
- Creates pending payment records
- Returns gateway-specific configuration

#### 4. Payment Controller (`app/Http/Controllers/Api/Payment/PaymentController.php`)

**POST `/api/payments/verify`** (Updated)
- Verifies payment status from gateway callback
- Updates Payment record status
- Updates Order payment_status and status
- Returns updated payment details

## Setup Instructions

### 1. Database Migration (CRITICAL)

Run the migration to add `additional_info` field to products:

```bash
cd backend
php artisan migrate
```

### 2. Update Product Model

Edit `app/Models/Product.php` and ensure `additional_info` is in `$fillable`:

```php
protected $fillable = [
    'name',
    'slug',
    'description',
    'long_description',
    'additional_info',  // ← Add this
    'sku',
    'price',
    'stock_quantity',
    // ... rest of fields
];
```

### 3. Configure Payment Gateway Settings

Insert these settings into the `settings` table in your database:

#### PayPal Configuration:
```sql
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('paypal_active', '1', NOW(), NOW()),
('paypal_mode', 'sandbox', NOW(), NOW()),
('paypal_client_id', 'YOUR_PAYPAL_CLIENT_ID', NOW(), NOW()),
('paypal_client_secret', 'YOUR_PAYPAL_CLIENT_SECRET', NOW(), NOW());
```

#### eSewa Configuration (Sandbox):
```sql
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('esewa_active', '1', NOW(), NOW()),
('esewa_mode', 'sandbox', NOW(), NOW()),
('esewa_merchant_code', 'EPAYTEST', NOW(), NOW()),
('esewa_secret_key', '8g7h3o91bh14', NOW(), NOW());
```

### 4. Get PayPal Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Create or log in to your account
3. Create a new application in Sandbox environment
4. Copy the **Client ID** and **Secret**
5. Update the settings with these values

### 5. Environment Configuration

Ensure your backend `.env` has:

```env
APP_URL=http://localhost:3000  # or your frontend URL
FRONTEND_URL=http://localhost:3000

# For production, use https://
APP_URL=https://yourdomain.com
```

## Payment Flow Details

### PayPal Flow:

1. **User initiates payment**
   ```
   User clicks "Pay with PayPal" → Frontend sends order_id & gateway='paypal'
   ```

2. **Backend initiates payment**
   ```
   POST /api/payments/initiate
   Returns: payment_id, paypal client_id, mode
   ```

3. **Frontend loads PayPal Buttons**
   ```
   Navigate to /payment?order_id=X&payment_id=Y&gateway=paypal
   Loads PayPal SDK with clientId
   Renders PayPal Buttons
   ```

4. **User clicks PayPal Button**
   ```
   PayPal Buttons calls createOrder callback
   Frontend calls POST /api/paypal/create-order
   Backend calls PayPal API to create order
   Returns paypal_order_id to frontend
   ```

5. **User authorizes on PayPal**
   ```
   User approves payment on PayPal
   PayPal calls onApprove callback with orderID
   ```

6. **Frontend captures payment**
   ```
   Calls POST /api/paypal/capture-order
   Backend calls PayPal API to capture payment
   Backend updates Payment and Order records
   Frontend redirects to /order-confirmation
   ```

### eSewa Flow:

1. **User initiates payment**
   ```
   User clicks "Pay with eSewa" → Frontend sends order_id & gateway='esewa'
   ```

2. **Backend generates eSewa form**
   ```
   POST /api/payments/initiate
   Returns: eSewa config with HMAC signature
   ```

3. **Frontend auto-submits form**
   ```
   Navigate to /payment?order_id=X&payment_id=Y&gateway=esewa
   Shows EsewaPaymentForm which auto-submits to eSewa
   ```

4. **User completes payment on eSewa**
   ```
   eSewa processes payment
   Redirects to success_url with transaction details
   ```

5. **Backend receives callback**
   ```
   Frontend payment-verify page verifies with backend
   POST /api/payments/verify verifies payment
   Backend updates Payment and Order records
   Frontend redirects to /order-confirmation
   ```

## Testing

### PayPal Sandbox Testing:

1. Create test accounts in [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/accounts)
2. Create a Business account (seller) and Personal account (buyer)
3. Get buyer account credentials
4. In checkout, select PayPal and pay with buyer account
5. Test transactions are not charged

**Test Credentials Format:**
- Email: test-buyer@example.com
- Password: automatic (assigned by PayPal)

### eSewa Sandbox Testing:

1. Use provided test credentials:
   - Merchant Code: `EPAYTEST`
   - Secret: `8g7h3o91bh14`
2. Any transaction UUID works in sandbox
3. Payment typically completes immediately

**Test URLs:**
- Request: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- Callback: Your configured `success_url`

## Error Handling

### Common Issues:

| Issue | Solution |
|-------|----------|
| "PayPal credentials not configured" | Check settings table for paypal_client_id |
| "eSewa payment gateway is disabled" | Set esewa_active='1' in settings |
| Payment shows as pending | Verify webhook/callback is being received |
| Signature mismatch error | Check eSewa secret_key matches in settings |
| CORS errors | Ensure APP_URL is correct in .env |

## Security Considerations

### Payment Verification:
- ✅ All payment status changes verified with payment provider
- ✅ eSewa signatures verified with HMAC-SHA256
- ✅ User ownership verified before payment processing
- ✅ Transaction amounts verified against order totals

### Best Practices:
- 🔒 Store secrets in environment variables
- 🔒 Always verify signatures on callbacks
- 🔒 Never trust frontend payment data directly
- 🔒 Use HTTPS in production
- 🔒 Log all payment transactions for reconciliation

## Database Schema

### Payments Table (Existing):
```sql
- id (UUID)
- order_id (FK)
- gateway (enum: paypal, esewa)
- amount (decimal)
- status (pending, completed, failed)
- transaction_id (from gateway)
- gateway_response (JSON)
- paid_at (timestamp)
```

### Settings Table (Update needed):
```sql
Key examples:
- paypal_active
- paypal_mode
- paypal_client_id
- paypal_client_secret
- esewa_active
- esewa_mode
- esewa_merchant_code
- esewa_secret_key
```

## Production Deployment

Before deploying to production:

1. **Switch to Live Mode:**
   - Update `paypal_mode` to "live"
   - Update `esewa_mode` to "live"
   - Update `APP_URL` to production domain

2. **Update Credentials:**
   - Use live PayPal credentials
   - Use live eSewa credentials

3. **Enable HTTPS:**
   - All payment processing requires HTTPS
   - Update redirect URLs

4. **Verify URLs:**
   - Ensure callback URLs use production domain
   - Update webhook endpoints

5. **Test Full Flow:**
   - Make test payment with live credentials
   - Verify order completion
   - Check payment confirmation emails

## API Reference

### Payment Endpoints:

```
POST /api/payments/initiate
  Body: { order_id, gateway }
  Returns: { payment_id, amount, [paypal|esewa]: {...} }

POST /api/payments/verify
  Body: { payment_id, gateway, status, ... }
  Returns: { message, data: payment }

POST /api/paypal/create-order
  Body: { payment_id, order_id, amount }
  Returns: { paypal_order_id }

POST /api/paypal/capture-order
  Body: { payment_id, paypal_order_id }
  Returns: { message, payment_id, order_id }

POST /api/esewa/success
  Body: { eSewa callback parameters }
  Returns: { message, payment_id }

POST /api/esewa/failure
  Body: { transaction_uuid }
  Returns: { message }
```

## Support & Troubleshooting

### Debugging:

Check Laravel logs:
```bash
tail -f storage/logs/laravel.log
```

Check browser console for frontend errors.

### Common PayPal Errors:

- `"Invalid client ID"` - Check PayPal credentials
- `"Order creation failed"` - Verify payment amount is valid
- `"Cannot capture this order"` - Payment may already be captured

### Common eSewa Errors:

- `"Invalid signature"` - Secret key doesn't match
- `"Amount mismatch"` - Order total changed after payment
- `"Transaction UUID not found"` - Payment ID not in database
