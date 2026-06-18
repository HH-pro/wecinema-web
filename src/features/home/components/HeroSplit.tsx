"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Play, Clapperboard, ShoppingBag, Sparkles, Star, Eye } from "lucide-react";
import { HeroBackdrop } from "@/features/home/components/hero/HeroBackdrop";
import { HeroGraph, preloadHeroChart } from "@/features/home/components/hero/HeroGraph";
import type { AnalyticsGraphs } from "@/features/home/api/analyticsGraphs";

export interface HeroFeatured {
  id: string;
  title: string;
  tagline?: string;
  href: string;
  image: string;
  /** Playable (signed) video URL — unused by the split hero backdrop, kept for parity. */
  video?: string;
  redCarpet: boolean;
  genre?: string;
  rating?: string;
  views?: number;
}

function formatViews(n?: number): string | null {
  if (!n || n <= 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "13px 26px",
  borderRadius: 12,
  background: "var(--color-accent-primary,#FFBB00)",
  color: "var(--color-btn-primary-text,#000)",
  fontWeight: 700,
  fontSize: 15,
  textDecoration: "none",
  boxShadow: "0 8px 28px rgba(255,187,0,0.32)",
};
const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "13px 26px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  fontWeight: 600,
  fontSize: 15,
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.28)",
  backdropFilter: "blur(6px)",
};
const metaChip: React.CSSProperties = {
  padding: "4px 11px",
  borderRadius: 9999,
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  backdropFilter: "blur(4px)",
};

/**
 * Homepage hero — a fixed split layout: cinematic film backdrop + a
 * viewers-first content column on the left, and an always-on live platform
 * graph on the right. Replaces the old rotating carousel so the graphs (a
 * client priority) are permanently front-and-center. No toggle, no rotation.
 */
export function HeroSplit({
  featured,
  graphs,
}: {
  featured: HeroFeatured[];
  graphs: AnalyticsGraphs;
}) {
  const film = featured[0];
  const views = formatViews(film?.views);

  // Warm the chart.js chunk after first paint so the hero graph renders fast.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => preloadHeroChart());
      return () => (w as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(preloadHeroChart, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      aria-label="Welcome to WeCinema"
      className="relative w-full overflow-hidden lg:min-h-[clamp(480px,52vw,620px)]"
      style={{ backgroundColor: "#100c0a", borderBottom: "1px solid var(--color-divider)" }}
    >
      {/* Cinematic film backdrop (poster, ken-burns) + legibility overlays */}
      {film?.image && <HeroBackdrop src={film.image} alt="" priority />}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(8,6,5,0.94) 0%, rgba(8,6,5,0.82) 40%, rgba(8,6,5,0.62) 100%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(0deg, rgba(8,6,5,0.55) 0%, transparent 55%)",
        }}
      />

      {/* Content grid */}
      <div
        className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12"
        style={{
          maxWidth: "var(--max-content)",
          margin: "0 auto",
          padding: "clamp(40px, 6vw, 68px) var(--space-section-x)",
        }}
      >
        {/* Left — viewers-first */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 600 }}>
          {film && (
            <Link
              href={film.href}
              className="hero-rise hero-rise-1 hover:!bg-white/15"
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px 6px 8px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#fff",
                textDecoration: "none",
                fontSize: 12.5,
                fontWeight: 600,
                backdropFilter: "blur(4px)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  background: film.redCarpet
                    ? "linear-gradient(135deg,#E11D48,#FFBB00)"
                    : "var(--color-accent-primary,#FFBB00)",
                  color: film.redCarpet ? "#fff" : "#000",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {film.redCarpet ? <Sparkles size={11} /> : <Play size={10} fill="currentColor" />}
                {film.redCarpet ? "Red Carpet" : "Now featured"}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                {film.title}
              </span>
            </Link>
          )}

          <h1
            className="hero-rise hero-rise-2"
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 800,
              lineHeight: 1.04,
              color: "#fff",
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.03em",
              textShadow: "0 2px 28px rgba(0,0,0,0.5)",
            }}
          >
            Watch, buy &amp; sell <span style={{ color: "var(--color-accent-primary,#FFBB00)" }}>independent films</span>
          </h1>

          <p
            className="hero-rise hero-rise-3"
            style={{
              margin: 0,
              fontSize: "clamp(0.98rem, 2vw, 1.15rem)",
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.86)",
              maxWidth: 520,
            }}
          >
            Stream original films and scripts, discover new creators, and trade work on a
            marketplace built for independent cinema.
          </p>

          {(film?.genre || film?.rating || views) && (
            <div className="hero-rise hero-rise-3" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {film?.genre && <span style={metaChip}>{film.genre}</span>}
              {film?.rating && (
                <span style={{ ...metaChip, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Star size={11} fill="currentColor" /> {film.rating}
                </span>
              )}
              {views && (
                <span style={{ ...metaChip, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Eye size={12} /> {views}
                </span>
              )}
            </div>
          )}

          {/* Primary CTAs */}
          <div className="hero-rise hero-rise-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            <Link href="/explore" style={primaryBtn} className="hover:!brightness-110">
              <Play size={16} fill="currentColor" /> Start Watching
            </Link>
            <Link href="/marketplace/browse" style={ghostBtn} className="hover:!bg-white/20">
              <ShoppingBag size={16} /> Explore Marketplace
            </Link>
          </div>

          {/* Secondary, supply-side links — subordinate to the viewer CTAs */}
          <div
            className="hero-rise hero-rise-4"
            style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", fontSize: 13.5, color: "rgba(255,255,255,0.72)" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Clapperboard size={14} aria-hidden /> Are you a creator?
            </span>
            <Link href="/marketplace/listings/new" className="hover:!text-white hover:underline" style={{ color: "var(--color-accent-primary,#FFBB00)", fontWeight: 600 }}>
              Sell your film
            </Link>
            <Link href="/upload/script" className="hover:!text-white hover:underline" style={{ color: "var(--color-accent-primary,#FFBB00)", fontWeight: 600 }}>
              Upload a script
            </Link>
          </div>
        </div>

        {/* Right — always-on live graph */}
        <div className="hero-rise hero-rise-3">
          <HeroGraph graphs={graphs} />
        </div>
      </div>
    </section>
  );
}
