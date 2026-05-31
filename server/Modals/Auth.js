import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false },
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
