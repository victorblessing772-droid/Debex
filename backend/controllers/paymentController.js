import axios from 'axios';
import moment from 'moment';

const DARAJA_URL = 'https://sandbox.safaricom.co.ke';
const CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET;
const SHORTCODE = process.env.DARAJA_SHORTCODE || '174379';
const PASSKEY = process.env.DARAJA_PASSKEY || 'bfb279f9ba9b9d4858f26b5b14ce40934';
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://debex-7ixn.onrender.com/api/payment/callback';

console.log('M-Pesa Configuration:');
console.log('- SHORTCODE:', SHORTCODE);
console.log('- PASSKEY exists:', !!PASSKEY);
console.log('- CONSUMER_KEY exists:', !!CONSUMER_KEY);
console.log('- CONSUMER_SECRET exists:', !!CONSUMER_SECRET);
console.log('- CALLBACK_URL:', CALLBACK_URL);

// Get OAuth token
const getAccessToken = async () => {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(`${DARAJA_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    console.log('Access token obtained successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to get Daraja token: ' + (error.response?.data?.error_description || error.message));
  }
};

// Initiate M-Pesa STK Push
export const initiateMpesaPayment = async (req, res) => {
  try {
    const { phoneNumber, amount, orderData } = req.body;

    // Validate inputs
    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: 'Phone number and amount are required', success: false });
    }

    console.log('Initiating M-Pesa payment for:', phoneNumber, 'Amount:', amount);

    // Check all required credentials
    const missingCreds = [];
    if (!CONSUMER_KEY) missingCreds.push('CONSUMER_KEY');
    if (!CONSUMER_SECRET) missingCreds.push('CONSUMER_SECRET');
    if (!PASSKEY) missingCreds.push('PASSKEY');
    if (!SHORTCODE) missingCreds.push('SHORTCODE');

    if (missingCreds.length > 0) {
      console.error('Missing credentials:', missingCreds);
      return res.status(500).json({ 
        error: 'Server configuration error',
        success: false,
        details: 'Missing environment variables: ' + missingCreds.join(', '),
        missingVars: missingCreds
      });
    }

    console.log('All credentials present, proceeding...');

    // Format phone number - remove +/0 and ensure starts with 254
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }

    console.log('Formatted phone:', formattedPhone);

    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (tokenError) {
      console.error('Token error:', tokenError.message);
      return res.status(500).json({
        error: 'Authentication failed',
        success: false,
        details: tokenError.message
      });
    }

    const timestamp = moment().format('YYYYMMDDHHmmss');
    
    // Create password for STK push
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const requestBody = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount), // Amount must be in KES (whole number)
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: 'Debex Order',
      TransactionDesc: 'DEBEX Electrical Payment',
    };

    console.log('STK Push Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      `${DARAJA_URL}/mpesa/stkpush/v1/processrequest`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('STK Push Response:', response.data);

    return res.status(200).json({
      success: true,
      message: 'STK push sent successfully',
      data: response.data,
      orderData: orderData, // Return order data for reference
    });
  } catch (error) {
    console.error('Error initiating M-Pesa payment:');
    console.error('Error type:', error.constructor.name);
    console.error('Status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Full error:', error);
    
    // Extract details from different error sources
    let errorDetails = error.response?.data || error.message;
    
    return res.status(500).json({
      error: 'Failed to initiate payment',
      success: false,
      details: errorDetails,
      status: error.response?.status || 500,
      errorType: error.constructor.name
    });
  }
};

// Payment callback from Daraja
export const paymentCallback = (req, res) => {
  try {
    const callbackData = req.body;
    console.log('Payment Callback:', JSON.stringify(callbackData, null, 2));

    // Parse the callback response
    if (callbackData.Body.stkCallback.ResultCode === 0) {
      // Payment successful
      const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
      console.log('Payment Successful:', metadata);
      
      // TODO: Update order status in database
      // TODO: Send confirmation email
      
      return res.status(200).json({
        success: true,
        message: 'Payment received',
      });
    } else {
      // Payment failed
      console.log('Payment Failed:', callbackData.Body.stkCallback.ResultDesc);
      
      // TODO: Update order status to failed
      
      return res.status(200).json({
        success: false,
        message: 'Payment failed',
        reason: callbackData.Body.stkCallback.ResultDesc,
      });
    }
  } catch (error) {
    console.error('Callback Error:', error);
    return res.status(500).json({
      error: 'Callback processing failed',
    });
  }
};

// Query payment status
export const queryMpesaStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;

    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'Checkout request ID is required' });
    }

    const accessToken = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const requestBody = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await axios.post(
      `${DARAJA_URL}/mpesa/stkpushquery/v1/query`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Error querying payment status:', error.message);
    return res.status(500).json({
      error: 'Failed to query payment status',
      details: error.message,
    });
  }
};
