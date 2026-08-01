import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Meal from "../models/meal.schema.js";
import {
  createMealValidate,
  updateMealValidate,
} from "../validators/meal.validator.js";
import { IMealFields } from "../types/meal.types.js";
import mongoose from "mongoose";

type CreateMealInput = z.infer<typeof createMealValidate>;
type UpdateMealInput = z.infer<typeof updateMealValidate>;

const mapToMealDocument = (input: CreateMealInput): IMealFields => {
  const mealDoc: IMealFields = {
    name: input.name,
    price: input.price,
    category: new mongoose.Types.ObjectId(input.category),
    isAvailable: input.isAvailable,
  };

  if (input.description) mealDoc.description = input.description;
  if (input.image) mealDoc.image = input.image;

  return mealDoc;
};

const mapToMealUpdateDocument = (
  input: UpdateMealInput,
): Partial<IMealFields> => {
  const mealDoc: Partial<IMealFields> = {}

  if (input.name !== undefined) mealDoc.name = input.name;
  if (input.description !== undefined) mealDoc.description = input.description;
  if (input.price !== undefined) mealDoc.price = input.price;
  if (input.category !== undefined) {
    mealDoc.category = new mongoose.Types.ObjectId(input.category)
  }
  if (input.image !== undefined) mealDoc.image = input.image;
  if (input.isAvailable !== undefined) mealDoc.isAvailable = input.isAvailable;

  return mealDoc;
};

export const createMeal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = createMealValidate.parse(req.body);
    const mealData = mapToMealDocument(validatedData);

    const isMealPresent = await Meal.findOne({ name: validatedData.name });
    if(isMealPresent) {
      const error: any = new Error("Meal already exists!");
      error.statusCode = 400;
      return next(error);
    }

    const newMeal = await Meal.create(mealData)

    return res.status(201).json({
      success: true,
      message: "Meal created successfully",
      data: newMeal,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMeals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { category } = req.query;
    const filter = category ? { category: String(category) } : {};

    const meals = await Meal.find(filter).populate("category", "name").sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
};

export const getMealById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findById(id);

    if (!meal) {
      const error: any = new Error("Meal not found");
      error.statusCode = 404;
      next(error);
    }

    return res.status(200).json({
      success: true,
      date: meal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const validatedData = updateMealValidate.parse(req.body);
    const updateData = mapToMealUpdateDocument(validatedData);

    const updateMeal = await Meal.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updateMeal) {
      const error: any = new Error("Meal not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Meal updated successfully",
      data: updateMeal,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMeal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleteMeal = await Meal.findByIdAndDelete(id);

    if (!deleteMeal) {
      const error: any = new Error("Meal not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Meal deleted succefully",
    });
  } catch (error) {
    next(error);
  }
};
