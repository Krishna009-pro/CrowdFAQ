import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { QuestionCard } from "@/components/QuestionCard";
import { users, questions, timeAgo } from "@/lib/mockData";
import { Award, MapPin, Calendar, Edit3, Mail } from "lucide-react";

export default function UserProfile() {
  const u = users[0];
  const [tab, setTab] = useState("questions");
  const userQuestions = questions.slice(0, 4);
  const userAnswers = [
    { id: 'ua-1', question: questions[0], excerpt: 'Use IRSA with EKS, and stop minting long-lived keys for service accounts entirely...', votes: 84, accepted: true, time: '5d ago' },
    { id: 'ua-2', question: questions[5], excerpt: 'The planner picks a hash join because the work table fits in work_mem...', votes: 41, accepted: false, time: '1w ago' },
  ];

  const tabs = [
    { k: "questions", label: `Questions (${userQuestions.length})` },
    { k: "answers", label: `Answers (${userAnswers.length})` },
    { k: "activity", label: "Activity" },
    { k: "badges", label: "Badges" },
  ];

  return (
    <PageShell>
      <section className="border-b border-brand-line bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
            <img src={u.avatar} alt={u.name} className="w-32 h-32 object-cover grayscale-[0.2]" data-testid="profile-avatar" />
            <div className="flex-1">
              <p className="label-eyebrow mb-2">{u.title}</p>
              <h1 className="font-serif text-5xl md:text-6xl text-brand-ink leading-none tracking-tight">{u.name}</h1>
              <div className="flex flex-wrap items-center gap-5 mt-5 text-sm text-brand-body">
                <span className="flex items-center gap-2"><Mail size={13} /> {u.handle}@crowdsource.faq</span>
                <span className="flex items-center gap-2"><Calendar size={13} /> Joined {u.joined}</span>
                <span className="flex items-center gap-2"><MapPin size={13} /> Remote / Lisbon</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="border border-brand-line px-5 py-3 text-sm hover:border-brand-ink flex items-center gap-2" data-testid="profile-edit-btn">
                <Edit3 size={13} /> Edit profile
              </button>
              <button className="bg-brand-ink text-brand-paper px-5 py-3 text-sm hover:bg-brand-blue" data-testid="profile-follow-btn">Follow</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-line border-y border-brand-line mt-10">
            {[
              { k: "Reputation", v: u.reputation.toLocaleString() },
              { k: "Questions", v: userQuestions.length },
              { k: "Answers", v: userAnswers.length },
              { k: "Accepted rate", v: "78%" },
            ].map((s) => (
              <div key={s.k} className="bg-white px-6 py-5">
                <p className="font-serif text-3xl md:text-4xl text-brand-ink">{s.v}</p>
                <p className="label-eyebrow mt-2">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-10">
        <div className="flex gap-1 border-b border-brand-line mb-8" data-testid="profile-tabs">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-3 text-sm tracking-wide border-b-2 -mb-px transition-colors ${tab === t.k ? 'border-brand-ink text-brand-ink font-medium' : 'border-transparent text-brand-body hover:text-brand-ink'}`}
              data-testid={`profile-tab-${t.k}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "questions" && (
          <div className="border border-brand-line">
            {userQuestions.map((q) => <QuestionCard key={q.id} q={q} />)}
          </div>
        )}

        {tab === "answers" && (
          <div className="border border-brand-line bg-white divide-y divide-brand-line">
            {userAnswers.map((a) => (
              <div key={a.id} className="p-6 md:p-8" data-testid={`profile-answer-${a.id}`}>
                <div className="flex items-center gap-3 mb-2">
                  {a.accepted && <span className="bg-[#E8F0ED] text-brand-forest text-[10px] uppercase tracking-widest px-2 py-0.5 font-bold">Accepted</span>}
                  <span className="label-eyebrow">{a.votes} votes · {a.time}</span>
                </div>
                <Link to={`/q/${a.question.slug}`}>
                  <h3 className="font-serif text-2xl text-brand-ink hover:text-brand-blue mb-2 leading-tight">{a.question.title}</h3>
                </Link>
                <p className="text-brand-body text-sm">{a.excerpt}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "activity" && (
          <div className="space-y-4">
            {[
              { type: "Answered", target: "How do we rotate AWS IAM access keys", time: "2h ago" },
              { type: "Voted", target: "Recommended pattern for cleaning up stale feature flags", time: "5h ago" },
              { type: "Asked", target: "Should we use Kubernetes Secret objects or a CSI driver", time: "1d ago" },
              { type: "Edited", target: "Onboarding plan for engineers", time: "3d ago" },
            ].map((a, i) => (
              <div key={i} className="border border-brand-line bg-white p-5 flex items-center justify-between" data-testid={`activity-${i}`}>
                <div>
                  <p className="label-eyebrow">{a.type}</p>
                  <p className="text-brand-ink text-base mt-1">{a.target}</p>
                </div>
                <span className="text-xs text-brand-mute">{a.time}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "badges" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Curator", desc: "Edited 25+ questions for clarity", tier: "Gold" },
              { name: "Trusted Source", desc: "10+ accepted answers in Engineering", tier: "Gold" },
              { name: "Early Adopter", desc: "Joined in the first 1,000", tier: "Silver" },
              { name: "Mentor", desc: "Answered 50+ questions", tier: "Silver" },
              { name: "Sleuth", desc: "Resolved 5 reported issues", tier: "Bronze" },
              { name: "Storyteller", desc: "Wrote an answer over 500 words", tier: "Bronze" },
            ].map((b) => (
              <div key={b.name} className="border border-brand-line bg-white p-6" data-testid={`badge-${b.name.toLowerCase()}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Award size={20} className={b.tier === 'Gold' ? 'text-brand-gold' : b.tier === 'Silver' ? 'text-brand-mute' : 'text-[#8B6E4E]'} />
                  <p className="label-eyebrow">{b.tier}</p>
                </div>
                <p className="font-serif text-2xl text-brand-ink leading-tight mb-1">{b.name}</p>
                <p className="text-sm text-brand-body">{b.desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
