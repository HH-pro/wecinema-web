"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Plus, Pencil, Trash2, X, Check, AlertTriangle, Server, Calendar } from "lucide-react";
import * as adminService from "@/features/admin/api/adminService";
import type { Domain } from "@/features/admin/types/admin.types";
import toast from "react-hot-toast";

function daysRemaining(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ date }: { date: string }) {
  const days = daysRemaining(date);
  const cls = days <= 30
    ? "border-red-500/30 text-red-400 bg-red-500/10"
    : days <= 90
    ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
    : "border-green-500/30 text-green-400 bg-green-500/10";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${cls}`}>
      {days <= 30 && <AlertTriangle className="w-2.5 h-2.5" />}
      {days > 0 ? `${days}d left` : "Expired"}
    </span>
  );
}

const emptyForm = { name: "", date: "", hostingName: "", hostingDate: "" };

export default function DomainPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Domain | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const raw = await adminService.getDomains();
      const data = Array.isArray(raw) ? raw : (raw as { domains?: Domain[] }).domains ?? [];
      setDomains(data);
    } catch {
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDomains(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (d: Domain) => {
    setEditing(d);
    setForm({
      name: d.domain.name,
      date: (d.domain.date ?? "").split("T")[0] ?? "",
      hostingName: d.hosting.name,
      hostingDate: (d.hosting.date ?? "").split("T")[0] ?? "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutating(true);
    const payload = {
      domain: { name: form.name, date: form.date },
      hosting: { name: form.hostingName, date: form.hostingDate },
    };
    try {
      if (editing) {
        await adminService.updateDomain(editing._id, payload);
        toast.success("Domain updated");
      } else {
        await adminService.saveDomain(payload);
        toast.success("Domain added");
      }
      setFormOpen(false);
      fetchDomains();
    } catch {
      toast.error("Save failed");
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setMutating(true);
    try {
      await adminService.deleteDomain(deleteId);
      toast.success("Domain deleted");
      setDeleteId(null);
      fetchDomains();
    } catch {
      toast.error("Delete failed");
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            Domain & Hosting
          </h1>
          <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">Track domain and hosting expiry dates</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-teal-500/25 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 animate-pulse bg-[var(--ap-surface)] rounded-2xl border border-[var(--ap-border)]" />)}
        </div>
      ) : domains.length === 0 ? (
        <div className="text-center py-16 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl">
          <Globe className="w-10 h-10 text-[var(--ap-text-3)] mx-auto mb-3" />
          <p className="text-[var(--ap-text-3)] font-mono text-sm">No domains tracked yet</p>
          <button onClick={openAdd} className="mt-4 text-teal-400 text-sm font-mono hover:text-teal-300">
            + Add your first domain
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {domains.map((d) => {
            const domainDays = daysRemaining(d.domain.date);
            const hostingDays = daysRemaining(d.hosting.date);
            const isUrgent = domainDays <= 30 || hostingDays <= 30;
            return (
              <motion.div
                key={d._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[var(--ap-surface)] border rounded-2xl p-5 relative ${isUrgent ? "border-red-500/30" : "border-[var(--ap-border)]"}`}
              >
                {isUrgent && (
                  <div className="absolute top-3 right-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                )}
                <h3 className="font-semibold text-[var(--ap-text)] flex items-center gap-2 mb-4 pr-6">
                  <Globe className="w-4 h-4 text-teal-400" />
                  {d.domain.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--ap-text-2)] font-mono">
                      <Globe className="w-3 h-3 text-teal-400" />
                      Domain expiry
                    </div>
                    <div className="text-right">
                      <ExpiryBadge date={d.domain.date} />
                      <p className="text-[10px] text-[var(--ap-text-3)] font-mono mt-0.5">
                        {new Date(d.domain.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[var(--ap-text-2)] font-mono">
                      <Server className="w-3 h-3 text-cyan-400" />
                      {d.hosting.name}
                    </div>
                    <div className="text-right">
                      <ExpiryBadge date={d.hosting.date} />
                      <p className="text-[10px] text-[var(--ap-text-3)] font-mono mt-0.5">
                        {new Date(d.hosting.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--ap-border)]">
                  <button
                    onClick={() => openEdit(d)}
                    className="flex-1 py-1.5 text-xs font-mono rounded-lg bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] hover:bg-blue-500/20 hover:text-blue-400 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(d._id)}
                    className="flex-1 py-1.5 text-xs font-mono rounded-lg bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)] flex items-center gap-2">
                  {editing ? <Pencil className="w-4 h-4 text-teal-400" /> : <Plus className="w-4 h-4 text-teal-400" />}
                  {editing ? "Edit Domain" : "Add Domain"}
                </h3>
                <button onClick={() => setFormOpen(false)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Domain Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-teal-500 font-mono" placeholder="example.com" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Domain Expiry</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-teal-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Hosting Provider</label>
                  <input type="text" value={form.hostingName} onChange={(e) => setForm({ ...form, hostingName: e.target.value })} required className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-teal-500 font-mono" placeholder="AWS, DigitalOcean, etc." />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Hosting Expiry</label>
                  <input type="date" value={form.hostingDate} onChange={(e) => setForm({ ...form, hostingDate: e.target.value })} required className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-teal-500 font-mono" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setFormOpen(false)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">Cancel</button>
                  <button type="submit" disabled={mutating} className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                    {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-semibold text-[var(--ap-text)] mb-2">Delete Domain</h3>
              <p className="text-sm text-[var(--ap-text-2)] mb-5">Remove this domain from tracking?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm">Cancel</button>
                <button onClick={handleDelete} disabled={mutating} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
