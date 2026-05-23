"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import { ChevronLeft, ChevronRight, Wifi } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Filler,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import type { GraphData, GraphDateParams } from "@/types";
import { CATEGORIES, THEMES, RATINGS } from "@/lib/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  LineController,
  PointElement,
  Filler,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartsProps {
  isMobile?: boolean;
  dateRange?: GraphDateParams;
}

function defaultDateRange(): GraphDateParams {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 90);
  return { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] };
}

// ─── Color palettes ───────────────────────────────────────────────────────────

const LINE_COLORS = [
  "#FF6B00", "#3B82F6", "#22C55E", "#8B5CF6",
  "#F59E0B", "#EF4444", "#06B6D4", "#EC4899",
];

const DONUT_COLORS = [
  "#FF6B00", "#22C55E", "#3B82F6", "#E6B450",
  "#8B5CF6", "#EF4444", "#06B6D4", "#F472B6",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function aggregateTotals(raw: GraphData): { key: string; total: number }[] {
  return Object.entries(raw)
    .map(([key, dates]) => ({
      key,
      total: Object.values(dates).reduce((s, v) => s + (v ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

function ensureCanonical(raw: GraphData | null, canonical: readonly string[]): GraphData {
  const merged: GraphData = { ...(raw ?? {}) };
  for (const key of canonical) if (!merged[key]) merged[key] = {};
  return merged;
}

function dateRangeDays(params?: GraphDateParams): string[] {
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

const TOP_LINE_COUNT = 5;

interface CategoryEntry {
  key: string;
  total: number;
  color: string | null; // non-null = drawn as a chart line in this color
}

function buildCategoryEntries(raw: GraphData): CategoryEntry[] {
  return aggregateTotals(raw).map((item, idx) => ({
    key: item.key,
    total: item.total,
    color: idx < TOP_LINE_COUNT ? LINE_COLORS[idx % LINE_COLORS.length] ?? null : null,
  }));
}

function buildLineData(raw: GraphData, fallbackDates: string[], entries: CategoryEntry[]): ChartData<"line"> {
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

function buildDoughnutEntries(raw: GraphData): CategoryEntry[] {
  return aggregateTotals(raw).map((item, idx) => ({
    key: item.key,
    total: item.total,
    color: DONUT_COLORS[idx % DONUT_COLORS.length] ?? null,
  }));
}

function buildDoughnutData(entries: CategoryEntry[]): ChartData<"doughnut"> {
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

function getCSSVar(prop: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim() || fallback;
}

function buildLineOptions(mobile: boolean, maxTicks: number): ChartOptions<"line"> {
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

function buildDoughnutOptions(_mobile: boolean): ChartOptions<"doughnut"> {
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  skeleton: { display: "flex", flexDirection: "column" as const, gap: "16px", padding: "16px" },
  skelCard: {
    borderRadius: "16px",
    background: "var(--color-bg-secondary,#F9F9F0)",
    padding: "20px",
    border: "1px solid var(--color-border-secondary,#E5E5E5)",
  },
  skelRow: (w: string) => ({
    height: "11px",
    borderRadius: "6px",
    background: "var(--color-skeleton-base,#E5E5E5)",
    width: w,
    marginBottom: "8px",
  }),
  skelChart: {
    height: "150px",
    borderRadius: "12px",
    background: "var(--color-skeleton-base,#E5E5E5)",
    marginTop: "12px",
    opacity: 0.45,
  },
  card: (active: boolean, mobile: boolean) => ({
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: "16px",
    background: "var(--color-bg-elevated,#FFF)",
    border: `1px solid ${active ? "var(--color-border-primary,#D4D4D4)" : "var(--color-border-secondary,#E5E5E5)"}`,
    boxShadow: active ? "0 2px 16px rgba(0,0,0,0.06)" : "none",
    opacity: active ? 1 : 0.55,
    transition: "all 0.25s",
    overflow: "hidden",
    ...(mobile ? { minWidth: "calc(100vw - 48px)", scrollSnapAlign: "center" as const } : {}),
  }),
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px 10px",
  },
  iconBox: (color: string) => ({
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
    background: `${color}18`,
    border: `1.5px solid ${color}28`,
  }),
  cardTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "var(--color-text-primary,#0F0F0F)",
    fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
  },
  cardSub: { fontSize: "0.68rem", color: "var(--color-text-tertiary,#909090)", marginTop: "2px" },
  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 9px",
    borderRadius: "9999px",
    background: "#22C55E12",
    border: "1px solid #22C55E25",
  },
  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "9999px",
    background: "#22C55E",
    animation: "livePulse 2s ease-in-out infinite",
  },
  liveText: { fontSize: "0.6rem", fontWeight: 600, color: "#22C55E" },
  chartArea: (h: number) => ({ padding: "4px 16px 8px", height: h }),
  legendGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: "4px 10px",
    padding: "8px 14px 10px",
    borderTop: "1px solid var(--color-divider,#E5E5E5)",
    maxHeight: "92px",
    overflowY: "auto" as const,
    scrollbarWidth: "thin" as const,
  },
  legendItem: (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.7rem",
    color: active ? "var(--color-text-secondary,#606060)" : "var(--color-text-tertiary,#909090)",
    opacity: active ? 1 : 0.7,
    minWidth: 0,
  }),
  legendDot: (color: string | null) => ({
    width: "8px",
    height: "8px",
    borderRadius: "9999px",
    flexShrink: 0,
    background: color ?? "transparent",
    border: color ? "none" : "1.5px solid var(--color-border-primary,#D4D4D4)",
  }),
  legendName: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  legendCount: { fontWeight: 600, fontVariantNumeric: "tabular-nums" as const },
  noData: {
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "var(--color-text-tertiary,#909090)",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 18px",
    borderTop: "1px solid var(--color-divider,#E5E5E5)",
  },
  footerText: { fontSize: "0.675rem", color: "var(--color-text-tertiary,#909090)" },
  footerBadge: (color: string) => ({
    fontSize: "0.625rem",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "9999px",
    background: `${color}15`,
    color,
  }),
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
    gap: "16px",
    padding: "16px",
  },
  sliderHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px 8px",
  },
  sliderBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "9999px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--color-border-secondary,#E5E5E5)",
    background: "var(--color-bg-elevated,#FFF)",
    color: "var(--color-text-secondary,#606060)",
    cursor: "pointer",
  },
  sliderTitle: { fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary,#0F0F0F)" },
  sliderStrip: {
    display: "flex",
    gap: "12px",
    padding: "0 16px 4px",
    overflowX: "auto" as const,
    scrollSnapType: "x mandatory" as const,
    scrollBehavior: "smooth" as const,
    scrollbarWidth: "none" as const,
  },
  dots: { display: "flex", justifyContent: "center", gap: "6px", marginTop: "10px" },
  dot: (a: boolean) => ({
    width: a ? "18px" : "6px",
    height: "6px",
    borderRadius: "9999px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    background: a ? "var(--color-accent-primary,#FF6B00)" : "var(--color-border-primary,#D4D4D4)",
  }),
  error: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    textAlign: "center" as const,
  },
  errorIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "var(--color-danger-bg,#FEF2F2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },
  errorTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--color-text-primary,#0F0F0F)",
    marginBottom: "4px",
  },
  errorSub: { fontSize: "0.75rem", color: "var(--color-text-tertiary,#909090)" },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api")
    : "/api";

async function fetchGraph(endpoint: string, params?: GraphDateParams): Promise<GraphData> {
  const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
  if (params?.from) url.searchParams.set("from", params.from);
  if (params?.to) url.searchParams.set("to", params.to);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  return (json.data ?? json) as GraphData;
}

interface GraphState {
  data: GraphData | null;
  loading: boolean;
  error: string | null;
}

function useGraph(endpoint: string, params?: GraphDateParams): GraphState {
  const [state, setState] = useState<GraphState>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetchGraph(endpoint, params)
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((e: Error) => { if (!cancelled) setState({ data: null, loading: false, error: e.message }); });
    return () => { cancelled = true; };
  }, [endpoint, params?.from, params?.to]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChartSkeleton: React.FC = () => (
  <>
    <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    <div style={S.skeleton}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={S.skelCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div
              style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--color-skeleton-base,#E5E5E5)" }}
            />
            <div style={{ flex: 1 }}>
              <div style={S.skelRow("130px")} />
              <div style={S.skelRow("80px")} />
            </div>
          </div>
          <div style={S.skelChart} />
        </div>
      ))}
    </div>
  </>
);

const LineCard: React.FC<{
  title: string;
  icon: string;
  accentColor: string;
  subtitle: string;
  data: ChartData<"line"> | null;
  isMobile: boolean;
  isActive?: boolean;
  entries: CategoryEntry[];
  maxTicks: number;
}> = ({ title, icon, accentColor, subtitle, data, isMobile, isActive = true, entries, maxTicks }) => {
  const opts = useMemo(() => buildLineOptions(isMobile, maxTicks), [isMobile, maxTicks]);
  const height = isMobile ? 140 : 160;
  const drawnCount = entries.filter((e) => e.color).length;

  return (
    <div style={S.card(isActive, isMobile)}>
      <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={S.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={S.iconBox(accentColor)}>{icon}</div>
          <div>
            <p style={S.cardTitle}>{title}</p>
            <p style={S.cardSub}>{subtitle}</p>
          </div>
        </div>
        <div style={S.liveBadge}>
          <span style={S.liveDot} />
          <span style={S.liveText}>Live</span>
        </div>
      </div>
      <div style={S.chartArea(height)}>
        {data ? (
          <Line data={data} options={opts} />
        ) : (
          <div style={S.noData}>
            <Wifi size={22} style={{ opacity: 0.35 }} />
            <span style={{ fontSize: "0.75rem" }}>No data yet</span>
          </div>
        )}
      </div>
      <div style={S.legendGrid}>
        {entries.map((e) => (
          <div key={e.key} style={S.legendItem(e.total > 0)} title={`${e.key}: ${e.total.toLocaleString()}`}>
            <span style={S.legendDot(e.color)} />
            <span style={S.legendName}>{e.key}</span>
            <span style={S.legendCount}>{e.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {!isMobile && (
        <div style={S.footer}>
          <span style={S.footerText}>
            Top <strong>{drawnCount}</strong> of {entries.length} categories
          </span>
          <span style={S.footerBadge(accentColor)}>90-day trend</span>
        </div>
      )}
    </div>
  );
};

const DonutCard: React.FC<{
  title: string;
  icon: string;
  accentColor: string;
  data: ChartData<"doughnut"> | null;
  isMobile: boolean;
  isActive?: boolean;
  entries: CategoryEntry[];
}> = ({ title, icon, accentColor, data, isMobile, isActive = true, entries }) => {
  const opts = useMemo(() => buildDoughnutOptions(isMobile), [isMobile]);
  const height = isMobile ? 140 : 160;
  const activeCount = entries.filter((e) => e.total > 0).length;

  return (
    <div style={S.card(isActive, isMobile)}>
      <div style={S.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={S.iconBox(accentColor)}>{icon}</div>
          <div>
            <p style={S.cardTitle}>{title}</p>
            <p style={S.cardSub}>Content distribution</p>
          </div>
        </div>
        <div style={S.liveBadge}>
          <span style={S.liveDot} />
          <span style={S.liveText}>Live</span>
        </div>
      </div>
      <div style={S.chartArea(height)}>
        {data ? (
          <Doughnut data={data} options={opts} />
        ) : (
          <div style={S.noData}>
            <Wifi size={22} style={{ opacity: 0.35 }} />
            <span style={{ fontSize: "0.75rem" }}>No data yet</span>
          </div>
        )}
      </div>
      <div style={S.legendGrid}>
        {entries.map((e) => (
          <div key={e.key} style={S.legendItem(e.total > 0)} title={`${e.key}: ${e.total.toLocaleString()}`}>
            <span style={S.legendDot(e.total > 0 ? e.color : null)} />
            <span style={S.legendName}>{e.key}</span>
            <span style={S.legendCount}>{e.total.toLocaleString()}</span>
          </div>
        ))}
      </div>
      {!isMobile && (
        <div style={S.footer}>
          <span style={S.footerText}>
            <strong>{activeCount}</strong> of {entries.length} ratings active
          </span>
          <span style={S.footerBadge(accentColor)}>Analytics</span>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Charts: React.FC<ChartsProps> = ({ isMobile = false, dateRange }) => {
  const params = useMemo(() => dateRange ?? defaultDateRange(), [dateRange]);
  const genreR = useGraph("/video/genres/graph", params);
  const themeR = useGraph("/video/themes/graph", params);
  const ratingR = useGraph("/video/ratings/graph", params);

  const loading = genreR.loading || themeR.loading || ratingR.loading;
  const err = genreR.error ?? themeR.error ?? ratingR.error;

  const maxTicks = isMobile ? 4 : 7;
  const fallbackDates = useMemo(() => dateRangeDays(params), [params]);

  const genreMerged = useMemo(() => ensureCanonical(genreR.data, CATEGORIES), [genreR.data]);
  const themeMerged = useMemo(() => ensureCanonical(themeR.data, THEMES), [themeR.data]);
  const ratingMerged = useMemo(() => ensureCanonical(ratingR.data, RATINGS), [ratingR.data]);

  const genreEntries = useMemo(() => buildCategoryEntries(genreMerged), [genreMerged]);
  const themeEntries = useMemo(() => buildCategoryEntries(themeMerged), [themeMerged]);
  const ratingEntries = useMemo(() => buildDoughnutEntries(ratingMerged), [ratingMerged]);

  const genreData = useMemo(
    () => buildLineData(genreMerged, fallbackDates, genreEntries),
    [genreMerged, fallbackDates, genreEntries],
  );
  const themeData = useMemo(
    () => buildLineData(themeMerged, fallbackDates, themeEntries),
    [themeMerged, fallbackDates, themeEntries],
  );
  const ratingData = useMemo(() => buildDoughnutData(ratingEntries), [ratingEntries]);

  const [slide, setSlide] = useState(0);
  const touchX = useRef(0);
  const touchT = useRef(0);
  const goTo = useCallback((i: number) => setSlide(((i % 3) + 3) % 3), []);

  if (loading) return <ChartSkeleton />;

  if (err) {
    return (
      <div style={S.error}>
        <div style={S.errorIcon}>
          <Wifi size={22} style={{ color: "var(--color-danger,#EF4444)" }} />
        </div>
        <p style={S.errorTitle}>Failed to load analytics</p>
        <p style={S.errorSub}>{err}</p>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div style={S.grid}>
        <LineCard
          title="Genre Trends"
          icon="🎬"
          accentColor="#FF6B00"
          subtitle="Views over time by genre"
          data={genreData}
          isMobile={false}
          entries={genreEntries}
          maxTicks={maxTicks}
        />
        <LineCard
          title="Theme Analysis"
          icon="🎯"
          accentColor="#22C55E"
          subtitle="Views over time by theme"
          data={themeData}
          isMobile={false}
          entries={themeEntries}
          maxTicks={maxTicks}
        />
        <DonutCard
          title="Ratings Overview"
          icon="⭐"
          accentColor="#3B82F6"
          data={ratingData}
          isMobile={false}
          entries={ratingEntries}
        />
      </div>
    );
  }

  // Mobile: swipeable slider
  const cards = [
    <LineCard
      key="genre"
      title="Genre Trends"
      icon="🎬"
      accentColor="#FF6B00"
      subtitle="Views by genre"
      data={genreData}
      isMobile
      isActive={slide === 0}
      entries={genreEntries}
      maxTicks={maxTicks}
    />,
    <LineCard
      key="theme"
      title="Theme Analysis"
      icon="🎯"
      accentColor="#22C55E"
      subtitle="Views by theme"
      data={themeData}
      isMobile
      isActive={slide === 1}
      entries={themeEntries}
      maxTicks={maxTicks}
    />,
    <DonutCard
      key="rating"
      title="Ratings Overview"
      icon="⭐"
      accentColor="#3B82F6"
      data={ratingData}
      isMobile
      isActive={slide === 2}
      entries={ratingEntries}
    />,
  ];

  return (
    <div style={{ paddingBottom: "36px" }}>
      <div style={S.sliderHeader}>
        <button onClick={() => goTo(slide - 1)} style={S.sliderBtn} aria-label="Previous">
          <ChevronLeft size={16} />
        </button>
        <span style={S.sliderTitle}>
          {["🎬 Genre Trends", "🎯 Theme Analysis", "⭐ Ratings Overview"][slide]}
        </span>
        <button onClick={() => goTo(slide + 1)} style={S.sliderBtn} aria-label="Next">
          <ChevronRight size={16} />
        </button>
      </div>
      <div
        style={S.sliderStrip}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? 0;
          touchT.current = Date.now();
        }}
        onTouchEnd={(e) => {
          const dx = touchX.current - (e.changedTouches[0]?.clientX ?? 0);
          if (Math.abs(dx) > 40 && Date.now() - touchT.current < 600) goTo(slide + (dx > 0 ? 1 : -1));
        }}
      >
        {cards}
      </div>
      <div style={S.dots}>
        {[0, 1, 2].map((i) => (
          <button key={i} onClick={() => goTo(i)} style={S.dot(i === slide)} aria-label={`Chart ${i + 1}`} />
        ))}
      </div>
    </div>
  );
};

export default Charts;
