const express = require("express");

const {
  createAnswer,
  editAnswer,
  deleteAnswer,
  acceptAnswer,
  voteAnswer,
  createOfficialAnswer,
} = require("../controllers/answerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createAnswer);
router.post("/official/create", protect, createOfficialAnswer);
router.patch("/:id", protect, editAnswer);
router.delete("/:id", protect, deleteAnswer);
router.patch("/:id/accept", protect, acceptAnswer);
router.post("/:id/vote", protect, voteAnswer);

module.exports = router;
