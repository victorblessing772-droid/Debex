import express from "express";
import { addProduct, getProducts, deleteProduct, deleteByCategory } from "../controllers/productController.js";

const router = express.Router();

router.post("/", addProduct);
router.get("/", getProducts);
router.delete("/:id", deleteProduct);
router.delete("/category/:category", deleteByCategory);

export default router;