import { Router } from "express";
import { createMeal, getAllMeals, getMealById, updateMeal, deleteMeal } from '../controllers/meals.controller.js';
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";

const router = Router();

router.post("/createMeal", isVerifiedUser, isAdmin, createMeal);
router.get("/", getAllMeals);
router.get("/:id", getMealById);
router.put("/updateMeal/:id", isVerifiedUser, isAdmin, updateMeal);
router.delete("/deleteMeal/:id", isVerifiedUser, isAdmin, deleteMeal);

export default router;