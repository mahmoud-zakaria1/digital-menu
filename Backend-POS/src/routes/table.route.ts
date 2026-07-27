import { Router } from "express";
import { addTable, getTables, updateTable, deleteTable, cancelReservation } from "../controllers/tables.controller.js";
import { isVerifiedUser, isAdmin, isAdminOrCashier } from "../middlewares/tokenVerfication.js";

const router = Router();

router.post("/createTable", isVerifiedUser, isAdmin, addTable);
router.get("/", isVerifiedUser, isAdminOrCashier, getTables);
router.put("/updateTable/:id", isVerifiedUser, isAdminOrCashier, updateTable);
router.delete("/deleteTable/:id", isVerifiedUser, isAdmin, deleteTable);
router.put("/cancelReservation/:id", isVerifiedUser, isAdminOrCashier, cancelReservation);

export default router;