const Report = require("../models/Report");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const User = require("../models/User");

/**
 * Creates a moderation report for a Question or an Answer.
 */
const reportContent = async ({ reporterId, contentType, contentId, reason, additionalInfo }) => {
  // Validate content exists
  if (contentType === "Question") {
    const question = await Question.findById(contentId);
    if (!question) throw new Error("Question not found.");
    
    // Update Question flags
    question.isReported = true;
    question.reportReason = reason;
    await question.save();
  } else if (contentType === "Answer") {
    const answer = await Answer.findById(contentId);
    if (!answer) throw new Error("Answer not found.");
    
    // Update Answer flags
    answer.isReported = true;
    answer.reportReason = reason;
    await answer.save();
  } else {
    throw new Error("Invalid content type. Must be 'Question' or 'Answer'.");
  }

  const report = await Report.create({
    reporter: reporterId,
    contentType,
    contentId,
    reason,
    additionalInfo,
  });

  return report;
};

/**
 * Retrieves all reports. Can filter by status.
 */
const getReports = async (status = "pending") => {
  return await Report.find({ status })
    .populate("reporter", "displayName email role")
    .sort({ createdAt: -1 });
};

/**
 * Dismisses a report without taking any hiding actions.
 */
const dismissReport = async (reportId, resolverId) => {
  const report = await Report.findById(reportId);
  if (!report) throw new Error("Report not found.");

  report.status = "resolved";
  report.actionTaken = "dismiss";
  report.resolvedBy = resolverId;
  report.resolvedAt = new Date();
  await report.save();

  // Reset the reported flags on the content itself
  if (report.contentType === "Question") {
    await Question.findByIdAndUpdate(report.contentId, {
      isReported: false,
      reportReason: "",
    });
  } else if (report.contentType === "Answer") {
    await Answer.findByIdAndUpdate(report.contentId, {
      isReported: false,
      reportReason: "",
    });
  }

  return report;
};

/**
 * Resolves a report and hides the target content.
 */
const hideContent = async (reportId, resolverId) => {
  const report = await Report.findById(reportId);
  if (!report) throw new Error("Report not found.");

  report.status = "resolved";
  report.actionTaken = "hide";
  report.resolvedBy = resolverId;
  report.resolvedAt = new Date();
  await report.save();

  if (report.contentType === "Question") {
    await Question.findByIdAndUpdate(report.contentId, {
      isHidden: true,
      status: "closed",
    });
  } else if (report.contentType === "Answer") {
    await Answer.findByIdAndUpdate(report.contentId, {
      isHidden: true,
    });
  }

  return report;
};

/**
 * Suspends a user and updates their status.
 */
const suspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found.");

  user.isSuspended = true;
  await user.save();

  // Optionally: hide all posts/answers by suspended users, but simple suspension is requested.
  return user;
};

module.exports = {
  reportContent,
  getReports,
  dismissReport,
  hideContent,
  suspendUser,
};
