"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, Bookmark } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import type { Video } from "@/types";

function openAuthEvent(tab: "login" | "signup" = "login") {
  window.dispatchEvent(
    new CustomEvent("wecinema:open-auth", { detail: { tab } }),
  );
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / 86400);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface LikeStatusResponse {
  liked?: boolean;
  disliked?: boolean;
}

interface LikeCountResponse {
  likesCount?: number;
  dislikesCount?: number;
}

interface LikeActionResponse {
  likesCount?: number;
  dislikesCount?: number;
}

interface BookmarksResponse {
  bookmarks?: Array<string | { _id: string }>;
}

export function VideoMeta({ video }: { video: Video }) {
  const { authUser } = useAuth();

  const [viewsCount, setViewsCount] = useState<number>(video.views ?? 0);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [dislikeLoading, setDislikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    api
      .get<{ views?: number }>(`/video/views/${video._id}`)
      .then((d) => { if (d.views !== undefined) setViewsCount(d.views); })
      .catch(() => {});

    api
      .get<LikeCountResponse>(`/video/likes/${video._id}`)
      .then((d) => {
        setLikesCount(d.likesCount ?? 0);
        setDislikesCount(d.dislikesCount ?? 0);
      })
      .catch(() => {});

    if (authUser) {
      api
        .get<LikeStatusResponse>(`/video/${video._id}/like-status/${authUser._id}`)
        .then((d) => {
          setLiked(d.liked ?? false);
          setDisliked(d.disliked ?? false);
        })
        .catch(() => {});

      api
        .get<BookmarksResponse>(`/video/bookmarks/${authUser._id}`)
        .then((d) => {
          const list = d.bookmarks ?? [];
          setBookmarked(
            list.some((b) =>
              typeof b === "string" ? b === video._id : b._id === video._id,
            ),
          );
        })
        .catch(() => {});
    }
  }, [video._id, authUser]);

  async function handleLike() {
    if (!authUser) { openAuthEvent("login"); return; }
    if (likeLoading) return;
    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;
    setLiked(!liked);
    if (disliked) setDisliked(false);
    setLikesCount((c) => c + (liked ? -1 : 1));
    if (disliked) setDislikesCount((c) => c - 1);
    setLikeLoading(true);
    try {
      const data = await api.post<LikeActionResponse>(`/video/like/${video._id}`, {
        userId: authUser._id,
        action: "like",
      });
      setLikesCount(data.likesCount ?? likesCount);
      setDislikesCount(data.dislikesCount ?? dislikesCount);
    } catch {
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleDislike() {
    if (!authUser) { openAuthEvent("login"); return; }
    if (dislikeLoading) return;
    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikes = likesCount;
    const prevDislikes = dislikesCount;
    setDisliked(!disliked);
    if (liked) setLiked(false);
    setDislikesCount((c) => c + (disliked ? -1 : 1));
    if (liked) setLikesCount((c) => c - 1);
    setDislikeLoading(true);
    try {
      const data = await api.post<LikeActionResponse>(`/video/like/${video._id}`, {
        userId: authUser._id,
        action: "dislike",
      });
      setLikesCount(data.likesCount ?? likesCount);
      setDislikesCount(data.dislikesCount ?? dislikesCount);
    } catch {
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikesCount(prevLikes);
      setDislikesCount(prevDislikes);
    } finally {
      setDislikeLoading(false);
    }
  }

  async function handleBookmark() {
    if (!authUser) { openAuthEvent("login"); return; }
    if (bookmarkLoading) return;
    const prev = bookmarked;
    setBookmarked(!bookmarked);
    setBookmarkLoading(true);
    try {
      if (prev) {
        await api.delete(`/video/${video._id}/bookmark`);
      } else {
        await api.post(`/video/${video._id}/bookmark`, {});
      }
    } catch {
      setBookmarked(prev);
    } finally {
      setBookmarkLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h1
        style={{
          margin: "0 0 10px",
          fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
          fontWeight: 800,
          lineHeight: 1.25,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.02em",
        }}
      >
        {video.title}
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>
          {viewsCount.toLocaleString()} views · {timeAgo(video.createdAt)}
        </p>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={handleLike}
            disabled={likeLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid",
              borderColor: liked
                ? "rgba(245,158,11,0.45)"
                : "var(--color-border-secondary)",
              backgroundColor: liked
                ? "rgba(245,158,11,0.1)"
                : "var(--color-bg-elevated)",
              color: liked ? "#F59E0B" : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <ThumbsUp
              size={15}
              fill={liked ? "#F59E0B" : "none"}
              strokeWidth={liked ? 0 : 2}
            />
            {likesCount > 0 && likesCount}
          </button>

          <button
            type="button"
            onClick={handleDislike}
            disabled={dislikeLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid",
              borderColor: disliked
                ? "rgba(239,68,68,0.45)"
                : "var(--color-border-secondary)",
              backgroundColor: disliked
                ? "rgba(239,68,68,0.1)"
                : "var(--color-bg-elevated)",
              color: disliked ? "#EF4444" : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <ThumbsDown
              size={15}
              fill={disliked ? "#EF4444" : "none"}
              strokeWidth={disliked ? 0 : 2}
            />
            {dislikesCount > 0 && dislikesCount}
          </button>

          <button
            type="button"
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid",
              borderColor: bookmarked
                ? "rgba(59,130,246,0.45)"
                : "var(--color-border-secondary)",
              backgroundColor: bookmarked
                ? "rgba(59,130,246,0.1)"
                : "var(--color-bg-elevated)",
              color: bookmarked ? "#3B82F6" : "var(--color-text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Bookmark
              size={15}
              fill={bookmarked ? "#3B82F6" : "none"}
              strokeWidth={bookmarked ? 0 : 2}
            />
            {bookmarked ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {video.description && (
        <p
          style={{
            marginTop: 14,
            fontSize: 14,
            lineHeight: 1.65,
            color: "var(--color-text-secondary)",
          }}
        >
          {video.description}
        </p>
      )}
    </div>
  );
}
