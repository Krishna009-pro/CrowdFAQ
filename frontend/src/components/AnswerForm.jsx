import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Send } from "lucide-react";

import apiClient from "../api/client";
import useStore from "../store/useStore";

const AnswerForm = ({ questionId, onAnswerCreated }) => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError("Answer body is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await apiClient.post("answers", {
        questionId,
        body: trimmedBody,
      });

      setBody("");
      onAnswerCreated?.();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          "Answer could not be posted."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="rounded-2xl border border-white/40 bg-[#fffdf2] p-5 shadow-[0_18px_45px_rgba(6,16,22,0.16)]"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <label
            className="block text-sm font-semibold text-[#102431]"
            htmlFor="answer-body"
          >
            Add an answer
          </label>
          <p className="mt-1 text-xs text-[#51616a]">
            Human review improves provisional AI drafts and closes the loop.
          </p>
        </div>
        {!user && (
          <span className="rounded-full border border-[#FCE0C6] bg-[#FCE0C6]/60 px-3 py-1 text-xs font-semibold text-[#8a674c]">
            Sign in required
          </span>
        )}
      </div>

      <textarea
        id="answer-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        placeholder="Write a clear, helpful answer..."
        className="mt-4 w-full resize-y rounded-xl border border-[#C1DCEB] bg-white/75 p-4 text-sm leading-6 text-[#102431] outline-none transition placeholder:text-[#7a8b91] focus:border-[#84BBE1] focus:ring-2 focus:ring-[#84BBE1]/20"
      />

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-[#84BBE1] px-4 py-2 text-sm font-bold text-[#071018] transition hover:bg-[#6caedb] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Posting..." : "Post Answer"}
        </button>
      </div>
    </form>
  );
};

export default AnswerForm;
