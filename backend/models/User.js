const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Public name shown on questions, answers, and profile views.
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    // Unique login/contact identity for the user.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Hashed password value. Hidden from normal query results by select: false.
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    // Permission level used by auth/admin middleware.
    role: {
      type: String,
      enum: ["student", "moderator", "admin"],
      default: "student",
      index: true,
    },
    // Gamification score increased by accepted answers, votes, and contributions.
    reputationScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Lightweight achievement labels shown on user profiles.
    badges: {
      type: [String],
      default: [],
    },
    // Consecutive activity count for engagement features.
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
