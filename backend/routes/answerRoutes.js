const express = require("express");

const {
  createAnswer,
  acceptAnswer,
  voteAnswer,
  createOfficialAnswer,
} = require("../controllers/answerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createAnswer);
router.patch("/:id/accept", protect, acceptAnswer);
router.post("/:id/vote", voteAnswer);
router.post("/official/create", protect, createOfficialAnswer);

module.exports = router;
