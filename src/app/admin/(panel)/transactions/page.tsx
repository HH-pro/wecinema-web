"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Search, DollarSign, Clock, Hash, TrendingUp } from "lucide-react";
import * as adminService from "@/features/admin/api/adminService";
import type { Transaction } from "@/features/admin/types/admin.types";
import toast from "react-hot-toast";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllTransactions()
      .then((raw) => {
        const data = Array.isArray(raw) ? raw : (raw as { transactions?: Transaction[] }).transactions ?? [];
        setTransactions(data);
        setFiltered(data);
      })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      transactions.filter(t =>
        t.username?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.orderId?.toLowerCase().includes(q) ||
        t.amount?.toString().includes(q)
      )
    );
  }, [search, transactions]);

  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Transactions
          </h1>
          <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">{transactions.length} total transactions</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--ap-text-3)] font-mono">Total Revenue</p>
          <p className="text-xl font-bold text-emerald-400 font-mono">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Transactions", value: transactions.length, icon: Hash, color: "text-purple-400" },
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Avg. Transaction", value: transactions.length ? `$${(totalRevenue / transactions.length).toFixed(2)}` : "$0", icon: TrendingUp, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-[var(--ap-surface-alt)]">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-[var(--ap-text-3)] font-mono">{label}</p>
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ap-text-3)]" />
        <input
          type="text"
          placeholder="Search by user, email, or order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-xl text-[var(--ap-text)] placeholder-[var(--ap-text-3)] text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="space-y-px">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse bg-[var(--ap-surface-alt)]" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-[var(--ap-border)]">
                  {["User", "Order ID", "Amount", "Currency", "Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono font-semibold text-[var(--ap-text-2)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ap-border)]">
                {filtered.map((t) => (
                  <motion.tr key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-[var(--ap-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--ap-text)]">{t.username}</p>
                      <p className="text-[10px] text-[var(--ap-text-3)] font-mono">{t.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-[var(--ap-text-2)] max-w-[140px] truncate" title={t.orderId}>{t.orderId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-400 font-mono">{t.amount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-[var(--ap-text-2)] uppercase">{t.currency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-[var(--ap-text-3)] font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(t.createdAt || t.timestamp || "").toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border border-green-500/30 text-green-400 bg-green-500/10">
                        COMPLETED
                      </span>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--ap-text-3)] font-mono">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
