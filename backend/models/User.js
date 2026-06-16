const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't include password in queries by default
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
    // Account standing
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash the token and store in DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiry to 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  // Return the unhashed token (to send to user)
  return resetToken;
};

// Generate and hash email verification token
userSchema.methods.getEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Set expiry to 24 hours
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

module.exports = mongoose.model("User", userSchema);
