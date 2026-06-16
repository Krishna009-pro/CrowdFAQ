const mongoose = require("mongoose");

const Question = require("../models/Question");
const Answer = require("../models/Answer");
const {
  generateEmbedding,
  generateProvisionalDraft,
} = require("../services/openaiService");

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 200;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a Mongoose filter object from query params.
 * Supports: cursor (pagination), tag, status, search (text match).
 */
const buildQuestionFilter = ({ cursor, tag, status, search }) => {
  const filter = {};

  // Status filter
  if (status) {
    filter.status = status;
  } else {
    // Default: hide terminal states from the community feed
    filter.status = { $nin: ["closed", "duplicate"] };
  }

  // Tag filter
  if (tag) {
    filter.tags = tag;
  }

  // Basic text search on title + body (no Atlas Search required)
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { body:  { $regex: search, $options: "i" } },
    ];
  }

  // Cursor-based pagination (keyset on _id)
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      const error = new Error("Invalid cursor");
      error.statusCode = 400;
      throw error;
    }
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  return filter;
};

/**
 * Resolve sort order from a ?sort= query param.
 * Supported values: newest (default), oldest, votes
 */
const buildSortOrder = (sort) => {
  switch (sort) {
    case "oldest": return { _id: 1 };
    case "votes":  return { upvoteCount: -1, _id: -1 };
    default:       return { _id: -1 }; // newest first
  }
};

// ─── Background AI Draft ─────────────────────────────────────────────────────

const createAiDraftForQuestion = async (question) => {
  try {
    const draft = await generateProvisionalDraft({
      title: question.title,
      body:  question.body,
      tags:  question.tags,
    });

    await Answer.create({
      question:    question._id,
      body:        draft,
      aiGenerated: true,
    });
  } catch (error) {
    console.error(
      `Failed to generate provisional draft for question ${question._id}`,
      error.message
    );
  }
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/questions
 * Create a new question. Embedding is generated inline; AI draft fires in background.
 */
const createQuestion = async (req, res, next) => {
  try {
    const { title, body, tags = [] } = req.body;
    const authorId = req.user._id;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: { message: "title and body are required" },
      });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : [];

    // Embedding — failure is non-blocking
    let embedding = [];
    try {
      embedding = await generateEmbedding(`${title} ${body}`);
    } catch (openAiError) {
      console.warn(
        "OpenAI Embedding failed during question creation. Saving without embedding.",
        openAiError.message
      );
    }

    const question = await Question.create({
      title,
      body,
      author: authorId,
      tags:   normalizedTags,
      embedding,
    });

    const responseQuestion = question.toObject();
    delete responseQuestion.embedding;

    // Fire-and-forget AI draft
    setImmediate(() => createAiDraftForQuestion(question));

    return res.status(201).json({
      success: true,
      data: { question: responseQuestion },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/questions
 * List questions with filters, sorting, and cursor pagination.
 *
 * Query params:
 *   limit    – page size (1–200, default 20)
 *   cursor   – last _id from previous page
 *   tag      – filter by tag
 *   status   – filter by status (pending | answered | verified | resolved | duplicate | closed)
 *   search   – case-insensitive substring match on title/body
 *   sort     – newest (default) | oldest | votes
 */
const getQuestions = async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT;
    const limit  = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_LIMIT);
    const cursor = req.query.cursor ? String(req.query.cursor) : null;
    const tag    = req.query.tag    ? String(req.query.tag)    : null;
    const status = req.query.status ? String(req.query.status) : null;
    const search = req.query.search ? String(req.query.search) : null;
    const sort   = req.query.sort   ? String(req.query.sort)   : "newest";

    const filter    = buildQuestionFilter({ cursor, tag, status, search });
    const sortOrder = buildSortOrder(sort);

    // Single aggregation pipeline — avoids N+1 answerCount queries
    const pipeline = [
      { $match: filter },
      { $sort: sortOrder },
      { $limit: limit + 1 }, // fetch one extra to determine hasMore
      {
        $lookup: {
          from:         "users",
          localField:   "author",
          foreignField: "_id",
          as:           "author",
          pipeline: [
            { $project: { displayName: 1, role: 1, reputationScore: 1 } },
          ],
        },
      },
      { $unwind: { path: "$author", preserveNullAndEmpty: true } },
      {
        $lookup: {
          from:         "answers",
          localField:   "_id",
          foreignField: "question",
          as:           "_answers",
        },
      },
      {
        $addFields: {
          answerCount: { $size: "$_answers" },
        },
      },
      {
        $project: {
          embedding: 0, // never send embedding to clients
          _answers:  0, // internal lookup array
        },
      },
    ];

    const questions = await Question.aggregate(pipeline);

    const hasMore   = questions.length > limit;
    const pageItems = hasMore ? questions.slice(0, limit) : questions;
    const nextCursor = hasMore
      ? pageItems[pageItems.length - 1]._id.toString()
      : null;

    return res.status(200).json({
      success: true,
      data: {
        questions: pageItems,
        pagination: { limit, nextCursor, hasMore },
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/v1/questions/:id
 * Fetch a single question with its answers (accepted first).
 */
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Question id must be a valid MongoDB ObjectId" },
      });
    }

    const question = await Question.findById(id)
      .select("-embedding")
      .populate("author", "displayName role reputationScore")
      .populate({
        path:    "answers",
        options: { sort: { isAccepted: -1, createdAt: 1 } },
        populate: {
          path:   "author",
          select: "displayName role reputationScore",
        },
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: { message: "Question not found" },
      });
    }

    return res.status(200).json({
      success: true,
      data: { question },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/questions/:id
 * Edit a question's title, body, or tags.
 * Only the original author OR an admin/moderator can edit.
 * Questions in terminal states (resolved, closed, duplicate) cannot be edited.
 */
const editQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Question id must be a valid MongoDB ObjectId" },
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { message: "Question not found" },
      });
    }

    // Authorisation: author or staff only
    const isAuthor = question.author.toString() === req.user._id.toString();
    const isStaff  = ["admin", "moderator"].includes(req.user.role);
    if (!isAuthor && !isStaff) {
      return res.status(403).json({
        success: false,
        error: { message: "Not authorised to edit this question" },
      });
    }

    // Block edits on terminal states
    const terminalStates = ["resolved", "closed", "duplicate"];
    if (terminalStates.includes(question.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot edit a question with status '${question.status}'`,
        },
      });
    }

    // Apply updates
    if (title !== undefined) question.title = title;
    if (body  !== undefined) question.body  = body;
    if (tags  !== undefined) {
      question.tags = Array.isArray(tags)
        ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
        : [];
    }

    // Re-generate embedding in background if content changed
    if (title !== undefined || body !== undefined) {
      setImmediate(async () => {
        try {
          const newEmbedding = await generateEmbedding(
            `${question.title} ${question.body}`
          );
          await Question.findByIdAndUpdate(id, { embedding: newEmbedding });
        } catch (err) {
          console.warn("Re-embedding failed after edit:", err.message);
        }
      });
    }

    await question.save();

    const responseQuestion = question.toObject();
    delete responseQuestion.embedding;

    return res.status(200).json({
      success: true,
      data: { question: responseQuestion },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/v1/questions/:id
 * Soft-delete by setting status → "closed".
 * Hard-delete only for admins when ?hard=true is passed.
 * Only the original author (soft) or admin (hard) can delete.
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hard === "true" && req.user.role === "admin";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: "Question id must be a valid MongoDB ObjectId" },
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: { message: "Question not found" },
      });
    }

    const isAuthor = question.author.toString() === req.user._id.toString();
    const isAdmin  = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: "Not authorised to delete this question" },
      });
    }

    if (hardDelete) {
      // Hard delete: remove question + all its answers
      await Answer.deleteMany({ question: id });
      await question.deleteOne();

      return res.status(200).json({
        success: true,
        data: { message: "Question permanently deleted" },
      });
    }

    // Soft delete: close the question
    question.status = "closed";
    await question.save();

    return res.status(200).json({
      success: true,
      data: { message: "Question closed successfully" },
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  editQuestion,
  deleteQuestion,
};
