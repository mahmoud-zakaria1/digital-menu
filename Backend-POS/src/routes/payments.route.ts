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
 *     summary: Start an online payment attempt for one of your own online orders - creates a Paymob intention and returns the hosted checkout URL
 *     description: Each call is a fresh attempt, so a failed or abandoned payment can be retried. The customer is redirected back to /orders/{id}/track afterwards; that redirect is never trusted - only the signed webhook marks an order paid.
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
 *         description: Payment attempt created - data.checkoutUrl is where to send the customer
 *       400:
 *         description: Order isn't an online order, is cancelled/completed, or is already paid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to pay for this order
 *       404:
 *         description: Order not found
 *       502:
 *         description: Failed to communicate with Paymob API
 *       503:
 *         description: Online payment isn't configured (missing PAYMOB_PUBLIC_KEY)
 */
paymentRouter.post("/create", isVerifiedUser, createPayment);

// 2️⃣ Handle Paymob real-time webhook callbacks (HMAC verified inside controller)
/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Paymob real-time webhook callback listener
 *     description: Verifies the HMAC, locates the payment by Paymob's signed order id (never by merchant_order_id), checks the signed amount against what was recorded, then applies the result idempotently.
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
 *         description: Webhook acknowledged (including already-processed and unknown-payment callbacks)
 *       400:
 *         description: Malformed payload, or the signed amount/currency doesn't match the payment
 *       401:
 *         description: Invalid HMAC signature
 */
paymentRouter.post("/webhook", paymobWebhook);

export default paymentRouter;
