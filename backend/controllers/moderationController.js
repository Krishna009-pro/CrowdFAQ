const moderationService = require("../services/moderationService");
const Report = require("../models/Report");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Creates a moderation report.
 * Route: POST /api/v1/moderation/report
 */
const createReport = asyncHandler(async (req, res, next) => {
  const { contentType, contentId, reason, additionalInfo } = req.body;
  const reporterId = req.user._id;

  if (!contentType || !contentId || !reason) {
    return res.status(400).json({
      success: false,
      error: {
        message: "contentType, contentId, and reason are required.",
      },
    });
  }

  const report = await moderationService.reportContent({
    reporterId,
    contentType,
    contentId,
    reason,
    additionalInfo,
  });

  return res.status(201).json({
    success: true,
    data: {
      report,
    },
  });
});

/**
 * Gets all reports (filtered by status, default is pending).
 * Route: GET /api/v1/moderation/reports
 */
const getReports = asyncHandler(async (req, res, next) => {
  const { status = "pending" } = req.query;
  const reports = await moderationService.getReports(status);

  return res.status(200).json({
    success: true,
    data: {
      reports,
    },
  });
});

/**
 * Handles actions on a report (dismiss, hide, suspend).
 * Route: PATCH /api/v1/moderation/reports/:id
 */
const updateReportStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { action } = req.body;
  const resolverId = req.user._id;

  if (!action) {
    return res.status(400).json({
      success: false,
      error: {
        message: "action (dismiss, hide, suspend) is required.",
      },
    });
  }

  const report = await Report.findById(id);
  if (!report) {
    return res.status(404).json({
      success: false,
      error: {
        message: "Report not found.",
      },
    });
  }

  let updatedReport;
  if (action === "dismiss") {
    updatedReport = await moderationService.dismissReport(id, resolverId);
  } else if (action === "hide") {
    updatedReport = await moderationService.hideContent(id, resolverId);
  } else if (action === "suspend") {
    // Suspend the author of the reported content
    let authorId;
    if (report.contentType === "Question") {
      const q = await Question.findById(report.contentId);
      if (q) authorId = q.author;
    } else if (report.contentType === "Answer") {
      const a = await Answer.findById(report.contentId);
      if (a) authorId = a.author;
    }

    if (!authorId) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Could not find the author of the reported content to suspend.",
        },
      });
    }

    await moderationService.suspendUser(authorId);
    // Also hide the content for safety
    await moderationService.hideContent(id, resolverId);
    
    report.status = "resolved";
    report.actionTaken = "suspend";
    report.resolvedBy = resolverId;
    report.resolvedAt = new Date();
    updatedReport = await report.save();
  } else {
    return res.status(400).json({
      success: false,
      error: {
        message: "Invalid action. Must be 'dismiss', 'hide', or 'suspend'.",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      report: updatedReport,
    },
  });
});

/**
 * Controller mapping for individual POST endpoints
 */
const dismissReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.body;
  const resolverId = req.user._id;

  if (!reportId) {
    return res.status(400).json({
      success: false,
      error: { message: "reportId is required." },
    });
  }

  const report = await moderationService.dismissReport(reportId, resolverId);
  return res.status(200).json({ success: true, data: { report } });
});

const hideContent = asyncHandler(async (req, res, next) => {
  const { reportId } = req.body;
  const resolverId = req.user._id;

  if (!reportId) {
    return res.status(400).json({
      success: false,
      error: { message: "reportId is required." },
    });
  }

  const report = await moderationService.hideContent(reportId, resolverId);
  return res.status(200).json({ success: true, data: { report } });
});

const suspendUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: { message: "userId is required." },
    });
  }

  const user = await moderationService.suspendUser(userId);
  return res.status(200).json({ success: true, data: { user } });
});

module.exports = {
  createReport,
  getReports,
  updateReportStatus,
  dismissReport,
  hideContent,
  suspendUser,
};
