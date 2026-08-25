import { Router } from "express";
import {
  createPayment,
  paymobWebhook,
} from "../controllers/payments.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const paymentRouter = Router();

// 1️⃣ Create payment intention session for authenticated users
paymentRouter.post("/create", isVerifiedUser, createPayment);

// 2️⃣ Handle Paymob real-time webhook callbacks (HMAC verified inside controller)
paymentRouter.post("/webhook", paymobWebhook);

export default paymentRouter;
