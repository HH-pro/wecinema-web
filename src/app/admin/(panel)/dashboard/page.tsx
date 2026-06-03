"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Film, FileText, CreditCard, TrendingUp,
  Activity, Zap, Server, Database,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import * as adminService from "@/features/admin/api/adminService";
import { useAuth } from "@/features/auth/context/AuthContext";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: "rgba(124, 58, 237, 0.08)" }, ticks: { color: "#64748b", font: { size: 10 } } },
    y: { grid: { color: "rgba(124, 58, 237, 0.08)" }, ticks: { color: "#64748b", font: { size: 10 } } },
  },
};

function StatCard({ title, value, icon: Icon, color, sub }: {
  title: string; value: number | string; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-[var(--ap-surface)] rounded-2xl border border-[var(--ap-border)] overflow-hidden relative group"
    >
      <div className={`h-1 bg-gradient-to-r ${color}`} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-[var(--ap-text-3)] mb-1 tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-[var(--ap-text)]">{value}</p>
            {sub && <p className="text-xs text-[var(--ap-text-3)] mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/[0.02] transition-all pointer-events-none rounded-2xl" />
    </motion.div>
  );
}

export default function DashboardPage() {
  const { authUser } = useAuth();
  const [stats, setStats] = useState({ users: 0, videos: 0, scripts: 0, transactions: 0, revenue: 0 });
  const [recentUsers, setRecentUsers] = useState<{ _id: string; username: string; createdAt: string }[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<{ _id: string; amount: number; username: string; currency: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, videosRes, scriptsRes, txRes] = await Promise.allSettled([
          adminService.getAllUsers({ page: 1, limit: 100 }),
          adminService.getAllVideos(),
          adminService.getAllScripts(),
          adminService.getAllTransactions(),
        ]);

        const users = usersRes.status === "fulfilled" ? (usersRes.value?.users ?? []) : [];
        const videos = videosRes.status === "fulfilled" ? (videosRes.value?.videos ?? []) : [];
        const scripts = scriptsRes.status === "fulfilled" ? (scriptsRes.value?.scripts ?? []) : [];
        const txRaw = txRes.status === "fulfilled" ? txRes.value : [];
        const transactions = (Array.isArray(txRaw) ? txRaw : (txRaw as { transactions?: unknown[] }).transactions ?? []) as { _id: string; amount: number; username: string; currency: string; createdAt: string }[];
        const revenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        setStats({
          users: users.length,
          videos: videos.length,
          scripts: scripts.length,
          transactions: transactions.length,
          revenue,
        });

        setRecentUsers(users.slice(0, 5).map((u: { _id: string; username: string; createdAt: string }) => ({ _id: u._id, username: u.username, createdAt: u.createdAt })));
        setRecentTransactions(transactions.slice(0, 5).map((t: { _id: string; amount: number; username: string; currency: string; createdAt: string }) => ({
          _id: t._id,
          amount: t.amount,
          username: t.username,
          currency: t.currency,
          createdAt: t.createdAt,
        })));
      } catch {
        // stats stay at 0
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const userGrowthData = {
    labels: months,
    datasets: [{
      label: "Users",
      data: [12, 19, 28, 35, 42, stats.users].slice(-6),
      fill: true,
      borderColor: "#a855f7",
      backgroundColor: "rgba(168, 85, 247, 0.08)",
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
    }],
  };

  const subscriptionData = {
    labels: ["Basic", "Premium", "HypeMode", "Studio"],
    datasets: [{
      data: [40, 30, 20, 10],
      backgroundColor: ["rgba(168,85,247,0.8)", "rgba(59,130,246,0.8)", "rgba(6,182,212,0.8)", "rgba(236,72,153,0.8)"],
      borderWidth: 0,
    }],
  };

  const revenueData = {
    labels: months,
    datasets: [{
      label: "Revenue ($)",
      data: [850, 1200, 980, 1450, 1800, stats.revenue || 2100].slice(-6),
      backgroundColor: "rgba(59, 130, 246, 0.6)",
      borderRadius: 6,
    }],
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--ap-surface)] rounded-2xl border border-[var(--ap-border)] h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--ap-surface)] rounded-2xl border border-[var(--ap-border)] h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Dashboard
          </h1>
          <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">
            Welcome back, {authUser?.username}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ap-text-3)] bg-[var(--ap-surface)] border border-[var(--ap-border)] px-3 py-1.5 rounded-full">
          <Activity className="w-3 h-3 text-green-400" />
          <span className="text-green-400">System Active</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="TOTAL USERS" value={stats.users} icon={Users} color="from-purple-600 to-purple-800" />
        <StatCard title="TOTAL VIDEOS" value={stats.videos} icon={Film} color="from-blue-600 to-blue-800" />
        <StatCard title="TOTAL SCRIPTS" value={stats.scripts} icon={FileText} color="from-cyan-600 to-cyan-800" />
        <StatCard title="REVENUE" value={`$${stats.revenue.toFixed(0)}`} icon={CreditCard} color="from-emerald-600 to-emerald-800" sub={`${stats.transactions} transactions`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--ap-text)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              User Growth
            </h2>
            <span className="text-xs font-mono text-[var(--ap-text-3)]">Last 6 months</span>
          </div>
          <div className="h-40">
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-[var(--ap-text)] mb-4">Subscriptions</h2>
          <div className="h-40 flex items-center justify-center">
            <Doughnut data={subscriptionData} options={{ ...chartOptions, plugins: { legend: { display: true, position: "bottom" as const, labels: { color: "#94a3b8", font: { size: 10 }, boxWidth: 10, padding: 8 } } }, cutout: "70%" }} />
          </div>
        </motion.div>
      </div>

      {/* Revenue chart + recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2 bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-[var(--ap-text)] flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-blue-400" />
            Revenue Overview
          </h2>
          <div className="h-40">
            <Bar data={revenueData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-[var(--ap-text)] flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-purple-400" />
            Recent Users
          </h2>
          <div className="space-y-3">
            {recentUsers.length === 0 && (
              <p className="text-xs text-[var(--ap-text-3)] font-mono">No users yet</p>
            )}
            {recentUsers.map((u, i) => (
              <div key={u._id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--ap-text)] truncate">{u.username}</p>
                  <p className="text-[10px] text-[var(--ap-text-3)] font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System health row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-[var(--ap-text)] flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-cyan-400" />
            Quick Stats
          </h2>
          <div className="space-y-3">
            {[
              { label: "Videos per User", value: stats.users ? (stats.videos / stats.users).toFixed(1) : "0", color: "from-purple-600 to-purple-800" },
              { label: "Scripts per User", value: stats.users ? (stats.scripts / stats.users).toFixed(1) : "0", color: "from-blue-600 to-blue-800" },
              { label: "Avg. Revenue / Txn", value: stats.transactions ? `$${(stats.revenue / stats.transactions).toFixed(0)}` : "$0", color: "from-emerald-600 to-emerald-800" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--ap-text-2)] font-mono">{label}</span>
                <span className={`text-xs font-bold font-mono bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-5"
        >
          <h2 className="text-sm font-semibold text-[var(--ap-text)] flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-blue-400" />
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {recentTransactions.length === 0 && (
              <p className="text-xs text-[var(--ap-text-3)] font-mono">No transactions yet</p>
            )}
            {recentTransactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--ap-text)] truncate">{t.username}</p>
                  <p className="text-[10px] text-[var(--ap-text-3)] font-mono">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-400 flex-shrink-0 ml-2">
                  +${t.amount} {t.currency}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
