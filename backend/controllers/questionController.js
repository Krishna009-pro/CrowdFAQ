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
    const cursor = req.query.cursor ? String(req.query.cursor).trim() : null;
    const tag = req.query.tag ? String(req.query.tag).trim().toLowerCase() : null;
    const status = req.query.status ? String(req.query.status).trim() : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const sortBy = req.query.sortBy ? String(req.query.sortBy).trim() : "latest";

    // 1. Build base filter (filters that do NOT include the cursor)
    const baseFilter = {};

    if (tag) {
      baseFilter.tags = tag;
    }

    if (status) {
      const VALID_STATUSES = ["pending", "answered", "verified", "resolved", "duplicate", "closed"];
      if (VALID_STATUSES.includes(status)) {
        baseFilter.status = status;
      } else {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`,
          },
        });
      }
    } else {
      // Default behavior: if no status is specified and no tag is specified, exclude terminal states.
      if (!tag) {
        baseFilter.status = {
          $nin: ["resolved", "closed", "duplicate"],
        };
      }
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      baseFilter.$or = [
        { title: searchRegex },
        { body: searchRegex },
      ];
    }

    // 2. Determine Sort Field and Order
    let sortOption = {};
    if (sortBy === "popular") {
      sortOption = { upvoteCount: -1, _id: -1 };
    } else if (sortBy === "answered") {
      sortOption = { answerCount: -1, _id: -1 };
    } else if (sortBy === "unanswered") {
      sortOption = { answerCount: 1, _id: -1 };
    } else {
      // default: latest
      sortOption = { _id: -1 };
    }

    // 3. Build cursor filter (if cursor is provided)
    let cursorFilter = null;
    if (cursor) {
      if (mongoose.Types.ObjectId.isValid(cursor)) {
        if (sortBy === "latest") {
          cursorFilter = { _id: { $lt: new mongoose.Types.ObjectId(cursor) } };
        } else {
          return res.status(400).json({
            success: false,
            error: {
              message: "Invalid cursor format for selected sort",
            },
          });
        }
      } else {
        const parts = cursor.split("_");
        if (parts.length !== 2 || !mongoose.Types.ObjectId.isValid(parts[1])) {
          return res.status(400).json({
            success: false,
            error: {
              message: "Invalid cursor format",
            },
          });
        }
        const cursorId = new mongoose.Types.ObjectId(parts[1]);
        const cursorVal = Number.parseInt(parts[0], 10);
        if (Number.isNaN(cursorVal)) {
          return res.status(400).json({
            success: false,
            error: {
              message: "Invalid cursor value",
            },
          });
        }

        if (sortBy === "popular") {
          cursorFilter = {
            $or: [
              { upvoteCount: { $lt: cursorVal } },
              { upvoteCount: cursorVal, _id: { $lt: cursorId } },
            ],
          };
        } else if (sortBy === "answered") {
          cursorFilter = {
            $or: [
              { answerCount: { $lt: cursorVal } },
              { answerCount: cursorVal, _id: { $lt: cursorId } },
            ],
          };
        } else if (sortBy === "unanswered") {
          cursorFilter = {
            $or: [
              { answerCount: { $gt: cursorVal } },
              { answerCount: cursorVal, _id: { $lt: cursorId } },
            ],
          };
        } else {
          return res.status(400).json({
            success: false,
            error: {
              message: "Invalid cursor for selected sort",
            },
          });
        }
      }
    }

    // 4. Construct MongoDB Aggregation Pipeline
    const pipeline = [];

    // Match base filters (status, tag, search)
    pipeline.push({ $match: baseFilter });

    // Lookup to calculate answerCount dynamically (avoids N+1)
    pipeline.push(
      {
        $lookup: {
          from: "answers",
          let: { qId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$question", "$$qId"] } } },
            { $count: "count" }
          ],
          as: "answerCountArray",
        },
      },
      {
        $addFields: {
          answerCount: {
            $ifNull: [
              { $arrayElemAt: ["$answerCountArray.count", 0] },
              0,
            ],
          },
        },
      }
    );

    // Populate Author info
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorArray",
        },
      },
      {
        $addFields: {
          author: {
            $ifNull: [
              { $arrayElemAt: ["$authorArray", 0] },
              null,
            ],
          },
        },
      }
    );

    // Project fields to match the schema representation and exclude sensitive or unneeded ones
    pipeline.push({
      $project: {
        embedding: 0,
        answerCountArray: 0,
        authorArray: 0,
      },
    });

    pipeline.push({
      $addFields: {
        author: {
          $cond: {
            if: { $ne: ["$author", null] },
            then: {
              _id: "$author._id",
              displayName: "$author.displayName",
              role: "$author.role",
              reputationScore: "$author.reputationScore",
            },
            else: null,
          },
        },
      },
    });

    // 5. Facet for Paginated Data and Total Metadata
    const dataPipeline = [];
    if (cursorFilter) {
      dataPipeline.push({ $match: cursorFilter });
    }
    dataPipeline.push({ $sort: sortOption });
    dataPipeline.push({ $limit: limit + 1 });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: dataPipeline,
      },
    });

    const results = await Question.aggregate(pipeline);
    const totalCount = results[0]?.metadata[0]?.total || 0;
    const rawQuestions = results[0]?.data || [];

    // Map to regular objects and set id property for serialization consistency
    const questions = rawQuestions.map((q) => ({
      ...q,
      id: q._id.toString(),
    }));

    const hasMore = questions.length > limit;
    const pageItems = hasMore ? questions.slice(0, limit) : questions;

    let nextCursor = null;
    if (hasMore && pageItems.length > 0) {
      const lastItem = pageItems[pageItems.length - 1];
      if (sortBy === "latest") {
        nextCursor = lastItem._id.toString();
      } else if (sortBy === "popular") {
        nextCursor = `${lastItem.upvoteCount}_${lastItem._id}`;
      } else if (sortBy === "answered" || sortBy === "unanswered") {
        nextCursor = `${lastItem.answerCount}_${lastItem._id}`;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        questions: pageItems,
        pagination: {
          limit,
          nextCursor,
          hasMore,
          totalCount,
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

const editQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, body, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Question id must be a valid MongoDB ObjectId",
        },
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Question not found",
        },
      });
    }

    // Author, moderator, or admin can edit
    const isAuthor = question.author.toString() === req.user._id.toString();
    const isModOrAdmin = ["moderator", "admin"].includes(req.user.role);
    if (!isAuthor && !isModOrAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Not authorized to edit this question",
        },
      });
    }

    let needsEmbeddingUpdate = false;
    if (title !== undefined) {
      question.title = title;
      needsEmbeddingUpdate = true;
    }
    if (body !== undefined) {
      question.body = body;
      needsEmbeddingUpdate = true;
    }
    if (tags !== undefined) {
      question.tags = Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
        : [];
    }

    if (needsEmbeddingUpdate) {
      try {
        question.embedding = await generateEmbedding(`${question.title} ${question.body}`);
      } catch (openAiError) {
        console.warn("OpenAI Embedding failed during question update. Saving without embedding.", openAiError.message);
      }
    }

    await question.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`question_${id}`).emit("question_status_updated", {
        questionId: id,
        status: question.status,
      });
    }

    const responseQuestion = question.toObject();
    delete responseQuestion.embedding;

    return res.status(200).json({
      success: true,
      data: {
        question: responseQuestion,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
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

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Question not found",
        },
      });
    }

    // Author, moderator, or admin can close
    const isAuthor = question.author.toString() === req.user._id.toString();
    const isModOrAdmin = ["moderator", "admin"].includes(req.user.role);
    if (!isAuthor && !isModOrAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Not authorized to close this question",
        },
      });
    }

    // Soft delete: status = closed
    question.status = "closed";
    await question.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`question_${id}`).emit("question_status_updated", {
        questionId: id,
        status: "closed",
      });
    }

    const responseQuestion = question.toObject();
    delete responseQuestion.embedding;

    return res.status(200).json({
      success: true,
      message: "Question closed successfully",
      data: {
        question: responseQuestion,
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
  editQuestion,
  deleteQuestion,
};
