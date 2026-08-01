import { Request, Response, NextFunction } from "express";
import mongoose, { NestedPaths } from "mongoose";
import { z } from "zod";
import Category from "../models/category.schema.js";
import {
  createCategoryValidate,
  updateCategoryValidate,
} from "../validators/category.validator.js";
import { ICategoryFields } from "../types/category.types.js";

type CreateCategoryInput = z.infer<typeof createCategoryValidate>;
type UpdateCategoryInput = z.infer<typeof updateCategoryValidate>;

const mapToCategoryDocument = (
  input: CreateCategoryInput,
): Pick<ICategoryFields, "name"> => ({
  name: input.name,
});

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = createCategoryValidate.parse(req.body);

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

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { isActiveOnly } = req.query;
    const filter = isActiveOnly === "true" ? { isActive: true } : {};

    const categories = Category.find(filter).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error("Invalid category id");
      error.statusCode = 400;
      return next(error);
    }

    const validatedData: UpdateCategoryInput = updateCategoryValidate.parse(
      req.body,
    );

    const updatePayload: Partial<ICategoryFields> = {};
    if (validatedData.name !== undefined)
      updatePayload.name = validatedData.name;
    if (validatedData.isActive !== undefined)
      updatePayload.isActive = validatedData.isActive;

    const updateCategory = await Category.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updateCategory) {
      const error: any = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updateCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error("Invalid category id");
      error.statusCode = 400;
      return next(error);
    }

    const category = await Category.findById(id);

    if (!category) {
      const error: any = new Error("Category not found");
      error.statusCode = 404;
      return next(error);
    }

    const Meal = mongoose.model("Meal");
    const mealsUsingCategory = await Meal.countDocuments({ category: id });

    if (mealsUsingCategory > 0) {
      const error: any = new Error(
        `Cannot delete category. ${mealsUsingCategory} meal(s) are still using it. Reassign or delete those meals first.`,
      );
      error.statusCode = 400;
      return next(error);
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
