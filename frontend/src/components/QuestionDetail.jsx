import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";

import apiClient from "../api/client";
import useStore from "../store/useStore";
import AnswerForm from "./AnswerForm";

const getAuthorLabel = (author) => {
  if (!author) {
    return "Anonymous";
  }

  if (typeof author === "string") {
    return author;
  }

  return author.displayName || author.email || "Anonymous";
};

const getAuthorId = (author) => {
  if (!author) {
    return "";
  }

  return typeof author === "string" ? author : author._id || author.id || "";
};

const getInitial = (author) => getAuthorLabel(author).slice(0, 1).toUpperCase();

const QuestionDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useStore((state) => state.user);
  const addNotification = useStore((state) => state.addNotification);
  const notifications = useStore((state) => state.notifications);
  const removeNotification = useStore((state) => state.removeNotification);
  const [question, setQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcceptingId, setIsAcceptingId] = useState("");
  const [error, setError] = useState("");
  const [votesByAnswer, setVotesByAnswer] = useState({});

  const currentUserId = user?.id || user?._id || "";

  const fetchQuestion = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.get(`questions/${id}`);
      setQuestion(response.data.data?.question || null);
    } catch (requestError) {
      setError("Question could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    const backendUrl =
      process.env.REACT_APP_API_BASE_URL?.replace("/api/v1", "") ||
      "http://localhost:5000";
    const socket = io(backendUrl, { withCredentials: true });

    socket.on("connect", () => {
      socket.emit("join_question", id);
    });

    socket.on("new_answer", (newAnswer) => {
      setQuestion((previousQuestion) => {
        if (!previousQuestion) {
          return previousQuestion;
        }

        const alreadyExists = previousQuestion.answers?.some(
          (answer) => answer._id === newAnswer._id
        );

        if (alreadyExists) {
          return previousQuestion;
        }

        return {
          ...previousQuestion,
          answers: [newAnswer, ...(previousQuestion.answers || [])],
        };
      });

      addNotification({
        title: "Live update",
        message: "A new response has arrived in this thread.",
        type: "success",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [id, addNotification]);

  const isQuestionAuthor = useMemo(() => {
    if (!question || !currentUserId) {
      return false;
    }

    return getAuthorId(question.author) === currentUserId;
  }, [currentUserId, question]);

  const updateVote = async (answerId, delta) => {
    try {
      await apiClient.post(`answers/${answerId}/vote`, {
        type: delta === 1 ? "up" : "down",
      });
      setVotesByAnswer((currentVotes) => ({
        ...currentVotes,
        [answerId]: (currentVotes[answerId] || 0) + delta,
      }));
    } catch (requestError) {
      addNotification({
        title: "Vote not saved",
        message: "The vote endpoint did not accept the request.",
        type: "error",
      });
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setIsAcceptingId(answerId);
      await apiClient.patch(`answers/${answerId}/accept`);
      await fetchQuestion();
    } catch (requestError) {
      setError("Answer could not be accepted.");
    } finally {
      setIsAcceptingId("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          Loading thread...
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-950 px-8 text-center">
        <X className="h-10 w-10 text-zinc-700" />
        <h2 className="mt-4 text-lg font-medium text-zinc-300">
          Question missing or unavailable
        </h2>
        <Link
          to="/"
          className="mt-6 text-sm font-bold uppercase tracking-wide text-zinc-500 hover:text-white"
        >
          Return to feed
        </Link>
      </div>
    );
  }

  const answers = question.answers || [];

  return (
    <section className="relative mx-auto max-w-4xl pb-24">
      <div className="fixed right-6 top-6 z-50 flex max-w-sm flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900">
              <Zap className="h-5 w-5 text-[#84BBE1]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                {notification.title}
              </p>
              <p className="text-xs text-zinc-500">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="text-zinc-600 hover:text-zinc-300"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <nav className="mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#84BBE1] transition hover:text-[#FEF9D9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portal
        </button>
      </nav>

      <article className="overflow-hidden rounded-3xl border border-white/40 bg-[#fffdf2] p-7 shadow-[0_28px_80px_rgba(132,187,225,0.18)] md:p-10">
        <div className="-mx-7 -mt-7 mb-7 h-2 bg-[linear-gradient(90deg,#FEF9D9,#FCE0C6,#C1DCEB,#84BBE1)] md:-mx-10 md:-mt-10" />
        <header className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#51616a]">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {getAuthorLabel(question.author)}
          </span>
          {question.createdAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(question.createdAt).toLocaleDateString()}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {answers.length} responses
          </span>
        </header>

        <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-[#102431] md:text-5xl">
          {question.title}
        </h1>

        <p className="mt-7 whitespace-pre-wrap text-base leading-8 text-[#31444f] md:text-lg">
          {question.body}
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {(question.tags || []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#C1DCEB] bg-[#C1DCEB]/55 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#102431]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </article>

      {error && (
        <div className="mt-5 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-10">
        <AnswerForm questionId={question._id} onAnswerCreated={fetchQuestion} />
      </div>

      <div className="mt-14 space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-[#FEF9D9]">Discussion</h2>
          <div className="h-px flex-1 bg-[#C1DCEB]/25" />
        </div>

        {answers.length === 0 ? (
          <div className="rounded-2xl border border-[#C1DCEB]/40 bg-[#FEF9D9]/95 p-8 text-center text-sm text-[#31444f]">
            No answers yet.
          </div>
        ) : (
          <div className="grid gap-6">
            {answers.map((answer) => {
              const answerId = answer._id || answer.id;
              const baseVoteScore = answer.netVoteScore ?? answer.upvoteCount ?? 0;
              const voteScore = baseVoteScore + (votesByAnswer[answerId] || 0);

              return (
                <article
                  key={answerId}
                  className={`flex flex-col gap-5 rounded-2xl p-5 md:flex-row md:gap-7 ${
                    answer.aiGenerated
                      ? "border border-[#84BBE1]/50 bg-[#C1DCEB]"
                      : "border border-white/40 bg-[#fffdf2]"
                  }`}
                >
                  <div className="flex shrink-0 items-center gap-3 md:flex-col">
                    <button
                      type="button"
                      onClick={() => updateVote(answerId, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C1DCEB] bg-white/65 text-[#2f779f] transition hover:border-[#84BBE1] hover:text-[#102431]"
                      aria-label="Upvote answer"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                    <span className="font-mono text-sm font-bold text-[#102431]">
                      {voteScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateVote(answerId, -1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C1DCEB] bg-white/65 text-[#2f779f] transition hover:border-[#84BBE1] hover:text-[#102431]"
                      aria-label="Downvote answer"
                    >
                      <ArrowDown className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#84BBE1] text-xs font-bold text-[#071018]">
                          {getInitial(answer.author)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#102431]">
                            {getAuthorLabel(answer.author)}
                          </p>
                          {answer.createdAt && (
                            <p className="text-xs text-[#51616a]">
                              {new Date(answer.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {getAuthorLabel(answer.author) === "Vicharanashala System" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#84BBE1]/50 bg-[#84BBE1]/35 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#102431]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Official Response
                          </span>
                        )}
                        {answer.aiGenerated && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#84BBE1]/50 bg-white/50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#102431]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Provisional AI Draft - Pending Peer Review
                          </span>
                        )}
                        {answer.isAccepted && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#84BBE1]/50 bg-[#FEF9D9] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#102431]">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Solution
                          </span>
                        )}
                      </div>
                    </header>

                    <p className="whitespace-pre-wrap text-base leading-7 text-[#31444f]">
                      {answer.body}
                    </p>

                    {isQuestionAuthor && !answer.isAccepted && (
                      <button
                        type="button"
                        onClick={() => handleAcceptAnswer(answerId)}
                        disabled={isAcceptingId === answerId}
                        className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#2f779f] transition hover:text-[#102431] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAcceptingId === answerId
                          ? "Processing..."
                          : "Mark as validated solution"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default QuestionDetail;
