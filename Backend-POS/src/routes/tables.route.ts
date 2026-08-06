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
tableRouter.get("/", isVerifiedUser, isAdminOrCashier, getTables);
tableRouter.put("/:id", isVerifiedUser, isAdminOrCashier, updateTable);
tableRouter.patch(
  "/:id/cancel",
  isVerifiedUser,
  isAdminOrCashier,
  cancelReservation,
);

// 2️⃣ Admin Only Routes
tableRouter.post("/", isVerifiedUser, isAdmin, addTable);
tableRouter.delete("/:id", isVerifiedUser, isAdmin, deleteTable);

export default tableRouter;
