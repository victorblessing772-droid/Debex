import express from 'express';
import { initiateMpesaPayment, paymentCallback, queryMpesaStatus } from '../controllers/paymentController.js';

const router = express.Router();

// Test endpoint to verify configuration
router.get('/config-check', (req, res) => {
  const hasKey = !!process.env.DARAJA_CONSUMER_KEY;
  const hasSecret = !!process.env.DARAJA_CONSUMER_SECRET;
  const hasPasskey = !!process.env.DARAJA_PASSKEY;
  const hasShortcode = !!process.env.DARAJA_SHORTCODE;

  return res.json({
    configStatus: {
      CONSUMER_KEY: hasKey,
      CONSUMER_SECRET: hasSecret,
      PASSKEY: hasPasskey,
      SHORTCODE: hasShortcode,
      allSet: hasKey && hasSecret && hasPasskey && hasShortcode
    },
    values: {
      SHORTCODE: process.env.DARAJA_SHORTCODE,
      CALLBACK_URL: process.env.CALLBACK_URL
    }
  });
});

// Initiate M-Pesa payment
router.post('/initiate', initiateMpesaPayment);

// Payment callback endpoint (called by Daraja)
router.post('/callback', paymentCallback);

// Query payment status
router.post('/query', queryMpesaStatus);

export default router;