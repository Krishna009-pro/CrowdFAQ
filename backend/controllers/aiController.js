const duplicateDetectionService = require("../services/duplicateDetectionService");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Endpoint for duplicate question check.
 * Route: POST /api/v1/ai/check-duplicate
 */
const checkDuplicate = asyncHandler(async (req, res, next) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Title is required for duplicate checking.",
      },
    });
  }

  const result = await duplicateDetectionService.checkDuplicates(title);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  checkDuplicate,
};
