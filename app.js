const config = require("./utils/config");
const express = require("express");
const app = express();
require("express-async-errors");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const productRouter = require("./controllers/product");
const cartRouter = require("./controllers/cart");
const checkoutRouter = require("./controllers/checkout");
const middleware = require("./utils/middleware");
const logger = require("./utils/logger");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
mongoose.set("strictQuery", false);

logger.info("connecting to ", config.MONGODB_URI);

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to mongoDB");
  })
  .catch((e) => {
    logger.error("error connecting to mongoDB", e);
    process.exit(1);
  });

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.1.58:5173",
      "http://192.168.1.52:5173",
      "http://192.168.1.55:5173",
      "http://192.168.1.56:5173",
      "http://192.168.235.135:5173",
      "http://192.168.0.175:5173",
      "http://192.168.167.135:5173",
      "https://momoelo1.github.io",
      "https://p01--afd-backend--288t4d4hml72.code.run"
    ],
    credentials: true,
  })
);

// Security middlewares
app.use(helmet());
app.use(
  express.json({
    limit: "10kb",
  })
);
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api", apiLimiter);
app.use(middleware.requestLogger);

app.use((req, res, next) => {
  res.header(
    "Set-Cookie",
    "__stripe_mid=; Max-Age=0; Path=/; HttpOnly=True; SameSite=Strict"
  );
  next();
});
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Test endpoint to check if routes are working
app.get("/test", (req, res) => {
  res.status(200).json({
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/cart", cartRouter);
app.use("/api/users", userRouter);
app.use("/api/login", loginRouter);
app.use("/api/products", productRouter);
app.use("/api/checkout", checkoutRouter);

// app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
