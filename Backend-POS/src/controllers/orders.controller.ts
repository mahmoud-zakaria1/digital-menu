import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import Order from "../models/order.schema.js";
import Meal from "../models/meal.schema.js";
import Table from "../models/table.schema.js";
import {
  createOrderValidate,
  updateOrderStatusValidate,
  getOrdersQueryValidate,
} from "../validators/order.validator.js";
import { IOrderFields } from "../types/order.types.js";
import { toObjectId } from "../utils/toObjectId.js";
import { io } from "../app.js";
import { assertExists, assertUser } from "../utils/assertions.js";
import Payment from "../models/payment.schema.js";
import { publishOrderToStaff, releaseTable } from "../utils/orderEvents.js";

type CreateOrderInput = z.infer<typeof createOrderValidate>;

// Staff must never see an online order that hasn't been paid yet - it isn't
// "real" to the restaurant until the Paymob webhook confirms it (see
// utils/orderEvents.ts). `$ne: "online"` (rather than `: "cash"`) is
// deliberate: orders created before paymentMethod existed have no such
// field and must stay visible.
//
// Typed as Record<string, any> (like every other dynamic filter in this
// codebase): without an annotation TypeScript widens "online" / "paid" to
// plain `string`, which Mongoose's strictly-typed filter then rejects
// because Order.paymentMethod is the union "cash" | "online".
const staffVisibleFilter = (): Record<string, any> => ({
  $or: [{ paymentMethod: { $ne: "online" } }, { paymentStatus: "paid" }],
});

// Helper to map validated input and server-calculated price into an Order document
const mapToOrderDocument = (
  input: CreateOrderInput,
  userId: string,
  totalPrice: number,
): Omit<IOrderFields, "status" | "paymentStatus"> => {
  const orderDoc: Omit<IOrderFields, "status" | "paymentStatus"> = {
    user: toObjectId(userId),
    meals: input.meals.map((item) => ({
      meal: toObjectId(item.meal),
      quantity: item.quantity,
    })),
    totalPrice,
    phone: input.phone,
    paymentMethod: input.paymentMethod,
  };

  if (input.address) {
    orderDoc.address = input.address;
  }

  if (input.table) {
    orderDoc.table = toObjectId(input.table);
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

    // If the order came from a table's QR code, make sure that table
    // actually exists before creating the order around it
    if (validatedData.table) {
      const tableExists = await Table.findById(toObjectId(validatedData.table));
      if (!tableExists) {
        const error: any = new Error("Table does not exist");
        error.statusCode = 400;
        return next(error);
      }
    }

    // Merge duplicate lines: the same meal sent twice becomes one line with
    // the summed quantity. Without this, the "every id was found" check
    // below would wrongly report a meal as missing.
    const mergedQuantities = new Map<string, number>();
    for (const item of validatedData.meals) {
      mergedQuantities.set(
        item.meal,
        (mergedQuantities.get(item.meal) ?? 0) + item.quantity,
      );
    }
    const mealIds = [...mergedQuantities.keys()];
    const mergedMeals = [...mergedQuantities].map(([meal, quantity]) => ({
      meal,
      quantity,
    }));

    // Fetch all requested meals to ensure they exist and retrieve accurate prices
    const mealsFromDb = await Meal.find({ _id: { $in: mealIds } });

    if (mealsFromDb.length !== mealIds.length) {
      const error: any = new Error("One or more meals do not exist");
      error.statusCode = 400;
      return next(error);
    }

    // A meal the Admin switched off must not be orderable, whatever the
    // client's (possibly stale) menu still shows.
    const unavailableMeals = mealsFromDb.filter((meal) => !meal.isAvailable);
    if (unavailableMeals.length > 0) {
      const error: any = new Error(
        `Not available right now: ${unavailableMeals
          .map((meal) => meal.name)
          .join(", ")}`,
      );
      error.statusCode = 400;
      return next(error);
    }

    // Calculate total price on the server side
    let totalPrice = 0;
    for (const mealDoc of mealsFromDb) {
      totalPrice +=
        mealDoc.price * (mergedQuantities.get(mealDoc._id.toString()) ?? 0);
    }

    // Map order fields and persist to database
    const orderData = mapToOrderDocument(
      { ...validatedData, meals: mergedMeals },
      userId.toString(),
      totalPrice,
    );

    const newOrder = await Order.create(orderData);

    // Cash orders are real the moment they exist, so they go live now.
    // Online orders are NOT published here - the Paymob webhook does that
    // once the payment is confirmed, so an abandoned checkout never rings
    // the Cashier's bell or occupies a table.
    if (newOrder.paymentMethod === "cash") {
      await publishOrderToStaff(newOrder);
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

// 2️⃣ Get All Orders (Supports Pagination, Filtering, and Authorization Rules)
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Authenticate user request
    if (!assertUser(req.user, next)) return;

    // Validate query parameters
    const { page, limit, status } = getOrdersQueryValidate.parse(req.query);

    // Build query filter (Customer only sees their own orders; Admin/Cashier can view all)
    const queryFilter: Record<string, any> = {};

    if (req.user.role === "Customer") {
      queryFilter.user = req.user._id;
    } else {
      // Staff only see orders that are real to the restaurant (cash, or
      // online + paid), never an online order still waiting on its payment.
      Object.assign(queryFilter, staffVisibleFilter());
    }

    if (status) {
      queryFilter.status = status;
    }

    // Offsets calculation
    const skip = (page - 1) * limit;

    // Fetch paginated data and total count concurrently
    const [orders, totalOrders] = await Promise.all([
      Order.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .populate("meals.meal", "name price")
        .populate("table", "tableNo"),
      Order.countDocuments(queryFilter),
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          totalOrders,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3️⃣ Get Order Stats (Admin-only analytics for the dashboard)
// Revenue counts "completed" orders only - money for a still-pending or
// cancelled order hasn't actually been earned yet. Active orders covers
// anything currently in the pending/preparing pipeline. Unpaid online
// orders are excluded from the active count and from best sellers: they
// aren't real orders yet.
export const getOrderStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Orders currently in the kitchen pipeline that are real to the
    // restaurant (unpaid online orders excluded)
    const activeOrdersFilter: Record<string, any> = {
      status: { $in: ["pending", "preparing"] },
      ...staffVisibleFilter(),
    };

    const [revenueResult, activeOrders, bestSellingMeals] = await Promise.all([
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
      ]),
      Order.countDocuments(activeOrdersFilter),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" }, ...staffVisibleFilter() } },
        { $unwind: "$meals" },
        {
          $group: {
            _id: "$meals.meal",
            totalQuantity: { $sum: "$meals.quantity" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "meals",
            localField: "_id",
            foreignField: "_id",
            as: "meal",
          },
        },
        { $unwind: "$meal" },
        {
          $project: {
            _id: 0,
            mealId: "$meal._id",
            name: "$meal.name",
            totalQuantity: 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: revenueResult[0]?.totalRevenue ?? 0,
        activeOrders,
        bestSellingMeals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 4️⃣ Get Single Order By ID (the order's owner, or staff)
// Customers need this for the live tracking page; it used to be
// Admin/Cashier only, so a customer had no way to load their own order.
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!assertUser(req.user, next)) return;

    const orderId = toObjectId(req.params.id);
    const order = await Order.findById(orderId);
    if (!assertExists(order, "Order", next)) return;

    // Authorize BEFORE populating, while order.user is still a bare
    // ObjectId (after populate it becomes a document, or null if the
    // user was deleted).
    const isOwner = order.user.toString() === req.user._id.toString();
    const isStaff = req.user.role === "Admin" || req.user.role === "Cashier";

    if (!isOwner && !isStaff) {
      const error: any = new Error("You are not authorized to view this order");
      error.statusCode = 403;
      return next(error);
    }

    await order.populate([
      { path: "user", select: "name" },
      { path: "meals.meal", select: "name price" },
      { path: "table", select: "tableNo" },
    ]);

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

// 5️⃣ Update Order Status (Enforces State Machine transitions)
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

    // An online order only enters the kitchen pipeline through the payment
    // webhook. Staff can't see unpaid ones on the board, but the endpoint
    // must refuse them too - hiding something in the UI is not a guard.
    if (order.paymentMethod === "online" && order.paymentStatus !== "paid") {
      const error: any = new Error(
        "This online order hasn't been paid yet, so it can't be processed",
      );
      error.statusCode = 400;
      return next(error);
    }

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

    // A finished order frees its table
    if (order.status === "completed") {
      await releaseTable(order);
    }

    // Notify the customer tracking this order AND the staff dashboards.
    // Chaining .to() targets the union of both rooms and delivers once to
    // anyone who is in both.
    io.to(`order_${orderId}`).to("staff_room").emit("status_changed", {
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

// 6️⃣ Cancel Order (Customer owner, Admin, or Cashier - only if order is
// still 'pending').
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

    // Authorization check: User must own the order, or be staff (Admin/Cashier)
    const isOwner = order.user.toString() === req.user._id.toString();
    const isStaff = req.user.role === "Admin" || req.user.role === "Cashier";

    if (!isOwner && !isStaff) {
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

    // Same loose-filter approach as the other dynamic queries here
    const paidPaymentFilter: Record<string, any> = {
      order: orderId,
      status: "paid",
    };
    const existingPayment = await Payment.findOne(paidPaymentFilter);
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

    // Free the table if this order was holding one (a no-op for an unpaid
    // online order, which never occupied it)
    await releaseTable(order);

    // Same as updateOrder: the tracking customer AND the staff boards need
    // to hear about it (e.g. a customer cancelling must update the
    // Cashier's board live).
    io.to(`order_${orderId}`).to("staff_room").emit("status_changed", {
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

// 7️⃣ Hard Delete Order (Admin only maintenance)
export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = toObjectId(req.params.id);
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!assertExists(deletedOrder, "Order", next)) return;

    // Don't leave a table pointing at an order that no longer exists
    await releaseTable(deletedOrder);

    return res.status(200).json({
      success: true,
      message: "Order hard-deleted from database successfully",
    });
  } catch (error) {
    next(error);
  }
};
