import Link from "next/link";
import Image from "next/image";
import type { Video } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

const FALLBACK_THUMB =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iOSIgZmlsbD0iIzI2MjYyNiIvPjwvc3ZnPg==";

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

export function VideoCard({ video, priority = false }: { video: Video; priority?: boolean }) {
  const href = `/watch/${video.slug ?? video._id}`;
  const thumb = video.thumbnailSmall ?? video.thumbnail ?? FALLBACK_THUMB;
  const author =
    typeof video.author === "object" && video.author !== null ? video.author : null;
  const authorName = author?.username ?? "Unknown";
  const authorAvatar = author?.avatar;
  const authorHref = author ? `/user/${author._id}` : null;
  const views = video.views ?? 0;
  const ago = timeAgo(video.createdAt);

  return (
    <article
      style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 14, padding: 8, margin: -8, transition: "background 0.18s" }}
      className="group/card hover:bg-[var(--color-bg-elevated)]"
    >
      {/* ── Thumbnail ── */}
      <Link
        href={href}
        style={{
          position: "relative",
          display: "block",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "16/9",
          backgroundColor: "var(--color-skeleton-base)",
          flexShrink: 0,
        }}
        className="group/thumb"
      >
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
          unoptimized={thumb.startsWith("data:")}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />

        {/* Hover play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-200"
          style={{ background: "rgba(0,0,0,0.18)" }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
            }}
          >
            {/* inline play triangle */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 2l9 5-9 5V2z" fill="#111" />
            </svg>
          </div>
        </div>

        {/* Views pill */}
        <span
          style={{
            position: "absolute",
            bottom: 6,
            right: 8,
            backgroundColor: "rgba(0,0,0,0.72)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 500,
            padding: "2px 7px",
            borderRadius: 9999,
            backdropFilter: "blur(4px)",
            letterSpacing: "0.02em",
          }}
        >
          {formatViews(views)}
        </span>
      </Link>

      {/* ── Meta row (avatar + info) ── */}
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "flex-start" }}>

        {/* Avatar */}
        {authorHref ? (
          <Link href={authorHref} style={{ flexShrink: 0 }}>
            <Avatar src={authorAvatar} username={authorName} size={36} />
          </Link>
        ) : (
          <Avatar src={null} username={authorName} size={36} />
        )}

        {/* Title + channel + description */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link href={href} style={{ textDecoration: "none" }}>
            <h3
              className="line-clamp-2"
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.4,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {video.title}
            </h3>
          </Link>

          {/* Channel name */}
          {authorHref ? (
            <Link
              href={authorHref}
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              className="hover:text-[var(--color-text-secondary)]"
            >
              {authorName}
            </Link>
          ) : (
            <span
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 12,
                color: "var(--color-text-tertiary)",
              }}
            >
              {authorName}
            </span>
          )}

          {/* Views · time */}
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "var(--color-text-tertiary)",
            }}
          >
            {formatViews(views)}{ago ? ` · ${ago}` : ""}
          </p>

        </div>
      </div>
    </article>
  );
}
