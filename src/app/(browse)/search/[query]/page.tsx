"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Search, SearchX, SlidersHorizontal } from "lucide-react";
import { api } from "@/features/auth/services/apiClient";
import type { Video } from "@/types";
import { VideoCard } from "@/features/videos/components/VideoCard";
import { CATEGORIES, RATINGS } from "@/lib/constants";

type Sort = "relevance" | "newest" | "views";

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "views", label: "Most viewed" },
];

const PAGE_SIZE = 24;

interface SearchResponse {
  videos?: Video[];
  total?: number;
  hasMore?: boolean;
}

export default function SearchResultsPage() {
  const { query } = useParams<{ query: string }>();
  const decoded = decodeURIComponent(query ?? "");

  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const [sort, setSort] = useState<Sort>("relevance");
  const [genre, setGenre] = useState<string>("");
  const [rating, setRating] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Fetches a page of results. All state updates happen inside the async
  // callbacks (not synchronously), so callers can trigger it from effects.
  // Loading flags are raised by the user-event handlers / initial state.
  const fetchPage = useCallback(
    (pageNum: number, append: boolean) => {
      const params = new URLSearchParams({
        q: decoded,
        sort,
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (genre) params.set("genre", genre);
      if (rating) params.set("rating", rating);

      return api
        .get<SearchResponse>(`/video/search?${params.toString()}`)
        .then((res) => {
          const list = res.videos ?? [];
          setVideos((prev) => (append ? [...prev, ...list] : list));
          setTotal(res.total ?? list.length);
          setHasMore(Boolean(res.hasMore));
          setPage(pageNum);
          setError("");
        })
        .catch(() => setError("Failed to load results"))
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [decoded, sort, genre, rating],
  );

  // Re-run from page 1 whenever the query or any filter/sort changes.
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const toggle = (current: string, value: string, set: (v: string) => void) => {
    setLoading(true);
    set(current === value ? "" : value);
  };

  const changeSort = (value: Sort) => {
    if (value === sort) return;
    setLoading(true);
    setSort(value);
  };

  const loadMore = () => {
    setLoadingMore(true);
    fetchPage(page + 1, true);
  };

  return (
    <div style={{ maxWidth: 1536, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
          <Search style={{ width: 20, height: 20 }} />
          {decoded ? `Results for "${decoded}"` : "All Videos"}
        </h1>
        {!loading && !error && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>
            {total} video{total !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Filter / sort bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setShowFilters((p) => !p)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px",
            borderRadius: 9999, border: "1px solid var(--color-border-secondary)",
            background: showFilters || genre || rating ? "var(--color-bg-tertiary)" : "transparent",
            color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <SlidersHorizontal size={14} />
          Filters{genre || rating ? ` (${[genre, rating].filter(Boolean).length})` : ""}
        </button>

        <div style={{ display: "inline-flex", gap: 6 }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => changeSort(opt.value)}
              style={{
                height: 36, padding: "0 14px", borderRadius: 9999,
                border: `1px solid ${sort === opt.value ? "var(--color-accent-primary)" : "var(--color-border-secondary)"}`,
                background: sort === opt.value ? "var(--color-accent-primary)" : "transparent",
                color: sort === opt.value ? "#fff" : "var(--color-text-secondary)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 14, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-secondary)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-tertiary)" }}>Genre</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {CATEGORIES.map((g) => (
              <Chip key={g} label={g} active={genre === g} onClick={() => toggle(genre, g, setGenre)} />
            ))}
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-tertiary)" }}>Rating</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {RATINGS.map((r) => (
              <Chip key={r} label={r} active={rating === r} onClick={() => toggle(rating, r, setRating)} />
            ))}
          </div>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div style={{ aspectRatio: "16/9", borderRadius: 12, backgroundColor: "var(--color-bg-elevated)" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "var(--color-bg-elevated)", flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 14, borderRadius: 6, backgroundColor: "var(--color-bg-elevated)" }} />
                  <div style={{ height: 12, width: "65%", borderRadius: 6, backgroundColor: "var(--color-bg-elevated)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "rgb(248,113,113)", fontSize: 14 }}>{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && videos.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <SearchX style={{ width: 48, height: 48, color: "var(--color-text-tertiary)", margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            {decoded ? `No results for "${decoded}"` : "No videos found"}
          </p>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
            {genre || rating ? "Try removing filters or different keywords" : "Try different keywords or check your spelling"}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && videos.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  height: 42, padding: "0 28px", borderRadius: 9999, border: "1px solid var(--color-border-secondary)",
                  background: "var(--color-bg-elevated)", color: "var(--color-text-primary)", fontSize: 14, fontWeight: 600,
                  cursor: loadingMore ? "default" : "pointer", opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 32, padding: "0 14px", borderRadius: 9999,
        border: `1px solid ${active ? "var(--color-accent-primary)" : "var(--color-border-secondary)"}`,
        background: active ? "var(--color-accent-primary)" : "transparent",
        color: active ? "#fff" : "var(--color-text-secondary)",
        fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
