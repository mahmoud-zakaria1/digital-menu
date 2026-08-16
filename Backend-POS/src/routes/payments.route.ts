import { Router } from "express";
import { createPayment, paymobWebhook } from "../controllers/payments.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const paymentRouter = Router();

paymentRouter.post("/create", isVerifiedUser, createPayment);
paymentRouter.post("/webhook", paymobWebhook);

export default paymentRouter;