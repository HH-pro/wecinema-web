"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface MediaRowProps {
  title: string;
  viewAllHref?: string;
  /** Fixed item width in px for each card slot. */
  itemWidth?: number;
  children: ReactNode;
  /** Optional accent (e.g. a flame icon) shown before the title. */
  icon?: ReactNode;
}

/**
 * Netflix-style horizontal carousel. Scroll-snap track with overlay scroll
 * buttons (desktop). Each child is placed in a fixed-width, non-shrinking slot.
 * `content-visibility: auto` keeps off-screen rows cheap to render.
 */
export function MediaRow({ title, viewAllHref, itemWidth = 240, children, icon }: MediaRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  // Throttle scroll-driven layout reads to one per frame so dragging the row
  // never blocks the scroll thread (no jank/stutter on hover-scroll).
  const onScroll = useCallback(() => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      update();
    });
  }, [update]);

  // Initialise arrow visibility once the row has measured itself.
  useEffect(() => {
    update();
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, itemWidth * 2), behavior: "smooth" });
  };

  const items = Children.toArray(children);
  if (items.length === 0) return null;

  const btn: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 2,
    width: 44,
    border: "none",
    background: "linear-gradient(90deg, var(--color-bg-primary) 10%, transparent)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <section
      // NOTE: previously used `content-visibility: auto` + a fixed
      // `contain-intrinsic-size`, but the estimated height never matched the real
      // row height, so rows jumped as the browser resolved on/off-screen state —
      // a major CLS source (homepage CLS was ~0.4). Rows are cheap to render, so
      // we render them normally and keep layout stable instead.
      style={{ padding: "20px 24px 28px" }}
      aria-label={title}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.015em",
          }}
        >
          {icon}
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            aria-label={`View all ${title}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-accent-primary)",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
            className="hover:underline"
          >
            View all <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>

      <div style={{ position: "relative" }} className="group/row">
        {canLeft && (
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            style={{ ...btn, left: 0 }}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity max-md:hidden"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div
          ref={trackRef}
          onScroll={onScroll}
          className="hide-scrollbar"
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            // Keep the row HORIZONTAL-only. Setting only `overflow-x: auto` makes
            // the browser promote `overflow-y` to `auto` as well, turning this into
            // a vertical scroll container that swallows mouse-wheel scrolls and
            // makes the page feel "stuck" on hover. Pinning `overflow-y: hidden`
            // lets vertical wheel events bubble to the page (YouTube-style).
            overflowY: "hidden",
            // `proximity` (not `mandatory`) lets the row scroll freely instead of
            // fighting the cursor and feeling "stuck" — it only eases to the
            // nearest card once you stop.
            scrollSnapType: "x proximity",
            overscrollBehaviorX: "contain",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            // Vertical padding gives the card hover-highlight (negative-margin
            // bleed) room so `overflow-y: hidden` doesn't clip its top/bottom edge.
            padding: "8px 0 12px",
          }}
        >
          {items.map((child, i) => (
            <div
              key={i}
              style={{ width: itemWidth, flex: "0 0 auto", scrollSnapAlign: "start" }}
            >
              {child}
            </div>
          ))}
        </div>

        {canRight && (
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            style={{ ...btn, right: 0, background: "linear-gradient(270deg, var(--color-bg-primary) 10%, transparent)" }}
            className="opacity-0 group-hover/row:opacity-100 transition-opacity max-md:hidden"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  );
}
