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

tableRouter.post("/addTable", isVerifiedUser, isAdmin, addTable);
tableRouter.get("/", isVerifiedUser, isAdminOrCashier, getTables);
tableRouter.put("/updateTable/:id", isVerifiedUser, isAdminOrCashier, updateTable);
tableRouter.delete("/deleteTable/:id", isVerifiedUser, isAdmin, deleteTable);
tableRouter.put(
  "/cancelReservation/:id",
  isVerifiedUser,
  isAdminOrCashier,
  cancelReservation,
);

export default tableRouter;
