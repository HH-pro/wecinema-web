import type { ChartData, ChartOptions } from "chart.js";
import type { GraphData, GraphDateParams } from "@/types";

/**
 * Pure data + option builders shared by the full analytics dashboard
 * (`Charts.tsx`) and the homepage hero graph (`HeroGraph.tsx`). No React, no
 * chart.js registration side-effects — just transforms over `GraphData`.
 */

// ─── Color palettes ───────────────────────────────────────────────────────────

export const LINE_COLORS = [
  "#FFBB00", "#3B82F6", "#22C55E", "#8B5CF6",
  "#F59E0B", "#EF4444", "#06B6D4", "#EC4899",
];

export const DONUT_COLORS = [
  "#FFBB00", "#22C55E", "#3B82F6", "#E6B450",
  "#8B5CF6", "#EF4444", "#06B6D4", "#F472B6",
];

export const TOP_LINE_COUNT = 5;

export interface CategoryEntry {
  key: string;
  total: number;
  color: string | null; // non-null = drawn as a chart line in this color
}

// ─── Date helpers ───────────────────────────────────────────────────────────

export function defaultDateRange(): GraphDateParams {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 90);
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dateRangeDays(params?: GraphDateParams): string[] {
  const to = params?.to ? new Date(params.to + "T00:00:00") : new Date();
  const from = params?.from ? new Date(params.from + "T00:00:00") : (() => {
    const d = new Date(to);
    d.setDate(d.getDate() - 90);
    return d;
  })();
  const out: string[] = [];
  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().split("T")[0];
    if (iso) out.push(iso);
  }
  return out;
}

// ─── Aggregation ───────────────────────────────────────────────────────────

export function aggregateTotals(raw: GraphData): { key: string; total: number }[] {
  return Object.entries(raw)
    .map(([key, dates]) => ({
      key,
      total: Object.values(dates).reduce((s, v) => s + (v ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

export function ensureCanonical(raw: GraphData | null, canonical: readonly string[]): GraphData {
  const merged: GraphData = { ...(raw ?? {}) };
  for (const key of canonical) if (!merged[key]) merged[key] = {};
  return merged;
}

export function buildCategoryEntries(raw: GraphData): CategoryEntry[] {
  return aggregateTotals(raw).map((item, idx) => ({
    key: item.key,
    total: item.total,
    color: idx < TOP_LINE_COUNT ? LINE_COLORS[idx % LINE_COLORS.length] ?? null : null,
  }));
}

export function buildDoughnutEntries(raw: GraphData): CategoryEntry[] {
  return aggregateTotals(raw).map((item, idx) => ({
    key: item.key,
    total: item.total,
    color: DONUT_COLORS[idx % DONUT_COLORS.length] ?? null,
  }));
}

// ─── Chart.js data shapes ───────────────────────────────────────────────────

export function buildLineData(
  raw: GraphData,
  fallbackDates: string[],
  entries: CategoryEntry[],
): ChartData<"line"> {
  const fromData = Array.from(
    new Set(Object.values(raw).flatMap((d) => Object.keys(d))),
  );
  const allDates = (fromData.length ? fromData : fallbackDates).sort();
  const drawn = entries.filter((e) => e.color);
  return {
    labels: allDates.map(formatDateLabel),
    datasets: drawn.map((item, idx) => {
      const color = item.color as string;
      return {
        label: item.key,
        data: allDates.map((d) => raw[item.key]?.[d] ?? 0),
        borderColor: color,
        backgroundColor: idx === 0 ? `${color}22` : "transparent",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: "#fff",
        fill: idx === 0,
      };
    }),
  };
}

export function buildDoughnutData(entries: CategoryEntry[]): ChartData<"doughnut"> {
  const sum = entries.reduce((s, e) => s + e.total, 0);
  if (sum === 0) {
    // Render a single muted ring so the chart visually exists when there's no data.
    return {
      labels: ["No data"],
      datasets: [
        {
          data: [1],
          backgroundColor: ["var(--color-skeleton-base,#E5E5E5)"],
          borderColor: "transparent",
          borderWidth: 0,
          hoverOffset: 0,
        },
      ],
    };
  }
  return {
    labels: entries.map((e) => e.key),
    datasets: [
      {
        data: entries.map((e) => e.total),
        backgroundColor: entries.map((e) => e.color ?? "#E5E5E5"),
        borderColor: "transparent",
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };
}

// ─── Chart.js options ───────────────────────────────────────────────────────

function getCSSVar(prop: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || fallback;
}

export function buildLineOptions(mobile: boolean, maxTicks: number): ChartOptions<"line"> {
  const tick = getCSSVar("--color-text-tertiary", "#909090");
  const grid = getCSSVar("--color-divider", "#E5E5E5") + "44";
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        padding: 12,
        cornerRadius: 8,
        borderColor: "rgba(148,163,184,0.12)",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString()} views`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: tick,
          font: { size: mobile ? 8 : 10 },
          maxRotation: 0,
          maxTicksLimit: maxTicks,
        },
      },
      y: {
        grid: { color: grid },
        border: { display: false },
        beginAtZero: true,
        ticks: {
          color: tick,
          font: { size: mobile ? 8 : 10 },
          callback: (v) => {
            const n = Number(v);
            return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : n;
          },
        },
      },
    },
  };
}

export function buildDoughnutOptions(): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        titleColor: "#f1f5f9",
        bodyColor: "#94a3b8",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed.toLocaleString()} views`,
        },
      },
    },
  };
}

/**
 * Dark-themed line options for the always-dark homepage hero. The hero is dark
 * regardless of the site light/dark theme, so axis/grid colors are hardcoded
 * rather than read from theme tokens.
 */
export function buildHeroLineOptions(mobile: boolean, maxTicks: number): ChartOptions<"line"> {
  const base = buildLineOptions(mobile, maxTicks);
  const tick = "rgba(255,255,255,0.45)";
  const grid = "rgba(255,255,255,0.08)";
  return {
    ...base,
    scales: {
      x: {
        ...base.scales?.x,
        grid: { display: false },
        border: { display: false },
        ticks: { ...base.scales?.x?.ticks, color: tick },
      },
      y: {
        ...base.scales?.y,
        grid: { color: grid },
        border: { display: false },
        beginAtZero: true,
        ticks: { ...base.scales?.y?.ticks, color: tick },
      },
    },
  };
}
