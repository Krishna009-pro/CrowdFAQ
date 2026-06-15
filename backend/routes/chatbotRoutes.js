const express = require("express");
const { queryChatbot } = require("../controllers/chatbotController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Route: POST /api/v1/chatbot/query (or POST /api/v1/chatbot)
router.post("/query", protect, queryChatbot);
router.post("/", protect, queryChatbot);

module.exports = router;
