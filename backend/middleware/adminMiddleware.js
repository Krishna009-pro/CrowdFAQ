const authorizeModeratorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "moderator" || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: {
        message: "Not authorized to access this route. Moderator or Admin role required.",
      },
    });
  }
};

module.exports = {
  authorizeModeratorOrAdmin,
};
