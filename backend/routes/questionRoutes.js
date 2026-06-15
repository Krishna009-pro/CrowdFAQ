const express = require("express");

const {
  createQuestion,
  getQuestions,
  getQuestionById,
} = require("../controllers/questionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createQuestion);
router.get("/", getQuestions);
router.get("/:id", getQuestionById);

module.exports = router;
