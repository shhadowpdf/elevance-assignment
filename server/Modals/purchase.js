import mongoose from "mongoose";

const purchaseSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    previousPlanCode: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      required: true,
    },
    targetPlanCode: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      required: true,
    },
    listPricePaise: { type: Number, required: true },
    chargedAmountPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    receipt: { type: String, required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    invoiceNumber: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    emailSent: { type: Boolean, default: false },
    emailError: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("purchase", purchaseSchema);
