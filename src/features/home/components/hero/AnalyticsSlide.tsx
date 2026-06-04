"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { BarChart3, TrendingUp, Film } from "lucide-react";
import type { AnalyticsGraphs } from "@/features/home/api/analyticsGraphs";
import { FeaturedFilmSlide, type HeroFeatured } from "@/features/home/components/hero/PromoSlides";

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

/** Floating pill that toggles between the featured film and the graphs. */
function GraphToggle({ showGraphs, onClick }: { showGraphs: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={showGraphs}
      aria-label={showGraphs ? "Hide graphs and show featured film" : "Show platform graphs"}
      style={{
        position: "absolute",
        top: 14,
        right: 16,
        zIndex: 6,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 9999,
        border: "1px solid rgba(255,187,0,0.5)",
        background: showGraphs ? "rgba(20,16,12,0.55)" : "var(--color-accent-primary)",
        color: showGraphs ? "var(--color-accent-primary)" : "#000",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        backdropFilter: "blur(6px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        transition: "background var(--transition-fast), color var(--transition-fast)",
      }}
    >
      {showGraphs ? <Film size={14} /> : <BarChart3 size={14} />}
      {showGraphs ? "Show Film" : "Show Graphs"}
    </button>
  );
}

/**
 * First hero slide. Defaults to the featured film (video/text). A toggle button
 * reveals the platform graphs (Genre Trends, Theme Analysis, Ratings Overview),
 * hiding the film while shown. Graph data is server-preloaded — no fetch on mount.
 */
export function AnalyticsSlide({
  active,
  graphs,
  film,
}: {
  active: boolean;
  graphs: AnalyticsGraphs;
  film?: HeroFeatured;
}) {
  // Graphs hidden by default; if there's no film to show, fall back to graphs.
  const [showGraphs, setShowGraphs] = useState(!film);
  const toggle = () => setShowGraphs((v) => !v);

  // ── Default state: featured film (video/text), like the other promo slides ──
  if (!showGraphs && film) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <FeaturedFilmSlide film={film} />
        <GraphToggle showGraphs={false} onClick={toggle} />
      </div>
    );
  }

  // ── Graphs state ──
  return (
    <div
      className="hide-scrollbar"
      style={{
        position: "relative",
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
      {/* Soft amber brand glow behind the content for a cinematic hero feel */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "55%",
          height: "120%",
          background:
            "radial-gradient(closest-side, rgba(255,187,0,0.18), rgba(255,187,0,0) 70%)",
          pointerEvents: "none",
          filter: "blur(8px)",
        }}
      />

      {film && <GraphToggle showGraphs onClick={toggle} />}

      {/* Heading */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, paddingInline: 4 }}>
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <Charts
            preloaded={{ genres: graphs.genres, themes: graphs.themes, ratings: graphs.ratings }}
            dateRange={graphs.range}
          />
        </div>
      )}
    </div>
  );
}
