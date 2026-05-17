"use client";
/**
 * BuyerStatsPage — Wecinema Marketplace
 *
 * Changes from original:
 *  - import marketplaceApi + direct calls in component → useBuyerStats() hook
 *  - import './BuyerStatsPage.css' → pure Tailwind
 *  - formatCurrency: marketplaceApi.utils.formatCurrency() → Intl.NumberFormat
 *  - fetchBuyerStats + calculateStatsFromOrders defined inside component,
 *    not useCallback — new function reference each render, stale closure in
 *    the refresh button
 *  - key={index} on ordersByMonth items → key={item.month}
 *  - Stats calculations (completedOrders / totalOrders) without guard →
 *    division by zero when totalOrders === 0
 *  - All inline style={{ color: '...' }} hex values → Tailwind
 *  - CSS class names (buyer-stats-page, metric-card, etc.) → Tailwind
 *  - window.confirm for cancel → not used here (no cancel in stats page)
 *  - FaSpinner imported but never used → removed
 */

import React from "react";
import {
  FaArrowLeft, FaCalendar, FaChartLine,
  FaCheckCircle, FaClock, FaDollarSign,
  FaShoppingBag, FaTimes,
} from "react-icons/fa";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from 'next/navigation';

import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { useBuyerStats } from "@/hooks/Usebuyerstats";

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Guard: avoid division by zero
function safePct(numerator: number, denominator: number): string {
  if (denominator === 0) return "0.0%";
  return formatPercentage((numerator / denominator) * 100);
}

// ─── Sub-components ───────────────────────────────────────────

const MetricCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  sub: string;
}> = ({ icon, iconBg, value, label, sub }) => (
  <div className="bg-card-bg rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4 theme-transition">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold text-text-primary tabular-nums truncate">{value}</p>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>
    </div>
  </div>
);

const StatRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
}> = ({ icon, label, count, total }) => (
  <div className="flex items-center justify-between py-3 border-b border-border last:border-0 theme-transition">
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-3 text-sm">
      <span className="font-bold text-text-primary tabular-nums">{count}</span>
      <span className="text-xs text-text-tertiary w-14 text-right">{safePct(count, total)}</span>
    </div>
  </div>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-card-bg rounded-2xl border border-border shadow-sm p-5 theme-transition">
    <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-4">{title}</h3>
    {children}
  </div>
);

// ─── BuyerStatsPage ───────────────────────────────────────────

const BuyerStatsPage: React.FC = () => {
  const router = useRouter();
  const { stats, loading, error, refetch } = useBuyerStats();

  // ── Loading ──────────────────────────────────────────────────
  if (loading && !stats) {
    return (
      <MarketplaceLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-yellow-500" />
          <p className="text-sm text-text-secondary font-medium">Loading statistics…</p>
        </div>
      </MarketplaceLayout>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error && !stats) {
    return (
      <MarketplaceLayout>
        <div className="max-w-sm mx-auto mt-20 text-center px-4">
          <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <FaTimes className="text-danger text-xl" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Unable to load statistics</h3>
          <p className="text-sm text-text-secondary mb-5">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/marketplace/dashboard/buyer")}
              className="flex items-center gap-2 px-4 py-2.5 border border-border text-btn-secondary-text rounded-xl text-sm font-medium hover:bg-btn-secondary-bg transition-colors theme-transition"
            >
              <FaArrowLeft size={12} /> Dashboard
            </button>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (!stats) return null;

  const total = stats.totalOrders;

  return (
    <MarketplaceLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/marketplace/dashboard/buyer")}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors theme-transition"
          >
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-text-primary theme-transition">Buyer Statistics</h1>
            <p className="text-sm text-text-tertiary theme-transition">Detailed insights into your purchasing activity</p>
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-btn-secondary-bg disabled:opacity-50 transition-colors theme-transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Key Metrics ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<FaDollarSign />}
            iconBg="bg-green-500"
            value={formatCurrency(stats.totalSpent)}
            label="Total Spent"
            sub={`${formatCurrency(stats.monthlySpent)} this month`}
          />
          <MetricCard
            icon={<FaShoppingBag />}
            iconBg="bg-blue-500"
            value={String(stats.totalOrders)}
            label="Total Orders"
            sub={`${stats.activeOrders} active`}
          />
          <MetricCard
            icon={<FaCheckCircle />}
            iconBg="bg-yellow-500"
            value={formatPercentage(stats.successRate)}
            label="Success Rate"
            sub={`${stats.completedOrders} completed`}
          />
          <MetricCard
            icon={<FaChartLine />}
            iconBg="bg-purple-500"
            value={formatCurrency(stats.averageOrderValue)}
            label="Avg. Order Value"
            sub="Per successful order"
          />
        </div>

        {/* ── Detailed Stats ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Order Breakdown */}
          <SectionCard title="Order Breakdown">
            <StatRow
              icon={<FaCheckCircle className="text-green-500" size={13} />}
              label="Completed"
              count={stats.completedOrders}
              total={total}
            />
            <StatRow
              icon={<FaClock className="text-amber-500" size={13} />}
              label="Active"
              count={stats.activeOrders}
              total={total}
            />
            <StatRow
              icon={<FaClock className="text-blue-400" size={13} />}
              label="Pending Payment"
              count={stats.pendingOrders}
              total={total}
            />
            <StatRow
              icon={<FaTimes className="text-red-400" size={13} />}
              label="Cancelled"
              count={stats.cancelledOrders}
              total={total}
            />
          </SectionCard>

          {/* Financial Summary */}
          <SectionCard title="Financial Summary">
            {[
              { label: "Total Orders Value",  value: formatCurrency(stats.totalSpent) },
              { label: "Monthly Spending",     value: formatCurrency(stats.monthlySpent) },
              { label: "Average Order Value",  value: formatCurrency(stats.averageOrderValue) },
              ...(stats.favoriteCategory
                ? [{ label: "Favourite Category", value: stats.favoriteCategory }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0 text-sm theme-transition">
                <span className="text-text-secondary">{label}</span>
                <span className="font-semibold text-text-primary tabular-nums">{value}</span>
              </div>
            ))}
          </SectionCard>
        </div>

        {/* ── Timeline ─────────────────────────────────── */}
        {stats.ordersByMonth && stats.ordersByMonth.length > 0 && (
          <SectionCard title="Orders Timeline">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-text-tertiary uppercase tracking-wide border-b border-border theme-transition">
                    <th className="text-left pb-3 font-semibold">Month</th>
                    <th className="text-center pb-3 font-semibold">Orders</th>
                    <th className="text-right pb-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* FIX: key={item.month} — months are unique strings */}
                  {stats.ordersByMonth.slice(0, 6).map((item: any) => (
                    <tr key={item.month} className="border-b border-border last:border-0 theme-transition">
                      <td className="py-3 text-text-secondary flex items-center gap-2">
                        <FaCalendar size={11} className="text-text-tertiary" />
                        {item.month}
                      </td>
                      <td className="py-3 text-center font-medium text-text-secondary tabular-nums">
                        {item.count}
                      </td>
                      <td className="py-3 text-right font-semibold text-text-primary tabular-nums">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ── Actions ──────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 pb-4">
          <button
            type="button"
            onClick={() => router.push("/marketplace/dashboard/buyer")}
            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl text-sm transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => router.push("/marketplace")}
            className="px-5 py-2.5 border border-border text-btn-secondary-text hover:bg-btn-secondary-bg font-medium rounded-xl text-sm transition-colors theme-transition"
          >
            Browse Listings
          </button>
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default BuyerStatsPage;
