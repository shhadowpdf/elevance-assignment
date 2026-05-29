import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import path from "path";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log('Loaded env from:', path.resolve(__dirname, '.env'));
console.log('BLOB_READ_WRITE_TOKEN present:', Boolean(process.env.BLOB_READ_WRITE_TOKEN));
const app = express();
app.use(
  cors({
    origin: process.env.PUBLIC_URL,
  })
);
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Connected" });
});
// app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });
