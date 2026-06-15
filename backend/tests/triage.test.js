const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const { generateEmbedding } = require("../services/openaiService");

// Mock the OpenAI service
jest.mock("../services/openaiService", () => ({
  generateEmbedding: jest.fn(),
  generateProvisionalDraft: jest.fn()
}));

// Mock the Auth Middleware to bypass auth for testing
// We must mock the entire module to export a 'protect' function
jest.mock("../middleware/authMiddleware", () => {
  const mongoose = require("mongoose");
  return {
    protect: (req, res, next) => {
      req.user = { _id: new mongoose.Types.ObjectId(), displayName: "Test User" };
      next();
    }
  };
});

describe("Triage Integration Tests", () => {
  beforeAll(async () => {
    // Avoid connecting to real mongo if we can, 
    // but app.js currently does it on require.
    // In a real Staff Engineer scenario, we'd refactor app/server separation properly.
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("GET /api/v1/search should return allow_post when no matches found", async () => {
    // MongoDB Atlas Cosine similarity fails on zero vectors.
    // Use a small non-zero vector for testing.
    const mockVector = new Array(1536).fill(0);
    mockVector[0] = 0.1;
    generateEmbedding.mockResolvedValue(mockVector);

    const res = await request(app)
      .get("/api/v1/search")
      .query({ q: "how to install node" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.action).toBe("allow_post");
    expect(res.body.data).toHaveProperty("matches");
  });

  it("GET /api/v1/search should return 400 if query is missing", async () => {
    const res = await request(app).get("/api/v1/search");
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
