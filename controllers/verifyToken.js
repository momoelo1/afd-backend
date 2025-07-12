const jwt = require("jsonwebtoken");

const verifyToken = async (req, res) => {
  const { user } = req.body;

  const userForToken = {
    username: user.username,
    id: user._id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET);

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.json({ token, user });
  });
};

module.exports = { verifyToken };
