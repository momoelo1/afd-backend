const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const User = require("../models/User");
const { generateToken, storeRefreshToken, setCookies } = require("./auth");
const config = require("../utils/config");

loginRouter.post("/", async (req, res) => {
  console.log('body', req.body);
  console.log('cookie', req.cookies);
  
  
  try {
    const { username, email, password } = req.body;
    const user = await User.findOne({ email });


    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      console.log(user._id);

      const { accessToken, refreshToken } = generateToken(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

      res.status(200).json({
        accessToken,
        _id: user._id,
        username: user.username,
        email: user.email,
        cartItems: user.cartItems,
      });
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.log(error);
  }
});

/*
loginRouter.post("/", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  const passwordCorrect =
    user === null ? false : await bcrypt.compare(password, user.passwordHash);

  if (!(user && passwordCorrect)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }


  const userForToken = {
    email: user.email,
    id: user.id,
  };

  const token = jwt.sign(userForToken, config.SECRET);

  res
    .status(200)
    .send({ token, username: user.username, email: user.email, id: user.id });
});
*/

module.exports = loginRouter;
