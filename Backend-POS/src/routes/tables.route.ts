import { Router } from "express";
import {
  addTable,
  getTables,
  updateTable,
  deleteTable,
  cancelReservation,
} from "../controllers/tables.controller.js";
import {
  isVerifiedUser,
  isAdmin,
  isAdminOrCashier,
} from "../middlewares/tokenVerfication.js";

const tableRouter = Router();

// 1️⃣ Management & Cashier Routes
/**
 * @openapi
 * /api/tables:
 *   get:
 *     summary: Get all tables with current order summary (Admin or Cashier)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of tables retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins or Cashiers only
 */
tableRouter.get("/", isVerifiedUser, isAdminOrCashier, getTables);

/**
 * @openapi
 * /api/tables/{id}:
 *   put:
 *     summary: Update table status, current order, or reservation time (Admin or Cashier)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Available, Occupied, Reserved]
 *                 example: Reserved
 *               orderId:
 *                 type: string
 *                 description: Order ObjectId to link to the table
 *                 example: 60d5ecb8b5c9c22b4c8e4111
 *               reservedAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-08-29T15:00:00.000Z
 *     responses:
 *       200:
 *         description: Table updated successfully
 *       400:
 *         description: Validation error or referenced order does not exist
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins or Cashiers only
 *       404:
 *         description: Table not found
 */
tableRouter.put("/:id", isVerifiedUser, isAdminOrCashier, updateTable);

/**
 * @openapi
 * /api/tables/{id}/cancel:
 *   patch:
 *     summary: Cancel a table reservation and set status to Available (Admin or Cashier)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 *       400:
 *         description: Table is not currently in Reserved status
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins or Cashiers only
 *       404:
 *         description: Table not found
 */
tableRouter.patch(
  "/:id/cancel",
  isVerifiedUser,
  isAdminOrCashier,
  cancelReservation,
);

// 2️⃣ Admin Only Routes
/**
 * @openapi
 * /api/tables:
 *   post:
 *     summary: Add a new dining table (Admin only)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tableNo]
 *             properties:
 *               tableNo:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Table added successfully
 *       400:
 *         description: Table number already exists or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 */
tableRouter.post("/", isVerifiedUser, isAdmin, addTable);

/**
 * @openapi
 * /api/tables/{id}:
 *   delete:
 *     summary: Delete a dining table (Admin only)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *       400:
 *         description: Cannot delete table with an active order linked
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied - Admins only
 *       404:
 *         description: Table not found
 */
tableRouter.delete("/:id", isVerifiedUser, isAdmin, deleteTable);

export default tableRouter;
