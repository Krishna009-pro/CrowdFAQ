const ragService = require("../services/ragService");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Handles RAG-based query processing for the chatbot.
 * Route: POST /api/v1/chatbot/query
 */
const queryChatbot = asyncHandler(async (req, res, next) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Query is required for chatbot lookup.",
      },
    });
  }

  const answer = await ragService.generateRAGAnswer(query);

  return res.status(200).json({
    success: true,
    data: {
      answer,
    },
  });
});

module.exports = {
  queryChatbot,
};
