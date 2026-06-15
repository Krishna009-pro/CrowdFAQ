const express = require("express");
const { checkDuplicate } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Route: POST /api/v1/ai/check-duplicate
router.post("/check-duplicate", protect, checkDuplicate);

module.exports = router;
