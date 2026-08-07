import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Category from "../models/category.schema.js";
import {
  createCategoryValidate,
  updateCategoryValidate,
} from "../validators/category.validator.js";
import { ICategoryFields } from "../types/category.types.js";
import { toObjectId } from "../utils/toObjectId.js";

type CreateCategoryInput = z.infer<typeof createCategoryValidate>;
type UpdateCategoryInput = z.infer<typeof updateCategoryValidate>;

// Helper to sanitize payload for category creation
const mapToCategoryDocument = (
  input: CreateCategoryInput,
): Pick<ICategoryFields, "name"> => ({
  name: input.name,
});

// 1️⃣ Create New Category
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = createCategoryValidate.parse(req.body);

    // Prevent duplicate category names
    const isCategoryPresent = await Category.findOne({
      name: validatedData.name,
    });
    if (isCategoryPresent) {
      const error: any = new Error("Category already exists");
      error.statusCode = 400;
      return next(error);
    }

    const categoryData = mapToCategoryDocument(validatedData);
    const newCategory = await Category.create(categoryData);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

// 2️⃣ Get All Categories (with optional active filter)
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isActiveOnly } = req.query;
    const filter = isActiveOnly === "true" ? { isActive: true } : {};

    const categories = await Category.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// 3️⃣ Update Existing Category
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categoryId = toObjectId(req.params.id);

    const validatedData: UpdateCategoryInput = updateCategoryValidate.parse(
      req.body,
    );

    // Build dynamic payload to update only provided fields
    const updatePayload: Partial<ICategoryFields> = {};
    if (validatedData.name !== undefined)
      updatePayload.name = validatedData.name;
    if (validatedData.isActive !== undefined)
      updatePayload.isActive = validatedData.isActive;

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updatePayload,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedCategory) {
      const error: any = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

// 4️⃣ Delete Category (Prevents deletion if assigned to existing meals)
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categoryId = toObjectId(req.params.id);

    const category = await Category.findById(categoryId);
    if (!category) {
      const error: any = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    // Check dependency in Meal model before deleting
    const Meal = mongoose.model("Meal");
    const mealsUsingCategory = await Meal.countDocuments({
      category: categoryId,
    });

    if (mealsUsingCategory > 0) {
      const error: any = new Error(
        `Cannot delete category. ${mealsUsingCategory} meal(s) are still using it. Reassign or delete those meals first.`,
      );
      error.statusCode = 400;
      return next(error);
    }

    await Category.findByIdAndDelete(categoryId);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
