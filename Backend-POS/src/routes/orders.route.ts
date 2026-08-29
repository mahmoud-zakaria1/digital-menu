import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  deleteOrder,
} from "../controllers/orders.controller.js";
import {
  isVerifiedUser,
  isAdmin,
  isAdminOrCashier,
} from "../middlewares/tokenVerfication.js";

const orderRouter = Router();

// 1️⃣ Customer Routes
/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [meals, phone]
 *             properties:
 *               meals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [meal, quantity]
 *                   properties:
 *                     meal:
 *                       type: string
 *                       description: Meal ObjectId
 *                       example: 60d5ecb8b5c9c22b4c8e4111
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               phone:
 *                 type: string
 *                 example: "+201000000000"
 *               address:
 *                 type: string
 *                 example: "123 Main St, Alexandria"
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or invalid meal IDs
 *       401:
 *         description: Not authenticated
 */
orderRouter.post("/", isVerifiedUser, createOrder);

/**
 * @openapi
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Cancel an order (Owner or Admin only, pending orders only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order is no longer pending or already paid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to cancel this order
 *       404:
 *         description: Order not found
 */
orderRouter.patch("/:id/cancel", isVerifiedUser, cancelOrder);

// 2️⃣ Management & Cashier Routes
/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Get all orders with user and meal details (Admin or Cashier)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all orders retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins or Cashiers only
 */
orderRouter.get("/", isVerifiedUser, isAdminOrCashier, getAllOrders);

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     summary: Get a single order by ID (Admin or Cashier)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins or Cashiers only
 *       404:
 *         description: Order not found
 */
orderRouter.get("/:id", isVerifiedUser, isAdminOrCashier, getOrderById);

/**
 * @openapi
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin or Cashier - Enforces state machine logic)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, preparing, completed, cancelled]
 *                 example: preparing
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins or Cashiers only
 *       404:
 *         description: Order not found
 */
orderRouter.patch("/:id/status", isVerifiedUser, isAdminOrCashier, updateOrder);

// 3️⃣ Admin Only Routes
/**
 * @openapi
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order by ID (Admin only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 *       404:
 *         description: Order not found
 */
orderRouter.delete("/:id", isVerifiedUser, isAdmin, deleteOrder);

export default orderRouter;
