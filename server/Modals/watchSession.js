import mongoose from "mongoose";

const watchSessionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    maxWatchSeconds: {
      type: Number,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("watchsession", watchSessionSchema);
