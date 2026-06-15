const express = require("express");
const {
  createReport,
  getReports,
  updateReportStatus,
  dismissReport,
  hideContent,
  suspendUser,
} = require("../controllers/moderationController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeModeratorOrAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

// Any authenticated user can report content
router.post("/report", protect, createReport);
router.post("/", protect, createReport); // Fallback standard route

// Only moderators or admins can view, resolve, or act on reports
router.get("/reports", protect, authorizeModeratorOrAdmin, getReports);
router.get("/", protect, authorizeModeratorOrAdmin, getReports); // Fallback standard route

router.patch("/reports/:id", protect, authorizeModeratorOrAdmin, updateReportStatus);
router.patch("/:id", protect, authorizeModeratorOrAdmin, updateReportStatus); // Fallback standard route

// Individual POST actions for specific workflows
router.post("/dismiss", protect, authorizeModeratorOrAdmin, dismissReport);
router.post("/hide", protect, authorizeModeratorOrAdmin, hideContent);
router.post("/suspend", protect, authorizeModeratorOrAdmin, suspendUser);

module.exports = router;
