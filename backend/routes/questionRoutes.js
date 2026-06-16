const express = require("express");

const {
  createQuestion,
  getQuestions,
  getQuestionById,
  editQuestion,
  deleteQuestion,
} = require("../controllers/questionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET  /api/v1/questions          – list with filters, sort, pagination
// POST /api/v1/questions          – create a new question (auth required)
router.get("/", getQuestions);
router.post("/", protect, createQuestion);

// GET    /api/v1/questions/:id    – fetch single question + answers
// PATCH  /api/v1/questions/:id    – edit question (auth required)
// DELETE /api/v1/questions/:id    – close/delete question (auth required)
router.get("/:id", getQuestionById);
router.patch("/:id", protect, editQuestion);
router.delete("/:id", protect, deleteQuestion);

module.exports = router;
