import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";
import { isVerifiedUser, isAdmin } from "../middlewares/tokenVerfication.js";
import Category from "../models/category.schema.js";

const categoryRouter = Router();

categoryRouter.get("/", getAllCategories);

categoryRouter.post("/createCategory", isVerifiedUser, isAdmin, createCategory);
categoryRouter.put("/updateCategory", isVerifiedUser, isAdmin, updateCategory);
categoryRouter.delete(
  "/deleteCategory",
  isVerifiedUser,
  isAdmin,
  deleteCategory,
);

export default categoryRouter;
