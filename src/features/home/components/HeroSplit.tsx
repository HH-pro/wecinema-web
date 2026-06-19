"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Clapperboard, ShoppingBag, Sparkles, Star, Eye, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { HeroBackdrop } from "@/features/home/components/hero/HeroBackdrop";
import { HeroGraphRow, preloadHeroChart } from "@/features/home/components/hero/HeroGraph";
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

type Slide = { type: "graphs"; id: "graphs" } | { type: "film"; id: string; film: HeroFeatured };

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

const SLIDE_INTERVAL_MS = 6500;
const SLIDE_FADE_MS = 300;

/**
 * Homepage hero — a rotating slider with the live trend charts (genre /
 * theme / rating) as their own dedicated slide, followed by one slide per
 * featured film / red-carpet event. Each slide gets the full hero to
 * itself rather than sharing space, so the charts read as a clear business
 * signal on their slide and each film/event gets full-bleed treatment on
 * its own.
 */
export function HeroSplit({
  featured,
  graphs,
}: {
  featured: HeroFeatured[];
  graphs: AnalyticsGraphs;
}) {
  const slides: Slide[] = [
    { type: "graphs", id: "graphs" },
    ...featured.slice(0, 5).map((film): Slide => ({ type: "film", id: film.id, film })),
  ];

  // Default to the first film slide (not the graphs slide) when one exists —
  // its <h1> carries the page's primary keywords ("Watch, buy & sell
  // independent films"), and this is the only <h1> a crawler or no-JS client
  // sees before the slider's interval advances it.
  const [slideIndex, setSlideIndex] = useState(slides.length > 1 ? 1 : 0);
  const [visible, setVisible] = useState(true);
  const slideIndexRef = useRef(slideIndex);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    slideIndexRef.current = slideIndex;
  }, [slideIndex]);

  const goToSlide = (next: number) => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    setVisible(false);
    fadeTimeoutRef.current = setTimeout(() => {
      setSlideIndex(next);
      setVisible(true);
    }, SLIDE_FADE_MS);
  };

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      goToSlide((slideIndexRef.current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(
    () => () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    },
    []
  );

  const slide = slides[slideIndex] ?? slides[0]!;
  const film = slide.type === "film" ? slide.film : undefined;
  const views = formatViews(film?.views);

  // Warm the chart.js chunk after first paint so the hero graphs render fast.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => preloadHeroChart());
      return () => (w as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(preloadHeroChart, 1200);
    return () => clearTimeout(t);
  }, []);

  const arrowBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 38,
    height: 38,
    borderRadius: 9999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(20,16,12,0.55)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "#fff",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
    transition: "background 150ms ease, transform 150ms ease",
  };

  return (
    <section
      aria-label="Welcome to WeCinema"
      className="relative w-full overflow-hidden lg:min-h-[clamp(360px,34vw,440px)]"
      style={{ backgroundColor: "#100c0a", borderBottom: "1px solid var(--color-divider)" }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goToSlide((slideIndex - 1 + slides.length) % slides.length)}
            className="left-3 min-[1120px]:left-5 hover:!bg-white/20 hover:scale-110 active:scale-95"
            style={arrowBtnStyle}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goToSlide((slideIndex + 1) % slides.length)}
            className="right-3 min-[1120px]:right-5 hover:!bg-white/20 hover:scale-110 active:scale-95"
            style={arrowBtnStyle}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </>
      )}
      {/* Cinematic film backdrop (poster, ken-burns) — only on film slides */}
      {film?.image && (
        <div key={film.id} className="hero-backdrop-fade" style={{ position: "absolute", inset: 0 }}>
          <HeroBackdrop src={film.image} alt="" priority />
        </div>
      )}
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

      {/* Content — each slide gets the full hero to itself */}
      <div
        className="relative flex flex-col justify-center"
        style={{
          maxWidth: "var(--max-content)",
          margin: "0 auto",
          minHeight: "clamp(360px,34vw,440px)",
          gap: "clamp(18px, 3vw, 28px)",
          padding: "clamp(28px, 4vw, 40px) clamp(48px, 6vw, 72px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(4px)",
          transition: `opacity ${SLIDE_FADE_MS}ms ease, transform ${SLIDE_FADE_MS}ms ease`,
        }}
      >
        {slide.type === "graphs" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span
              className="hero-rise hero-rise-1"
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 9999,
                background: "rgba(255,187,0,0.14)",
                border: "1px solid rgba(255,187,0,0.32)",
                color: "var(--color-accent-primary,#FFBB00)",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <TrendingUp size={12} aria-hidden /> Live platform activity
            </span>

            <h1
              className="hero-rise hero-rise-2"
              style={{
                margin: 0,
                fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                color: "#fff",
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.03em",
                textShadow: "0 2px 28px rgba(0,0,0,0.5)",
              }}
            >
              What&apos;s trending on <span style={{ color: "var(--color-accent-primary,#FFBB00)" }}>WeCinema</span>
            </h1>

            <div className="hero-rise hero-rise-3">
              <HeroGraphRow graphs={graphs} />
            </div>
          </div>
        ) : (
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
        )}

        {/* Slide dots — manual navigation across the graphs slide + every featured film/event */}
        {slides.length > 1 && (
          <div className="hero-rise hero-rise-4" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={s.type === "graphs" ? "Show trending charts" : `Show slide ${i + 1}: ${s.film.title}`}
                onClick={() => goToSlide(i)}
                style={{
                  width: i === slideIndex ? 22 : 7,
                  height: 7,
                  borderRadius: 9999,
                  background: i === slideIndex ? "var(--color-accent-primary,#FFBB00)" : "rgba(255,255,255,0.3)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "width 200ms ease, background 200ms ease",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
