"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { api } from "@/features/auth/services/apiClient";
import type { Video } from "@/types";
import { VideoCard } from "@/features/videos/components/VideoCard";

function filterVideos(videos: Video[], q: string): Video[] {
  if (!q.trim()) return videos;
  const lower = q.toLowerCase();
  return videos.filter((v) => {
    const genres = Array.isArray(v.genre) ? v.genre : v.genre ? [v.genre] : [];
    const themes = Array.isArray(v.theme) ? v.theme : v.theme ? [v.theme] : [];
    return (
      v.title?.toLowerCase().includes(lower) ||
      v.description?.toLowerCase().includes(lower) ||
      genres.some((g) => g.toLowerCase().includes(lower)) ||
      themes.some((t) => t.toLowerCase().includes(lower))
    );
  });
}

export default function SearchResultsPage() {
  const { query } = useParams<{ query: string }>();
  const decoded = decodeURIComponent(query ?? "");

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ videos?: Video[] } | Video[]>("/video/all")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { videos?: Video[] }).videos ?? [];
        setVideos(list);
      })
      .catch(() => setError("Failed to load videos"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterVideos(videos, decoded), [videos, decoded]);

  return (
    <div style={{ maxWidth: 1536, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Search style={{ width: 20, height: 20 }} />
          {decoded ? `Results for "${decoded}"` : "All Videos"}
        </h1>
        {!loading && !error && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>
            {filtered.length} video{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Skeletons */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div
                style={{
                  aspectRatio: "16/9",
                  borderRadius: 12,
                  backgroundColor: "var(--color-bg-elevated)",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bg-elevated)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div
                    style={{
                      height: 14,
                      borderRadius: 6,
                      backgroundColor: "var(--color-bg-elevated)",
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      width: "65%",
                      borderRadius: 6,
                      backgroundColor: "var(--color-bg-elevated)",
                    }}
                  />
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
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <SearchX
            style={{
              width: 48,
              height: 48,
              color: "var(--color-text-tertiary)",
              margin: "0 auto 12px",
              opacity: 0.4,
            }}
          />
          <p style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            {decoded ? `No results for "${decoded}"` : "No videos found"}
          </p>
          {decoded && (
            <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 4 }}>
              Try different keywords or check your spelling
            </p>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
