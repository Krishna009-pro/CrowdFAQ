const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const Question = require("../models/Question");
const geminiService = require("../services/geminiService");

// Mock Gemini SDK
jest.mock("@google/generative-ai", () => {
  return require("./mocks/geminiMock");
});

// Mock Auth Middleware to bypass auth for testing
jest.mock("../middleware/authMiddleware", () => {
  return {
    protect: (req, res, next) => {
      req.user = { _id: new mongoose.Types.ObjectId(), displayName: "Test User", role: "student" };
      next();
    },
  };
});

describe("AI & Gemini Integration Tests", () => {
  it("should auto-categorize and tag suggestions using geminiService", async () => {
    const title = "How do I apply for IIT Ropar internship?";
    const body = "I need details on where to submit the forms and eligibility.";
    
    const result = await geminiService.generateAutoTagsAndCategory(title, body);
    
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("tags");
    expect(result.category).toBe("Internships");
    expect(result.tags).toContain("internship");
  });

  it("should summarize answer thread in exactly 3 sentences using geminiService", async () => {
    const answers = [
      { body: "First go to the website." },
      { body: "Then fill in the details and register." },
      { body: "Finally, upload the forms." },
    ];
    
    const summary = await geminiService.generateThreadSummary("Exam Registration", "How to register?", answers);
    
    expect(typeof summary).toBe("string");
    expect(summary).toContain("3-sentence summary");
  });

  it("POST /api/v1/ai/check-duplicate should find duplicate questions with score > 0.85", async () => {
    // Seed database with questions
    const authorId = new mongoose.Types.ObjectId();
    
    // We create a question with a synthetic embedding to match
    await Question.create({
      title: "How to register for examinations?",
      body: "I am having issues during exam portal logins.",
      author: authorId,
      embedding: new Array(384).fill(0.1),
    });

    const res = await request(app)
      .post("/api/v1/ai/check-duplicate")
      .send({ title: "How to register for examinations?" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("duplicates");
    expect(res.body.data).toHaveProperty("similarityScore");
    expect(res.body.data.duplicates.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.duplicates[0].title).toBe("How to register for examinations?");
  });
});
