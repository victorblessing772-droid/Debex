import axios from 'axios';
import moment from 'moment';
import { sendSMS } from '../services/smsService.js';

// Initiate M-Pesa STK Push
export const initiateMpesaPayment = async (req, res) => {
  try {
    return res.status(503).json({
      error: 'M-Pesa payment not currently available',
      success: false,
      message: 'This service has been disabled. Please use alternative payment methods.',
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Payment service error',
      success: false,
      details: error.message,
    });
  }
};

// Payment callback
export const paymentCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('Payment Callback:', JSON.stringify(callbackData, null, 2));

    // Parse the callback response
    if (callbackData.Body.stkCallback.ResultCode === 0) {
      // Payment successful
      const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value || '';
      const mpesaCode = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value || '';
      const amount = metadata.find(item => item.Name === 'Amount')?.Value || '';
      
      console.log('Payment Successful:', metadata);
      
      // Send SMS notification for successful payment
      if (phoneNumber) {
        const smsMessage = `Payment successful! Reference: ${mpesaCode}. Amount: KES ${amount}. Your order is being processed.`;
        const smsResult = await sendSMS(phoneNumber, smsMessage, 'Debex');
        
        if (smsResult.success) {
          console.log(`[Payment Callback] SMS sent successfully to ${phoneNumber}`);
        } else {
          console.warn(`[Payment Callback] Failed to send SMS: ${smsResult.error}`);
        }
      }
      
      // TODO: Update order status to 'paid' in database
      
      return res.status(200).json({
        success: true,
        message: 'Payment received',
        mpesaReference: mpesaCode,
      });
    } else {
      // Payment failed
      const resultDesc = callbackData.Body.stkCallback.ResultDesc;
      const phoneNumber = callbackData.Body.stkCallback.PhoneNumber || '';
      
      console.log('Payment Failed:', resultDesc);
      
      // Send SMS notification for failed payment
      if (phoneNumber) {
        const smsMessage = `Payment failed: ${resultDesc}. Please try again or contact support.`;
        const smsResult = await sendSMS(phoneNumber, smsMessage, 'Debex');
        
        if (smsResult.success) {
          console.log(`[Payment Callback] Failure SMS sent successfully to ${phoneNumber}`);
        } else {
          console.warn(`[Payment Callback] Failed to send SMS: ${smsResult.error}`);
        }
      }
      
      // TODO: Update order status to 'failed' in database
      
      return res.status(200).json({
        success: false,
        message: 'Payment failed',
        reason: resultDesc,
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
    return res.status(503).json({
      error: 'M-Pesa payment not currently available',
      success: false,
      message: 'This service has been disabled.',
    });
  } catch (error) {
    console.error('Error querying payment status:', error.message);
    return res.status(500).json({
      error: 'Failed to query payment status',
      details: error.message,
    });
  }
};
