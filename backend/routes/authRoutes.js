const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Simple mock registration for development
router.post("/register", async (req, res, next) => {
  try {
    const { displayName, email } = req.body;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ displayName, email });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true });
});

module.exports = router;
