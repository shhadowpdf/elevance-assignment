"use strict";
import multer from "multer";
const storage = multer.memoryStorage();
const filefilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage, fileFilter: filefilter });
export default upload;
