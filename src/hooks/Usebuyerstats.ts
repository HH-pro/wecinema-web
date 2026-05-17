"use client";
/**
 * src/hooks/Usebuyerstats.ts
 *
 * Fetches buyer statistics, with fallback calculation from raw orders.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/features/auth/services/apiClient";

// ─── Types ────────────────────────────────────────────────────

export interface MonthlyOrderEntry {
  month:  string;
  count:  number;
  amount: number;
}

export interface BuyerStats {
  totalOrders:       number;
  completedOrders:   number;
  pendingOrders:     number;
  cancelledOrders:   number;
  activeOrders:      number;
  totalSpent:        number;
  monthlySpent:      number;
  averageOrderValue: number;
  successRate:       number;
  favoriteCategory?: string;
  ordersByMonth?:    MonthlyOrderEntry[];
  recentOrders?:     unknown[];
}

interface UseBuyerStatsReturn {
  stats:   BuyerStats | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

const EMPTY_STATS: BuyerStats = {
  totalOrders:       0,
  completedOrders:   0,
  pendingOrders:     0,
  cancelledOrders:   0,
  activeOrders:      0,
  totalSpent:        0,
  monthlySpent:      0,
  averageOrderValue: 0,
  successRate:       0,
};

const ACTIVE_STATUSES = ["paid", "processing", "in_progress", "delivered", "in_revision"] as const;
const PAID_STATUSES   = ["completed", "delivered", "in_progress", "paid", "processing"] as const;

async function computeStatsFromOrders(): Promise<BuyerStats> {
  const res: any = await api.get("/orders/my-orders");
  const orders = (res?.data?.orders ?? res?.orders ?? []) as Array<{
    status:    string;
    amount?:   number;
    createdAt: string;
  }>;

  if (!orders.length) return EMPTY_STATS;

  const totalOrders     = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const pendingOrders   = orders.filter((o) => o.status === "pending_payment").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const activeOrders    = orders.filter((o) =>
    (ACTIVE_STATUSES as readonly string[]).includes(o.status)
  ).length;

  const paidOrders = orders.filter((o) =>
    (PAID_STATUSES as readonly string[]).includes(o.status)
  );

  const totalSpent = paidOrders.reduce((s, o) => s + (o.amount ?? 0), 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlySpent = orders
    .filter((o) =>
      new Date(o.createdAt) >= thirtyDaysAgo &&
      (PAID_STATUSES as readonly string[]).includes(o.status)
    )
    .reduce((s, o) => s + (o.amount ?? 0), 0);

  const averageOrderValue = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0;
  const successRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  return {
    totalOrders, completedOrders, pendingOrders, cancelledOrders, activeOrders,
    totalSpent, monthlySpent, averageOrderValue, successRate,
  };
}

export function useBuyerStats(): UseBuyerStatsReturn {
  const [stats,   setStats]   = useState<BuyerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get("/orders/buyer-stats");
      if (!isMounted.current) return;
      if (res.success && res.data) {
        const d = res.data as any;
        if (d.stats) {
          if (Array.isArray(d.stats)) {
            const t = d.totals ?? {};
            setStats({
              totalOrders:       t.totalOrders       ?? 0,
              completedOrders:   t.completedOrders   ?? 0,
              pendingOrders:     t.pendingOrders     ?? 0,
              cancelledOrders:   t.cancelledOrders   ?? 0,
              activeOrders:      t.activeOrders      ?? 0,
              totalSpent:        t.totalSpent        ?? 0,
              monthlySpent:      0,
              averageOrderValue: t.totalSpent && t.totalOrders > 0 ? t.totalSpent / t.totalOrders : 0,
              successRate:       t.totalOrders > 0 ? ((t.completedOrders ?? 0) / t.totalOrders) * 100 : 0,
            });
          } else {
            setStats(d.stats as BuyerStats);
          }
        } else {
          setStats(d as BuyerStats);
        }
      } else {
        const fallback = await computeStatsFromOrders();
        if (isMounted.current) setStats(fallback);
      }
    } catch {
      try {
        const fallback = await computeStatsFromOrders();
        if (isMounted.current) setStats(fallback);
      } catch (fallbackErr: unknown) {
        if (!isMounted.current) return;
        setError(fallbackErr instanceof Error ? fallbackErr.message : "Failed to load statistics");
        setStats(EMPTY_STATS);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, [fetch]);

  return { stats, loading, error, refetch: fetch };
}
