const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 5000,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAccepted: {
      type: Boolean,
      default: false,
      index: true,
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

answerSchema.virtual("netVoteScore").get(function () {
  return this.upvoteCount - this.downvoteCount;
});

answerSchema.index({ question: 1, createdAt: 1 });

module.exports = mongoose.model("Answer", answerSchema);
