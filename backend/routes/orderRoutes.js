import express from "express";
import Order from "../models/orderModel.js";
import { sendSMS } from "../services/smsService.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE ORDER + SEND SMS
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      total,
      customerEmail,
      customerPhoneNumber,
      address,
    } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const order = await Order.create({
      userId: req.userId,
      items,
      total,
      customerEmail,
      customerPhoneNumber,
      address,
      status: "pending",
    });

    console.log("✅ Order created:", order._id);

    // SEND SMS
    if (customerPhoneNumber) {
      const smsMessage = `Hi, your order (${order._id}) has been placed successfully. Total: KES ${total}.`;

      const smsResult = await sendSMS(customerPhoneNumber, smsMessage);

      console.log("📲 SMS RESULT:", smsResult);
    }

    return res.status(201).json(order);

  } catch (error) {
    console.error("❌ Create Order Error:", error.message);

    return res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const orders = await Order.find({ userId: req.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE ORDER
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update status if provided
    if (req.body.status) {
      order.status = req.body.status;
    }

    // Update transaction code if provided
    if (req.body.transactionCode) {
      order.transactionCode = req.body.transactionCode;
      console.log(`Transaction code added to order ${order._id}: ${req.body.transactionCode}`);
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  try {
    console.log('Delete request received for order:', req.params.id);
    console.log('User ID from token:', req.userId);
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      console.log('Order not found:', req.params.id);
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    const orderUserId = order.userId.toString();
    const currentUserId = req.userId ? req.userId.toString() : null;
    
    console.log('Order user ID:', orderUserId, 'Current user ID:', currentUserId);
    
    if (!currentUserId || orderUserId !== currentUserId) {
      console.log('Unauthorized delete attempt');
      return res.status(403).json({ message: "Unauthorized - You can only delete your own orders" });
    }

    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      console.log('Cannot delete - order status is:', order.status);
      return res.status(400).json({ message: "Only pending orders can be deleted" });
    }

    await order.deleteOne();
    console.log('Order deleted successfully:', req.params.id);

    return res.json({ message: "Order deleted successfully" });

  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ADMIN: GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SETUP ROUTES
router.post("/", protect, createOrder);
router.get("/", protect, getUserOrders);
router.get("/admin/all", protect, getAllOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id", protect, updateOrderStatus);
router.delete("/:id", protect, deleteOrder);

export default router;