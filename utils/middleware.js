const jwt = require("jsonwebtoken");
const logger = require("./logger");
const User = require("../models/User");

const getTokenFrom = async (req, res) => {
  const accessCookie = req.cookies.accessToken;

  if (accessCookie) {
    const decodedToken = jwt.verify(accessCookie, process.env.SECRET);

    if (decodedToken) {
      return (req.user = await User.findById(decodedToken.userId));
    }
    if (!decodedToken) {
      return null;
    }
  } else {
    return null;
  }
};

const getUserTokenFrom = async (token) => {
  if (token === null) {
    return null;
  }

  const decodedToken = jwt.verify(token, process.env.SECRET);

  return await User.findById(decodedToken.id);
};

const requestLogger = (req, res, next) => {
  logger.info("Method: ", req.method);
  logger.info("Path: ", req.path);
  logger.info("Body: ", req.body);
  logger.info("---");
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
  req.user = user;
  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  unknownEndpoint,
  tokenExtractor,
};
