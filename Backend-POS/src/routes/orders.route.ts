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

orderRouter.post("/createOrder", isVerifiedUser, createOrder);
orderRouter.put("/cancelOrder/:id", isVerifiedUser, cancelOrder);

orderRouter.get("/allOrders", isVerifiedUser, isAdminOrCashier, getAllOrders);
orderRouter.get("/:id", isVerifiedUser, isAdminOrCashier, getOrderById);
orderRouter.put("/updateOrder/:id", isVerifiedUser, isAdminOrCashier, updateOrder);

orderRouter.delete("/deleteOrder/:id", isVerifiedUser, isAdmin, deleteOrder);

export default orderRouter;
