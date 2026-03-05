# Oman Visa CRM Verification Checklist

The web app calls these CRM endpoints. The **CRM project is not in this workspace** – open it separately to verify.

## CRM Endpoints Used

| Step | Endpoint | Called by |
|------|----------|-----------|
| 1 | `POST /api/website/oman-visa-enquiry/upload-and-prepare` | Web app `create-order` (before payment) |
| 2 | `POST /api/website/oman-visa-enquiry/complete-payment` | CCAvenue callback (after successful payment) |

## If Records Are Not Created in CRM

### 1. Verify `upload-and-prepare` creates records in `oman_visa_pending`
- Table: `oman_visa_pending` (or equivalent)
- Must return `{ success: true, order_id: "OVxxxxx...", customer_name, customer_email, customer_phone }`
- `order_id` format should start with `OV` (e.g. `OV12345678XYZ`)

### 2. Verify `complete-payment` expects
```json
{
  "order_id": "OV12345678XYZ",
  "payment_transaction_id": "CCAvenue tracking id",
  "payment_amount": 150,
  "payment_currency": "AED"
}
```
- Must look up `oman_visa_pending` by `order_id`
- Move row to `oman_visa_enquiries`
- Return `{ success: true, name, email, contact }`

### 3. API Key
- Web app uses `WEBSITE_API_KEY` in `x-api-key` header
- CRM must accept the same key – confirm both projects use the same value

### 4. CCAvenue `order_id`
- Web app sends `order_id` from CRM (`upload-and-prepare` response) to CCAvenue
- CCAvenue returns this in response as `order_id` or `merchant_param1`
- CRM `complete-payment` must receive the exact same string to find the pending row

## How to Open CRM Project in Cursor

1. Locate your CRM project folder (e.g. `aapka-tourism-crm`, `crm`, etc.)
2. In Cursor: **File → Open Folder** → select the CRM project
3. Search for:
   - `upload-and-prepare`
   - `complete-payment`
   - `oman_visa_pending`
   - `oman_visa_enquiries`

## Web App Logs to Check

After a payment, check server logs for:
- `[CCAVENUE] Parsed response:` – confirms `order_id`, `bookingId`, `paymentType`
- `[OMAN VISA] Calling complete-payment:` – confirms URL and `order_id` sent
- `Oman visa complete-payment failed:` – CRM response when it fails
