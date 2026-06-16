const mongoose = require("mongoose");

const Answer = require("../models/Answer");
const Question = require("../models/Question");
const User = require("../models/User");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getPublicUser = async (id) => {
  if (!isValidObjectId(id)) {
    const error = new Error("User id must be a valid MongoDB ObjectId");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const updateMe = async (req, res, next) => {
  try {
    const allowedUpdates = {};
    const { displayName } = req.body;

    if (displayName !== undefined) {
      allowedUpdates.displayName = String(displayName).trim();
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "No supported profile fields provided",
        },
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await getPublicUser(req.params.id);

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getUserQuestions = async (req, res, next) => {
  try {
    await getPublicUser(req.params.id);

    const questions = await Question.find({ author: req.params.id })
      .select("-embedding")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        questions,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getUserAnswers = async (req, res, next) => {
  try {
    await getPublicUser(req.params.id);

    const answers = await Answer.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .populate("question", "title status")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        answers,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  updateMe,
  getUserById,
  getUserQuestions,
  getUserAnswers,
};
