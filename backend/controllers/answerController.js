const mongoose = require("mongoose");

const Answer = require("../models/Answer");
const Question = require("../models/Question");
const User = require("../models/User");

const createAnswer = async (req, res, next) => {
  try {
    const { questionId, body } = req.body;
    const authorId = req.user._id;

    if (!questionId || !body) {
      return res.status(400).json({
        success: false,
        error: {
          message: "questionId and body are required",
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "questionId must be a valid MongoDB ObjectId",
        },
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Question not found",
        },
      });
    }

    const answer = await Answer.create({
      question: questionId,
      author: authorId,
      body,
      aiGenerated: false,
    });

    if (question.status === "pending") {
      question.status = "answered";
      await question.save();
    }

    const populatedAnswer = await Answer.findById(answer._id).populate("author", "displayName");
    const io = req.app.get("io");
    if (io) {
      io.to(`question_${questionId}`).emit("new_answer", populatedAnswer);
    }

    return res.status(201).json({
      success: true,
      data: {
        answer: populatedAnswer,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const acceptAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Answer id must be a valid MongoDB ObjectId",
        },
      });
    }

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Answer not found",
        },
      });
    }

    await Answer.updateMany(
      { question: answer.question, _id: { $ne: answer._id } },
      { $set: { isAccepted: false } }
    );

    answer.isAccepted = true;
    await answer.save();

    await Question.findByIdAndUpdate(
      answer.question,
      { $set: { status: "resolved", acceptedAnswerId: answer._id } },
      { runValidators: true }
    );

    if (answer.author) {
      await User.findByIdAndUpdate(answer.author, {
        $inc: { reputationScore: 25 },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        answer,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const voteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'up' or 'down'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Answer id must be a valid MongoDB ObjectId",
        },
      });
    }

    const update =
      type === "up" ? { $inc: { upvoteCount: 1 } } : { $inc: { downvoteCount: 1 } };

    const answer = await Answer.findByIdAndUpdate(id, update, { new: true });

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Answer not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        answer,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const createOfficialAnswer = async (req, res, next) => {
  try {
    const { questionId, body } = req.body;

    if (!questionId || !body) {
      return res.status(400).json({
        success: false,
        error: {
          message: "questionId and body are required",
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "questionId must be a valid MongoDB ObjectId",
        },
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Question not found",
        },
      });
    }

    // Get or create Vicharanashala System user
    let vicharanashalUser = await User.findOne({ email: "system@vicharanashala.com" });
    if (!vicharanashalUser) {
      vicharanashalUser = await User.create({
        email: "system@vicharanashala.com",
        displayName: "Vicharanashala System",
        password: "System@123456",
        role: "admin",
      });
    }

    const answer = await Answer.create({
      question: questionId,
      author: vicharanashalUser._id,
      body,
      aiGenerated: false,
      isAccepted: true,
    });

    // Update question status to resolved with official answer
    question.status = "resolved";
    question.acceptedAnswerId = answer._id;
    await question.save();

    const populatedAnswer = await Answer.findById(answer._id).populate("author", "displayName email");
    
    const io = req.app.get("io");
    if (io) {
      io.to(`question_${questionId}`).emit("new_answer", populatedAnswer);
    }

    return res.status(201).json({
      success: true,
      data: {
        answer: populatedAnswer,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAnswer,
  acceptAnswer,
  voteAnswer,
  createOfficialAnswer,
};
