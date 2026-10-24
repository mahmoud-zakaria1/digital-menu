import express, { NextFunction, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import config from "./config/config.js";
import globalErrorHandling from "./middlewares/globalErrorHandler.js";
import userRouter from "./routes/users.route.js";
import orderRouter from "./routes/orders.route.js";
import mealRouter from "./routes/meals.route.js";
import tableRouter from "./routes/tables.route.js";
import categoryRouter from "./routes/categories.route.js";
import paymentRouter from "./routes/payments.route.js";
import uploadRouter from "./routes/uploads.route.js";
import cookieParser from "cookie-parser";
import { socketAuthMiddleware } from "./middlewares/socketAuth.js";
import Order from "./models/order.schema.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { serveFrontend } from "./middlewares/serveFrontend.js";

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
// Behind Railway's reverse proxy every request would otherwise appear to
// come from the proxy's own IP, so the rate limiter below would count the
// whole world as ONE client. Trusting exactly one proxy hop makes
// req.ip the real client address.
app.set("trust proxy", 1);
// Security headers. The CSP is switched off on purpose: this is a JSON API
// (a CSP only protects HTML documents) and Swagger UI's inline scripts
// would be blocked by helmet's default policy.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// 4️⃣ Brute-force protection for the public auth endpoints.
// Login and register share one budget per IP. It is only enforced in
// production: in development and in the test suite the same machine logs
// in constantly (every integration test does), and a limiter there would
// just lock the developer out.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
  skip: () => !config.isProduction,
});
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

// 5️⃣ Root Route (Health Check / Welcome Endpoint)
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Digital Menu POS Backend API is up and running!",
    docs: "Access API endpoints at /api-docs",
  });
});

// 6️⃣ API Routes Setup
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/meals", mealRouter);
app.use("/api/tables", tableRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
serveFrontend(app);

// 7️⃣ Catch-all 404 Handler for Unmatched Routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
});

// 8️⃣ Global Error Handler Middleware
app.use(globalErrorHandling);

// 9️⃣ Socket.IO Authentication Middleware
io.use(socketAuthMiddleware);

// 🔟 Socket.IO Connection & Real-time Events Handling
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
  socket.on("track_order", async (orderId: string, ack?: () => void) => {
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

      // Acknowledge the join. The client uses this as its cue to re-sync
      // the order over REST: anything that changed before the room was
      // joined was never delivered to this socket (Socket.IO does not
      // replay events), so "subscribe, then sync" closes that gap.
      if (typeof ack === "function") ack();
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
