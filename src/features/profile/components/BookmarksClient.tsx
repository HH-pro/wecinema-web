"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  getVideoBookmarks,
  getScriptBookmarks,
  removeVideoBookmark,
  removeScriptBookmark,
  type BookmarkedVideo,
  type BookmarkedScript,
} from "@/features/profile/services/profileService";

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-bg-elevated)",
  borderRadius: 14,
  border: "1px solid var(--color-border-secondary)",
  overflow: "hidden",
};

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--color-text-tertiary)",
      }}
    >
      <p style={{ fontSize: 40, margin: "0 0 12px" }}>{icon}</p>
      <p style={{ margin: 0, fontSize: 15 }}>{label}</p>
    </div>
  );
}

type Tab = "videos" | "scripts";

interface BookmarksClientProps {
  userId: string;
}

export function BookmarksClient({ userId }: BookmarksClientProps) {
  const router = useRouter();
  const { authUser } = useAuth();
  const isOwner = !!authUser && authUser._id === userId;

  const [tab, setTab] = useState<Tab>("videos");
  const [videoBookmarks, setVideoBookmarks] = useState<BookmarkedVideo[]>([]);
  const [scriptBookmarks, setScriptBookmarks] = useState<BookmarkedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authUser || !isOwner) {
      setLoading(false);
      return;
    }
    Promise.all([
      getVideoBookmarks(userId),
      getScriptBookmarks(userId),
    ])
      .then(([vr, sr]) => {
        setVideoBookmarks(vr.bookmarks);
        setScriptBookmarks(sr.bookmarks);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, authUser, isOwner]);

  async function handleRemoveVideo(id: string) {
    setRemoving((prev) => new Set(prev).add(id));
    try {
      await removeVideoBookmark(id);
      setVideoBookmarks((prev) => prev.filter((v) => v._id !== id));
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleRemoveScript(id: string) {
    setRemoving((prev) => new Set(prev).add(id));
    try {
      await removeScriptBookmark(id);
      setScriptBookmarks((prev) => prev.filter((s) => s._id !== id));
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "9px 18px",
    borderRadius: "10px 10px 0 0",
    border: "none",
    borderBottom: active
      ? "2px solid var(--color-accent-primary)"
      : "2px solid transparent",
    backgroundColor: "transparent",
    color: active ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  });

  const removeBtnStyle: React.CSSProperties = {
    padding: "5px 10px",
    borderRadius: 6,
    border: "1px solid rgba(239,68,68,0.4)",
    backgroundColor: "transparent",
    color: "#ef4444",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 28,
        }}
      >
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            border: "1px solid var(--color-border-secondary)",
            backgroundColor: "transparent",
            color: "var(--color-text-secondary)",
            fontSize: 13,
            cursor: "pointer",
          }}
          onClick={() => router.push(`/user/${userId}`)}
        >
          ← Back
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          🔖 Bookmarks
        </h1>
      </div>

      {!authUser && <EmptyState icon="🔒" label="Sign in to view your bookmarks" />}
      {authUser && !isOwner && <EmptyState icon="🔒" label="You can only view your own bookmarks" />}

      {authUser && isOwner && (
        <>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 4,
              borderBottom: "1px solid var(--color-divider)",
              marginBottom: 24,
            }}
          >
            <button style={tabBtnStyle(tab === "videos")} onClick={() => setTab("videos")}>
              🎬 Videos
              {!loading && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  ({videoBookmarks.length})
                </span>
              )}
            </button>
            <button style={tabBtnStyle(tab === "scripts")} onClick={() => setTab("scripts")}>
              📝 Scripts
              {!loading && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  ({scriptBookmarks.length})
                </span>
              )}
            </button>
          </div>

          {loading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ ...cardStyle, cursor: "default" }}>
                  <div
                    style={{
                      aspectRatio: "16/9",
                      backgroundColor: "var(--color-bg-secondary)",
                    }}
                  />
                  <div style={{ padding: 12 }}>
                    <div
                      style={{
                        height: 14,
                        width: "70%",
                        borderRadius: 6,
                        backgroundColor: "var(--color-bg-secondary)",
                        marginBottom: 8,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && <EmptyState icon="⚠️" label={error} />}

          {/* Video bookmarks */}
          {!loading && !error && tab === "videos" && (
            <>
              {videoBookmarks.length === 0 ? (
                <EmptyState icon="🔖" label="No video bookmarks yet" />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 16,
                  }}
                >
                  {videoBookmarks.map((v) => (
                    <div key={v._id} style={cardStyle}>
                      <div
                        style={{
                          position: "relative",
                          aspectRatio: "16/9",
                          backgroundColor: "var(--color-bg-secondary)",
                          cursor: "pointer",
                        }}
                        onClick={() => v.slug && router.push(`/watch/${v.slug}`)}
                      >
                        {v.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnail}
                            alt={v.title ?? "Video"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 32,
                              opacity: 0.3,
                            }}
                          >
                            🎬
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <p
                            style={{
                              margin: "0 0 3px",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {v.title ?? "Untitled"}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {v.views != null ? `${v.views.toLocaleString()} views` : ""}
                          </p>
                        </div>
                        <button
                          style={removeBtnStyle}
                          disabled={removing.has(v._id)}
                          onClick={() => handleRemoveVideo(v._id)}
                          title="Remove bookmark"
                        >
                          {removing.has(v._id) ? "…" : "✕"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Script bookmarks */}
          {!loading && !error && tab === "scripts" && (
            <>
              {scriptBookmarks.length === 0 ? (
                <EmptyState icon="📝" label="No script bookmarks yet" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {scriptBookmarks.map((s) => (
                    <div
                      key={s._id}
                      style={{
                        ...cardStyle,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: "rgba(245,158,11,0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        📝
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 2px",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--color-text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.title ?? "Untitled Script"}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {Array.isArray(s.genre) ? s.genre.join(", ") : s.genre ?? ""}
                          {s.createdAt
                            ? ` · ${new Date(s.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                              })}`
                            : ""}
                        </p>
                      </div>
                      <button
                        style={removeBtnStyle}
                        disabled={removing.has(s._id)}
                        onClick={() => handleRemoveScript(s._id)}
                        title="Remove bookmark"
                      >
                        {removing.has(s._id) ? "…" : "✕"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
