import video from "../Modals/video.js";
import { put } from "@vercel/blob";

export const uploadvideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a video file." });
  }

  try {
    const safeFileName = `${Date.now()}-${req.file.originalname}`
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_.]/g, "");

    const uploadResult = await put(safeFileName, req.file.buffer, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: req.file.mimetype,
      access: "public",
    });

    const file = new video({
      videotitle: req.body.videotitle,
      filename: req.file.originalname,
      filepath: uploadResult.url,
      filetype: req.file.mimetype,
      filesize: req.file.size,
      videochanel: req.body.videochanel,
      uploader: req.body.uploader,
    });
    await file.save();
    return res.status(201).json({ message: "file uploaded successfully", url: uploadResult.url });
  } catch (error) {
    console.error("uploadvideo error:", error);
    return res.status(500).json({ message: "Something went wrong" });
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
