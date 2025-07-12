const jwt = require("jsonwebtoken");
const connectDB = require("../libraries/db");

const generateToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  const db = await connectDB();
  const refreshTokenCollection = db.collection("refreshTokens");

  await refreshTokenCollection.updateOne(
    { userId },
    {
      $set: {
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    },
    { upsert: true }
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

module.exports = { generateToken, storeRefreshToken, setCookies }