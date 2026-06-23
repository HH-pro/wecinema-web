"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getWatchHistory, type HistoryEntry } from "@/features/profile/services/profileService";
import { MediaRow } from "@/features/home/components/MediaRow";
import { POSTER_FALLBACK, resolveThumb } from "@/features/home/lib/posterFallback";

function dedupeByVideo(entries: HistoryEntry[], max: number): HistoryEntry[] {
  const seen = new Set<string>();
  const out: HistoryEntry[] = [];
  for (const e of entries) {
    const id = e.videoId?._id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(e);
    if (out.length >= max) break;
  }
  return out;
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const v = entry.videoId;
  const href = v.slug ? `/watch/${v.slug}` : `/watch/${v._id}`;
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }} className="group/hc">
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "var(--color-skeleton-base)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveThumb(v.thumbnailSmall ?? v.thumbnail)}
          alt={v.title ?? "Video"}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover/hc:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = POSTER_FALLBACK;
          }}
        />
      </div>
      <p
        className="line-clamp-1"
        style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}
      >
        {v.title ?? "Untitled"}
      </p>
    </Link>
  );
}

export function ContinueWatchingRow() {
  const { authUser, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !authUser?._id) return;
    let cancelled = false;
    getWatchHistory(authUser._id)
      .then((h) => {
        if (!cancelled) setEntries(dedupeByVideo(h, 12));
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authUser?._id]);

  // Hide entirely when logged out or there is no history. The auth guard also
  // ensures stale entries never render after logout.
  if (!isAuthenticated || entries.length === 0) return null;

  return (
    <MediaRow>
      {entries.map((e) => (
        <HistoryCard key={e._id} entry={e} />
      ))}
    </MediaRow>
  );
}
