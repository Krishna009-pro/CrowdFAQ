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

router.post("/", protect, createQuestion);
router.get("/", getQuestions);
router.get("/:id", getQuestionById);
router.patch("/:id", protect, editQuestion);
router.delete("/:id", protect, deleteQuestion);

module.exports = router;
