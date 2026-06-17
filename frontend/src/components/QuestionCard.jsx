import { Link } from "react-router-dom";
import { ChevronUp, ChevronDown, MessageSquare, Eye, ShieldCheck, Clock } from "lucide-react";
import { userById, timeAgo } from "@/lib/mockData";

export const QuestionCard = ({ q, variant = "default" }) => {
  const author = userById(q.author);
  const statusMap = {
    verified: { label: "Verified", color: "text-brand-forest", bg: "bg-[#E8F0ED]" },
    answered: { label: "Answered", color: "text-brand-blue", bg: "bg-[#E8EEF5]" },
    unanswered: { label: "Open", color: "text-brand-vermilion", bg: "bg-[#FBEAE6]" },
  };
  const s = statusMap[q.status];

  return (
    <article
      className="group border-b border-brand-line bg-white hover:bg-[#FCFCFB] transition-colors p-6 md:p-8"
      data-testid={`question-card-${q.id}`}
    >
      <div className="flex gap-6">
        <div className="hidden sm:flex flex-col items-center w-12 pt-1 shrink-0">
          <button className="text-brand-mute hover:text-brand-ink transition-colors p-1" data-testid={`upvote-${q.id}`}>
            <ChevronUp size={20} strokeWidth={1.5} />
          </button>
          <span className="font-sans font-semibold text-2xl text-brand-ink leading-none my-1">{q.votes}</span>
          <button className="text-brand-mute hover:text-brand-vermilion transition-colors p-1" data-testid={`downvote-${q.id}`}>
            <ChevronDown size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`label-eyebrow flex items-center gap-1.5 ${s.color}`}>
              {q.status === "verified" && <ShieldCheck size={11} strokeWidth={2} />}
              {s.label}
            </span>
            <span className="text-brand-mute text-xs uppercase tracking-widest">/ {q.category}</span>
          </div>

          <Link to={`/q/${q.slug}`} className="block" data-testid={`question-link-${q.id}`}>
            <h3 className="font-serif text-2xl md:text-3xl leading-tight text-brand-ink hover:text-brand-blue transition-colors mb-3 tracking-tight">
              {q.title}
            </h3>
          </Link>

          <p className="text-brand-body text-sm md:text-base leading-relaxed mb-5 line-clamp-2">{q.excerpt}</p>

          <div className="flex flex-wrap gap-2 mb-5">
            {q.tags.map((t) => (
              <Link
                key={t}
                to={`/search?q=${t}`}
                className="text-[10px] sm:text-xs px-2.5 py-1 border border-brand-line text-brand-body uppercase tracking-wider hover:border-brand-ink hover:text-brand-ink transition-colors"
              >
                #{t}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <img src={author.avatar} alt={author.name} className="w-7 h-7 object-cover" />
              <div>
                <p className="text-brand-ink font-medium">{author.name}</p>
                <p className="text-brand-mute text-[10px] uppercase tracking-widest flex items-center gap-1">
                  <Clock size={9} /> {timeAgo(q.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-brand-body">
              <span className="flex items-center gap-1.5 sm:hidden"><ChevronUp size={13} />{q.votes}</span>
              <span className="flex items-center gap-1.5"><MessageSquare size={13} strokeWidth={1.5} />{q.answers}</span>
              <span className="flex items-center gap-1.5"><Eye size={13} strokeWidth={1.5} />{q.views.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
