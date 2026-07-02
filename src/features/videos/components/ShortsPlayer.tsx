"use client";

import { useRef, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Heart, Share2, Volume2, VolumeX, Eye, Play, Pause } from "lucide-react";
import type { Video } from "@/types";

function fmtCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: 0,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
      <span
        style={{
          fontSize: 11,
          color: "#fff",
          fontWeight: 600,
          textShadow: "0 1px 4px rgba(0,0,0,0.7)",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Individual Short ─────────────────────────────────────────────────────────
interface ShortItemProps {
  video: Video;
  isActive: boolean;
  index: number;
  activeIndex: number;
  muted: boolean;
  onMuteToggle: () => void;
}

function ShortItem({ video, isActive, index, activeIndex, muted, onMuteToggle }: ShortItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [paused, setPaused] = useState(true);
  const [liked, setLiked] = useState(false);
  const [tapIcon, setTapIcon] = useState<"play" | "pause" | null>(null);

  const thumb = video.thumbnailSmall ?? video.thumbnail ?? "";
  const isDataThumb = thumb.startsWith("data:");

  // Auto-play / pause when this item enters or leaves the viewport
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.currentTime = 0;
      el.play().catch(() => {/* autoplay blocked – fine, user can tap */});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive]);

  // Sync muted prop → video element
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    clearTimeout(timerRef.current);
    if (el.paused) {
      el.play().catch(() => {});
      setTapIcon("play");
    } else {
      el.pause();
      setTapIcon("pause");
    }
    timerRef.current = setTimeout(() => setTapIcon(null), 700);
  }, []);

  const share = useCallback(async () => {
    const url = `${window.location.origin}/watch/${video.slug ?? video._id}`;
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch {}
    }
  }, [video.slug, video._id, video.title]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const likeCount = (video.likes?.length ?? 0) + (liked ? 1 : 0);

  // Determine preload strategy: auto for active, metadata for adjacent, none for far
  const preload =
    isActive ? "auto" : Math.abs(index - activeIndex) <= 1 ? "metadata" : "none";

  return (
    // Outer: full-bleed, dark backdrop, centers the actual player.
    // Inner (.shorts-frame): full-bleed on mobile, but capped to a 9:16
    // card on desktop — so shorts don't stretch to fill a wide viewport.
    <div className="shorts-frame-outer">
      <div className="shorts-frame">
      {/* Thumbnail – shown until the video starts */}
      {thumb && !isDataThumb && (
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="(min-width: 768px) 440px, 100vw"
          style={{ objectFit: "cover" }}
          priority={isActive}
          unoptimized={false}
        />
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={video.file}
        loop
        playsInline
        muted={muted}
        preload={preload}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onClick={togglePlay}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          cursor: "pointer",
          zIndex: 1,
        }}
      />

      {/* Tap-to-play / pause flash icon */}
      {tapIcon && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "shorts-pop 0.15s ease-out",
            }}
          >
            {tapIcon === "pause"
              ? <Pause size={28} fill="#fff" stroke="none" />
              : <Play size={28} fill="#fff" stroke="none" />
            }
          </div>
        </div>
      )}

      {/* Active-but-user-paused indicator in corner */}
      {isActive && paused && !tapIcon && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
          }}
        >
          <Play size={28} fill="#fff" stroke="none" />
        </button>
      )}

      {/* Bottom gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 65%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Right action bar */}
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 110,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          zIndex: 10,
        }}
      >
        <ActionBtn onClick={() => setLiked((l) => !l)} label={fmtCount(likeCount)}>
          <Heart
            size={28}
            fill={liked ? "#ef4444" : "none"}
            color={liked ? "#ef4444" : "#fff"}
          />
        </ActionBtn>

        <ActionBtn onClick={share} label="Share">
          <Share2 size={26} color="#fff" />
        </ActionBtn>

        <ActionBtn label={fmtCount(video.views)}>
          <Eye size={24} color="#fff" />
        </ActionBtn>

        <ActionBtn onClick={onMuteToggle} label={muted ? "Unmute" : "Mute"}>
          {muted ? (
            <VolumeX size={24} color="#fff" />
          ) : (
            <Volume2 size={24} color="#fff" />
          )}
        </ActionBtn>
      </div>

      {/* Bottom info overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 16,
          right: 72,
          zIndex: 10,
        }}
      >
        <Link
          href={`/watch/${video.slug ?? video._id}`}
          style={{ textDecoration: "none" }}
        >
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.35,
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {video.title}
          </h3>
        </Link>
        {video.description && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            }}
          >
            {video.description}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── ShortsPlayer ─────────────────────────────────────────────────────────────
export function ShortsPlayer({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Deep-link support: /shorts?v=<slug-or-id> opens positioned at that
  // video (e.g. clicked from the homepage's Shorts row) instead of always
  // starting at the first one.
  const initialVideoParam = searchParams.get("v");
  const initialIndex = useMemo(() => {
    if (!initialVideoParam) return 0;
    const idx = videos.findIndex((v) => v.slug === initialVideoParam || v._id === initialVideoParam);
    return idx === -1 ? 0 : idx;
  }, [initialVideoParam, videos]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(true); // start muted → autoplay always works

  // Jump (no scroll animation) to the deep-linked video on first mount.
  useEffect(() => {
    if (initialIndex > 0) {
      itemRefs.current[initialIndex]?.scrollIntoView({ behavior: "auto", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect which item is ≥50% visible
  useEffect(() => {
    const items = itemRefs.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = items.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.5 },
    );
    items.forEach((el) => { if (el) obs.observe(el); });
    return () => items.forEach((el) => { if (el) obs.unobserve(el); });
  }, []);

  // Keyboard nav: ↑↓ or j/k
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, videos.length - 1);
        itemRefs.current[next]?.scrollIntoView({ behavior: "smooth" });
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prev = Math.max(activeIndex - 1, 0);
        itemRefs.current[prev]?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, videos.length]);

  if (videos.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          background: "#000",
          gap: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.55)" }}>
          No shorts available yet.
        </p>
        <Link
          href="/"
          style={{ color: "#FFBB00", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes shorts-pop {
          from { transform: scale(0.75); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .shorts-scroller {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .shorts-scroller::-webkit-scrollbar {
          display: none;
        }
        .shorts-frame-outer {
          position: relative;
          width: 100%;
          height: 100dvh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shorts-frame {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .shorts-frame {
            width: min(calc(100dvh * 9 / 16), 440px);
            height: min(100%, calc(440px * 16 / 9));
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
          }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100 }}>
        {/* ── Top bar ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: "env(safe-area-inset-top, 0px) 16px 0",
            height: "calc(60px + env(safe-area-inset-top, 0px))",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "8px 8px 8px 0",
              pointerEvents: "auto",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={22} />
          </button>

          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-poppins, sans-serif)",
              letterSpacing: "-0.01em",
              pointerEvents: "none",
            }}
          >
            Shorts
          </span>

          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 500,
              marginLeft: 4,
              pointerEvents: "none",
            }}
          >
            {activeIndex + 1} / {videos.length}
          </span>
        </div>

        {/* ── Scroll container ── */}
        <div
          ref={containerRef}
          className="shorts-scroller"
          style={{
            height: "100dvh",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
          }}
        >
          {videos.map((video, i) => (
            <div
              key={video._id}
              ref={(el) => { itemRefs.current[i] = el; }}
              style={{
                height: "100dvh",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                flexShrink: 0,
              }}
            >
              <ShortItem
                video={video}
                index={i}
                activeIndex={activeIndex}
                isActive={i === activeIndex}
                muted={muted}
                onMuteToggle={() => setMuted((m) => !m)}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
