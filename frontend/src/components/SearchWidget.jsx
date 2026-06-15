import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Search,
  Send,
  X,
} from "lucide-react";

import apiClient from "../api/client";
import useStore from "../store/useStore";

const MIN_QUERY_LENGTH = 3;

const SearchWidget = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [triage, setTriage] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  const normalizedTriage = useMemo(() => {
    if (!triage) {
      return null;
    }

    return {
      action: triage.action,
      confidence: triage.confidence ?? triage.topScore ?? 0,
      match: triage.match ?? triage.topMatch ?? null,
      matches: triage.matches ?? [],
    };
  }, [triage]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setTriage(null);
      setIsSearching(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    const debounceTimer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setError("");

        const response = await apiClient.get("search", {
          params: {
            q: trimmedQuery,
          },
          signal: controller.signal,
        });

        setTriage(response.data.data);
      } catch (requestError) {
        if (requestError.name !== "CanceledError") {
          setError("Search is unavailable right now.");
          setTriage(null);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(debounceTimer);
    };
  }, [query]);

  const handlePostQuestion = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    const trimmedBody = body.trim();
    if (trimmedBody.length < 10) {
      setError("Please add at least 10 characters of context.");
      return;
    }

    try {
      setIsPosting(true);
      setError("");

      const response = await apiClient.post("questions", {
        title: query.trim(),
        body: trimmedBody,
      });

      navigate(`/question/${response.data.data.question._id}`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          "Failed to post question. Please try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setBody("");
    setTriage(null);
    setIsExpanded(false);
    setError("");
  };

  const action = normalizedTriage?.action;
  const match = normalizedTriage?.match;
  const matches = normalizedTriage?.matches || [];
  const hasPostableQuery = query.trim().length >= MIN_QUERY_LENGTH;
  const canShowSubmit = action !== "hard_intercept" && hasPostableQuery;

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-lg border border-white/60 bg-[#fffdf2] shadow-[0_18px_60px_rgba(7,16,24,0.28)]">
        <div className="relative">
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#FCE0C6]/70 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-[#84BBE1]/35 blur-3xl" />
        </div>
        <div className="relative flex min-h-11 items-center gap-2 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C1DCEB]/60 text-[#2f779f]">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>

          <input
            id="aq-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your question before posting..."
            className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#102431] outline-none placeholder:text-[#6f7f86]"
            aria-label="Search existing answers before posting a question"
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-md p-1.5 text-[#6f7f86] transition hover:bg-[#C1DCEB]/40 hover:text-[#102431]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {canShowSubmit && (
            <button
              type="button"
              onClick={handlePostQuestion}
              disabled={isPosting}
              className="hidden min-h-8 items-center justify-center gap-1.5 rounded-md bg-[#84BBE1] px-3 text-xs font-semibold text-[#071018] transition hover:bg-[#6caedb] disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
            >
              {isPosting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isExpanded ? (
                <>
                  Post <Send className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Ask <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="border-t border-[#C1DCEB] bg-[#FEF9D9]/70 px-4 py-3">
            <label
              className="mb-2 block text-xs font-semibold text-[#31444f]"
              htmlFor="aq-body-input"
            >
              Add context before posting
            </label>
            <textarea
              id="aq-body-input"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Share the details a mentor or peer would need to answer well..."
              rows={4}
              className="w-full resize-y rounded-md border border-[#C1DCEB] bg-white/70 px-3 py-2 text-sm leading-6 text-[#102431] outline-none placeholder:text-[#7a8b91] focus:border-[#84BBE1]"
            />
          </div>
        )}

        {canShowSubmit && (
          <div className="border-t border-[#C1DCEB] bg-[#FEF9D9]/70 p-3 sm:hidden">
          <button
            type="button"
            onClick={handlePostQuestion}
            disabled={isPosting}
              className={`inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isExpanded
                ? "bg-[#84BBE1] text-[#071018] hover:bg-[#6caedb]"
                : "bg-[#FCE0C6] text-[#102431] hover:bg-[#f6cfae]"
            }`}
          >
            {isPosting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isExpanded ? (
              <>
                Confirm Post <Send className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Ask Question <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs font-medium text-[#C1DCEB]">
        Search verified answers first. If nothing matches, you can post a new question.
      </p>

      <div className="mt-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {action === "hard_intercept" && match && (
          <div className="rounded-lg border border-[#84BBE1]/50 bg-[#C1DCEB] p-4 text-left shadow-[0_18px_40px_rgba(132,187,225,0.22)]">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#84BBE1] text-[#071018]">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#2f779f]">
                  We found an exact answer
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#102431]">
                  {match.title}
                </h3>
                <button
                  type="button"
                  onClick={() => navigate(`/question/${match._id}`)}
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#071018] px-4 py-2 text-sm font-bold text-[#FEF9D9] hover:bg-[#102431]"
                >
                  View answer <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {action === "soft_intercept" && (
          <div className="rounded-lg border border-[#FCE0C6]/80 bg-[#FEF9D9] p-4 text-left shadow-[0_18px_40px_rgba(252,224,198,0.2)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#8a674c]">
              Did you mean one of these?
            </p>
            <div className="space-y-2">
              {matches.map((candidate) => (
                <button
                  key={candidate._id}
                  type="button"
                  onClick={() => navigate(`/question/${candidate._id}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-md border border-[#FCE0C6] bg-white/55 p-3 text-left text-sm font-medium text-[#31444f] transition hover:border-[#84BBE1] hover:text-[#102431]"
                >
                  <span>{candidate.title}</span>
                  <ArrowRight className="h-4 w-4 text-[#2f779f]" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="mt-4 text-sm font-semibold text-[#2f779f] hover:text-[#102431]"
            >
              No, submit my question anyway
            </button>
          </div>
        )}

        {action === "gentle_suggest" && (
          <div className="rounded-lg border border-[#84BBE1]/40 bg-[#fffdf2]/90 p-4 text-left shadow-[0_12px_30px_rgba(132,187,225,0.08)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#2f779f]">
              Possibly related questions:
            </p>
            <div className="space-y-2">
              {matches.map((candidate) => (
                <button
                  key={candidate._id}
                  type="button"
                  onClick={() => navigate(`/question/${candidate._id}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-md border border-[#C1DCEB]/50 bg-white/40 p-2.5 text-left text-sm font-medium text-[#31444f] transition hover:border-[#84BBE1] hover:text-[#102431]"
                >
                  <span>{candidate.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2f779f]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchWidget;
