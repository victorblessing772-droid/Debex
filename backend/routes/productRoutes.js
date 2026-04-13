import express from "express";
import { addProduct, getProducts, deleteProduct, deleteByCategory } from "../controllers/productController.js";

const router = express.Router();

router.post("/", addProduct);
router.get("/", getProducts);
router.delete("/category/:category", deleteByCategory);
router.delete("/:id", deleteProduct);

export default router;