"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Video } from "@/types";

const FALLBACK_THUMB =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5Ij48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iOSIgZmlsbD0iIzI2MjYyNiIvPjwvc3ZnPg==";

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
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

interface VideoListResponse {
  videos?: Video[];
  data?: Video[];
}

async function fetchRelatedClient(
  genres: string | string[],
  excludeId: string,
): Promise<Video[]> {
  const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
  const genreList = Array.isArray(genres) ? genres : genres ? [genres] : [];
  if (genreList.length === 0) return [];

  const results = await Promise.all(
    genreList.map(async (genre) => {
      try {
        const res = await fetch(
          `${BASE}/video/category/${encodeURIComponent(genre)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return [];
        const data: VideoListResponse | Video[] = await res.json();
        return Array.isArray(data) ? data : data.videos ?? data.data ?? [];
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set<string>();
  const combined: Video[] = [];
  for (const list of results) {
    for (const v of list) {
      if (v._id !== excludeId && !seen.has(v._id)) {
        seen.add(v._id);
        combined.push(v);
        if (combined.length >= 10) return combined;
      }
    }
  }
  return combined;
}

function RelatedVideoCard({ video }: { video: Video }) {
  const href = `/watch/${video.slug ?? video._id}`;
  const thumb = video.thumbnailSmall ?? video.thumbnail ?? FALLBACK_THUMB;
  const author =
    typeof video.author === "object" && video.author !== null
      ? video.author
      : null;
  const authorName = author?.username ?? "Unknown";
  const views = video.views ?? 0;
  const ago = timeAgo(video.createdAt);

  return (
    <article style={{ display: "flex", gap: 10 }}>
      <Link
        href={href}
        style={{
          position: "relative",
          display: "block",
          flexShrink: 0,
          width: 120,
          borderRadius: 8,
          overflow: "hidden",
          aspectRatio: "16/9",
          backgroundColor: "var(--color-skeleton-base)",
        }}
        className="group/thumb"
      >
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="120px"
          className="object-cover transition-transform duration-300 group-hover/thumb:scale-105"
          unoptimized={thumb.startsWith("data:")}
        />
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={href} style={{ textDecoration: "none" }}>
          <h3
            className="line-clamp-2"
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.4,
              color: "var(--color-text-primary)",
            }}
          >
            {video.title}
          </h3>
        </Link>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 11,
            color: "var(--color-text-tertiary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {authorName}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {formatViews(views)} views{ago ? ` · ${ago}` : ""}
        </p>
      </div>
    </article>
  );
}

export function RelatedVideos({
  genres,
  excludeId,
}: {
  genres: string | string[];
  excludeId: string;
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedClient(genres, excludeId)
      .then(setVideos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [genres, excludeId]);

  return (
    <div>
      <h2
        style={{
          margin: "0 0 16px",
          fontSize: 15,
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        Related Videos
      </h2>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <div
                className="animate-pulse"
                style={{
                  width: 120,
                  aspectRatio: "16/9",
                  borderRadius: 8,
                  backgroundColor: "var(--color-skeleton-base)",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                  className="animate-pulse"
                  style={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "var(--color-skeleton-base)",
                  }}
                />
                <div
                  className="animate-pulse"
                  style={{
                    height: 10,
                    width: "60%",
                    borderRadius: 6,
                    backgroundColor: "var(--color-skeleton-base)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
          No related videos found.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {videos.map((v) => (
            <RelatedVideoCard key={v._id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
