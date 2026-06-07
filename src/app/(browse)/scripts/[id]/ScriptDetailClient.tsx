"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Share2,
  Tag,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { SafeHtml } from "@/components/ui/SafeHtml";
import {
  addScriptBookmark,
  getScriptBookmarks,
  removeScriptBookmark,
} from "@/features/profile/services/profileService";
import type { ScriptDetail } from "./types";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadTime(html?: string): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, " ").trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 220));
}

export function ScriptDetailClient({ script }: { script: ScriptDetail }) {
  const router = useRouter();
  const { authUser } = useAuth();
  const id = script._id;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: script.title, url });
      } else if (navigator?.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled or unsupported */
    }
  }, [script.title]);

  const author = typeof script.author === "object" && script.author ? script.author : null;
  const authorName =
    author?.username ?? (typeof script.author === "string" ? script.author : "Unknown");
  const genres = script.genre ? (Array.isArray(script.genre) ? script.genre : [script.genre]) : [];
  const readTime = estimateReadTime(script.script);

  return (
    <div style={{ backgroundColor: "var(--color-bg-primary)", minHeight: "100vh" }}>
      {/* Sticky toolbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "saturate(160%) blur(12px)",
          WebkitBackdropFilter: "saturate(160%) blur(12px)",
          backgroundColor: "color-mix(in srgb, var(--color-bg-primary) 80%, transparent)",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            padding: "10px clamp(12px, 3vw, 24px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
            aria-label="Go back"
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            <span className="hidden-on-mobile" style={{ lineHeight: 1 }}>
              Back
            </span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleShare}
              aria-label="Share script"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--color-border-secondary)",
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text-secondary)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Share2 style={{ width: 15, height: 15 }} />
              <span className="hidden-on-mobile" style={{ lineHeight: 1 }}>
                Share
              </span>
            </button>
            <button
              onClick={toggleBookmark}
              disabled={bookmarking}
              aria-pressed={isBookmarked}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: isBookmarked
                  ? "1px solid var(--color-accent-primary)"
                  : "1px solid var(--color-border-secondary)",
                backgroundColor: isBookmarked
                  ? "var(--color-accent-primary)"
                  : "var(--color-bg-elevated)",
                color: isBookmarked ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                cursor: bookmarking ? "wait" : "pointer",
                opacity: bookmarking ? 0.6 : 1,
                transition: "background-color 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              {isBookmarked ? (
                <BookmarkCheck style={{ width: 15, height: 15 }} />
              ) : (
                <Bookmark style={{ width: 15, height: 15 }} />
              )}
              <span className="hidden-on-mobile" style={{ lineHeight: 1 }}>
                {isBookmarked ? "Saved" : "Save"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <header
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(28px, 6vw, 56px) clamp(16px, 4vw, 24px) clamp(20px, 4vw, 32px)",
        }}
      >
        {genres.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {genres.map((g) => (
              <span
                key={g}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: 9999,
                  backgroundColor: "var(--color-bg-tertiary)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-secondary)",
                }}
              >
                <Tag style={{ width: 10, height: 10 }} aria-hidden />
                {g}
              </span>
            ))}
          </div>
        )}

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-poppins)",
          }}
        >
          {script.title}
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid var(--color-divider)",
          }}
        >
          {author?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar}
              alt={authorName}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid var(--color-border-secondary)",
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User style={{ width: 18, height: 18, color: "var(--color-text-tertiary)" }} aria-hidden />
            </div>
          )}
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {authorName}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 2,
                fontSize: 12,
                color: "var(--color-text-tertiary)",
              }}
            >
              {script.createdAt && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Calendar style={{ width: 12, height: 12 }} aria-hidden />
                  <time dateTime={script.createdAt}>{formatDate(script.createdAt)}</time>
                </span>
              )}
              {readTime > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span>{readTime} min read</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <article
        className="script-prose"
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 24px) clamp(48px, 8vw, 80px)",
        }}
      >
        <div
          style={{
            color: "var(--color-text-primary)",
            fontSize: "clamp(15px, 1.6vw, 17px)",
            lineHeight: 1.75,
          }}
        >
          <SafeHtml html={script.script ?? "<p>No content available.</p>"} />
        </div>
      </article>

      {/* Scroll to top FAB */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          style={{
            position: "fixed",
            bottom: "clamp(16px, 4vw, 24px)",
            right: "clamp(16px, 4vw, 24px)",
            zIndex: 40,
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: "var(--color-accent-primary)",
            color: "var(--color-text-inverse)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 18px color-mix(in srgb, var(--color-accent-primary) 40%, transparent)",
          }}
        >
          <ArrowUp style={{ width: 18, height: 18 }} />
        </button>
      )}

      <style jsx>{`
        @media (max-width: 480px) {
          :global(.hidden-on-mobile) {
            display: none;
          }
        }
        .script-prose :global(p) {
          margin: 0 0 1.1em;
        }
        .script-prose :global(h1),
        .script-prose :global(h2),
        .script-prose :global(h3) {
          font-family: var(--font-poppins);
          color: var(--color-text-primary);
          letter-spacing: -0.015em;
          line-height: 1.3;
          margin: 1.6em 0 0.6em;
        }
        .script-prose :global(h1) { font-size: 1.5em; }
        .script-prose :global(h2) { font-size: 1.3em; }
        .script-prose :global(h3) { font-size: 1.1em; }
        .script-prose :global(a) {
          color: var(--color-text-link);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .script-prose :global(blockquote) {
          margin: 1.2em 0;
          padding: 4px 16px;
          border-left: 3px solid var(--color-accent-primary);
          color: var(--color-text-secondary);
          font-style: italic;
        }
        .script-prose :global(ul),
        .script-prose :global(ol) {
          padding-left: 1.4em;
          margin: 0 0 1.1em;
        }
        .script-prose :global(li) {
          margin-bottom: 0.4em;
        }
        .script-prose :global(code) {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.9em;
          background: var(--color-bg-tertiary);
          padding: 2px 6px;
          border-radius: 6px;
        }
        .script-prose :global(pre) {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-secondary);
          border-radius: 12px;
          padding: 16px;
          overflow-x: auto;
          margin: 1.2em 0;
        }
        .script-prose :global(pre code) {
          background: transparent;
          padding: 0;
        }
        .script-prose :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }
        .script-prose :global(hr) {
          border: 0;
          border-top: 1px solid var(--color-divider);
          margin: 2em 0;
        }
      `}</style>
    </div>
  );
}
