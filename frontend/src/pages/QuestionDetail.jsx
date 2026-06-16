import { useParams, Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { questions, questionBySlug, answers, userById, timeAgo } from "@/lib/mockData";
import { ChevronUp, ChevronDown, ShieldCheck, MessageSquare, Eye, Share2, Bookmark, Flag, Check } from "lucide-react";

export default function QuestionDetail() {
  const { slug } = useParams();
  const q = questionBySlug(slug) || questions[0];
  const author = userById(q.author);
  const qAnswers = answers[q.id] || answers["q-001"];
  const related = questions.filter((qq) => qq.category === q.category && qq.id !== q.id).slice(0, 4);

  return (
    <PageShell>
      <section className="border-b border-brand-line">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-6 text-xs uppercase tracking-widest text-brand-body">
            <Link to="/" className="hover:text-brand-ink">Feed</Link>
            <span className="text-brand-mute">/</span>
            <Link to={`/categories/${q.category}`} className="hover:text-brand-ink">{q.category}</Link>
            <span className="text-brand-mute">/</span>
            <span className="text-brand-mute truncate">Question</span>
          </div>

          <div className="flex items-center gap-3 mb-5">
            {q.status === "verified" && (
              <span className="bg-[#E8F0ED] text-brand-forest text-[10px] uppercase tracking-widest px-3 py-1 font-bold flex items-center gap-1.5">
                <ShieldCheck size={11} /> Verified answer
              </span>
            )}
            <span className="label-eyebrow">{q.category}</span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-brand-ink leading-[1.05] tracking-tight max-w-4xl">
            {q.title}
          </h1>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-4">
              <img src={author.avatar} alt={author.name} className="w-12 h-12 object-cover" />
              <div>
                <p className="text-brand-ink font-medium">{author.name}</p>
                <p className="label-eyebrow">{author.title} · Asked {timeAgo(q.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-brand-body">
              <span className="flex items-center gap-2"><MessageSquare size={14} />{q.answers} answers</span>
              <span className="flex items-center gap-2"><Eye size={14} />{q.views.toLocaleString()} views</span>
              <button className="flex items-center gap-2 hover:text-brand-ink" data-testid="share-btn"><Share2 size={14} />Share</button>
              <button className="flex items-center gap-2 hover:text-brand-ink" data-testid="bookmark-btn"><Bookmark size={14} />Save</button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 grid lg:grid-cols-12 gap-10">
        <article className="lg:col-span-8">
          <div className="flex gap-6">
            <VoteColumn count={q.votes} testid={`vote-question-${q.id}`} />
            <div className="flex-1">
              <p className="text-brand-body text-base md:text-lg leading-relaxed mb-6">{q.body}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {q.tags.map((t) => (
                  <Link key={t} to={`/search?q=${t}`} className="text-xs px-3 py-1.5 border border-brand-line text-brand-body uppercase tracking-wider hover:border-brand-ink">#{t}</Link>
                ))}
              </div>
              <div className="flex gap-3 text-xs uppercase tracking-widest text-brand-mute pb-4 border-b border-brand-line">
                <button className="hover:text-brand-ink flex items-center gap-1.5"><Share2 size={12} />Share</button>
                <button className="hover:text-brand-ink flex items-center gap-1.5"><Flag size={12} />Report</button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <div className="flex items-end justify-between border-b border-brand-line pb-3 mb-6">
              <h2 className="font-serif text-3xl md:text-4xl tracking-tight text-brand-ink">{qAnswers.length} Answers</h2>
              <select className="text-xs uppercase tracking-widest bg-transparent border-b border-brand-line py-1 outline-none" data-testid="answers-sort">
                <option>Sort: Highest voted</option>
                <option>Sort: Newest</option>
                <option>Sort: Oldest</option>
              </select>
            </div>

            <div className="space-y-10">
              {qAnswers.map((a) => {
                const u = userById(a.author);
                return (
                  <div key={a.id} className={`p-6 md:p-8 ${a.accepted ? 'border-l-4 border-brand-blue bg-[#F4F7FA]' : 'border-l border-brand-line'}`} data-testid={`answer-${a.id}`}>
                    {a.accepted && (
                      <div className="flex items-center gap-2 mb-4 text-brand-blue text-[10px] uppercase tracking-widest font-bold">
                        <Check size={13} strokeWidth={2.5} /> Accepted answer
                      </div>
                    )}
                    <div className="flex gap-6">
                      <VoteColumn count={a.votes} testid={`vote-answer-${a.id}`} />
                      <div className="flex-1">
                        <p className="text-brand-body text-base leading-relaxed">{a.body}</p>
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-line">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} alt="" className="w-9 h-9 object-cover" />
                            <div>
                              <p className="text-sm text-brand-ink">{u.name}</p>
                              <p className="text-[10px] uppercase tracking-widest text-brand-mute">{u.reputation.toLocaleString()} rep · {timeAgo(a.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex gap-3 text-xs uppercase tracking-widest text-brand-mute">
                            <button className="hover:text-brand-ink">Reply</button>
                            <button className="hover:text-brand-ink">Share</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 border-t border-brand-line pt-8">
              <h3 className="font-serif text-2xl text-brand-ink mb-4">Your answer</h3>
              <textarea rows={5} placeholder="Write a clear, sourced answer. Avoid pleasantries. Get to the point." className="w-full border border-brand-line bg-white p-4 text-base outline-none focus:border-brand-ink resize-y" data-testid="answer-input" />
              <div className="flex justify-end mt-4">
                <button className="bg-brand-ink text-brand-paper px-6 py-3 text-sm tracking-wide hover:bg-brand-blue" data-testid="post-answer-btn">Post your answer</button>
              </div>
            </div>
          </div>
        </article>

        <aside className="lg:col-span-4 space-y-6">
          <div className="border border-brand-line bg-white p-6">
            <p className="label-eyebrow mb-4">Related questions</p>
            <ul className="divide-y divide-brand-line">
              {related.map((r) => (
                <li key={r.id}>
                  <Link to={`/q/${r.slug}`} className="block py-4 group" data-testid={`related-${r.id}`}>
                    <p className="font-serif text-lg text-brand-ink leading-snug group-hover:text-brand-blue mb-1">{r.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-mute">{r.answers} answers · {r.votes} votes</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-brand-line bg-white p-6">
            <p className="label-eyebrow mb-4">About the asker</p>
            <div className="flex items-center gap-3 mb-3">
              <img src={author.avatar} alt="" className="w-12 h-12 object-cover" />
              <div>
                <p className="text-brand-ink">{author.name}</p>
                <p className="text-xs text-brand-mute">{author.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-brand-line border border-brand-line">
              <div className="bg-white px-3 py-3"><p className="font-serif text-2xl">{author.reputation.toLocaleString()}</p><p className="label-eyebrow text-[9px]">Reputation</p></div>
              <div className="bg-white px-3 py-3"><p className="font-serif text-2xl">{author.joined.split(' ')[1]}</p><p className="label-eyebrow text-[9px]">Member since</p></div>
            </div>
          </div>
        </aside>
      </section>
    </PageShell>
  );
}

const VoteColumn = ({ count, testid }) => (
  <div className="flex flex-col items-center w-12 shrink-0" data-testid={testid}>
    <button className="text-brand-mute hover:text-brand-ink p-1"><ChevronUp size={22} strokeWidth={1.5} /></button>
    <span className="font-serif text-3xl text-brand-ink leading-none my-1">{count}</span>
    <button className="text-brand-mute hover:text-brand-vermilion p-1"><ChevronDown size={22} strokeWidth={1.5} /></button>
  </div>
);
