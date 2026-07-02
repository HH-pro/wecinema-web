import Link from "next/link";
import Image from "next/image";
import type { Video } from "@/types";
import { POSTER_FALLBACK as FALLBACK_THUMB } from "@/features/home/lib/posterFallback";

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / 86400);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatDuration(d?: string | number): string | null {
  if (d == null) return null;
  const secs = typeof d === "string" ? parseFloat(d) : d;
  if (!Number.isFinite(secs) || secs <= 0) return null;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ShortsCard({ video, priority = false }: { video: Video; priority?: boolean }) {
  // Opens the vertical shorts feed (not the regular watch page) positioned
  // at this video, matching TikTok/YouTube Shorts card behavior.
  const href = `/shorts?v=${encodeURIComponent(video.slug ?? video._id)}`;
  const thumb = video.thumbnailSmall ?? video.thumbnail ?? FALLBACK_THUMB;
  const isDataThumb = thumb.startsWith("data:");
  const views = video.views ?? 0;
  const ago = timeAgo(video.createdAt);
  const duration = formatDuration(video.duration);

  return (
    <article style={{ width: "100%" }}>
      <Link
        href={href}
        style={{
          position: "relative",
          display: "block",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "9/16",
          backgroundColor: "var(--color-skeleton-base)",
        }}
        className="group/thumb"
      >
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="160px"
          className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
          unoptimized={isDataThumb}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          {...(isDataThumb ? {} : { placeholder: "blur" as const, blurDataURL: FALLBACK_THUMB })}
        />

        {/* Hover play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200"
          style={{ background: "rgba(0,0,0,0.18)" }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M3 2l9 5-9 5V2z" fill="#111" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        {duration && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              backgroundColor: "rgba(0,0,0,0.72)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 6,
              backdropFilter: "blur(4px)",
              letterSpacing: "0.02em",
            }}
          >
            {duration}
          </span>
        )}
      </Link>

      <Link href={href} style={{ textDecoration: "none" }}>
        <h3
          className="line-clamp-1"
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          {video.title}
        </h3>
      </Link>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 11,
          color: "var(--color-text-tertiary)",
        }}
      >
        {formatViews(views)}{ago ? ` · ${ago}` : ""}
      </p>
    </article>
  );
}
