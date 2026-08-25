import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import config from "./config/config.js";
import globalErrorHandling from "./middlewares/globalErrorHandler.js";
import userRouter from "./routes/users.route.js";
import orderRouter from "./routes/orders.route.js";
import mealRouter from "./routes/meals.route.js";
import tableRouter from "./routes/tables.route.js";
import categoryRouter from "./routes/categories.route.js";
import paymentRouter from "./routes/payments.route.js";
import cookieParser from "cookie-parser";
import { socketAuthMiddleware } from "./middlewares/socketAuth.js";
import Order from "./models/order.schema.js";

// 1️⃣ Initialize Express App & HTTP Server
const app = express();
const httpServer = http.createServer(app);

// 2️⃣ Initialize Socket.IO Server with CORS and Heartbeat Settings
const io = new Server(httpServer, {
  cors: { origin: config.frontendUrl, credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// 3️⃣ Global Middlewares
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// 4️⃣ API Routes Setup
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/meals", mealRouter);
app.use("/api/tables", tableRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/payments", paymentRouter);

// 5️⃣ Catch-all 404 Handler for Unmatched Routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// 6️⃣ Global Error Handler Middleware
app.use(globalErrorHandling);

// 7️⃣ Socket.IO Authentication Middleware
io.use(socketAuthMiddleware);

// 8️⃣ Socket.IO Connection & Real-time Events Handling
io.on("connection", (socket) => {
  console.log(
    `Socket connected: ${socket.id} - User: ${socket.data.user?.name}`,
  );

  // Automatically join authorized staff (Admin / Cashier) to staff_room for live order updates
  const userRole = socket.data.user?.role;
  if (userRole === "Admin" || userRole === "Cashier") {
    socket.join("staff_room");
    console.log(`Socket ${socket.id} joined room: staff_room`);
  }

  // Real-time order tracking listener
  socket.on("track_order", async (orderId: string) => {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        socket.emit("track_order_error", "Order not found");
        return;
      }

      // Check authorization: only order owner or staff (Admin/Cashier) can track
      const isOwner =
        order.user.toString() === socket.data.user?._id.toString();
      const isStaff =
        socket.data.user?.role === "Admin" ||
        socket.data.user?.role === "Cashier";

      if (!isOwner && !isStaff) {
        socket.emit(
          "track_order_error",
          "You are not authorized to track this order",
        );
        return;
      }

      // Join room dedicated to this order for targeted broadcasts
      socket.join(`order_${orderId}`);
      console.log(`Socket ${socket.id} joined room: order_${orderId}`);
    } catch (error) {
      socket.emit("track_order_error", "Invalid order id");
    }
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

export { app, httpServer, io };
