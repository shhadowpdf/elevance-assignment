import express from "express";
import {
  login,
  updateprofile,
  createDownload,
  getDownloads,
  createOrder,
  verifyPayment,
} from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/download/:videoId", createDownload);
routes.get("/downloads/:id", getDownloads);
routes.post("/payment/order", createOrder);
routes.post("/payment/verify", verifyPayment);
routes.patch("/update/:id", updateprofile);
export default routes;
