const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes — verify JWT token from cookie
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

// Authorize by role — must be used after protect middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Not authorized to access this route");
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error(
        `User role '${req.user.role}' is not authorized to access this route`
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = { protect, authorize };
