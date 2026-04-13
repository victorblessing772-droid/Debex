import express from 'express';
import { initiateMpesaPayment, paymentCallback, queryMpesaStatus } from '../controllers/paymentController.js';

const router = express.Router();

// Initiate M-Pesa payment
router.post('/initiate', initiateMpesaPayment);

// Payment callback endpoint (called by Daraja)
router.post('/callback', paymentCallback);

// Query payment status
router.post('/query', queryMpesaStatus);

export default router;
