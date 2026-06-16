const cookieParser = require("cookie-parser");
const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const userId = "507f1f77bcf86cd799439011";
const otherUserId = "507f1f77bcf86cd799439012";
const adminId = "507f1f77bcf86cd799439013";
const questionId = "507f1f77bcf86cd799439014";

jest.mock("../middleware/authMiddleware", () => ({
  protect: (req, res, next) => {
    if (req.headers["x-unauthorized"] === "true") {
      const err = new Error("Not authorized to access this route");
      err.statusCode = 401;
      return next(err);
    }
    req.user = {
      _id: req.headers["x-user-id"] || userId,
      role: req.headers["x-user-role"] || "student",
    };
    next();
  },
}));

jest.mock("../models/Question");
jest.mock("../services/openaiService", () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  generateProvisionalDraft: jest.fn(),
}));

const Question = require("../models/Question");
const questionRoutes = require("../routes/questionRoutes");
const { errorHandler } = require("../middleware/errorHandler");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, res, next) => {
    req.app.set("io", {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    });
    next();
  });
  app.use("/api/v1/questions", questionRoutes);
  app.use(errorHandler);
  return app;
};

const buildQuestion = (overrides = {}) => {
  const q = {
    _id: questionId,
    title: "How to run jest tests on windows",
    body: "I am having difficulty setting up cross-env and jest.",
    author: userId,
    tags: ["node", "jest"],
    embedding: new Array(1536).fill(0.1),
    status: "pending",
    upvoteCount: 0,
    downvoteCount: 0,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  q.toObject = jest.fn().mockReturnValue({
    _id: q._id,
    title: q.title,
    body: q.body,
    author: q.author,
    tags: q.tags,
    status: q.status,
    upvoteCount: q.upvoteCount,
    downvoteCount: q.downvoteCount,
  });
  return q;
};

describe("Question API", () => {
  let app;

  beforeEach(() => {
    process.env.NODE_ENV = "test";
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe("GET /api/v1/questions", () => {
    it("returns questions and consistent cursor pagination metadata", async () => {
      const mockQuestions = [
        {
          _id: questionId,
          title: "Test question 1",
          body: "Body of test question 1",
          author: { _id: userId, displayName: "User 1", role: "student" },
          tags: ["node"],
          status: "pending",
          upvoteCount: 5,
          answerCount: 2,
        },
      ];

      Question.aggregate.mockResolvedValue([
        {
          metadata: [{ total: 10 }],
          data: mockQuestions,
        },
      ]);

      const res = await request(app).get("/api/v1/questions?limit=5&sortBy=popular");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questions).toHaveLength(1);
      expect(res.body.data.pagination).toEqual({
        limit: 5,
        nextCursor: null,
        hasMore: false,
        totalCount: 10,
      });

      // Verify embedding vector is not returned
      expect(res.body.data.questions[0].embedding).toBeUndefined();
    });

    it("filters and sorts correctly", async () => {
      Question.aggregate.mockResolvedValue([
        {
          metadata: [{ total: 0 }],
          data: [],
        },
      ]);

      const res = await request(app)
        .get("/api/v1/questions")
        .query({
          status: "answered",
          tag: "react",
          search: "hooks",
          sortBy: "latest",
        });

      expect(res.statusCode).toBe(200);
      expect(Question.aggregate).toHaveBeenCalled();
      const pipeline = Question.aggregate.mock.calls[0][0];

      // Check base filter structure
      const matchStage = pipeline.find((stage) => stage.$match);
      expect(matchStage.$match.status).toBe("answered");
      expect(matchStage.$match.tags).toBe("react");
      expect(matchStage.$match.$or).toBeDefined();
    });

    it("returns 400 for invalid status query", async () => {
      const res = await request(app).get("/api/v1/questions?status=invalid_status");
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/v1/questions/:id", () => {
    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app)
        .patch(`/api/v1/questions/${questionId}`)
        .set("x-unauthorized", "true")
        .send({ title: "New title details here" });

      expect(res.statusCode).toBe(401);
    });

    it("returns 403 when user is not the author, mod, or admin", async () => {
      const question = buildQuestion({ author: otherUserId });
      Question.findById.mockResolvedValue(question);

      const res = await request(app)
        .patch(`/api/v1/questions/${questionId}`)
        .set("x-user-id", userId)
        .set("x-user-role", "student")
        .send({ title: "Updated Title By Stranger" });

      expect(res.statusCode).toBe(403);
    });

    it("allows the author to edit question details", async () => {
      const question = buildQuestion({ author: userId });
      Question.findById.mockResolvedValue(question);

      const res = await request(app)
        .patch(`/api/v1/questions/${questionId}`)
        .set("x-user-id", userId)
        .set("x-user-role", "student")
        .send({
          title: "Updated title with sufficient length",
          body: "Updated body with sufficient length",
          tags: ["jest", "testing"],
        });

      expect(res.statusCode).toBe(200);
      expect(question.title).toBe("Updated title with sufficient length");
      expect(question.body).toBe("Updated body with sufficient length");
      expect(question.tags).toEqual(["jest", "testing"]);
      expect(question.save).toHaveBeenCalled();
    });

    it("allows admin/moderator to edit question details", async () => {
      const question = buildQuestion({ author: userId });
      Question.findById.mockResolvedValue(question);

      const res = await request(app)
        .patch(`/api/v1/questions/${questionId}`)
        .set("x-user-id", otherUserId)
        .set("x-user-role", "admin")
        .send({
          title: "Admin updated title length is long",
        });

      expect(res.statusCode).toBe(200);
      expect(question.title).toBe("Admin updated title length is long");
      expect(question.save).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/v1/questions/:id", () => {
    it("returns 403 when non-authorized user tries to close the question", async () => {
      const question = buildQuestion({ author: otherUserId });
      Question.findById.mockResolvedValue(question);

      const res = await request(app)
        .delete(`/api/v1/questions/${questionId}`)
        .set("x-user-id", userId)
        .set("x-user-role", "student");

      expect(res.statusCode).toBe(403);
    });

    it("soft deletes (closes) the question when requested by author", async () => {
      const question = buildQuestion({ author: userId, status: "pending" });
      Question.findById.mockResolvedValue(question);

      const res = await request(app)
        .delete(`/api/v1/questions/${questionId}`)
        .set("x-user-id", userId)
        .set("x-user-role", "student");

      expect(res.statusCode).toBe(200);
      expect(question.status).toBe("closed");
      expect(question.save).toHaveBeenCalled();
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("closed successfully");
    });

    it("soft deletes (closes) the question when requested by moderator/admin", async () => {
      const question = buildQuestion({ author: userId, status: "pending" });
      Question.findById.mockResolvedValue(question);

      const res = await request(app)
        .delete(`/api/v1/questions/${questionId}`)
        .set("x-user-id", otherUserId)
        .set("x-user-role", "moderator");

      expect(res.statusCode).toBe(200);
      expect(question.status).toBe("closed");
      expect(question.save).toHaveBeenCalled();
    });
  });
});
