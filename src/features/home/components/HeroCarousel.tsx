"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  FeaturedFilmSlide,
  MarketplaceSlide,
  CreatorSlide,
  type HeroFeatured,
} from "@/features/home/components/hero/PromoSlides";
import { AnalyticsSlide, preloadCharts } from "@/features/home/components/hero/AnalyticsSlide";
import type { AnalyticsGraphs } from "@/features/home/api/analyticsGraphs";

const ROTATE_MS = 6500;

interface HeroCarouselProps {
  featured: HeroFeatured[];
  graphs: AnalyticsGraphs;
  /** Real film thumbnails used as cinematic collage backdrops on promo slides. */
  posters?: string[];
}

export function HeroCarousel({ featured, graphs, posters = [] }: HeroCarouselProps) {
  // Build slide list. Featured film slide only when we actually have a film.
  // Order: Red Carpet film → Analytics graphs (right after, per request) →
  // Marketplace → Creator.
  const film = featured[0];
  const slides: { key: string; node: React.ReactNode }[] = [];
  if (film) slides.push({ key: "featured", node: <FeaturedFilmSlide film={film} /> });
  const analyticsIndex = slides.length;
  slides.push({ key: "analytics", node: null }); // rendered with `active` flag below
  slides.push({ key: "marketplace", node: <MarketplaceSlide posters={posters} /> });
  slides.push({ key: "creator", node: <CreatorSlide posters={posters} /> });

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    // Linger on the analytics/charts slide so the graphs are readable, but keep
    // cycling afterward.
    const dwell = index === analyticsIndex ? ROTATE_MS * 2.4 : ROTATE_MS;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), dwell);
    return () => clearTimeout(id);
  }, [paused, count, index, analyticsIndex]);

  // Pause rotation when the tab is hidden.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Warm the chart.js chunk in the background after first paint so sliding to
  // the analytics slide is instant (graph data is already server-preloaded).
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => preloadCharts());
      return () => (w as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const t = setTimeout(preloadCharts, 1500);
    return () => clearTimeout(t);
  }, []);

  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0]?.clientX;
    if (touchX.current === null || endX === undefined) return;
    const dx = endX - touchX.current;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  const current = slides[index] ?? slides[0]!;

  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 9999,
    border: "none",
    background: "rgba(0,0,0,0.4)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  };

  return (
    <section
      aria-label="Featured highlights"
      aria-roledescription="carousel"
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(380px, 46vw, 520px)",
        overflow: "hidden",
        backgroundColor: "#100c0a",
        borderBottom: "1px solid var(--color-divider)",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={current.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ position: "absolute", inset: 0 }}
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${count}`}
        >
          {index === analyticsIndex ? (
            <AnalyticsSlide active graphs={graphs} />
          ) : (
            current.node
          )}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button aria-label="Previous slide" onClick={() => go(index - 1)} style={{ ...arrowStyle, left: 14 }} className="hover:!bg-black/60">
            <ChevronLeft size={20} />
          </button>
          <button aria-label="Next slide" onClick={() => go(index + 1)} style={{ ...arrowStyle, right: 14 }} className="hover:!bg-black/60">
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 3,
              display: "flex",
              gap: 2,
            }}
          >
            {slides.map((s, i) => (
              // Button is a ≥24px transparent hit target (WCAG 2.5.8); the visible
              // pill lives inside. No width transition (non-composited) — the pill
              // just swaps on slide change.
              <button
                key={s.key}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                style={{
                  width: 24,
                  height: 24,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: "block",
                    width: i === index ? 26 : 8,
                    height: 8,
                    borderRadius: 9999,
                    background: i === index ? "var(--color-accent-primary,#FF6B00)" : "rgba(255,255,255,0.7)",
                  }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
