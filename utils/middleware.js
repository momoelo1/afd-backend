const jwt = require("jsonwebtoken");
const logger = require("./logger");
const User = require("../models/User");

const getTokenFrom = async (req) => {
  const accessCookie = req.cookies?.accessToken;

  if (!accessCookie) {
    return null;
  }

  try {
    const decodedToken = jwt.verify(accessCookie, process.env.SECRET);

    if (!decodedToken || !decodedToken.userId) {
      return null;
    }

    const user = await User.findById(decodedToken.userId);
    return user || null;
  } catch (error) {
    logger.error("Failed to verify access token", error);
    return null;
  }
};

const getUserTokenFrom = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken || !decodedToken.id) {
      return null;
    }
    const user = await User.findById(decodedToken.id);
    return user || null;
  } catch (error) {
    logger.error("Failed to verify user token", error);
    return null;
  }
};

const requestLogger = (req, res, next) => {
  logger.info("Method:", req.method, "Path:", req.path);
  next();
};

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, req, res, next) => {
  if (error.name === "CastError") {
    return res.status(400).send({ error: error.message });
  } else if (error.name === "ValidationError") {
    res.status(400).json({ error: error.message });
  } else if (
    error.name === "MongoServerError" &&
    error.message.includes("E11000 duplicate key error")
  ) {
    return res.status(400).json({ error });
  } else if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error });
  }

  next(error);
};

const tokenExtractor = async (req, res, next) => {
  const user = await getTokenFrom(req);

  if (!user) {
    return res.status(401).json({ error: "authentication required" });
  }

  req.user = user;
  next();
};

// Optional token extractor - doesn't fail if no token, just sets req.user to null
const optionalTokenExtractor = async (req, res, next) => {
  const user = await getTokenFrom(req);
  req.user = user || null;
  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  unknownEndpoint,
  tokenExtractor,
  optionalTokenExtractor,
  getTokenFrom,
  getUserTokenFrom,
};
