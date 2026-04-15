import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import { sendSMS } from '../services/smsService.js';

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { items, total, customerEmail, customerPhoneNumber, address } = req.body;

    // Validate input
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    if (!total) {
      return res.status(400).json({ message: 'Total is required' });
    }

    // Get user phone number if not provided in request
    let phoneNumber = customerPhoneNumber;
    if (!phoneNumber) {
      const user = await User.findById(req.userId);
      phoneNumber = user?.phoneNumber;
    }

    // Create new order
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

    console.log('[Order Controller] Order created:', savedOrder._id);

    // Send order confirmation SMS if phone number available
    if (phoneNumber) {
      const itemSummary = items.map(item => `${item.name} x${item.quantity}`).join(', ');
      const shortOrderId = savedOrder._id.toString().slice(-6).toUpperCase();
      const smsMessage = `Order confirmed! Order ID: ${shortOrderId}. Items: ${itemSummary}. Total: KES ${total}. Delivery to: ${address}. You will receive further updates.`;

      console.log('[Order Controller] Sending SMS to:', phoneNumber);
      const smsResult = await sendSMS(phoneNumber, smsMessage, 'Debex');

      if (smsResult.success) {
        console.log(`[Order Controller] SMS sent successfully to ${phoneNumber}. Message ID: ${smsResult.messageId}`);
      } else {
        console.warn(`[Order Controller] Failed to send SMS: ${smsResult.error}`);
        // Don't fail the order if SMS fails
      }
    } else {
      console.warn('[Order Controller] No phone number available for SMS');
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('[Order Controller] Error creating order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all orders for a user
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('[Order Controller] Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error) {
    console.error('[Order Controller] Error fetching order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await order.save();

    console.log(`[Order Controller] Order ${order._id} status updated: ${oldStatus} → ${status}`);

    // Send SMS notification on status change
    if (order.customerPhoneNumber) {
      const statusMessages = {
        'confirmed': 'Your order has been confirmed. Preparation will start soon.',
        'processing': 'Your order is being processed and will be shipped shortly.',
        'shipped': 'Your order has been shipped! Track your package with your carrier.',
        'delivered': 'Your order has been delivered. Thank you for shopping with Debex!',
        'cancelled': 'Your order has been cancelled. Refund will be processed shortly.'
      };

      const messageText = statusMessages[status] || `Your order status has been updated to: ${status}`;
      const smsMessage = `Order Update: ${messageText} Order ID: ${order._id.toString().slice(-6).toUpperCase()}`;

      const smsResult = await sendSMS(order.customerPhoneNumber, smsMessage, 'Debex');
      if (smsResult.success) {
        console.log(`[Order Controller] Status update SMS sent to ${order.customerPhoneNumber}`);
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('[Order Controller] Error updating order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete order (only pending orders)
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be deleted' });
    }

    await Order.findByIdAndDelete(req.params.id);

    console.log(`[Order Controller] Order ${order._id} deleted`);

    // Send cancellation SMS
    if (order.customerPhoneNumber) {
      const smsMessage = `Your order (ID: ${order._id.toString().slice(-6).toUpperCase()}) has been cancelled.`;
      await sendSMS(order.customerPhoneNumber, smsMessage, 'Debex');
    }

    res.json({ message: 'Order deleted successfully', orderId: order._id });
  } catch (error) {
    console.error('[Order Controller] Error deleting order:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    // Check if user is admin (would need admin field in User model)
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const orders = await Order.find().sort({ createdAt: -1 }).populate('userId', 'name email phoneNumber');
    res.json(orders);
  } catch (error) {
    console.error('[Order Controller] Error fetching all orders:', error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getAllOrders
};
