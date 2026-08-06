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
orderRouter.post("/", isVerifiedUser, createOrder);
orderRouter.patch("/:id/cancel", isVerifiedUser, cancelOrder);

// 2️⃣ Management & Cashier Routes
orderRouter.get("/", isVerifiedUser, isAdminOrCashier, getAllOrders);
orderRouter.get("/:id", isVerifiedUser, isAdminOrCashier, getOrderById);
orderRouter.patch("/:id/status", isVerifiedUser, isAdminOrCashier, updateOrder);

// 3️⃣ Admin Only Routes
orderRouter.delete("/:id", isVerifiedUser, isAdmin, deleteOrder);

export default orderRouter;
