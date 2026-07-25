import { Router } from "express";
import { createMeal, getAllMeals, getMealById, updateMeal, deleteMeal } from '../controllers/meals.controller.js';
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";
import route from "./users.route.js";

const router = Router();

router.get("/", getAllMeals);
router.get("/:id", getMealById);

router.post("/createMeal", isVerifiedUser, isAdmin, createMeal);
router.put("/updateMeal", isVerifiedUser, isAdmin, updateMeal);
route.delete("/deleteMeal", isVerifiedUser, isAdmin, deleteMeal);

export default Router;