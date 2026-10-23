import crypto from "crypto";
import mongoose from "mongoose";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";
import { app } from "../app.js";
import config from "../config/config.js";
import Order from "../models/order.schema.js";
import Payment from "../models/payment.schema.js";
import User from "../models/user.schema.js";

// Paymob's own order id for the seeded payment attempt. The webhook finds
// the payment by THIS value (it is covered by the HMAC), so every test
// builds its payload around it.
const PAYMOB_ORDER_ID = "777";

// 1️⃣ Build a transaction payload shaped exactly like Paymob's callback.
// Only the fields verifyPaymobHmac reads are filled in - the rest of
// Paymob's payload is irrelevant to the signature.
const buildPayload = (options: { amountCents: number; success: boolean }) => ({
  obj: {
    amount_cents: options.amountCents,
    created_at: "2026-01-01T00:00:00",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: 111,
    integration_id: 1,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: Number(PAYMOB_ORDER_ID) },
    owner: 1,
    pending: false,
    source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
    success: options.success,
  },
});

type WebhookPayload = ReturnType<typeof buildPayload>;

// 2️⃣ Sign the payload the same way Paymob does: concatenate the fields in
// the exact sequence from its spec, then HMAC-SHA512 with the shared secret.
// This list is deliberately a copy of the one in verifyPaymobHmac - if the
// controller's order ever drifts from Paymob's spec, these tests fail
// instead of letting a forged or broken callback through unnoticed.
const sign = (payload: WebhookPayload): string => {
  const o = payload.obj;
  const concatenated = [
    o.amount_cents,
    o.created_at,
    o.currency,
    o.error_occured,
    o.has_parent_transaction,
    o.id,
    o.integration_id,
    o.is_3d_secure,
    o.is_auth,
    o.is_capture,
    o.is_refunded,
    o.is_standalone_payment,
    o.is_voided,
    o.order.id,
    o.owner,
    o.pending,
    o.source_data.pan,
    o.source_data.sub_type,
    o.source_data.type,
    o.success,
  ].join("");

  return crypto
    .createHmac("sha512", config.paymobHmacSecret)
    .update(concatenated)
    .digest("hex");
};

// 3️⃣ Seed one online order + its pending payment attempt directly through
// the models. The webhook never needs a logged-in user (Paymob's servers
// call it), so there is no cookie/login dance here.
const seedOnlineOrder = async (status: "pending" | "cancelled" = "pending") => {
  const user = await User.create({
    name: "Webhook Tester",
    email: "webhook@test.com",
    phone: "+201234567899",
    password: "password123",
  });

  // The meal id doesn't need to exist: nothing in the webhook flow reads
  // the meal, and populate() just resolves it to null.
  const order = await Order.create({
    user: user._id,
    meals: [{ meal: new mongoose.Types.ObjectId(), quantity: 1 }],
    totalPrice: 100,
    phone: "+201234567899",
    paymentMethod: "online",
    status,
  });

  await Payment.create({
    order: order._id,
    amount: 100,
    paymobOrderId: PAYMOB_ORDER_ID,
    status: "pending",
  });

  return order;
};

// 4️⃣ Send a callback exactly how Paymob does: JSON body + the signature
// in the ?hmac= query param.
const sendWebhook = (payload: WebhookPayload, hmac: string) =>
  request(app).post(`/api/payments/webhook?hmac=${hmac}`).send(payload);

describe("Paymob Webhook Integration Tests", () => {
  // 5️⃣ A forged callback must be rejected before it touches anything
  it("should reject a callback with an invalid HMAC signature", async () => {
    const order = await seedOnlineOrder();
    const payload = buildPayload({ amountCents: 10000, success: true });

    const res = await sendWebhook(payload, "not-a-real-signature");

    expect(res.status).toBe(401);

    // The important part: the order is untouched, not just "an error was returned"
    const unchanged = await Order.findById(order._id);
    expect(unchanged?.paymentStatus).toBe("pending");
    expect(unchanged?.status).toBe("pending");
  });

  // 6️⃣ The happy path: a signed success callback pays the order and sends
  // it straight to the kitchen
  it("should mark the order paid and move it to preparing on a valid callback", async () => {
    const order = await seedOnlineOrder();
    const payload = buildPayload({ amountCents: 10000, success: true });

    const res = await sendWebhook(payload, sign(payload));

    expect(res.status).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated?.paymentStatus).toBe("paid");
    expect(updated?.status).toBe("preparing");

    const payment = await Payment.findOne({ order: order._id });
    expect(payment?.status).toBe("paid");
  });

  // 7️⃣ Paymob retries callbacks, so the same signed payload can arrive
  // twice. The second one must be acknowledged (so Paymob stops retrying)
  // but must NOT re-apply anything.
  it("should be idempotent: a replayed callback changes nothing", async () => {
    const order = await seedOnlineOrder();
    const payload = buildPayload({ amountCents: 10000, success: true });
    const hmac = sign(payload);

    await sendWebhook(payload, hmac);

    // Simulate the kitchen finishing the order between the two callbacks.
    // If the replay re-applied "pending -> preparing" it would drag the
    // order backwards, and this assertion would catch it.
    await Order.findByIdAndUpdate(order._id, { status: "completed" });

    const replay = await sendWebhook(payload, hmac);

    expect(replay.status).toBe(200);
    expect((await Order.findById(order._id))?.status).toBe("completed");
  });

  // 8️⃣ A validly SIGNED payload for the wrong amount is still refused:
  // the signature proves Paymob sent it, not that it matches our order
  it("should reject an amount mismatch even when the signature is valid", async () => {
    const order = await seedOnlineOrder();
    // Order total is 100 EGP = 10000 piastres; this callback claims 1 EGP
    const payload = buildPayload({ amountCents: 100, success: true });

    const res = await sendWebhook(payload, sign(payload));

    expect(res.status).toBe(400);
    expect((await Order.findById(order._id))?.paymentStatus).toBe("pending");
  });

  // 9️⃣ Paid for an order that was cancelled in the meantime: the money is
  // recorded (so it can be refunded manually) but the kitchen must never
  // cook it, so it has to stay cancelled
  it("should keep a cancelled order cancelled when the payment arrives late", async () => {
    const order = await seedOnlineOrder("cancelled");
    const payload = buildPayload({ amountCents: 10000, success: true });

    const res = await sendWebhook(payload, sign(payload));

    expect(res.status).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated?.paymentStatus).toBe("paid");
    expect(updated?.status).toBe("cancelled");
  });

  // 🔟 A failed attempt is recorded, but the order must not enter the
  // kitchen pipeline - the customer can retry from the tracking page
  it("should record a failed payment without sending the order to the kitchen", async () => {
    const order = await seedOnlineOrder();
    const payload = buildPayload({ amountCents: 10000, success: false });

    const res = await sendWebhook(payload, sign(payload));

    expect(res.status).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated?.paymentStatus).toBe("failed");
    expect(updated?.status).toBe("pending");
  });
});
