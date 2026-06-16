import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { notifications as initial, userById } from "@/lib/mockData";
import { MessageSquare, AtSign, Check, ArrowUp, Bell, Filter } from "lucide-react";

const iconMap = {
  answer: MessageSquare,
  mention: AtSign,
  accepted: Check,
  vote: ArrowUp,
  system: Bell,
};

export default function Notifications() {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("all");

  const filtered = items.filter((n) => filter === "all" ? true : filter === "unread" ? !n.read : n.type === filter);
  const unread = items.filter((n) => !n.read).length;

  const markAll = () => setItems(items.map((n) => ({ ...n, read: true })));
  const markOne = (id) => setItems(items.map((n) => n.id === id ? { ...n, read: true } : n));

  const filters = [
    { k: "all", label: "All" },
    { k: "unread", label: `Unread (${unread})` },
    { k: "answer", label: "Answers" },
    { k: "mention", label: "Mentions" },
    { k: "system", label: "System" },
  ];

  return (
    <PageShell>
      <section className="max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-16" data-testid="notifications-page">
        <div className="flex items-center justify-between mb-2">
          <p className="label-eyebrow">Inbox</p>
          <button onClick={markAll} className="text-xs uppercase tracking-widest text-brand-body hover:text-brand-ink flex items-center gap-1.5" data-testid="mark-all-btn">
            <Check size={11} /> Mark all read
          </button>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl text-brand-ink leading-none tracking-tight mb-8">Notifications.</h1>

        <div className="flex gap-1 border-b border-brand-line mb-6 overflow-x-auto" data-testid="notification-filters">
          {filters.map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`px-3 py-2.5 text-xs uppercase tracking-widest border-b-2 -mb-px whitespace-nowrap ${filter === f.k ? 'border-brand-ink text-brand-ink font-semibold' : 'border-transparent text-brand-body hover:text-brand-ink'}`}
              data-testid={`notif-filter-${f.k}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="border border-brand-line bg-white p-12 text-center" data-testid="notifications-empty">
            <Bell size={24} className="mx-auto mb-4 text-brand-mute" strokeWidth={1.5} />
            <p className="font-serif text-2xl text-brand-ink">All quiet.</p>
            <p className="text-sm text-brand-body mt-2">No notifications in this view.</p>
          </div>
        ) : (
          <ul className="border border-brand-line bg-white divide-y divide-brand-line">
            {filtered.map((n) => {
              const Icon = iconMap[n.type] || Bell;
              const actor = n.actor ? userById(n.actor) : null;
              return (
                <li key={n.id} className={`relative flex items-start gap-4 p-5 hover:bg-[#F9F9F8] transition-colors ${!n.read ? 'border-l-4 border-brand-blue' : 'border-l-4 border-transparent'}`} data-testid={`notification-${n.id}`}>
                  <div className="w-9 h-9 border border-brand-line bg-brand-paper flex items-center justify-center shrink-0">
                    <Icon size={15} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!n.read ? 'text-brand-ink font-medium' : 'text-brand-body'}`}>{n.text}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {actor && <img src={actor.avatar} alt="" className="w-5 h-5 object-cover" />}
                      <span className="text-[10px] uppercase tracking-widest text-brand-mute">{n.time}</span>
                    </div>
                  </div>
                  {!n.read && (
                    <button onClick={() => markOne(n.id)} className="text-[10px] uppercase tracking-widest text-brand-blue hover:text-brand-ink" data-testid={`mark-read-${n.id}`}>
                      Mark read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
