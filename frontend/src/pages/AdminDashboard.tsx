import { Link } from "react-router-dom";
import { AdminShell } from "@/components/layout/AdminShell";
import { adminStats, activityChart, users, questions, timeAgo, userById } from "@/lib/mockData";
import { ArrowUpRight, ArrowDownRight, MessageSquare, Users as UsersIcon, MessagesSquare, Flag, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const metrics = [
  { k: "Questions", v: adminStats.totalQuestions.toLocaleString(), delta: "+12.4%", up: true, icon: MessageSquare },
  { k: "Answers", v: adminStats.totalAnswers.toLocaleString(), delta: "+8.1%", up: true, icon: MessagesSquare },
  { k: "Members", v: adminStats.totalUsers.toLocaleString(), delta: "+4.2%", up: true, icon: UsersIcon },
  { k: "Flagged", v: adminStats.flagged.toString(), delta: "-22%", up: false, icon: Flag },
];

export default function AdminDashboard() {
  return (
    <AdminShell
      eyebrow="Console / overview"
      title="Dashboard"
      actions={
        <>
          <button className="hidden sm:inline-flex border border-brand-line px-4 py-2.5 text-sm hover:border-brand-ink items-center gap-2" data-testid="admin-export-btn">
            <Download size={14} /> Export
          </button>
          <Link to="/ask" className="bg-brand-ink text-brand-paper px-4 py-2.5 text-sm hover:bg-brand-blue" data-testid="admin-quick-action">New post</Link>
        </>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-line border border-brand-line" data-testid="admin-metrics">
        {metrics.map((m) => (
          <div key={m.k} className="bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="label-eyebrow">{m.k}</p>
              <m.icon size={16} className="text-brand-mute" strokeWidth={1.5} />
            </div>
            <p className="font-sans font-semibold text-4xl md:text-5xl text-brand-ink leading-none">{m.v}</p>
            <div className={`mt-3 flex items-center gap-1.5 text-xs ${m.up ? 'text-brand-forest' : 'text-brand-vermilion'}`}>
              {m.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {m.delta} <span className="text-brand-mute">vs. last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-px bg-brand-line border border-brand-line mt-px">
        <div className="bg-white p-6 lg:col-span-2">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="label-eyebrow mb-1">Trend</p>
              <h3 className="font-serif text-2xl text-brand-ink">Activity, past 7 days</h3>
            </div>
            <div className="flex gap-3 text-xs uppercase tracking-widest text-brand-body">
              <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-brand-blue" />Answers</span>
              <span className="flex items-center gap-2"><span className="w-3 h-0.5 bg-brand-vermilion" />Questions</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={activityChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#EAEAE5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A8A85' }} axisLine={{ stroke: '#E6E6E1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8A8A85' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #111110', background: '#fff', fontSize: 12 }} />
              <Line type="monotone" dataKey="answers" stroke="#004B87" strokeWidth={2} dot={{ r: 3, fill: '#004B87' }} />
              <Line type="monotone" dataKey="questions" stroke="#D9381E" strokeWidth={2} dot={{ r: 3, fill: '#D9381E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6">
          <p className="label-eyebrow mb-1">Health</p>
          <h3 className="font-serif text-2xl text-brand-ink mb-5">This week</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={activityChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#EAEAE5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A8A85' }} axisLine={{ stroke: '#E6E6E1' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8A8A85' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 0, border: '1px solid #111110', background: '#fff', fontSize: 12 }} />
              <Bar dataKey="views" fill="#111110" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-10">
        <div className="border border-brand-line bg-white" data-testid="recent-questions-block">
          <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
            <p className="label-eyebrow">Recent questions</p>
            <Link to="/" className="text-xs uppercase tracking-widest text-brand-blue hover:text-brand-ink">View all →</Link>
          </div>
          <ul className="divide-y divide-brand-line">
            {questions.slice(0, 5).map((q) => (
              <li key={q.id} className="px-6 py-4 hover:bg-[#F9F9F8]">
                <Link to={`/q/${q.slug}`} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-brand-ink truncate font-medium">{q.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-mute mt-1">{q.category} · {q.answers} answers · {timeAgo(q.createdAt)}</p>
                  </div>
                  <span className="text-xs tabular-nums shrink-0">{q.votes} ▲</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-brand-line bg-white" data-testid="recent-users-block">
          <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
            <p className="label-eyebrow">New members</p>
            <Link to="/admin/users" className="text-xs uppercase tracking-widest text-brand-blue hover:text-brand-ink">Manage →</Link>
          </div>
          <ul className="divide-y divide-brand-line">
            {users.map((u) => (
              <li key={u.id} className="px-6 py-3.5 flex items-center gap-3">
                <img src={u.avatar} alt="" className="w-9 h-9 object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-ink">{u.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-brand-mute">{u.title} · {u.joined}</p>
                </div>
                <span className="font-sans font-semibold text-base tabular-nums">{(u.reputation/1000).toFixed(1)}k</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
