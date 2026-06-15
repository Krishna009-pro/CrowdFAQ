import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import apiClient from "../api/client";
import fallbackFaqData from "../data/faqData";

const getSnippet = (body) => {
  if (!body) {
    return "";
  }

  return body.length > 160 ? `${body.slice(0, 157)}...` : body;
};

const fallbackQuestions = fallbackFaqData.flatMap((section) =>
  section.items.slice(0, 2).map((item, index) => ({
    _id: `fallback-${section.section}-${index}`,
    title: item.q,
    body: item.a,
    tags: ["Official FAQ", section.section],
    answerCount: 1,
    acceptedAnswerId: true,
    isFallback: true,
  }))
);

const AQFeed = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuestions = async (isMounted = true) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.get("questions");
      const nextQuestions = response.data.data?.questions || [];

      if (isMounted) {
        setQuestions(nextQuestions);
      }
    } catch (requestError) {
      if (isMounted) {
        setQuestions(fallbackQuestions);
        setError("Live community threads are unavailable. Showing official fallback answers.");
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchQuestions(isMounted);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="threads" className="mt-14 scroll-mt-24">
      <div className="mb-6 flex flex-col justify-between gap-3 border-t border-[#C1DCEB]/25 pt-10 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#FEF9D9] sm:text-3xl">
            Recent community threads
          </h2>
          <p className="mt-2 text-sm text-[#C1DCEB]">
            Browse live support questions after searching the official manual.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-[#C1DCEB]/40 bg-[#FEF9D9]/95">
          <div className="flex flex-col items-center gap-3 text-sm text-[#31444f]">
            <Loader2 className="h-6 w-6 animate-spin" />
            Syncing feed...
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-lg border border-[#C1DCEB]/40 bg-[#FEF9D9]/95 p-10 text-center text-sm text-[#31444f]">
          <p className="font-semibold text-[#102431]">The feed is quiet.</p>
          <p className="mt-1">Start by searching or asking a question.</p>
          <Link
            to="/#ask"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#84BBE1] px-4 py-2 text-sm font-bold text-[#071018] transition hover:bg-[#6caedb] focus:outline-none focus:ring-2 focus:ring-[#2f779f]"
          >
            Search first <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#FCE0C6] bg-[#FEF9D9] p-4 text-sm text-[#8a4b2f] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#102431]">
                  Live threads are temporarily unavailable.
                </p>
                <p className="mt-1">{error}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fetchQuestions(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-[#84BBE1]/60 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#2f779f] transition hover:bg-[#C1DCEB]/40 focus:outline-none focus:ring-2 focus:ring-[#2f779f]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-2 rounded-md bg-[#84BBE1] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#071018] transition hover:bg-[#6caedb] focus:outline-none focus:ring-2 focus:ring-[#2f779f]"
                >
                  Browse manual
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {questions.map((question) => {
            const answerCount = question.answerCount ?? question.answers?.length ?? 0;
            const hasAcceptedAnswer = Boolean(question.acceptedAnswerId);

            return (
              <article
                key={question._id}
                className="group overflow-hidden rounded-lg border border-white/40 bg-[#fffdf2] p-5 shadow-[0_18px_45px_rgba(6,16,22,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(6,16,22,0.22)]"
              >
                <div className="mb-4 h-1.5 rounded-full bg-[linear-gradient(90deg,#FEF9D9,#FCE0C6,#C1DCEB,#84BBE1)]" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link to={question.isFallback ? "/faq" : `/question/${question._id}`}>
                      <h3 className="text-lg font-semibold text-[#102431] underline-offset-4 transition group-hover:text-[#2f779f] group-hover:underline">
                        {question.title}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-[#51616a]">
                      {getSnippet(question.body)}
                    </p>
                  </div>

                  {question.isFallback && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#FCE0C6] bg-[#FEF9D9] px-2.5 py-1 text-xs font-semibold text-[#8a4b2f]">
                      Cached
                    </span>
                  )}

                  {!question.isFallback && hasAcceptedAnswer && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#84BBE1]/50 bg-[#C1DCEB] px-2.5 py-1 text-xs font-semibold text-[#102431]">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Resolved
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(question.tags || []).slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-[#C1DCEB] bg-[#C1DCEB]/55 px-2 py-1 text-xs font-semibold text-[#102431]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#FCE0C6] pt-4 text-xs font-medium text-[#51616a] sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-5">
                    <span className="inline-flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {answerCount} {answerCount === 1 ? "response" : "responses"}
                    </span>
                    {question.createdAt && (
                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Link
                    to={question.isFallback ? "/faq" : `/question/${question._id}`}
                    className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-[#2f779f] transition hover:text-[#102431]"
                  >
                    {question.isFallback ? "Open FAQ" : "View thread"} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
          </div>
        </>
      )}
    </section>
  );
};

export default AQFeed;
