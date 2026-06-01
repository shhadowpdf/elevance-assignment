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
import { getEmailConfigStatus } from "./utils/mailer.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
console.log('Loaded env from:', path.resolve(__dirname, '.env'));
console.log('BLOB_READ_WRITE_TOKEN present:', Boolean(process.env.BLOB_READ_WRITE_TOKEN));
console.log("SMTP config status:", getEmailConfigStatus());
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
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
const PORT = process.env.PORT || 5000;
import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.PUBLIC_URL || "*",
  },
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("new-peer", socket.id);
  });

  socket.on("offer", ({ to, sdp }) => {
    if (!to) return;
    io.to(to).emit("offer", { from: socket.id, sdp });
  });

  socket.on("answer", ({ to, sdp }) => {
    if (!to) return;
    io.to(to).emit("answer", { from: socket.id, sdp });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    if (!to) return;
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("peer-left", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
    socket.rooms.forEach((room) => {
      if (room === socket.id) return;
      socket.to(room).emit("peer-left", socket.id);
    });
  });
});

server.listen(PORT, () => {
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
