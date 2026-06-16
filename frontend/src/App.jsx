import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import {
  BadgeCheck,
  Loader2,
  BookOpen,
  Bot,
  CircleCheck,
  LogOut,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Search,
  UserCircle,
} from "lucide-react";

import AQFeed from "./components/AQFeed";
import FAQKnowledgeBase from "./components/FAQKnowledgeBase";
import Login from "./components/Login";
import QuestionDetail from "./components/QuestionDetail";
import SearchWidget from "./components/SearchWidget";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import apiClient from "./api/client";
import useStore from "./store/useStore";

const resourceCards = [
  {
    title: "Browse official answers",
    description: "Start with mentor-approved manual guidance before opening a new thread.",
    icon: BookOpen,
    accent: "#FEF9D9",
    links: [
      { label: "Browse FAQs", to: "/faq", icon: Search },
      { label: "Read internship rules", to: "/faq", icon: BadgeCheck },
      { label: "Get NOC help", to: "/faq", icon: MessageCircle },
    ],
  },
  {
    title: "Ask the community",
    description: "Search first, then post only when the answer is not already available.",
    icon: MessagesSquare,
    accent: "#FCE0C6",
    links: [
      { label: "Search before asking", to: "/#ask", icon: Search },
      { label: "View community feed", to: "/#threads", icon: MessagesSquare },
      { label: "Post a question", to: "/#ask", icon: MessageCircle },
    ],
  },
  {
    title: "Review AI suggestions",
    description: "AI drafts are provisional until students or mentors validate them.",
    icon: Bot,
    accent: "#C1DCEB",
    links: [
      { label: "Understand AI drafts", to: "/faq", icon: Bot },
      { label: "Review peer answers", to: "/#threads", icon: BadgeCheck },
      { label: "Open answer threads", to: "/#threads", icon: MessagesSquare },
    ],
  },
  {
    title: "Explore resolved threads",
    description: "Find accepted answers and verified help from previous student questions.",
    icon: BadgeCheck,
    accent: "#84BBE1",
    links: [
      { label: "See accepted answers", to: "/#threads", icon: BadgeCheck },
      { label: "Open verified FAQs", to: "/faq", icon: BookOpen },
      { label: "Get student support", to: "/#ask", icon: MessageCircle },
    ],
  },
];

const trustSignals = [
  "Official manual guidance",
  "Peer-reviewed answers",
  "AI drafts clearly labeled",
];

const ResourceCard = ({ title, description, icon: Icon, links, accent }) => {
  return (
    <article className="flex min-h-[270px] flex-col overflow-hidden rounded-lg border border-white/40 bg-[#fffdf2] shadow-[0_18px_45px_rgba(6,16,22,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(6,16,22,0.24)]">
      <div
        className="flex min-h-[142px] flex-col items-center justify-center border-b border-black/5 px-6 text-center"
        style={{ backgroundColor: accent }}
      >
        <Icon className="mb-3 h-7 w-7 text-[#102431]" aria-hidden="true" />
        <h3 className="text-lg font-semibold tracking-tight text-[#102431]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-5 text-[#31444f]">{description}</p>
      </div>

      <div className="grid gap-1 px-5 py-5">
        {links.map((link) => {
          const LinkIcon = link.icon;

          return (
            <Link
              key={`${title}-${link.label}`}
              to={link.to}
              className="aq-card-link flex min-h-10 items-center justify-between gap-3 rounded-md px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#2f779f]"
            >
              <span className="inline-flex items-center gap-3">
                <LinkIcon className="aq-card-link-icon h-4 w-4" aria-hidden="true" />
                <span>{link.label}</span>
              </span>
              <span className="aq-card-arrow" aria-hidden="true">→</span>
            </Link>
          );
        })}
      </div>
    </article>
  );
};

const AppShell = ({ children }) => {
  const { user, logout } = useStore();

  const handleLogout = async () => {
    try {
      await apiClient.post("auth/logout");
    } finally {
      logout();
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(254,249,217,0.13),transparent_28rem),radial-gradient(circle_at_80%_8%,rgba(132,187,225,0.18),transparent_30rem),#071018] text-zinc-100">
      <div className="border-b border-[#C1DCEB]/20 bg-[#071018]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FEF9D9,#FCE0C6,#84BBE1)] shadow-[0_0_22px_rgba(132,187,225,0.35)]">
              <BookOpen className="h-4 w-4 text-[#102431]" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-white">
              Samagama AQ
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/faq"
              className="hidden text-sm text-[#C1DCEB] transition hover:text-[#FEF9D9] sm:inline"
            >
              Knowledge Base
            </Link>
            <Link
              to="/admin"
              className="hidden text-sm text-[#C1DCEB] transition hover:text-[#FEF9D9] sm:inline"
              title="Admin Portal"
            >
              Admin
            </Link>
            {user ? (
              <>
                <span className="hidden items-center gap-2 rounded-full border border-[#252525] bg-[#101010] px-3 py-1.5 text-sm text-zinc-300 sm:inline-flex">
                  <UserCircle className="h-4 w-4" aria-hidden="true" />
                  {user.displayName}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md border border-[#252525] px-3 py-1.5 text-sm text-zinc-400 transition hover:text-white"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md border border-[#84BBE1]/40 bg-[#C1DCEB]/10 px-3 py-1.5 text-sm text-[#FEF9D9] transition hover:bg-[#C1DCEB]/20"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {children}
    </main>
  );
};

const Home = () => {
  const [dbStatus, setDbStatus] = useState("checking");
  const [healthCheckedAt, setHealthCheckedAt] = useState("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiClient.get("health");
        setDbStatus(response.data.data.database);
        setHealthCheckedAt(new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }));
      } catch (error) {
        console.error("Health check failed:", error.message);
        setDbStatus("offline");
        setHealthCheckedAt(new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }));
        // Retry after 2 seconds
        setTimeout(checkHealth, 2000);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      {dbStatus !== "connected" && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-[#FCE0C6]/50 bg-[#FEF9D9]/10 px-4 py-3 text-sm text-[#FEF9D9] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Live data unavailable. Showing available help content
            {healthCheckedAt ? ` · last checked ${healthCheckedAt}` : ""}.
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 self-start rounded-md border border-[#84BBE1]/50 px-3 py-1.5 text-xs font-semibold text-[#C1DCEB] transition hover:bg-[#84BBE1]/15 focus:outline-none focus:ring-2 focus:ring-[#84BBE1] sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      <section className="relative overflow-hidden rounded-xl border border-white/40 bg-[linear-gradient(135deg,#FEF9D9_0%,#FEF9D9_32%,#FCE0C6_54%,#C1DCEB_78%,#84BBE1_100%)] px-4 pb-14 pt-16 text-center shadow-[0_28px_80px_rgba(132,187,225,0.22)] sm:px-8 sm:pb-20 sm:pt-20">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#071018]/20 to-transparent" />
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#071018] text-white shadow-[0_18px_42px_rgba(7,16,24,0.35)]">
            <BookOpen className="h-5 w-5 text-[#FEF9D9]" aria-hidden="true" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#102431] sm:text-4xl">
            How can we help?
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#31444f] sm:text-lg">
            Find verified answers instantly. If no answer exists, post once and
            get an AI draft plus community review.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {trustSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1 text-xs font-semibold text-[#102431]"
              >
                <CircleCheck className="h-3.5 w-3.5 text-[#2f779f]" />
                {signal}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div id="ask" className="relative z-10 mx-auto -mt-5 scroll-mt-24 max-w-xl">
        <SearchWidget />
        <div className="mt-3 flex justify-center">
          <Link
            to="/faq"
            className="text-sm font-medium text-[#84BBE1] transition hover:text-[#FEF9D9] focus:outline-none focus:ring-2 focus:ring-[#84BBE1]"
          >
            Not sure what to search?
          </Link>
        </div>
      </div>

      <section className="mt-14 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF9D9] text-[#102431] shadow-[0_14px_36px_rgba(254,249,217,0.25)]">
          <MessagesSquare className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-base text-[#84BBE1]">
          If your question is not answered in the manual
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#FEF9D9] sm:text-3xl">
          Tap into the community knowledge base.
        </h2>

        <div className="mt-8 grid gap-5 text-left [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {resourceCards.map((card) => (
            <ResourceCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      <AQFeed />
    </div>
  );
};

const App = () => {
  const { setUser, setAuthLoading, authLoading } = useStore();

  // Check for existing session on app mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await apiClient.get("auth/me");
      if (response.data?.success && response.data?.data?.user) {
        setUser(response.data.data.user);
      }
    } catch {
      // 401 or network error — user is not logged in, continue as guest
    } finally {
      setAuthLoading(false);
    }
  }, [setUser, setAuthLoading]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading spinner while checking auth session
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071018]">
        <Loader2 className="h-8 w-8 animate-spin text-[#84BBE1]" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="*"
          element={
            <AppShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/faq" element={<FAQKnowledgeBase />} />
                <Route path="/login" element={<Login />} />
                <Route path="/question/:id" element={<QuestionDetail />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
