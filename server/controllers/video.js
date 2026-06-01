import crypto from "crypto";
import mongoose from "mongoose";
import { pipeline, Readable } from "stream";
import video from "../Modals/video.js";
import users from "../Modals/Auth.js";
import watchSession from "../Modals/watchSession.js";
import { hydrateUserPlan, getPlan, getVideoUploadQuota } from "../utils/plans.js";

export const uploadvideo = async (req, res) => {
  try {
    const uploaderId = req.body.uploader;

    if (!uploaderId || !mongoose.Types.ObjectId.isValid(uploaderId)) {
      return res.status(400).json({ message: "Invalid uploader ID." });
    }

    const uploaderUser = await users.findById(uploaderId);
    if (!uploaderUser) {
      return res.status(404).json({ message: "Uploader account not found." });
    }

    await hydrateUserPlan(uploaderUser);

    const uploadQuota = getVideoUploadQuota(uploaderUser.planCode);
    const existingUploads = await video.countDocuments({ uploader: uploaderId });

    if (existingUploads >= uploadQuota) {
      const quotaLabel = uploadQuota === Number.POSITIVE_INFINITY ? "unlimited" : uploadQuota;
      return res.status(403).json({
        message: `The ${uploaderUser.planName || uploaderUser.planCode} plan allows ${quotaLabel} uploads. Upgrade to upload more videos.`,
      });
    }

    const file = new video({
      videotitle: req.body.videotitle,
      filename: req.body.filename,
      filepath: req.body.filepath,
      filetype: req.body.filetype,
      filesize: req.body.filesize,
      videochanel: req.body.videochanel,
      uploader: uploaderId,
    });
    await file.save();
    return res.status(201).json({ message: "file uploaded successfully", url: req.body.filepath });
  } catch (error) {
    console.error("uploadvideo error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createWatchSession = async (req, res) => {
  const { userId, videoId } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID." });
  }

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await hydrateUserPlan(user);

    const targetVideo = await video.findById(videoId);
    if (!targetVideo) {
      return res.status(404).json({ message: "Video not found." });
    }

    const plan = getPlan(user.planCode);
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const session = await watchSession.create({
      userId: user._id,
      videoId: targetVideo._id,
      token,
      maxWatchSeconds: plan.watchLimitSeconds,
      expiresAt,
      status: "active",
    });

    return res.status(200).json({
      token: session.token,
      maxWatchSeconds: session.maxWatchSeconds,
      expiresAt: session.expiresAt,
      planCode: plan.code,
    });
  } catch (error) {
    console.error("createWatchSession error:", error);
    return res.status(500).json({ message: "Unable to create watch session." });
  }
};

export const streamVideo = async (req, res) => {
  const { videoId } = req.params;
  const token = String(req.query.token || "");
  const download = String(req.query.download || "0") === "1";

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video identifier." });
  }

  if (!token) {
    return res.status(401).json({ message: "A valid watch session token is required." });
  }

  try {
    const session = await watchSession.findOne({ token, videoId }).populate("userId");
    if (!session) {
      return res.status(401).json({ message: "Watch session not found or invalid." });
    }

    if (session.status !== "active") {
      return res.status(403).json({ message: "Watch session is no longer active." });
    }

    if (session.expiresAt < new Date()) {
      session.status = "expired";
      await session.save();
      return res.status(401).json({ message: "Watch session has expired." });
    }

    const user = session.userId;
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await hydrateUserPlan(user);

    const targetVideo = await video.findById(videoId);
    if (!targetVideo || !targetVideo.filepath) {
      return res.status(404).json({ message: "Video not found." });
    }

    const upstreamHeaders = {};
    if (req.headers.range) {
      upstreamHeaders.Range = req.headers.range;
    }

    const upstreamResponse = await fetch(targetVideo.filepath, {
      method: "GET",
      headers: upstreamHeaders,
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text().catch(() => "");
      return res.status(502).json({
        message: "Unable to proxy video stream.",
        upstreamStatus: upstreamResponse.status,
        upstreamError: errorText,
      });
    }

    upstreamResponse.headers.forEach((value, key) => {
      const normalizedKey = key.toLowerCase();
      if (["transfer-encoding", "connection"].includes(normalizedKey)) {
        return;
      }
      res.setHeader(key, value);
    });

    res.setHeader("x-user-plan", user.planCode);
    res.setHeader(
      "x-user-watch-limit-seconds",
      session.maxWatchSeconds === null || session.maxWatchSeconds === undefined
        ? "unlimited"
        : String(session.maxWatchSeconds)
    );

    if (download) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${targetVideo.videotitle.replace(/[^a-zA-Z0-9\.\-_]/g, "_")}.mp4"`
      );
    }

    res.status(upstreamResponse.status);

    const upstreamBody = upstreamResponse.body;
    if (!upstreamBody) {
      return res.status(500).json({ message: "Video stream is unavailable." });
    }

    const nodeReadable = Readable.fromWeb(upstreamBody);
    pipeline(nodeReadable, res, (streamError) => {
      if (streamError) {
        console.error("Video proxy pipeline error:", streamError);
      }
    });
  } catch (error) {
    console.error("streamVideo error:", error);
    return res.status(500).json({ message: "Unable to stream video." });
  }
};

export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
