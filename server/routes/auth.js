import express from "express";
import {
  login,
  updateprofile,
  createDownload,
  getDownloads,
  createOrder,
  getEmailStatus,
  sendTestEmail,
  verifyPayment,
  sendOtp,
  verifyOtp
} from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/send-otp", sendOtp)
routes.post("/verify-otp", verifyOtp);
routes.post("/download/:videoId", createDownload);
routes.get("/downloads/:id", getDownloads);
routes.get("/payment/email-status", getEmailStatus);
routes.post("/payment/order", createOrder);
routes.post("/payment/test-email", sendTestEmail);
routes.post("/payment/verify", verifyPayment);
routes.patch("/update/:id", updateprofile);
export default routes;
