import { Router } from "express";
import { createOrder, getAllOrders, getOrderById, updateOrder, cancelOrder, deleteOrder } from "../controllers/orders.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";

const router = Router();


router.post("/createOrder", isVerifiedUser, createOrder);
router.put("/cancelOrder/:id", isVerifiedUser, cancelOrder);

router.get("/allOrders", isVerifiedUser, isAdmin, getAllOrders);
router.get("/:id", isVerifiedUser, isAdmin, getOrderById);
router.put("/updateOrder/:id", isVerifiedUser, isAdmin, updateOrder);
router.delete("/deleteOrder/:id", isVerifiedUser, isAdmin, deleteOrder);

export default router;