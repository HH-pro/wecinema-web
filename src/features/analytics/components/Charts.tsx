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
  type ChartData,
} from "chart.js";
import type { GraphData, GraphDateParams } from "@/types";
import { CATEGORIES, THEMES, RATINGS } from "@/lib/constants";
import {
  type CategoryEntry,
  defaultDateRange,
  dateRangeDays,
  ensureCanonical,
  buildCategoryEntries,
  buildDoughnutEntries,
  buildLineData,
  buildDoughnutData,
  buildLineOptions,
  buildDoughnutOptions,
} from "@/features/analytics/lib/chartData";

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
  /**
   * Optional server-preloaded graph data. When provided, the charts render
   * immediately from this data and skip the client-side fetch (no loading
   * flicker when sliding to the analytics banner).
   */
  preloaded?: {
    genres?: GraphData;
    themes?: GraphData;
    ratings?: GraphData;
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
    background: a ? "var(--color-accent-primary,#FFBB00)" : "var(--color-border-primary,#D4D4D4)",
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

function useGraph(endpoint: string, params?: GraphDateParams, initial?: GraphData): GraphState {
  const hasInitial = initial !== undefined;
  const [state, setState] = useState<GraphState>(
    hasInitial
      ? { data: initial, loading: false, error: null }
      : { data: null, loading: true, error: null },
  );

  useEffect(() => {
    // Server-preloaded — no client fetch needed.
    if (hasInitial) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetchGraph(endpoint, params)
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((e: Error) => { if (!cancelled) setState({ data: null, loading: false, error: e.message }); });
    return () => { cancelled = true; };
  }, [endpoint, params?.from, params?.to, hasInitial]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const opts = useMemo(() => buildDoughnutOptions(), []);
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

const Charts: React.FC<ChartsProps> = ({ isMobile = false, dateRange, preloaded }) => {
  const params = useMemo(() => dateRange ?? defaultDateRange(), [dateRange]);
  const genreR = useGraph("/video/genres/graph", params, preloaded?.genres);
  const themeR = useGraph("/video/themes/graph", params, preloaded?.themes);
  const ratingR = useGraph("/video/ratings/graph", params, preloaded?.ratings);

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
          accentColor="#FFBB00"
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
      accentColor="#FFBB00"
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
