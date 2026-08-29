import { Router } from "express";
import {
  createPayment,
  paymobWebhook,
} from "../controllers/payments.controller.js";
import { isVerifiedUser } from "../middlewares/tokenVerfication.js";

const paymentRouter = Router();

// 1️⃣ Create payment intention session for authenticated users
/**
 * @openapi
 * /api/payments/create:
 *   post:
 *     summary: Create Paymob payment intention and internal payment record
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Valid Order ObjectId
 *                 example: 60d5ecb8b5c9c22b4c8e4111
 *     responses:
 *       201:
 *         description: Payment intention created successfully
 *       400:
 *         description: Cannot pay for cancelled/completed order or order already paid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to pay for this order
 *       404:
 *         description: Order not found
 *       502:
 *         description: Failed to communicate with Paymob API
 */
paymentRouter.post("/create", isVerifiedUser, createPayment);

// 2️⃣ Handle Paymob real-time webhook callbacks (HMAC verified inside controller)
/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Paymob real-time webhook callback listener
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: hmac
 *         required: true
 *         schema:
 *           type: string
 *         description: Paymob SHA-512 HMAC signature for request authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               obj:
 *                 type: object
 *                 description: Paymob transaction payload object
 *     responses:
 *       200:
 *         description: Webhook acknowledged successfully
 *       401:
 *         description: Invalid HMAC signature
 */
paymentRouter.post("/webhook", paymobWebhook);

export default paymentRouter;
