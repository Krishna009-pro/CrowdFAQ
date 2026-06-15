const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const Answer = require("../models/Answer");

// Mock Gemini SDK
jest.mock("@google/generative-ai", () => {
  return require("./mocks/geminiMock");
});

// Mock Auth Middleware
jest.mock("../middleware/authMiddleware", () => {
  return {
    protect: (req, res, next) => {
      req.user = { _id: new mongoose.Types.ObjectId(), displayName: "Test User" };
      next();
    },
  };
});

describe("RAG Chatbot Integration Tests", () => {
  it("POST /api/v1/chatbot/query should return AI answer if context is found", async () => {
    const authorId = new mongoose.Types.ObjectId();

    // Seed data
    const question = await Question.create({
      title: "How to apply for scholarships?",
      body: "What are the rules and dates for scholarships?",
      author: authorId,
      embedding: new Array(384).fill(0.1),
    });

    await Answer.create({
      question: question._id,
      body: "Go to the scholarship office on the main campus and submit form B.",
      author: authorId,
    });

    const res = await request(app)
      .post("/api/v1/chatbot/query")
      .send({ query: "scholarships" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("answer");
    expect(res.body.data.answer).toContain("grounded in the provided context");
  });

  it("POST /api/v1/chatbot/query should return 'No relevant information found.' if database is empty", async () => {
    const res = await request(app)
      .post("/api/v1/chatbot/query")
      .send({ query: "how to play soccer" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBe("No relevant information found.");
  });
});
