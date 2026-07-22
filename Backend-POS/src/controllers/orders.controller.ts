import { Request, Response, NextFunction } from "express";
import Order from "../models/order.schema.js";

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    
    const { meals, totalPrice, address, phone } = req.body;
    const userId = req.user._id;

    const newOrder = await Order.create({
      user: userId,
      meals,
      totalPrice,
      address,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
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

export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!updateOrder) {
      const error: any = new Error("Order not found!");
      error.statusCode = 404;
      return next(error);
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updateOrder,
    });
  } catch (error) {
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

    if (order.user.toString() !== req.user._id.toString()) {
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