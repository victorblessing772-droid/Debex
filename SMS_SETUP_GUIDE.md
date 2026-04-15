# Africa's Talking SMS Integration - Quick Setup Guide

## Prerequisites

1. **Africa's Talking Account** - Sign up at https://africastalking.com
2. **API Credentials** - Get from your AT dashboard:
   - `AT_USERNAME` - Your account username
   - `AT_API_KEY` - Your API key from Settings → API Keys

## Step 1: Update Environment Variables

Edit `backend/.env` and replace:

```env
# Africa's Talking SMS API
AT_USERNAME=your_africastalking_username
AT_API_KEY=your_africastalking_api_key
```

Replace with your actual Africa's Talking credentials.

## Step 2: Verify Dependencies

All dependencies are already installed. Verify with:

```bash
cd backend
npm ls axios dotenv
```

Should show:
- `axios@^1.15.0` ✓
- `dotenv@^17.3.1` ✓

## Step 3: Test SMS Service

```bash
cd backend
node -e "
import('./services/smsService.js').then(m => {
  console.log('✓ SMS Service loaded successfully');
  console.log('✓ Available functions:', Object.keys(m));
});
"
```

## Step 4: Test API Integration

Send a test SMS:

```bash
cd backend
node -e "
import('./services/smsService.js').then(async (m) => {
  const result = await m.sendSMS('+254XXXXXXXXX', 'Test SMS from Debex', 'Debex');
  console.log('Result:', JSON.stringify(result, null, 2));
});
"
```

Replace `+254XXXXXXXXX` with your test phone number.

## Step 5: Update Frontend

Update your registration and order forms to collect phone numbers:

```html
<!-- Registration Form -->
<input type="tel" name="phoneNumber" placeholder="Phone number" required />

<!-- Order Form -->
<input type="tel" name="customerPhoneNumber" placeholder="Phone number" required />
```

## Step 6: Test Full Flow

### Test 1: User Registration
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+254XXXXXXXXX",
    "password": "testpass123"
  }'
```

Expected: Welcome SMS sent to phone number

### Test 2: Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "id": "1",
        "name": "LED Bulb",
        "price": 500,
        "quantity": 2,
        "image": "url"
      }
    ],
    "total": "1000",
    "customerEmail": "test@example.com",
    "customerPhoneNumber": "+254XXXXXXXXX",
    "address": "123 Main St"
  }'
```

Expected: Order confirmation SMS sent

### Test 3: Payment Success
Complete M-Pesa STK push payment via your payment UI.

Expected: Payment success SMS with reference and amount

## Troubleshooting

### "No API credentials found"
- ✗ Check `.env` file has `AT_USERNAME` and `AT_API_KEY`
- ✗ Restart server after updating `.env`
- ✗ Verify credentials are correct in Africa's Talking dashboard

### "SMS sending failed" or "API error"
- ✗ Check Africa's Talking account has active balance
- ✗ Verify phone number format: should be `+254...`
- ✗ Check API key is valid (may have expired)
- ✗ Look at server console for `[SMS Service]` error messages

### "Phone number invalid"
- ✗ Ensure phone number is in format: `+254XXXXXXXXX`
- ✗ Service auto-normalizes: `07XX` → `+254...` ✓

### "SMS Service not imported"
- ✗ Verify `services/smsService.js` exists
- ✗ Check import path: `from '../services/smsService.js'`
- ✗ Ensure `import` is used (not `require`)

## Monitoring SMS in Production

Add this to track SMS sends in logs:

```bash
# Filter SMS logs
tail -f /path/to/server.log | grep "[SMS Service]"
```

Look for:
- ✓ `[SMS Service] Sending SMS...` - SMS queued
- ✓ `[SMS Service] SMS sent successfully` - Success
- ✗ `[SMS Service] Error sending SMS` - Failed

## API Response Examples

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "messageId": "ATXidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "response": {
    "SMSMessageData": {
      "Message": "Sent",
      "Recipients": [
        {
          "statusCode": 101,
          "number": "+254XXXXXXXXX",
          "status": "Success",
          "messageId": "ATXidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      ]
    }
  },
  "recipientCount": 1
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 401,
  "error": "Invalid API key",
  "response": {
    "error": "InvalidApiKey"
  }
}
```

## Feature Request: Bulk SMS

The service supports sending to multiple numbers:

```javascript
import { sendSMS } from '../services/smsService.js';

const recipients = ['+254XXXXXXXXX', '+254YYYYYYYYY'];
const result = await sendSMS(recipients, 'Hello everyone!', 'Debex');
```

## Next Steps

1. ✅ Get Africa's Talking credentials
2. ✅ Update `.env` file
3. ✅ Run tests from Step 4-6
4. ✅ Update frontend forms
5. ✅ Deploy to production
6. ✅ Monitor SMS in logs

## Resources

- Africa's Talking Docs: https://africastalking.com/sms/api
- API Status: https://status.africastalking.com
- Support: https://support.africastalking.com

---
**Ready to send SMS!** 🚀
