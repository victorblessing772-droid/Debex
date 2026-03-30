import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: String,
    brand: String,
    stock: {
      type: Number,
      default: 0,
    },
    description: String,
    image: String,
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;