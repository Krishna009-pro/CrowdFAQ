const mongoose = require("mongoose");

const Question = require("../models/Question");
const Answer = require("../models/Answer");
const {
  generateEmbedding,
  generateProvisionalDraft,
} = require("../services/openaiService");

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 200;

const buildOpenQuestionFilter = (cursor, tag) => {
  const filter = {};

  if (tag) {
    filter.tags = tag;
  } else {
    // Default: show questions that are not in terminal states
    // OR show any question for the community feed
    filter.status = {
      $nin: ["resolved", "closed", "duplicate"],
    };
  }

  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      const error = new Error("Invalid cursor");
      error.statusCode = 400;
      throw error;
    }

    filter._id = {
      $lt: new mongoose.Types.ObjectId(cursor),
    };
  }

  return filter;
};

const createAiDraftForQuestion = async (question) => {
  try {
    const draft = await generateProvisionalDraft({
      title: question.title,
      body: question.body,
      tags: question.tags,
    });

    await Answer.create({
      question: question._id,
      body: draft,
      aiGenerated: true,
    });
  } catch (error) {
    console.error(
      `Failed to generate provisional draft for question ${question._id}`,
      error.message
    );
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { title, body, tags = [] } = req.body;
    const authorId = req.user._id;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: {
          message: "title and body are required",
        },
      });
    }

    const normalizedTags = Array.isArray(tags)
      ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
      : [];

    let embedding = [];
    try {
      embedding = await generateEmbedding(`${title} ${body}`);
    } catch (openAiError) {
      console.warn("OpenAI Embedding failed during question creation. Saving without embedding.", openAiError.message);
      // We allow the question to be saved even if embedding fails so we don't block the user.
      // It just won't be searchable via vector search until re-indexed.
    }

    const question = await Question.create({
      title,
      body,
      author: authorId,
      tags: normalizedTags,
      embedding,
    });
    const responseQuestion = question.toObject();
    delete responseQuestion.embedding;

    setImmediate(() => {
      createAiDraftForQuestion(question);
    });

    return res.status(201).json({
      success: true,
      data: {
        question: responseQuestion,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getQuestions = async (req, res, next) => {
  try {
    const requestedLimit =
      Number.parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_PAGE_LIMIT);
    const cursor = req.query.cursor ? String(req.query.cursor) : null;
    const tag = req.query.tag ? String(req.query.tag) : null;

    const questions = await Question.find(buildOpenQuestionFilter(cursor, tag))
      .select("-embedding")
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("author", "displayName role reputationScore")
      .lean();

    // Map to include answer count (could be optimized with aggregation)
    const questionsWithCount = await Promise.all(
      questions.map(async (q) => {
        const count = await Answer.countDocuments({ question: q._id });
        return { ...q, answerCount: count };
      })
    );

    const hasMore = questionsWithCount.length > limit;
    const pageItems = hasMore
      ? questionsWithCount.slice(0, limit)
      : questionsWithCount;
    const nextCursor = hasMore
      ? pageItems[pageItems.length - 1]._id.toString()
      : null;

    return res.status(200).json({
      success: true,
      data: {
        questions: pageItems,
        pagination: {
          limit,
          nextCursor,
          hasMore,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Question id must be a valid MongoDB ObjectId",
        },
      });
    }

    const question = await Question.findById(id)
      .select("-embedding")
      .populate("author", "displayName role reputationScore")
      .populate({
        path: "answers",
        options: {
          sort: { isAccepted: -1, createdAt: 1 },
        },
        populate: {
          path: "author",
          select: "displayName role reputationScore",
        },
      });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Question not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        question,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
};
