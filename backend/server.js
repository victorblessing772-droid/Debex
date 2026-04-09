import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// routes
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

// connect to MongoDB
connectDB();

const app = express();

// 🔐 middleware
app.use(cors());
app.use(express.json());

// 🧪 health check route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// 📦 API routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// 🚀 start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});