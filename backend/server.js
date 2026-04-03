import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db.js";

// routes
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

// connect DB
connectDB();

const app = express();

// Define __dirname for path resolution
const __dirname = path.resolve();

// middleware
app.use(cors());
app.use(express.json());

// serve login.html as the root (must be before static files)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// serve static files from frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// start server
const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});