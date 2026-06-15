import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail, Sparkles, User } from "lucide-react";

import apiClient from "../api/client";
import useStore from "../store/useStore";

const Login = () => {
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.displayName.trim() || !formData.email.trim()) {
      setError("Display name and email are required.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.post("auth/register", formData);
      setUser(response.data.data.user);
      navigate("/");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          "Could not enter the portal."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[78vh] max-w-md flex-col justify-center px-4">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#C1DCEB] transition hover:text-[#FEF9D9]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to portal
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-[#fffdf2] p-7 shadow-[0_28px_80px_rgba(132,187,225,0.22)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#FCE0C6]/80 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-44 w-44 rounded-full bg-[#84BBE1]/35 blur-3xl" />

        <div className="relative">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FEF9D9,#FCE0C6,#84BBE1)] shadow-[0_18px_42px_rgba(7,16,24,0.16)]">
            <Sparkles className="h-7 w-7 text-[#102431]" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-semibold text-[#102431]">Enter AQ Portal</h1>
            <p className="mt-2 text-sm leading-6 text-[#51616a]">
              Create a lightweight session for posting questions and answers.
            </p>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#31444f]"
                htmlFor="displayName"
              >
                Display name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2f779f]" />
                <input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      displayName: event.target.value,
                    })
                  }
                  placeholder="Jane Cooper"
                  className="min-h-12 w-full rounded-xl border border-[#C1DCEB] bg-white/75 pl-12 pr-4 text-[#102431] outline-none transition placeholder:text-[#7a8b91] focus:border-[#84BBE1]"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#31444f]"
                htmlFor="email"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2f779f]" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      email: event.target.value,
                    })
                  }
                  placeholder="jane@example.com"
                  className="min-h-12 w-full rounded-xl border border-[#C1DCEB] bg-white/75 pl-12 pr-4 text-[#102431] outline-none transition placeholder:text-[#7a8b91] focus:border-[#84BBE1]"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#84BBE1] px-4 text-sm font-bold text-[#071018] transition hover:bg-[#6caedb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Enter the Portal <Sparkles className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
