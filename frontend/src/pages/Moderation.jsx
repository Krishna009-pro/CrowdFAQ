import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { reports as initial, questions, questionById, userById, timeAgo } from "@/lib/mockData";
import { Check, X, Trash2, Filter, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Moderation() {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState("pending");

  const filtered = items.filter((r) => r.status === tab);

  const act = (id, action) => {
    setItems(items.map((r) => r.id === id ? { ...r, status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'resolved' } : r));
    toast.success(`Report ${action}d.`);
  };

  const counts = {
    pending: items.filter((r) => r.status === 'pending').length,
    approved: items.filter((r) => r.status === 'approved').length,
    rejected: items.filter((r) => r.status === 'rejected').length,
    resolved: items.filter((r) => r.status === 'resolved').length,
  };

  return (
    <AdminShell
      eyebrow="Trust & safety"
      title="Reports & Moderation"
      actions={
        <button className="border border-brand-line px-4 py-2.5 text-sm hover:border-brand-ink flex items-center gap-2" data-testid="mod-filter-btn">
          <Filter size={14} /> Filter
        </button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-line border border-brand-line mb-px">
        {[
          { k: "pending", label: "Pending", v: counts.pending, color: "text-brand-vermilion" },
          { k: "approved", label: "Approved", v: counts.approved, color: "text-brand-forest" },
          { k: "rejected", label: "Rejected", v: counts.rejected, color: "text-brand-mute" },
          { k: "resolved", label: "Resolved", v: counts.resolved, color: "text-brand-blue" },
        ].map((s) => (
          <button key={s.k} onClick={() => setTab(s.k)} className={`bg-white p-5 text-left transition-colors hover:bg-[#F9F9F8] ${tab === s.k ? 'ring-1 ring-brand-ink ring-inset' : ''}`} data-testid={`mod-tab-${s.k}`}>
            <p className="label-eyebrow">{s.label}</p>
            <p className={`font-serif text-4xl mt-2 ${s.color}`}>{s.v}</p>
          </button>
        ))}
      </div>

      <div className="border border-brand-line bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-brand-mute border-b border-brand-line">
              <th className="px-6 py-3 font-medium">Flagged item</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Reason</th>
              <th className="px-6 py-3 font-medium">Reporter</th>
              <th className="px-6 py-3 font-medium">When</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-16 text-center" data-testid="mod-empty">
                <Check size={24} className="mx-auto text-brand-forest mb-3" />
                <p className="font-serif text-2xl text-brand-ink">Inbox zero.</p>
                <p className="text-sm text-brand-body mt-1">No items in this queue.</p>
              </td></tr>
            )}
            {filtered.map((r) => {
              const target = r.type === 'question' ? questionById(r.target) : questions[0];
              const reporter = userById(r.reporter);
              return (
                <tr key={r.id} className="border-b border-brand-line last:border-b-0 hover:bg-[#F9F9F8]" data-testid={`report-${r.id}`}>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-brand-ink truncate">{target?.title || 'Answer content'}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-mute mt-0.5">#{r.target}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="border border-brand-line px-2 py-0.5 text-[10px] uppercase tracking-widest">{r.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-brand-vermilion">
                      <AlertTriangle size={12} /> {r.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <img src={reporter.avatar} alt="" className="w-7 h-7 object-cover" />
                      <span className="text-brand-body">{reporter.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-brand-mute text-xs">{r.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button className="w-8 h-8 border border-brand-line hover:border-brand-ink flex items-center justify-center" title="View" data-testid={`view-${r.id}`}><Eye size={13} /></button>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => act(r.id, 'approve')} className="w-8 h-8 border border-brand-line text-brand-forest hover:bg-[#E8F0ED]" title="Approve" data-testid={`approve-${r.id}`}><Check size={13} /></button>
                          <button onClick={() => act(r.id, 'reject')} className="w-8 h-8 border border-brand-line text-brand-mute hover:bg-[#F0F0EE]" title="Reject" data-testid={`reject-${r.id}`}><X size={13} /></button>
                          <button onClick={() => act(r.id, 'delete')} className="w-8 h-8 border border-brand-line text-brand-vermilion hover:bg-[#FBEAE6]" title="Delete" data-testid={`delete-${r.id}`}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
