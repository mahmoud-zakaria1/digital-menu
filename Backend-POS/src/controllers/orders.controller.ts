import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Order from "../models/order.schema.js";
import Meal from "../models/meal.schema.js";
import {
  createOrderValidate,
  updateOrderStatusValidate,
} from "../validators/order.validator.js";
import { IOrderFields } from "../types/order.types.js";
import { toObjectId } from "../utils/toObjectId.js";
import { io } from "../app.js";
import { assertExists, assertUser } from "../utils/assertions.js";
import Payment from "../models/payment.schema.js";

type CreateOrderInput = z.infer<typeof createOrderValidate>;

// Helper to map validated input and server-calculated price into an Order document
const mapToOrderDocument = (
  input: CreateOrderInput,
  userId: string,
  totalPrice: number,
): Omit<IOrderFields, "status"> => {
  const orderDoc: Omit<IOrderFields, "status"> = {
    user: toObjectId(userId),
    meals: input.meals.map((item) => ({
      meal: toObjectId(item.meal),
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

// 1️⃣ Create New Order (Calculates total price server-side to prevent tampering)
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Authenticate user request
    if (!assertUser(req.user, next)) return;

    // Validate request body schemas
    const validatedData = createOrderValidate.parse(req.body);
    const userId = req.user._id;

    // Fetch all requested meals to ensure they exist and retrieve accurate prices
    const mealIds = validatedData.meals.map((m) => m.meal);
    const mealsFromDb = await Meal.find({ _id: { $in: mealIds } });

    if (mealsFromDb.length !== mealIds.length) {
      const error: any = new Error("One or more meals do not exist");
      error.statusCode = 400;
      return next(error);
    }

    // Map DB meals for O(1) instant lookup
    const mealsMap = new Map(mealsFromDb.map((m) => [m._id.toString(), m]));

    // Calculate total price on the server side
    let totalPrice = 0;
    for (const item of validatedData.meals) {
      const mealDoc = mealsMap.get(item.meal);

      if (!mealDoc) {
        throw Object.assign(new Error(`Meal with id ${item.meal} not found`), {
          statusCode: 400,
        });
      }

      totalPrice += mealDoc.price * item.quantity;
    }

    // Map order fields and persist to database
    const orderData = mapToOrderDocument(
      validatedData,
      userId.toString(),
      totalPrice,
    );

    const newOrder = await Order.create(orderData);

    // Broadcast new order event to all connected dashboard/kitchen clients
    io.emit("new_order", newOrder);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

// 2️⃣ Get All Orders (Admin/Staff view with populated relations)
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

// 3️⃣ Get Single Order By ID
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = toObjectId(req.params.id);
    const order = await Order.findById(orderId)
      .populate("user", "name")
      .populate("meals.meal", "name price");

    if (!assertExists(order, "Order", next)) return;

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// State Machine rules for valid order status lifecycle transitions
const ALLOWED_TRANSITION: Record<string, string[]> = {
  pending: ["preparing"],
  preparing: ["completed"],
  completed: [],
  cancelled: [],
};

// 4️⃣ Update Order Status (Enforces State Machine transitions)
export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = toObjectId(req.params.id);
    const validatedData = updateOrderStatusValidate.parse(req.body);

    const order = await Order.findById(orderId);

    if (!assertExists(order, "Order", next)) return;

    // Validate that status transition is allowed by the State Machine
    const allowedNextStatuses = ALLOWED_TRANSITION[order.status] || [];

    if (!allowedNextStatuses.includes(validatedData.status)) {
      const error: any = new Error(
        `Cannot change status from "${order.status}" to "${validatedData.status}"`,
      );
      error.statusCode = 400;
      return next(error);
    }

    // Save updated status
    order.status = validatedData.status;
    await order.save();

    // Emit status change event strictly to the specific order tracking room
    io.to(`order_${orderId}`).emit("status_changed", {
      orderId: order._id,
      status: order.status,
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// 5️⃣ Cancel Order (Customer owner or Admin - only if order is still 'pending')
export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Authenticate user
    if (!assertUser(req.user, next)) return;

    const orderId = toObjectId(req.params.id);
    const order = await Order.findById(orderId);
    if (!assertExists(order, "Order", next)) return;

    // Authorization check: User must own the order or be an Admin
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      const error: any = new Error(
        "You are not authorized to cancel this order",
      );
      error.statusCode = 403;
      return next(error);
    }

    // Prevent cancellation if the order has moved beyond 'pending'
    if (order.status !== "pending") {
      const error: any = new Error(
        `Cannot cancel order! it is already ${order.status}.`,
      );
      error.statusCode = 400;
      return next(error);
    }

    const existingPayment = await Payment.findOne({
      order: orderId,
      status: "paid",
    });
    if (existingPayment) {
      const error: any = new Error(
        "Cannot cancel an order that has already been paid",
      );
      error.statusCode = 400;
      return next(error);
    }

    // Update status to cancelled
    order.status = "cancelled";
    await order.save();

    // Emit status change event to the specific order tracking room
    io.to(`order_${orderId}`).emit("status_changed", {
      orderId: order._id,
      status: order.status,
    });

    return res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// 6️⃣ Hard Delete Order (Admin only maintenance)
export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = toObjectId(req.params.id);
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!assertExists(deletedOrder, "Order", next)) return;

    return res.status(200).json({
      success: true,
      message: "Order hard-deleted from database successfully",
    });
  } catch (error) {
    next(error);
  }
};
