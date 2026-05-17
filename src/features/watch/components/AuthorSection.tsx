"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import type { Video, Author } from "@/types";
import { Avatar } from "@/components/ui/Avatar";

function openAuthEvent() {
  window.dispatchEvent(
    new CustomEvent("wecinema:open-auth", { detail: { tab: "login" } }),
  );
}

export function AuthorSection({ video }: { video: Video }) {
  const { authUser } = useAuth();

  const author: Author | null =
    typeof video.author === "object" && video.author !== null
      ? video.author
      : null;

  const authorId = author?._id ?? "";
  const authorName = author?.username ?? "Unknown";
  const authorAvatar = author?.avatar;
  const followers = author?.followers ?? [];
  const initialFollowing = authUser ? followers.includes(authUser._id) : false;

  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(followers.length);
  const [loading, setLoading] = useState(false);

  async function handleFollow() {
    if (!authUser) { openAuthEvent(); return; }
    if (loading) return;
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => c + (wasFollowing ? -1 : 1));
    setLoading(true);
    try {
      await api.put(`/user/${authorId}/follow`, {
        action: wasFollowing ? "unfollow" : "follow",
        userId: authUser._id,
      });
    } catch {
      setIsFollowing(wasFollowing);
      setFollowerCount((c) => c + (wasFollowing ? 1 : -1));
    } finally {
      setLoading(false);
    }
  }

  if (!author) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 0",
        borderTop: "1px solid var(--color-divider)",
        borderBottom: "1px solid var(--color-divider)",
        marginTop: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={`/user/${authorId}`} style={{ flexShrink: 0 }}>
          <Avatar src={authorAvatar} username={authorName} size={48} />
        </Link>

        <div>
          <Link
            href={`/user/${authorId}`}
            style={{ textDecoration: "none" }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {authorName}
            </p>
          </Link>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "var(--color-text-tertiary)",
            }}
          >
            Creator · {followerCount.toLocaleString()} followers
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleFollow}
        disabled={loading}
        style={{
          padding: "8px 20px",
          borderRadius: 9999,
          fontWeight: 700,
          fontSize: 13,
          border: "1.5px solid",
          borderColor: isFollowing
            ? "var(--color-border-secondary)"
            : "var(--color-accent-primary)",
          backgroundColor: isFollowing
            ? "var(--color-bg-elevated)"
            : "var(--color-accent-primary)",
          color: isFollowing ? "var(--color-text-secondary)" : "#000",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "all 0.15s",
        }}
      >
        {isFollowing ? "Unsubscribe" : "Follow"}
      </button>
    </div>
  );
}
