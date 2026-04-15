import Order from "../models/orderModel.js";
import { sendSMS } from "../services/smsService.js";

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

    // 1. Create order in DB
    const order = await Order.create({
      userId: req.user._id, // from authMiddleware
      items,
      total,
      customerEmail,
      customerPhoneNumber,
      address,
      status: "pending",
    });

    console.log("✅ Order created:", order._id);

    // 2. SEND SMS (IMPORTANT PART)
    if (customerPhoneNumber) {
      const smsMessage = `Hi, your order (${order._id}) has been placed successfully. Total: KES ${total}.`;

      const smsResult = await sendSMS(customerPhoneNumber, smsMessage);

      console.log("📲 SMS RESULT:", smsResult);
    } else {
      console.log("⚠️ No phone number provided, SMS skipped");
    }

    // 3. Return response
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
    const orders = await Order.find({ userId: req.user._id });
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

    order.status = req.body.status || order.status;

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.deleteOne();

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
export default { createOrder, getUserOrders, getOrderById, updateOrderStatus, deleteOrder, getAllOrders };