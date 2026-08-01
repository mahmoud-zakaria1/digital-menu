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

const router = Router();

router.post("/createOrder", isVerifiedUser, createOrder);
router.put("/cancelOrder/:id", isVerifiedUser, cancelOrder);

router.get("/allOrders", isVerifiedUser, isAdminOrCashier, getAllOrders);
router.get("/:id", isVerifiedUser, isAdminOrCashier, getOrderById);
router.put("/updateOrder/:id", isVerifiedUser, isAdminOrCashier, updateOrder);

router.delete("/deleteOrder/:id", isVerifiedUser, isAdmin, deleteOrder);

export default router;
