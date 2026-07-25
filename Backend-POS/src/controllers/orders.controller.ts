import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { ZodError, z } from "zod";
import Order from "../models/order.schema.js";
import Meal from "../models/meals.schema.js";
import {
  createOrderValidate,
  updateOrderStatusValidate,
} from "../validators/order.validator.js";
import { IOrderFields } from "../types/order.types.js";

const formatZodError = (error: ZodError) =>
  error.issues.map((err) => ({
    field: err.path.length > 0 ? err.path[0] : "field",
    message: err.message,
  }));

type CreateOrderInput = z.infer<typeof createOrderValidate>;

const mapToOrderDocument = (
  input: CreateOrderInput,
  userId: string,
  totalPrice: number,
): Omit<IOrderFields, "status"> => {
  const orderDoc: Omit<IOrderFields, "status"> = {
    user: new Types.ObjectId(userId),
    meals: input.meals.map((item) => ({
      meal: new Types.ObjectId(item.meal),
      quantity: item.quantity,
    })),
    totalPrice,
    phone: input.phone,
  };

  if (input.address) {
    orderDoc.address = input.address;
  }
  return orderDoc;
};

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = createOrderValidate.parse(req.body);
    const userId = req.user._id;

    const mealIds = validatedData.meals.map((m) => m.meal);
    const mealsFromDb = await Meal.find({ _id: { $in: mealIds } });

    if (mealsFromDb.length !== mealIds.length) {
      const error: any = new Error("One or more meals do not exist");
      error.statusCode = 400;
      return next(error);
    }

    let totalPrice = 0;
    validatedData.meals.forEach((item) => {
      const mealDoc = mealsFromDb.find((m) => m._id.toString() === item.meal);

      if (!mealDoc) {
        throw Object.assign(new Error(`Meal with id ${item.meal} not found`), {
          statusCode: 400,
        });
      }

      totalPrice += mealDoc?.price * item.quantity;
    });

    const orderData = mapToOrderDocument(
      validatedData,
      userId.toString(),
      totalPrice,
    );

    const newOrder = await Order.create(orderData);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formatZodError(error),
      });
    }
    next(error);
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("meals.meal", "name price");

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user", "name")
      .populate("meals.meal", "name price");

    if (!order) {
      const error: any = new Error("Order not found");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_TRANSITION: Record<string, string[]> = {
  pending: ["preparing"],
  preparing: ["completed"],
  completed: [],
  cancelled: [],
};

export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const validatedData = updateOrderStatusValidate.parse(req.body);

    const order = await Order.findById(id);

    if (!order) {
      const error: any = new Error("Order not found!");
      error.statusCode = 404;
      return next(error);
    }

    const allowedNextStatuses = ALLOWED_TRANSITION[order.status] || [];

    if (!allowedNextStatuses.includes(validatedData.status)) {
      const error: any = new Error(
        `Cannot change status from "${order.status}" to "${validatedData.status}"`,
      );
      error.statusCode = 400;
      return next(error);
    }

    order.status = validatedData.status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formatZodError(error),
      });
    }
    next(error);
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      const error: any = new Error("Order not found");
      error.statusCode = 404;
      return next(error);
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      const error: any = new Error(
        "You are not authorized to cancel this order",
      );
      error.statusCode = 403;
      return next(error);
    }

    if (order.status !== "pending") {
      const error: any = new Error(
        `Cannot cancel order! it is already ${order.status}.`,
      );
      error.statusCode = 400;
      return next(error);
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const deleteOrder = await Order.findByIdAndDelete(id);

    if (!deleteOrder) {
      const error: any = new Error("Order not found");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({
      success: true,
      message: "Order hard-deleted from database successfully",
    });
  } catch (error) {
    next(error);
  }
};
