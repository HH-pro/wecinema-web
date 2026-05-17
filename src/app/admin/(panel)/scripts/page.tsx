"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Pencil, Trash2, X, Check, AlertCircle, Search, Calendar } from "lucide-react";
import * as adminService from "@/features/admin/api/adminService";
import toast from "react-hot-toast";

interface Script {
  _id: string;
  title: string;
  script: string;
  createdAt: string;
  author?: { _id: string; username: string; avatar?: string };
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filtered, setFiltered] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editScript, setEditScript] = useState<Script | null>(null);
  const [mutating, setMutating] = useState(false);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllScripts();
      const list = (res?.scripts ?? []) as Script[];
      setScripts(list);
      setFiltered(list);
    } catch {
      toast.error("Failed to load scripts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(scripts.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.author?.username?.toLowerCase().includes(q)
    ));
  }, [search, scripts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setMutating(true);
    try {
      await adminService.deleteScript(deleteId);
      toast.success("Script deleted");
      setDeleteId(null);
      fetchScripts();
    } catch {
      toast.error("Delete failed");
    } finally {
      setMutating(false);
    }
  };

  const handleEdit = async () => {
    if (!editScript) return;
    setMutating(true);
    try {
      await adminService.editScript(editScript._id, { title: editScript.title, script: editScript.script });
      toast.success("Script updated");
      setEditScript(null);
      fetchScripts();
    } catch {
      toast.error("Update failed");
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Scripts
          </h1>
          <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">{scripts.length} total scripts</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ap-text-3)]" />
        <input
          type="text"
          placeholder="Search scripts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] placeholder-[var(--ap-text-3)] text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
        />
      </div>

      <div className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-[var(--ap-surface-alt)]" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-[var(--ap-border)]">
                  {["Title", "Preview", "Author", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--ap-text-2)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ap-border)]">
                {filtered.map((script) => (
                  <motion.tr key={script._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[var(--ap-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--ap-text)] max-w-[160px] truncate">{script.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[var(--ap-text-3)] font-mono max-w-[200px] truncate">{script.script}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {script.author?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-[var(--ap-text-2)]">{script.author?.username ?? "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-[var(--ap-text-3)] font-mono">
                        <Calendar className="w-3 h-3" />
                        {new Date(script.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEditScript(script)} className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-blue-500/20 text-[var(--ap-text-2)] hover:text-blue-400 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(script._id)} className="p-1.5 rounded-lg bg-[var(--ap-surface-alt)] hover:bg-red-500/20 text-[var(--ap-text-2)] hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[var(--ap-text-3)] font-mono">No scripts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--ap-text)]">Delete Script</h3>
                  <p className="text-xs text-[var(--ap-text-3)]">This action cannot be undone</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">Cancel</button>
                <button onClick={handleDelete} disabled={mutating} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editScript && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-[var(--ap-text)] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-cyan-400" />
                  Edit Script
                </h3>
                <button onClick={() => setEditScript(null)} className="text-[var(--ap-text-3)] hover:text-[var(--ap-text)]"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Title</label>
                  <input
                    type="text"
                    value={editScript.title}
                    onChange={(e) => setEditScript({ ...editScript, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--ap-text-2)] mb-1.5">Script Content</label>
                  <textarea
                    rows={8}
                    value={editScript.script}
                    onChange={(e) => setEditScript({ ...editScript, script: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--ap-surface-alt)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] text-sm focus:outline-none focus:border-cyan-500 font-mono resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5 pt-4 border-t border-[var(--ap-border)]">
                <button onClick={() => setEditScript(null)} className="flex-1 py-2 rounded-xl bg-[var(--ap-surface-alt)] text-[var(--ap-text-2)] text-sm hover:bg-[var(--ap-hover)] transition-colors">Cancel</button>
                <button onClick={handleEdit} disabled={mutating} className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {mutating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
