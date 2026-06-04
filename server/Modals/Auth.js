import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  mobile: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false },
  planCode: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },
  planName: { type: String, default: "Free" },
  watchLimitMinutes: { type: Number, default: 5 },
  planPricePaise: { type: Number, default: 0 },
  planActivatedAt: { type: Date, default: null },
  downloadCountToday: { type: Number, default: 0 },
  lastDownloadDate: { type: Date },
  downloads: [
    {
      videoid: { type: mongoose.Schema.Types.ObjectId, ref: "videofiles" },
      title: { type: String },
      url: { type: String },
      downloadedAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("user", userschema);
