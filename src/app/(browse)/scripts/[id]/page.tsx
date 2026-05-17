"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, Bookmark, BookmarkCheck, Tag, User } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/features/auth/services/apiClient";
import { useAuth } from "@/features/auth/context/AuthContext";
import { SafeHtml } from "@/components/ui/SafeHtml";
import {
  addScriptBookmark,
  getScriptBookmarks,
  removeScriptBookmark,
} from "@/features/profile/services/profileService";

interface ScriptDetail {
  _id: string;
  title: string;
  genre?: string | string[];
  script?: string;
  createdAt?: string;
  author?: { _id: string; username?: string; avatar?: string } | string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { authUser } = useAuth();

  const [script, setScript] = useState<ScriptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ script?: ScriptDetail } | ScriptDetail>(`/video/scripts/${id}`)
      .then((res) => {
        const s =
          (res as { script?: ScriptDetail }).script ?? (res as ScriptDetail) ?? null;
        setScript(s);
        if (!s?._id) setError("Script not found");
      })
      .catch(() => setError("Failed to load script"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!authUser?._id || !id) return;
    getScriptBookmarks(authUser._id)
      .then((res) => setIsBookmarked(res.bookmarks.some((b) => b._id === id)))
      .catch(() => {});
  }, [authUser?._id, id]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleBookmark = useCallback(async () => {
    if (!id || bookmarking) return;
    if (!authUser) {
      toast.error("Sign in to bookmark scripts");
      return;
    }
    setBookmarking(true);
    try {
      if (isBookmarked) {
        await removeScriptBookmark(id);
        setIsBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        await addScriptBookmark(id);
        setIsBookmarked(true);
        toast.success("Script bookmarked");
      }
    } catch {
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarking(false);
    }
  }, [id, isBookmarked, bookmarking, authUser]);

  const author =
    typeof script?.author === "object" && script?.author ? script.author : null;
  const authorName =
    author?.username ??
    (typeof script?.author === "string" ? script.author : "Unknown");
  const genres = script?.genre
    ? Array.isArray(script.genre)
      ? script.genre
      : [script.genre]
    : [];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 12,
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid rgba(139,92,246,0.3)",
            borderTopColor: "rgb(139,92,246)",
          }}
        />
        <p style={{ fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading script…</p>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 16,
        }}
      >
        <p style={{ fontSize: 48 }}>📄</p>
        <p style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
          {error ?? "Script not found"}
        </p>
        <button
          onClick={() => router.back()}
          style={{
            fontSize: 14,
            color: "rgb(167,139,250)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(to bottom, rgba(76,29,149,0.2), transparent)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: 768,
            margin: "0 auto",
            padding: "48px 16px 40px",
            position: "relative",
          }}
        >
          {/* Back button */}
          <button
            onClick={() => router.back()}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-tertiary)",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Go back"
          >
            <ArrowLeft style={{ width: 20, height: 20 }} />
          </button>

          {/* Title */}
          <h1
            style={{
              margin: "0 0 24px",
              fontSize: "clamp(1.4rem, 4vw, 1.875rem)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {script.title}
          </h1>

          {/* Author */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {author?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatar}
                alt={authorName}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(139,92,246,0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(139,92,246,0.15)",
                  border: "2px solid rgba(139,92,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User style={{ width: 16, height: 16, color: "rgb(167,139,250)" }} />
              </div>
            )}
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                }}
              >
                {authorName}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                Author
              </p>
            </div>
          </div>

          {/* Tags */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {genres.map((g) => (
              <span
                key={g}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(139,92,246,0.1)",
                  color: "rgb(167,139,250)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              >
                <Tag style={{ width: 10, height: 10 }} />
                {g}
              </span>
            ))}
            {script.createdAt && (
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
                {formatDate(script.createdAt)}
              </span>
            )}
          </div>

          {/* Bookmark */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={toggleBookmark}
              disabled={bookmarking}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                border: isBookmarked
                  ? "1px solid rgba(139,92,246,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
                backgroundColor: isBookmarked
                  ? "rgba(139,92,246,0.15)"
                  : "rgba(255,255,255,0.03)",
                color: isBookmarked ? "rgb(167,139,250)" : "var(--color-text-secondary)",
                cursor: bookmarking ? "wait" : "pointer",
                opacity: bookmarking ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              {isBookmarked ? (
                <BookmarkCheck style={{ width: 15, height: 15 }} />
              ) : (
                <Bookmark style={{ width: 15, height: 15 }} />
              )}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 768, margin: "0 auto", padding: "40px 16px" }}>
        <div
          className="prose prose-invert prose-sm max-w-none"
          style={{
            backgroundColor: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: "clamp(24px, 4vw, 40px)",
            lineHeight: 1.8,
          }}
        >
          <SafeHtml html={script.script ?? "<p>No content available.</p>"} />
        </div>
      </div>

      {/* Scroll to top FAB */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 40,
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: "rgb(124,58,237)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
            transition: "all 0.2s",
          }}
        >
          <ArrowUp style={{ width: 18, height: 18 }} />
        </button>
      )}
    </div>
  );
}
