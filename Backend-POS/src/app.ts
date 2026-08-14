import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { connectDB } from "./config/db.js";
import config from "./config/config.js";
import globalErrorHandling from "./middlewares/globalErrorHandler.js";
import userRouter from "./routes/users.route.js";
import orderRouter from "./routes/orders.route.js";
import mealRouter from "./routes/meals.route.js";
import tableRouter from "./routes/tables.route.js";
import categoryRouter from "./routes/categories.route.js";
import cookieParser from "cookie-parser";
import { socketAuthMiddleware } from "./middlewares/socketAuth.js";

// Initialize Express app and HTTP server
const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: config.frontendUrl, credentials: true },
});

const PORT = config.port || 8000;

// Connect to MongoDB database
connectDB();

// Global Middlewares
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/meals", mealRouter);
app.use("/api/tables", tableRouter);
app.use("/api/categories", categoryRouter);

// Handle 404 - Unmatched Routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handling Middleware
app.use(globalErrorHandling);

// Authenticate Socket connection before handshake
io.use(socketAuthMiddleware);

// Socket.IO Connection & Events
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} _  User: ${socket.data.user?.name}`);

  // Join a specific order room for real-time tracking
  socket.on("track_order", (orderId: string) => {
    socket.join(`order_${orderId}`);
    console.log(`📦 Socket ${socket.id} joined room: order_${orderId}`)
  })

  // Handle Socket disconnection
  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Start the Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export { io };
