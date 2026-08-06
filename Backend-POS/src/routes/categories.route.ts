import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";

const categoryRouter = Router();

// 1️⃣ Public Routes
categoryRouter.get("/", getAllCategories);

// 2️⃣ Admin Only Routes
categoryRouter.post("/", isVerifiedUser, isAdmin, createCategory);
categoryRouter.put("/:id", isVerifiedUser, isAdmin, updateCategory);
categoryRouter.delete("/:id", isVerifiedUser, isAdmin, deleteCategory);

export default categoryRouter;
