const bcrypt = require("bcrypt");
const userRouter = require("express").Router();
const User = require("../models/User");
userRouter.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    email,
    passwordHash,
  });
  const userExist = await User.findOne({ email });

  if (userExist) {
    return res.status(400).json('username and email must be unique');
  }

  if (password.length < 3 && username.length < 3) {
    return res.status(400).json({ error: "username or password too short" });
  } else if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }

  const savedUser = await user.save();

  res.status(201).json(savedUser);
});

userRouter.get("/", async (req, res) => {
  const users = await User.find({}).populate("cartItems", {
    userId: 1,
    productId: 1,
    name: 1,
    desc: 1,
    img: 1,
    quantity: 1,
  });
  res.status(200).json(users);
});

module.exports = userRouter;
