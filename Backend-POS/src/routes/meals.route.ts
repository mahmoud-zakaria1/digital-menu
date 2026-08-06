import { Router } from "express";
import {
  createMeal,
  getAllMeals,
  getMealById,
  updateMeal,
  deleteMeal,
} from "../controllers/meals.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";

const mealRouter = Router();

// 1️⃣ Public Routes
mealRouter.get("/", getAllMeals);
mealRouter.get("/:id", getMealById);

// 2️⃣ Admin Only Routes
mealRouter.post("/", isVerifiedUser, isAdmin, createMeal);
mealRouter.put("/:id", isVerifiedUser, isAdmin, updateMeal);
mealRouter.delete("/:id", isVerifiedUser, isAdmin, deleteMeal);

export default mealRouter;
