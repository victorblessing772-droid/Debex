import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        id: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    total: String,
    customerEmail: String,
    customerPhoneNumber: String,
    address: String,
    status: {
      type: String,
      default: "pending",
    },
    transactionCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);