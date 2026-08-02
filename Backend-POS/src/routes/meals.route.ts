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

mealRouter.post("/createMeal", isVerifiedUser, isAdmin, createMeal);
mealRouter.get("/", getAllMeals);
mealRouter.get("/:id", getMealById);
mealRouter.put("/updateMeal/:id", isVerifiedUser, isAdmin, updateMeal);
mealRouter.delete("/deleteMeal/:id", isVerifiedUser, isAdmin, deleteMeal);

export default mealRouter;
