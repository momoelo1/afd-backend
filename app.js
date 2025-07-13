const config = require("./utils/config");
const express = require("express");
const app = express();
require("express-async-errors");
const cors = require("cors");
const userRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const productRouter = require("./controllers/product");
const cartRouter = require("./controllers/cart");
const checkoutRouter = require('./controllers/checkout')
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
    logger.error("error connecting to mongoDB");
    process.exit(1);
  });

app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "http://192.168.118.135:5173",
      "https://*.railway.app",
      "https://*.up.railway.app",
      "https://momoelo1.github.io",
      "https://*.github.io"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(middleware.requestLogger);

app.use((req, res, next) => {
  res.header(
    "Set-Cookie",
    "__stripe_mid=; Max-Age=0; Path=/; HttpOnly=True; SameSite=Strict"
  );
  next();
});
app.use(cookieParser());
// app.use(middleware.tokenExtractor);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ciao momo', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Test endpoint to check if routes are working
app.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

/* usersExtractor and userExtractor blocking the backend with a JsonWeTokeError. do not use it */
app.use("/api/cart", cartRouter);
app.use("/api/users", userRouter);
app.use("/api/login", loginRouter);
app.use("/api/products", productRouter);
app.use('/api/checkout', checkoutRouter)

// app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
