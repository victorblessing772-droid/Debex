import express from 'express';
import { createOrder, getUserOrders, getOrderById, updateOrderStatus, deleteOrder, getAllOrders } from '../controllers/orderController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new order
router.post('/', authMiddleware, createOrder);

// Get all orders for a user
router.get('/', authMiddleware, getUserOrders);

// Get a specific order
router.get('/:id', authMiddleware, getOrderById);

// Update order status
router.put('/:id', authMiddleware, updateOrderStatus);

// Delete order
router.delete('/:id', authMiddleware, deleteOrder);

// Get all orders (admin only)
router.get('/admin/all', authMiddleware, getAllOrders);

export default router;
