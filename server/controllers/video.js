import video from "../Modals/video.js";
import { put } from "@vercel/blob";

export const uploadvideo = async (req, res) => {
  try {

    const file = new video({
      videotitle: req.body.videotitle,
      filename: req.body.filename,
      filepath: req.body.filepath,
      filetype: req.body.filetype,
      filesize: req.body.filesize,
      videochanel: req.body.videochanel,
      uploader: req.body.uploader,
    });
    await file.save();
    return res.status(201).json({ message: "file uploaded successfully", url: req.body.filepath });
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
