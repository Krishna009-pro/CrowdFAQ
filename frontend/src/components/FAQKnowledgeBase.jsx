import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clock,
  FileText,
  HelpCircle,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";

import apiClient from "../api/client";
import fallbackFaqData from "../data/faqData";

const PASTEL = {
  yellow: "#FEF9D9",
  peach: "#FCE0C6",
  lightBlue: "#C1DCEB",
  skyBlue: "#84BBE1",
};

const sectionMeta = {
  "About the internship": {
    icon: BookOpen,
    accent: PASTEL.yellow,
  },
  "Timing and dates": {
    icon: Clock,
    accent: PASTEL.peach,
  },
  NOC: {
    icon: ShieldCheck,
    accent: PASTEL.lightBlue,
  },
  Communications: {
    icon: MessageCircle,
    accent: PASTEL.skyBlue,
  },
  General: {
    icon: HelpCircle,
    accent: PASTEL.lightBlue,
  },
};

const FAQRow = ({ question, answer, to }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-[#FCE0C6]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#C1DCEB]/30"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#84BBE1] text-xs font-bold text-[#071018]">
            Q
          </span>
          <span className="text-sm font-semibold text-[#102431] transition group-hover:text-[#2f779f]">
            {question}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#6f7f86] transition group-hover:text-[#2f779f] ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="bg-white/45 px-5 pb-5 pl-14 text-sm leading-7 text-[#51616a]">
          <div className="border-l border-[#84BBE1] pl-5">
            <p className="whitespace-pre-wrap">{answer}</p>
            {to && (
              <Link
                to={to}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#2f779f] hover:text-[#102431]"
              >
                Open thread <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const mapQuestionsToSections = (questions) => {
  if (!questions.length) {
    return fallbackFaqData;
  }

  const grouped = questions.reduce((groups, question) => {
    const section =
      question.tags?.find((tag) => tag !== "FAQ" && tag !== "Official") ||
      "General";

    if (!groups[section]) {
      groups[section] = {
        section,
        items: [],
      };
    }

    groups[section].items.push({
      q: question.title,
      a: question.body,
      to: `/question/${question._id}`,
    });

    return groups;
  }, {});

  return Object.values(grouped);
};

const FAQKnowledgeBase = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteQuestions, setRemoteQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchFaqs = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get("questions", {
          params: {
            tag: "FAQ",
            limit: 200,
          },
        });

        if (isMounted) {
          setRemoteQuestions(response.data.data?.questions || []);
          setIsUsingFallback(false);
        }
      } catch (error) {
        if (isMounted) {
          setRemoteQuestions([]);
          setIsUsingFallback(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  const sections = useMemo(
    () => mapQuestionsToSections(remoteQuestions),
    [remoteQuestions]
  );

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.q.toLowerCase().includes(normalizedSearch) ||
            item.a.toLowerCase().includes(normalizedSearch)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchTerm, sections]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 text-white sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-xl border border-white/40 bg-[linear-gradient(135deg,#FEF9D9_0%,#FEF9D9_32%,#FCE0C6_54%,#C1DCEB_78%,#84BBE1_100%)] px-4 pb-14 pt-16 text-center shadow-[0_28px_80px_rgba(132,187,225,0.22)] sm:px-8 sm:pb-20 sm:pt-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#071018] text-white shadow-[0_18px_42px_rgba(7,16,24,0.35)]">
            <BookOpen className="h-5 w-5 text-[#FEF9D9]" aria-hidden="true" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#102431] sm:text-4xl">
            How can we help?
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#31444f] sm:text-lg">
            Discover solutions through our{" "}
            <span className="font-semibold text-[#102431]">documentation</span>,{" "}
            <span className="font-semibold text-[#102431]">guides</span>, and community.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-5 w-full max-w-xl">
        <label className="sr-only" htmlFor="faq-search">
          Search knowledge base
        </label>
        <div className="relative overflow-hidden rounded-lg border border-white/60 bg-[#fffdf2] shadow-[0_18px_60px_rgba(7,16,24,0.28)]">
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2f779f]"
            aria-hidden="true"
          />
          <input
            id="faq-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search..."
            className="h-11 w-full bg-transparent pl-11 pr-4 text-sm text-[#102431] outline-none placeholder:text-[#6f7f86]"
          />
        </div>

        <div className="mt-3 flex justify-center">
          <Link
            to="/"
            className="text-sm font-medium text-[#84BBE1] transition hover:text-[#FEF9D9]"
          >
            Ask the community instead
          </Link>
        </div>

        {isUsingFallback && (
          <p className="mt-4 rounded-md border border-[#FCE0C6]/40 bg-[#FCE0C6]/15 px-3 py-2 text-center text-xs text-[#FEF9D9]">
            Showing built-in manual entries while the database is unavailable.
          </p>
        )}
      </div>

      <section className="mt-20">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF9D9] text-[#102431] shadow-[0_14px_36px_rgba(254,249,217,0.25)]">
            <HelpCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-base text-[#84BBE1]">
            If your question is not answered in the manual
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#FEF9D9]">
            Tap into the community knowledge base.
          </h2>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-[#C1DCEB]/40 bg-[#FEF9D9]/95 p-10 text-center text-sm text-[#31444f]">
            Loading knowledge base...
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="rounded-lg border border-[#C1DCEB]/40 bg-[#FEF9D9]/95 p-10 text-center text-sm text-[#31444f]">
            No results found for "{searchTerm}".
          </div>
        ) : (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {filteredSections.map((section) => {
              const meta = sectionMeta[section.section] || sectionMeta.General;
              const Icon = meta.icon;

              return (
                <article
                  key={section.section}
                  className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-white/40 bg-[#fffdf2] shadow-[0_18px_45px_rgba(6,16,22,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(6,16,22,0.22)]"
                >
                  <div
                    className="flex min-h-40 flex-col items-center justify-center border-b border-black/5 p-8 text-center"
                    style={{ backgroundColor: meta.accent }}
                  >
                    <Icon className="mb-4 h-7 w-7 text-[#102431]" />
                    <h3 className="text-lg font-semibold text-[#102431]">
                      {section.section}
                    </h3>
                  </div>

                  <div className="mt-auto bg-[#fffdf2]">
                    {section.items.map((item) => (
                      <FAQRow
                        key={item.q}
                        question={item.q}
                        answer={item.a}
                        to={item.to}
                      />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default FAQKnowledgeBase;
