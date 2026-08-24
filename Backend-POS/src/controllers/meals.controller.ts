import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Meal from "../models/meal.schema.js";
import {
  createMealValidate,
  updateMealValidate,
} from "../validators/meal.validator.js";
import { IMealFields } from "../types/meal.types.js";
import { toObjectId } from "../utils/toObjectId.js";
import Category from "../models/category.schema.js";
import { assertExists } from "../utils/assertions.js";

type CreateMealInput = z.infer<typeof createMealValidate>;
type UpdateMealInput = z.infer<typeof updateMealValidate>;

// Helper to map validated input into a strict Meal document payload
const mapToMealDocument = (input: CreateMealInput): IMealFields => {
  const mealDoc: IMealFields = {
    name: input.name,
    price: input.price,
    category: toObjectId(input.category),
    isAvailable: input.isAvailable,
  };

  if (input.description) mealDoc.description = input.description;
  if (input.image) mealDoc.image = input.image;

  return mealDoc;
};

// Helper to build dynamic payload for partial meal updates
const mapToMealUpdateDocument = (
  input: UpdateMealInput,
): Partial<IMealFields> => {
  const mealDoc: Partial<IMealFields> = {};

  if (input.name !== undefined) mealDoc.name = input.name;
  if (input.description !== undefined) mealDoc.description = input.description;
  if (input.price !== undefined) mealDoc.price = input.price;
  if (input.category !== undefined)
    mealDoc.category = toObjectId(input.category);
  if (input.image !== undefined) mealDoc.image = input.image;
  if (input.isAvailable !== undefined) mealDoc.isAvailable = input.isAvailable;

  return mealDoc;
};

// 1️⃣ Create New Meal
export const createMeal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = createMealValidate.parse(req.body);

    // Prevent duplicate meal names
    const isMealPresent = await Meal.findOne({ name: validatedData.name });
    if (isMealPresent) {
      const error: any = new Error("Meal already exists!");
      error.statusCode = 400;
      return next(error);
    }

    // Ensure referenced category exists
    const categoryExists = await Category.findById(validatedData.category);
    if (!categoryExists) {
      const error: any = new Error("Category does not exist!");
      error.statusCode = 400;
      return next(error);
    }

    const mealData = mapToMealDocument(validatedData);
    const newMeal = await Meal.create(mealData);

    return res.status(201).json({
      success: true,
      message: "Meal created successfully",
      data: newMeal,
    });
  } catch (error) {
    next(error);
  }
};

// 2️⃣ Get All Meals (with optional category filter and populated details)
export const getAllMeals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { category } = req.query;
    const filter = category ? { category: String(category) } : {};

    const meals = await Meal.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
};

// 3️⃣ Get Single Meal By ID
export const getMealById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mealId = toObjectId(req.params.id);
    const meal = await Meal.findById(mealId);

    if (!assertExists(meal, "Meal", next)) return;

    return res.status(200).json({
      success: true,
      data: meal,
    });
  } catch (error) {
    next(error);
  }
};

// 4️⃣ Update Meal Details
export const updateMeal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mealId = toObjectId(req.params.id);

    const validatedData = updateMealValidate.parse(req.body);

    // If category is being updated, ensure it exists in DB
    if (validatedData.category !== undefined) {
      const categoryExists = await Category.findById(validatedData.category);
      if (!categoryExists) {
        const error: any = new Error("Category does not exist!");
        error.statusCode = 400;
        return next(error);
      }
    }

    const updateData = mapToMealUpdateDocument(validatedData);

    const updatedMeal = await Meal.findByIdAndUpdate(mealId, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!assertExists(updatedMeal, "Meal", next)) return;

    return res.status(200).json({
      success: true,
      message: "Meal updated successfully",
      data: updatedMeal,
    });
  } catch (error) {
    next(error);
  }
};

// 5️⃣ Delete Meal By ID
export const deleteMeal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mealId = toObjectId(req.params.id);
    const deletedMeal = await Meal.findByIdAndDelete(mealId);

    if(!assertExists(deletedMeal, "Meal", next)) return;

    return res.status(200).json({
      success: true,
      message: "Meal deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
