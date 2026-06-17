import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/layout/AdminShell";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowUpRight, ArrowDownRight, MessageSquare, Users as UsersIcon, MessagesSquare, Flag, Download, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { timeAgo, activityChart } from "@/lib/mockData";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [userList, setUserList] = useState<any[]>([]);
  const [recentQs, setRecentQs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not moderator/admin
    if (user && user.role !== "admin" && user.role !== "moderator") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, usersRes, questionsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/questions", { params: { limit: 5 } }),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (usersRes.data.success) {
          setUserList(usersRes.data.data.users || []);
        }
        if (questionsRes.data.success) {
          setRecentQs(questionsRes.data.data.questions || []);
        }
      } catch (err: any) {
        console.error("Failed to fetch admin dashboard data:", err);
        toast.error(err.response?.data?.error?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <AdminShell eyebrow="Console / overview" title="Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-white border border-brand-line">
          <Loader2 className="animate-spin text-brand-blue" size={32} />
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-mute">Loading dashboard console...</p>
        </div>
      </AdminShell>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return (
      <AdminShell eyebrow="Console / overview" title="Access Denied">
        <div className="max-w-md mx-auto py-16 text-center">
          <p className="text-brand-body mb-8">You do not have permission to view the administrator panel.</p>
          <Link to="/" className="bg-brand-ink text-brand-paper px-6 py-3 text-sm">Back to Home</Link>
        </div>
      </AdminShell>
    );
  }

  const totalQuestions = stats?.totals?.questions || 0;
  const totalAnswers = stats?.totals?.answers || 0;
  const totalUsers = stats?.totals?.users || 0;
  const pendingReports = stats?.totals?.pendingReports || 0;

  const metrics = [
    { k: "Questions", v: totalQuestions.toLocaleString(), delta: "+12.4%", up: true, icon: MessageSquare },
    { k: "Answers", v: totalAnswers.toLocaleString(), delta: "+8.1%", up: true, icon: MessagesSquare },
    { k: "Members", v: totalUsers.toLocaleString(), delta: "+4.2%", up: true, icon: UsersIcon },
    { k: "Flagged", v: pendingReports.toString(), delta: "-22%", up: false, icon: Flag },
  ];

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
            {recentQs.slice(0, 5).map((q) => {
              const qVotes = q.upvoteCount !== undefined ? q.upvoteCount : (q.votes || 0);
              const qAnswers = q.answerCount !== undefined ? q.answerCount : (q.answers || 0);
              
              return (
                <li key={q._id || q.id} className="px-6 py-4 hover:bg-[#F9F9F8]">
                  <Link to={`/q/${q.slug || q._id}`} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-brand-ink truncate font-medium">{q.title}</p>
                      <p className="text-[10px] uppercase tracking-widest text-brand-mute mt-1">
                        {q.category || (q.tags && q.tags[0]) || "general"} · {qAnswers} answers · {timeAgo(q.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs tabular-nums shrink-0">{qVotes} ▲</span>
                  </Link>
                </li>
              );
            })}
            {recentQs.length === 0 && (
              <li className="px-6 py-4 text-center text-sm text-brand-mute">No questions found.</li>
            )}
          </ul>
        </div>

        <div className="border border-brand-line bg-white" data-testid="recent-users-block">
          <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
            <p className="label-eyebrow">New members</p>
            <Link to="/admin/users" className="text-xs uppercase tracking-widest text-brand-blue hover:text-brand-ink">Manage →</Link>
          </div>
          <ul className="divide-y divide-brand-line">
            {userList.slice(0, 5).map((u) => {
              const uAvatar = u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName || "U")}`;
              const rep = u.reputationScore !== undefined ? u.reputationScore : (u.reputation || 0);
              const joinedString = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "";

              return (
                <li key={u._id || u.id} className="px-6 py-3.5 flex items-center gap-3">
                  <img src={uAvatar} alt="" className="w-9 h-9 object-cover rounded-full border border-brand-line" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-brand-ink">{u.displayName}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-mute">
                      {u.title || u.role || "Contributor"} · {joinedString}
                    </p>
                  </div>
                  <span className="font-sans font-semibold text-base tabular-nums">
                    {rep >= 1000 ? `${(rep/1000).toFixed(1)}k` : rep}
                  </span>
                </li>
              );
            })}
            {userList.length === 0 && (
              <li className="px-6 py-4 text-center text-sm text-brand-mute">No members found.</li>
            )}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
