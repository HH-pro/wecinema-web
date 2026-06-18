"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrendingUp, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

/** Warm the chart.js chunk ahead of time so first paint of the hero graph is smooth. */
export function preloadHeroChart(): void {
  void ChartImport();
}

const ROTATE_INTERVAL_MS = 2000;
const FADE_MS = 250;

/**
 * Always-on hero graph. Cycles between genre, theme, and rating trend lines
 * in a dark glassmorphic card, auto-advancing every 2s with a soft crossfade;
 * arrow buttons let the visitor switch graphs manually. The hero is always
 * dark regardless of the site theme, so styling is hardcoded rather than
 * read from theme tokens.
 */
export function HeroGraph({ graphs }: { graphs: AnalyticsGraphs }) {
  const views = useMemo(() => {
    const fallbackDates = dateRangeDays(graphs.range);

    function buildView(raw: typeof graphs.genres, canonical: readonly string[], label: string) {
      const merged = ensureCanonical(raw, canonical);
      const entries = buildCategoryEntries(merged);
      return {
        label,
        data: buildLineData(merged, fallbackDates, entries),
        options: buildHeroLineOptions(false, 6),
        top: entries.filter((e) => e.total > 0).slice(0, 3),
      };
    }

    return [
      buildView(graphs.genres, CATEGORIES, "genre"),
      buildView(graphs.themes, THEMES, "theme"),
      buildView(graphs.ratings, RATINGS, "rating"),
    ];
  }, [graphs]);

  // Auto-advance through genre -> theme -> rating every 2s with a soft
  // crossfade. Buttons let the visitor step manually without waiting.
  const [viewIndex, setViewIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const viewIndexRef = useRef(viewIndex);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    viewIndexRef.current = viewIndex;
  }, [viewIndex]);

  const goToView = (next: number) => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    setVisible(false);
    fadeTimeoutRef.current = setTimeout(() => {
      setViewIndex(next);
      setVisible(true);
    }, FADE_MS);
  };

  useEffect(() => {
    if (views.length <= 1) return undefined;
    const id = setInterval(() => {
      goToView((viewIndexRef.current + 1) % views.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [views.length]);

  useEffect(
    () => () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    },
    []
  );

  const current = views[viewIndex] ?? views[0]!;
  const { data, options, top, label } = current;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        padding: "18px 18px 14px",
        background: "rgba(20,16,12,0.55)",
        border: "1px solid rgba(255,187,0,0.22)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
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
          background: "radial-gradient(closest-side, rgba(255,187,0,0.20), rgba(255,187,0,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--color-accent-primary,#FFBB00)",
            }}
          >
            <TrendingUp size={13} aria-hidden /> Trending now
          </span>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: "clamp(1.05rem, 1.6vw, 1.3rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: "#fff",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.02em",
            }}
          >
            What&apos;s trending on WeCinema
          </h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            Top {label}s by views · last 90 days
          </p>
        </div>

        {/* Live badge */}
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 9999,
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <span className="animate-pulse-custom" style={{ width: 6, height: 6, borderRadius: 9999, background: "#22C55E" }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#22C55E", letterSpacing: "0.04em" }}>LIVE</span>
        </span>
      </div>

      {/* Chart + legend fade together when switching genre / theme / rating */}
      <div
        style={{
          position: "relative",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        }}
      >
        <div style={{ position: "relative", height: "clamp(150px, 22vw, 200px)" }}>
          <HeroGraphChart data={data} options={options} />
        </div>

        {top.length > 0 && (
          <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12, minHeight: 18 }}>
            {top.map((e) => (
              <span key={e.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    background: e.color ?? "rgba(255,255,255,0.35)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", whiteSpace: "nowrap" }}>{e.key}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                  {e.total.toLocaleString()}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Genre / theme / rating switcher — auto-advances every 2s, arrows step manually */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 14 }}>
        <button
          type="button"
          aria-label="Previous graph"
          onClick={() => goToView((viewIndex - 1 + views.length) % views.length)}
          className="hover:scale-110 active:scale-95"
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 9999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,187,0,0.12)",
            border: "1px solid rgba(255,187,0,0.35)",
            color: "var(--color-accent-primary,#FFBB00)",
            cursor: "pointer",
            transition: "transform 150ms ease, background 150ms ease",
          }}
        >
          <ChevronLeft size={14} aria-hidden />
        </button>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {views.map((v, i) => (
            <button
              key={v.label}
              type="button"
              aria-label={`Show ${v.label} graph`}
              onClick={() => goToView(i)}
              style={{
                width: i === viewIndex ? 18 : 6,
                height: 6,
                borderRadius: 9999,
                background: i === viewIndex ? "var(--color-accent-primary,#FFBB00)" : "rgba(255,255,255,0.25)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "width 200ms ease, background 200ms ease",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next graph"
          onClick={() => goToView((viewIndex + 1) % views.length)}
          className="hover:scale-110 active:scale-95"
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 9999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,187,0,0.12)",
            border: "1px solid rgba(255,187,0,0.35)",
            color: "var(--color-accent-primary,#FFBB00)",
            cursor: "pointer",
            transition: "transform 150ms ease, background 150ms ease",
          }}
        >
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>

      {/* Footer link */}
      <div style={{ position: "relative", display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Link
          href="/explore"
          className="hover:underline"
          style={{
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
    </div>
  );
}
