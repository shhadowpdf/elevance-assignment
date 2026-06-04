import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import purchase from "../Modals/purchase.js";
import {
  applyPlanToUser,
  getPlan,
  getUpgradeChargePaise,
  hydrateUserPlan,
  isPaidPlanCode,
  serializeUser,
} from "../utils/plans.js";
import {
  getEmailConfigStatus,
  sendPlanUpgradeInvoiceEmail,
  sendTestPlanInvoiceEmail,
  verifyEmailTransport,
} from "../utils/mailer.js";
import "dotenv/config";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const buildInvoiceNumber = (purchaseDoc) => {
  const date = new Date();
  const dateCode = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  return `YT-${dateCode}-${String(purchaseDoc._id).slice(-6).toUpperCase()}`;
};

export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({
        email,
        name,
        image,
        ...serializeUser({
          email,
          name,
          image,
          planCode: "free",
          joinedon: new Date(),
        }),
      });
      return res.status(201).json({ result: serializeUser(newUser) });
    } else {
      await hydrateUserPlan(existingUser);
      return res.status(200).json({ result: serializeUser(existingUser) });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, mobile } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updateFields = {
      channelname,
      description,
    };

    if (typeof mobile === "string") {
      updateFields.mobile = mobile;
    }

    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: updateFields,
      },
      { new: true }
    );
    if (!updatedata) {
      return res.status(404).json({ message: "User unavailable..." });
    }

    await hydrateUserPlan(updatedata);
    return res.status(201).json(serializeUser(updatedata));
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

    await hydrateUserPlan(user);

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
    if (!isPaidPlanCode(user.planCode) && currentCount >= 1) {
      return res.status(403).json({
        message:
          "Free users can download only one video per day. Upgrade your plan for unlimited downloads.",
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

    await hydrateUserPlan(user);

    return res.status(200).json({
      downloads: user.downloads,
      isPremium: isPaidPlanCode(user.planCode),
      planCode: user.planCode,
      planName: user.planName,
      watchLimitMinutes: user.watchLimitMinutes,
      planPricePaise: user.planPricePaise,
      planActivatedAt: user.planActivatedAt,
      downloadCountToday: user.downloadCountToday,
      lastDownloadDate: user.lastDownloadDate,
    });
  } catch (error) {
    console.error("Get downloads error:", error);
    return res.status(500).json({ message: "Unable to load downloads." });
  }
};

export const createOrder = async (req, res) => {
  const { userId, targetPlanCode } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user identifier." });
  }

  try {
    const user = await users.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await hydrateUserPlan(user);

    const currentPlan = getPlan(user.planCode);
    const targetPlan = getPlan(targetPlanCode);
    const chargedAmountPaise = getUpgradeChargePaise(
      currentPlan.code,
      targetPlan.code
    );

    if (!targetPlanCode || targetPlan.code !== targetPlanCode) {
      return res.status(400).json({ message: "Invalid target plan." });
    }

    if (chargedAmountPaise === null) {
      return res.status(400).json({
        message: "You can only upgrade to a higher plan.",
      });
    }

    const receipt = `plan_${targetPlan.code}_${Date.now()}`;
    const order = await razorpayInstance.orders.create({
      amount: chargedAmountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
    });

    await purchase.create({
      userId: user._id,
      previousPlanCode: currentPlan.code,
      targetPlanCode: targetPlan.code,
      listPricePaise: targetPlan.pricePaise,
      chargedAmountPaise,
      currency: order.currency,
      receipt,
      razorpayOrderId: order.id,
      status: "pending",
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
    const existingPurchase = await purchase.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!existingPurchase) {
      return res.status(404).json({ message: "Purchase record not found." });
    }

    if (existingPurchase.status === "paid") {
      const paidUser = await users.findById(existingPurchase.userId);
      if (!paidUser) {
        return res.status(404).json({ message: "User not found." });
      }

      await hydrateUserPlan(paidUser);

      return res.status(200).json({
        success: true,
        user: serializeUser(paidUser),
        invoiceNumber: existingPurchase.invoiceNumber,
        emailSent: existingPurchase.emailSent,
        emailError: existingPurchase.emailError,
      });
    }

    if (String(existingPurchase.userId) !== userId) {
      return res.status(400).json({ message: "Payment user mismatch." });
    }

    const user = await users.findById(existingPurchase.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await hydrateUserPlan(user);

    const previousPlan = getPlan(user.planCode);
    const targetPlan = getPlan(existingPurchase.targetPlanCode);

    if (targetPlan.rank <= previousPlan.rank) {
      existingPurchase.status = "failed";
      existingPurchase.emailError =
        "Target plan is no longer higher than the user's current plan.";
      await existingPurchase.save();
      return res.status(409).json({
        message: "This upgrade is no longer valid for the current account plan.",
      });
    }

    applyPlanToUser(user, targetPlan.code, new Date());
    await user.save();

    existingPurchase.razorpayPaymentId = razorpay_payment_id;
    existingPurchase.invoiceNumber =
      existingPurchase.invoiceNumber || buildInvoiceNumber(existingPurchase);
    existingPurchase.status = "paid";

    const emailResult = await sendPlanUpgradeInvoiceEmail({
      user,
      previousPlan,
      targetPlan,
      purchase: existingPurchase,
    });

    existingPurchase.emailSent = emailResult.sent;
    existingPurchase.emailError = emailResult.error;
    await existingPurchase.save();

    if (emailResult.sent) {
      console.log("Invoice email sent:", {
        to: user.email,
        invoiceNumber: existingPurchase.invoiceNumber,
        orderId: existingPurchase.razorpayOrderId,
      });
    } else {
      console.error("Invoice email failed:", {
        to: user.email,
        invoiceNumber: existingPurchase.invoiceNumber,
        orderId: existingPurchase.razorpayOrderId,
        error: emailResult.error,
        emailConfig: getEmailConfigStatus(),
      });
    }

    return res.status(200).json({
      success: true,
      user: serializeUser(user),
      invoiceNumber: existingPurchase.invoiceNumber,
      emailSent: existingPurchase.emailSent,
      emailError: existingPurchase.emailError,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ message: "Unable to verify payment." });
  }
};

export const getEmailStatus = async (req, res) => {
  const transportStatus = await verifyEmailTransport();

  return res.status(transportStatus.ok ? 200 : 500).json({
    success: transportStatus.ok,
    config: transportStatus.config,
    error: transportStatus.error,
  });
};

export const sendTestEmail = async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const result = await sendTestPlanInvoiceEmail({ email, name });

  return res.status(result.sent ? 200 : 500).json({
    success: result.sent,
    message: result.sent
      ? "Test invoice email sent successfully."
      : "Unable to send test invoice email.",
    config: result.config,
    error: result.error,
    messageId: result.messageId,
  });
};
