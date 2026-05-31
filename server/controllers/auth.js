import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import "dotenv/config";
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createDownload = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    return res.status(400).json({
      message: "Invalid user or video identifier.",
    });
  }

  try {
    const user = await users.findById(userId);
    const targetVideo = await video.findById(videoId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (!targetVideo) {
      return res.status(404).json({
        message: "Video not found.",
      });
    }

    // Check if video already exists in downloads
    const alreadyDownloaded = user.downloads?.some(
      (download) =>
        download.videoid &&
        download.videoid.toString() === videoId
    );

    if (alreadyDownloaded) {
      return res.status(200).json({
        success: true,
        alreadyDownloaded: true,
        message: "Video already downloaded. Check your Downloads section.",
        downloads: user.downloads,
      });
    }

    const today = new Date();
    const lastDate = user.lastDownloadDate
      ? new Date(user.lastDownloadDate)
      : null;

    const sameDay =
      lastDate &&
      lastDate.toDateString() === today.toDateString();

    const currentCount = sameDay
      ? user.downloadCountToday || 0
      : 0;

    // Free users can only download 1 video per day
    if (!user.isPremium && currentCount >= 1) {
      return res.status(403).json({
        message:
          "Free users can download only one video per day. Upgrade to Premium for unlimited downloads.",
      });
    }

    const updatedUser = await users
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            downloadCountToday: sameDay
              ? currentCount + 1
              : 1,
            lastDownloadDate: today,
          },
          $push: {
            downloads: {
              videoid: targetVideo._id,
              title: targetVideo.videotitle,
              url: targetVideo.filepath,
              downloadedAt: today,
            },
          },
        },
        { new: true }
      )
      .populate("downloads.videoid");

    return res.status(200).json({
      success: true,
      alreadyDownloaded: false,
      message: "Video downloaded successfully.",
      downloads: updatedUser.downloads,
    });
  } catch (error) {
    console.error("Download error:", error);

    return res.status(500).json({
      message:
        "Something went wrong while processing download.",
    });
  }
};

export const getDownloads = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user identifier." });
  }

  try {
    const user = await users.findById(id).populate("downloads.videoid");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ downloads: user.downloads, isPremium: user.isPremium, downloadCountToday: user.downloadCountToday, lastDownloadDate: user.lastDownloadDate });
  } catch (error) {
    console.error("Get downloads error:", error);
    return res.status(500).json({ message: "Unable to load downloads." });
  }
};

export const createOrder = async (req, res) => {
  const { amount = 10000, currency = "INR", receipt } = req.body;

  try {
    const order = await razorpayInstance.orders.create({
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    });
    return res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ message: "Unable to create payment order." });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
    return res.status(400).json({ message: "Missing payment verification details." });
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature." });
  }

  try {
    const updatedUser = await users.findByIdAndUpdate(
      userId,
      { $set: { isPremium: true } },
      { new: true }
    );

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ message: "Unable to verify payment." });
  }
};
