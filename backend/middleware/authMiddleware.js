const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token) {
      const error = new Error("Not authorized to access this route");
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
