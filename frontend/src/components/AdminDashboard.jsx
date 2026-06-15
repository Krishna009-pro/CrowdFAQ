import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  MoreVertical,
  Edit3,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../api/client";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [answerBody, setAnswerBody] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState("");

  useEffect(() => {
    // Check if admin is logged in
    const adminSession = localStorage.getItem("adminSession");
    if (!adminSession) {
      navigate("/admin");
      return;
    }

    const session = JSON.parse(adminSession);
    setAdminEmail(session.email);

    // Fetch all questions
    fetchQuestions();
  }, [navigate]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("questions?limit=200");
      const allQuestions = response.data.data?.questions || [];
      setQuestions(allQuestions);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    navigate("/admin");
  };

  const handleCreateOfficialAnswer = async () => {
    if (!answerBody.trim()) {
      setAnswerError("Answer cannot be empty");
      return;
    }

    try {
      setIsSubmittingAnswer(true);
      setAnswerError("");
      
      await apiClient.post("/answers/official/create", {
        questionId: selectedQuestion._id,
        body: answerBody,
      });

      // Refresh questions
      await fetchQuestions();
      
      // Close modal and reset form
      setSelectedQuestion(null);
      setAnswerBody("");
    } catch (error) {
      setAnswerError(
        error.response?.data?.error?.message || "Failed to create answer"
      );
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-200 border-emerald-500/20";
      case "answered":
        return "bg-blue-500/10 text-blue-200 border-blue-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-200 border-yellow-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-200 border-zinc-500/20";
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || q.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-sky-100 to-amber-100 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-xs text-zinc-500">
              Manage questions, answers, and user support
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{adminEmail}</p>
              <p className="text-xs text-zinc-500">Vicharanashala Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[
            {
              label: "Total Questions",
              value: questions.length,
              icon: MessageSquare,
              color: "from-blue-500/20 to-cyan-500/10",
            },
            {
              label: "Pending",
              value: questions.filter((q) => q.status === "pending").length,
              icon: AlertCircle,
              color: "from-yellow-500/20 to-orange-500/10",
            },
            {
              label: "Answered",
              value: questions.filter((q) => q.status === "answered").length,
              icon: CheckCircle,
              color: "from-emerald-500/20 to-green-500/10",
            },
            {
              label: "Resolved",
              value: questions.filter((q) => q.status === "resolved").length,
              icon: CheckCircle,
              color: "from-sky-500/20 to-blue-500/10",
            },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-xl border border-zinc-800 bg-linear-to-br ${stat.color} p-6`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 opacity-50" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="Search questions or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-sm text-white focus:border-sky-500/50 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="answered">Answered</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredQuestions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center"
                >
                  <p className="text-zinc-500">No questions found</p>
                </motion.div>
              ) : (
                filteredQuestions.map((question, idx) => (
                  <motion.div
                    key={question._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => setSelectedQuestion(question)}
                    className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-sky-500/30 hover:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border ${getStatusColor(
                              question.status
                            )}`}
                          >
                            {question.status}
                          </span>
                          {question.answerCount > 0 && (
                            <span className="text-xs text-zinc-500">
                              {question.answerCount} answer
                              {question.answerCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-sky-200 transition">
                          {question.title}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
                          {question.body}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                          <span>
                            By: <span className="text-zinc-300">{question.author?.displayName || "Anonymous"}</span>
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(question.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 text-zinc-600 transition hover:border-sky-500/30 hover:text-sky-200">
                        <Edit3 className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Question Detail Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedQuestion(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-8"
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold border mb-2 ${getStatusColor(
                      selectedQuestion.status
                    )}`}
                  >
                    {selectedQuestion.status}
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedQuestion.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-zinc-300">
                <div>
                  <p className="text-sm font-semibold text-zinc-400 mb-1">
                    Question
                  </p>
                  <p className="text-base leading-relaxed">
                    {selectedQuestion.body}
                  </p>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-sm font-semibold text-zinc-400 mb-2">
                    User Information
                  </p>
                  <p>
                    <span className="text-zinc-500">Name:</span>{" "}
                    {selectedQuestion.author?.displayName || "Anonymous"}
                  </p>
                  <p>
                    <span className="text-zinc-500">Email:</span>{" "}
                    {selectedQuestion.author?.email || "N/A"}
                  </p>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-sm font-semibold text-zinc-400 mb-3">
                    Create Official Answer
                  </p>
                  <textarea
                    value={answerBody}
                    onChange={(e) => setAnswerBody(e.target.value)}
                    placeholder="Write an official answer from Vicharanashala System..."
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none resize-none h-32"
                  />
                  {answerError && (
                    <p className="mt-2 text-sm text-red-400">{answerError}</p>
                  )}
                  <button 
                    onClick={handleCreateOfficialAnswer}
                    disabled={isSubmittingAnswer}
                    className="w-full mt-3 rounded-lg bg-linear-to-r from-sky-500/30 to-amber-500/20 px-4 py-3 font-semibold text-sky-200 transition hover:from-sky-500/40 hover:to-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingAnswer ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Answer...
                      </div>
                    ) : (
                      "Create Official Answer"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
