const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    // Short searchable heading shown in feeds and search results.
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 180,
    },
    // Full question details provided by the author.
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },
    // User who asked the question.
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Normalized topic labels used for filtering and discovery.
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    // Embedding vector used by Atlas Vector Search for semantic matching.
    embedding: {
      type: [Number],
      default: [],
      validate: {
        validator(value) {
          return value.length === 0 || value.length === 1536 || value.length === 384;
        },
        message: "Question embedding must contain 1536 or 384 dimensions",
      },
    },
    // AI-generated summary of the question's answer thread.
    aiSummary: {
      type: String,
      default: "",
    },
    // Moderation fields
    isReported: {
      type: Boolean,
      default: false,
      index: true,
    },
    reportReason: {
      type: String,
      default: "",
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Points to an existing question when this question is marked as a duplicate.
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
      index: true,
    },
    // Accepted/best answer selected by author, moderator, or admin.
    acceptedAnswerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      default: null,
      index: true,
    },
    // Cached upvote count for quick feed sorting and display.
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Cached downvote count for quick feed sorting and display.
    downvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Similarity score used when linking duplicate/similar questions.
    duplicateScore: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
    // Workflow state for feed filters, moderation, and resolved question tracking.
    status: {
      type: String,
      enum: [
        "pending",
        "answered",
        "verified",
        "resolved",
        "duplicate",
        "closed",
      ],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Supports cursor pagination ordered by newest questions first.
questionSchema.index({ createdAt: -1, _id: -1 });

// Virtual relationship for populating all answers attached to this question.
questionSchema.virtual("answers", {
  ref: "Answer",
  localField: "_id",
  foreignField: "question",
});

module.exports = mongoose.model("Question", questionSchema);
