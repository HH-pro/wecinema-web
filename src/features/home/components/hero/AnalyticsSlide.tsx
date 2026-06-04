"use client";

import dynamic from "next/dynamic";
import { BarChart3, TrendingUp } from "lucide-react";
import type { AnalyticsGraphs } from "@/features/home/api/analyticsGraphs";

// chart.js (~290 KB) is code-split. The chunk is warmed at page load via
// preloadCharts() (see HeroCarousel), and the graph *data* is preloaded on the
// server — so by the time the user slides here, rendering is instant.
const ChartsImport = () => import("@/features/analytics/components/Charts");

const Charts = dynamic(ChartsImport, {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 200,
        margin: "8px 0",
        borderRadius: 12,
        background: "rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.6)",
        fontSize: 13,
      }}
    >
      Loading charts…
    </div>
  ),
});

/** Warm the chart.js chunk ahead of time so sliding to the slide is smooth. */
export function preloadCharts(): void {
  void ChartsImport();
}

/**
 * Analytics banner slide — renders the original 3 graphs (Genre Trends, Theme
 * Analysis, Ratings Overview) inside the hero carousel, as they were before.
 * Data is server-preloaded and passed in so there's no fetch on mount.
 */
export function AnalyticsSlide({ active, graphs }: { active: boolean; graphs: AnalyticsGraphs }) {
  return (
    <div
      className="hide-scrollbar"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "16px clamp(8px, 3vw, 40px)",
        overflowY: "auto",
        background:
          "radial-gradient(120% 140% at 0% 0%, #3a2a12 0%, #1b1410 55%, #100c0a 100%)",
      }}
    >
      {/* Heading */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, paddingInline: 4 }}>
        <span
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 9999,
            background: "var(--accent-soft)",
            color: "var(--color-accent-primary)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          <BarChart3 size={12} /> Platform Insights
        </span>
        <h2
          style={{
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontSize: "clamp(1.4rem, 3.4vw, 2.1rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#fff",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.025em",
          }}
        >
          What&apos;s Trending on WeCinema
          <TrendingUp size={22} color="var(--color-accent-primary,#FFBB00)" aria-hidden />
        </h2>
        <p style={{ margin: 0, fontSize: "clamp(0.82rem, 1.8vw, 0.95rem)", color: "rgba(255,255,255,0.7)" }}>
          Live genre, theme &amp; ratings analytics across the platform.
        </p>
      </div>

      {active && graphs && (
        <Charts
          preloaded={{ genres: graphs.genres, themes: graphs.themes, ratings: graphs.ratings }}
          dateRange={graphs.range}
        />
      )}
    </div>
  );
}
