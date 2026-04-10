import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// routes
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

// connect to MongoDB
connectDB();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🔐 middleware
app.use(cors());
app.use(express.json());

// 📁 Serve static files from frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// 🧪 health check route (VERY IMPORTANT)
app.get("/api", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// 📦 API routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// Serve index.html on root path (SPA fallback)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// 🚀 start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});