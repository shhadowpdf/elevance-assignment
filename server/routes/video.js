import express from "express";
import { createWatchSession, getallvideo, uploadvideo, streamVideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.post("/watch-session", createWatchSession);
routes.get("/getall", getallvideo);
routes.get("/stream/:videoId", streamVideo);
export default routes;
