import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/productModel.js";
import Order from "./models/orderModel.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for cleanup");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

const clearData = async () => {
  try {
    const productsResult = await Product.deleteMany({});
    const ordersResult = await Order.deleteMany({});
    console.log(`✅ Deleted ${productsResult.deletedCount} products from database`);
    console.log(`✅ Deleted ${ordersResult.deletedCount} orders/transactions from database`);
    console.log("Database is now clean - ready for new products!");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
};

// Run
connectDB().then(() => {
  clearData();
});
