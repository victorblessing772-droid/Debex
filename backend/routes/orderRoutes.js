import express from 'express';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { sendSMS } from '../services/smsService.js';

const router = express.Router();

// Create a new order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, total, customerEmail, customerPhoneNumber, address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get user phone number if not provided in request
    let phoneNumber = customerPhoneNumber;
    if (!phoneNumber) {
      const user = await User.findById(req.userId);
      phoneNumber = user?.phoneNumber;
    }

    const newOrder = new Order({
      userId: req.userId,
      items: items,
      total: total,
      customerEmail: customerEmail,
      customerPhoneNumber: phoneNumber,
      address: address,
      status: 'pending'
    });

    const savedOrder = await newOrder.save();
    
    // Send order confirmation SMS if phone number available
    if (phoneNumber) {
      const itemSummary = items.map(item => `${item.name} x${item.quantity}`).join(', ');
      const smsMessage = `Order confirmed! Order ID: ${savedOrder._id.toString().slice(-6).toUpperCase()}. Items: ${itemSummary}. Total: KES ${total}. Delivery to: ${address}. You will receive further updates.`;
      
      const smsResult = await sendSMS(phoneNumber, smsMessage, 'Debex');
      
      if (smsResult.success) {
        console.log(`[Order Creation] Confirmation SMS sent to ${phoneNumber}`);
      } else {
        console.warn(`[Order Creation] Failed to send SMS: ${smsResult.error}`);
      }
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
