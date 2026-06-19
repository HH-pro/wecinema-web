"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import type { AnalyticsGraphs } from "@/features/home/api/analyticsGraphs";
import { CATEGORIES, THEMES, RATINGS } from "@/lib/constants";
import {
  buildCategoryEntries,
  buildLineData,
  buildHeroLineOptions,
  dateRangeDays,
  ensureCanonical,
} from "@/features/analytics/lib/chartData";

// chart.js (~290 KB) is code-split. The chunk is warmed at page load via
// preloadHeroChart() (see HeroSplit); graph data is server-preloaded, so the
// chart paints from data already in the page — no client fetch.
const ChartImport = () => import("@/features/home/components/hero/HeroGraphChart");

const HeroGraphChart = dynamic(ChartImport, {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 10,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
      }}
      className="animate-pulse"
    />
  ),
});

/** Warm the chart.js chunk ahead of time so first paint of the hero graphs is smooth. */
export function preloadHeroChart(): void {
  void ChartImport();
}

interface HeroGraphView {
  key: string;
  title: string;
  data: ReturnType<typeof buildLineData>;
  options: ReturnType<typeof buildHeroLineOptions>;
  top: ReturnType<typeof buildCategoryEntries>;
}

function useHeroGraphViews(graphs: AnalyticsGraphs): HeroGraphView[] {
  return useMemo(() => {
    const fallbackDates = dateRangeDays(graphs.range);

    function buildView(raw: typeof graphs.genres, canonical: readonly string[], key: string, title: string): HeroGraphView {
      const merged = ensureCanonical(raw, canonical);
      const entries = buildCategoryEntries(merged);
      return {
        key,
        title,
        data: buildLineData(merged, fallbackDates, entries),
        options: buildHeroLineOptions(false, 5),
        top: entries.filter((e) => e.total > 0).slice(0, 2),
      };
    }

    return [
      buildView(graphs.genres, CATEGORIES, "genre", "Genre trends"),
      buildView(graphs.themes, THEMES, "theme", "Theme trends"),
      buildView(graphs.ratings, RATINGS, "rating", "Rating trends"),
    ];
  }, [graphs]);
}

/** A single static trend card — one of three shown together in `HeroGraphRow`. */
function HeroGraphCard({ view }: { view: HeroGraphView }) {
  const { title, data, options, top } = view;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 0%",
        minWidth: 0,
        borderRadius: 16,
        padding: "10px 14px 8px",
        background: "rgba(20,16,12,0.62)",
        border: "1px solid rgba(255,187,0,0.22)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 16px 44px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}
    >
      {/* Soft amber brand glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-30%",
          right: "-15%",
          width: "60%",
          height: "120%",
          background: "radial-gradient(closest-side, rgba(255,187,0,0.18), rgba(255,187,0,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "clamp(0.8rem, 1vw, 0.92rem)",
            fontWeight: 800,
            color: "#fff",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.01em",
          }}
        >
          <TrendingUp size={13} aria-hidden style={{ color: "var(--color-accent-primary,#FFBB00)" }} />
          {title}
        </span>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 9999,
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <span className="animate-pulse-custom" style={{ width: 6, height: 6, borderRadius: 9999, background: "#22C55E" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#22C55E", letterSpacing: "0.04em" }}>LIVE</span>
        </span>
      </div>

      <div style={{ position: "relative", height: "clamp(150px, 21vw, 210px)" }}>
        <HeroGraphChart data={data} options={options} />
      </div>

      {top.length > 0 && (
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 6, minHeight: 16 }}>
          {top.map((e) => (
            <span key={e.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 9999,
                  background: e.color ?? "rgba(255,255,255,0.35)",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.78)", whiteSpace: "nowrap" }}>{e.key}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                {e.total.toLocaleString()}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * All three trend charts (genre / theme / rating), shown together in a row.
 * Live data, always visible — the platform-analytics signal is meant to be
 * one of the first things a visitor sees on the homepage.
 */
export function HeroGraphRow({ graphs }: { graphs: AnalyticsGraphs }) {
  const views = useHeroGraphViews(graphs);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        {views.map((v) => (
          <HeroGraphCard key={v.key} view={v} />
        ))}
      </div>
      <Link
        href="/explore"
        className="hover:underline"
        style={{
          alignSelf: "flex-end",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--color-accent-primary,#FFBB00)",
        }}
      >
        Explore trending films <ArrowRight size={13} aria-hidden />
      </Link>
    </div>
  );
}
