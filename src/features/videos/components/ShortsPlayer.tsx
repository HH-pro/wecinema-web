"use client";

import { useRef, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Heart, MessageCircle, Share2, Volume2, VolumeX, Eye, Play, Pause } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import { toast } from "@/lib/toast";
import { HypemodeAuthDrawer } from "@/app/hypemode/HypemodeAuthDrawer";
import { ShortsCommentsDrawer } from "@/features/videos/components/ShortsCommentsDrawer";
import { Avatar } from "@/components/ui/Avatar";
import type { Video, VideoComment } from "@/types";

function openAuthEvent(tab: "login" | "signup" = "login") {
  window.dispatchEvent(
    new CustomEvent("wecinema:open-auth", { detail: { tab } }),
  );
}

function fmtCount(n?: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: 0,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {children}
      <span
        style={{
          fontSize: 11,
          color: "#fff",
          fontWeight: 600,
          textShadow: "0 1px 4px rgba(0,0,0,0.7)",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Individual Short ─────────────────────────────────────────────────────────
interface ShortItemProps {
  video: Video;
  isActive: boolean;
  index: number;
  activeIndex: number;
  muted: boolean;
  onMuteToggle: () => void;
  commentCount: number;
  onOpenComments: (video: Video) => void;
}

function ShortItem({
  video,
  isActive,
  index,
  activeIndex,
  muted,
  onMuteToggle,
  commentCount,
  onOpenComments,
}: ShortItemProps) {
  const { authUser } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [paused, setPaused] = useState(true);
  // Derived from authUser/video.likes each render (authUser resolves async after
  // mount), with a local override applied after the user clicks like/unlike.
  const baseLiked = authUser ? (video.likes ?? []).includes(authUser._id) : false;
  const [likeOverride, setLikeOverride] = useState<boolean | null>(null);
  const liked = likeOverride ?? baseLiked;
  const [likesCount, setLikesCount] = useState(video.likes?.length ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [tapIcon, setTapIcon] = useState<"play" | "pause" | null>(null);
  const [viewsCount, setViewsCount] = useState(video.views ?? 0);
  const viewTrackedRef = useRef(false);
  const [buffering, setBuffering] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const author = typeof video.author === "object" && video.author !== null ? video.author : null;

  const thumb = video.thumbnailSmall ?? video.thumbnail ?? "";
  const isDataThumb = thumb.startsWith("data:");

  // Auto-play / pause when this item enters or leaves the viewport
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.currentTime = 0;
      el.play().catch(() => {/* autoplay blocked – fine, user can tap */});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive]);

  // Sync muted prop → video element
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    clearTimeout(timerRef.current);
    if (el.paused) {
      el.play().catch(() => {});
      setTapIcon("play");
    } else {
      el.pause();
      setTapIcon("pause");
    }
    timerRef.current = setTimeout(() => setTapIcon(null), 700);
  }, []);

  // Views count once per short per page visit, after 2s of playback. The API only
  // records signed-in viewers (it dedupes via watch history), same as the watch page.
  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || viewTrackedRef.current || !authUser || el.currentTime < 2) return;
    viewTrackedRef.current = true;
    api
      .put<{ views?: number }>(`/video/view/${video._id}`)
      .then((data) => { if (typeof data?.views === "number") setViewsCount(data.views); })
      .catch(() => {});
  }, [authUser, video._id]);

  const share = useCallback(async () => {
    const url = `${window.location.origin}/shorts?v=${encodeURIComponent(video.slug ?? video._id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled or unsupported — nothing to do */
    }
  }, [video.slug, video._id, video.title]);

  const handleLike = useCallback(async () => {
    if (!authUser) { openAuthEvent(); return; }
    if (likeLoading) return;
    const prevLiked = liked;
    const prevCount = likesCount;
    setLikeOverride(!liked);
    setLikesCount((c) => c + (liked ? -1 : 1));
    setLikeLoading(true);
    try {
      const data = await api.post<{ likesCount?: number }>(`/video/like/${video._id}`, {
        userId: authUser._id,
        action: prevLiked ? "unlike" : "like",
      });
      if (data.likesCount !== undefined) setLikesCount(data.likesCount);
    } catch {
      setLikeOverride(prevLiked);
      setLikesCount(prevCount);
      toast.error("Couldn't like this video. Try again.");
    } finally {
      setLikeLoading(false);
    }
  }, [authUser, liked, likesCount, likeLoading, video._id]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Determine preload strategy: auto for active, metadata for adjacent, none for far
  const preload =
    isActive ? "auto" : Math.abs(index - activeIndex) <= 1 ? "metadata" : "none";

  return (
    // Outer: full-bleed, dark backdrop, centers the actual player.
    // Inner (.shorts-frame): full-bleed on mobile, but capped to a 9:16
    // card on desktop — so shorts don't stretch to fill a wide viewport.
    <div className="shorts-frame-outer">
      <div className="shorts-frame">
      {/* Thumbnail – shown until the video starts */}
      {thumb && !isDataThumb && (
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="(min-width: 768px) 440px, 100vw"
          style={{ objectFit: "cover" }}
          priority={isActive}
          unoptimized={false}
        />
      )}

      {/* Video element. `file` is absent for gated content — the backend
          excludes rentable videos from the shorts feed, so this should never
          happen here, but rendering a <video> with no src produces a silent
          black tile rather than an obvious failure. Fall back to the poster. */}
      {video.file && (
      <video
        ref={videoRef}
        src={video.file}
        loop
        playsInline
        muted={muted}
        preload={preload}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => { setBuffering(false); setLoadError(false); }}
        onCanPlay={() => setBuffering(false)}
        onError={() => { setBuffering(false); setLoadError(true); }}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          cursor: "pointer",
          zIndex: 1,
          visibility: loadError ? "hidden" : "visible",
        }}
      />
      )}

      {/* Buffering spinner / playback failure (poster stays visible behind) */}
      {isActive && (buffering || loadError || !video.file) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {loadError || !video.file ? (
            <span
              style={{
                padding: "8px 14px",
                borderRadius: 9999,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              This short can&apos;t be played right now
            </span>
          ) : (
            <span className="shorts-spinner" aria-label="Loading" />
          )}
        </div>
      )}

      {/* Tap-to-play / pause flash icon */}
      {tapIcon && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "shorts-pop 0.15s ease-out",
            }}
          >
            {tapIcon === "pause"
              ? <Pause size={28} fill="#fff" stroke="none" />
              : <Play size={28} fill="#fff" stroke="none" />
            }
          </div>
        </div>
      )}

      {/* Active-but-user-paused indicator in corner */}
      {isActive && paused && !tapIcon && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
          }}
        >
          <Play size={28} fill="#fff" stroke="none" />
        </button>
      )}

      {/* Bottom gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 65%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Right action bar */}
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 110,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          zIndex: 10,
        }}
      >
        <ActionBtn onClick={handleLike} label={fmtCount(likesCount)}>
          <Heart
            size={28}
            fill={liked ? "#ef4444" : "none"}
            color={liked ? "#ef4444" : "#fff"}
          />
        </ActionBtn>

        <ActionBtn onClick={() => onOpenComments(video)} label={fmtCount(commentCount)}>
          <MessageCircle size={26} color="#fff" />
        </ActionBtn>

        <ActionBtn onClick={share} label="Share">
          <Share2 size={26} color="#fff" />
        </ActionBtn>

        <ActionBtn label={fmtCount(viewsCount)}>
          <Eye size={24} color="#fff" />
        </ActionBtn>

        <ActionBtn onClick={onMuteToggle} label={muted ? "Unmute" : "Mute"}>
          {muted ? (
            <VolumeX size={24} color="#fff" />
          ) : (
            <Volume2 size={24} color="#fff" />
          )}
        </ActionBtn>
      </div>

      {/* Bottom info overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 16,
          right: 72,
          zIndex: 10,
        }}
      >
        {author?.username && (
          <Link
            href={`/user/${author._id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              textDecoration: "none",
              maxWidth: "100%",
            }}
          >
            <Avatar src={author.avatar} username={author.username} size={30} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{author.username}
            </span>
          </Link>
        )}
        <Link
          href={`/watch/${video.slug ?? video._id}`}
          style={{ textDecoration: "none" }}
        >
          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.35,
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {video.title}
          </h3>
        </Link>
        {video.description && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            }}
          >
            {video.description}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── ShortsPlayer ─────────────────────────────────────────────────────────────
export function ShortsPlayer({ videos }: { videos: Video[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Deep-link support: /shorts?v=<slug-or-id> opens positioned at that
  // video (e.g. clicked from the homepage's Shorts row) instead of always
  // starting at the first one.
  const initialVideoParam = searchParams.get("v");
  const initialIndex = useMemo(() => {
    if (!initialVideoParam) return 0;
    const idx = videos.findIndex((v) => v.slug === initialVideoParam || v._id === initialVideoParam);
    return idx === -1 ? 0 : idx;
  }, [initialVideoParam, videos]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(true); // start muted → autoplay always works

  // Comments drawer — a single instance shared across all items; `commentsVideo`
  // is kept set (not nulled) after close so the exit animation has content to show.
  const [commentsVideo, setCommentsVideo] = useState<Video | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  // Latest comment list per video, so posts/replies survive reopening the drawer.
  const [commentsById, setCommentsById] = useState<Record<string, VideoComment[]>>({});

  const openComments = useCallback((video: Video) => {
    setCommentsVideo(video);
    setCommentsOpen(true);
  }, []);

  // Auth prompt drawer, mirrors the wiring in WatchClient — this page has no
  // ancestor that already listens for "wecinema:open-auth".
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const [authDrawerTab, setAuthDrawerTab] = useState<"login" | "signup">("login");

  useEffect(() => {
    function handleOpenAuth(e: Event) {
      const detail = (e as CustomEvent<{ tab?: "login" | "signup" }>).detail;
      setAuthDrawerTab(detail?.tab ?? "login");
      setAuthDrawerOpen(true);
    }
    window.addEventListener("wecinema:open-auth", handleOpenAuth);
    return () => window.removeEventListener("wecinema:open-auth", handleOpenAuth);
  }, []);

  // Jump (no scroll animation) to the deep-linked video on first mount.
  useEffect(() => {
    if (initialIndex > 0) {
      itemRefs.current[initialIndex]?.scrollIntoView({ behavior: "auto", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect which item is ≥50% visible
  useEffect(() => {
    const items = itemRefs.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = items.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.5 },
    );
    items.forEach((el) => { if (el) obs.observe(el); });
    return () => items.forEach((el) => { if (el) obs.unobserve(el); });
  }, []);

  // Keep ?v= in step with the visible short, so refresh / copy-link reopens it.
  // replaceState (not router.replace) avoids a server round-trip per swipe.
  const activeVideo = videos[activeIndex];
  useEffect(() => {
    if (!activeVideo) return;
    const url = new URL(window.location.href);
    const v = activeVideo.slug ?? activeVideo._id;
    if (url.searchParams.get("v") === v) return;
    url.searchParams.set("v", v);
    window.history.replaceState(window.history.state, "", url);
  }, [activeVideo]);

  const scrollToIndex = useCallback((i: number) => {
    const target = Math.min(Math.max(i, 0), videos.length - 1);
    itemRefs.current[target]?.scrollIntoView({ behavior: "smooth" });
  }, [videos.length]);

  // Keyboard nav: ↑↓ or j/k — suppressed while typing in the comments/auth
  // drawers so arrow keys move the caret instead of scrolling the feed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (commentsOpen || authDrawerOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, scrollToIndex, commentsOpen, authDrawerOpen]);

  if (videos.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          background: "#000",
          gap: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.55)" }}>
          No shorts available yet.
        </p>
        <Link
          href="/"
          style={{ color: "#FFBB00", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes shorts-pop {
          from { transform: scale(0.75); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .shorts-scroller {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .shorts-scroller::-webkit-scrollbar {
          display: none;
        }
        .shorts-frame-outer {
          position: relative;
          width: 100%;
          height: 100dvh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shorts-frame {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        @keyframes shorts-spin { to { transform: rotate(360deg); } }
        .shorts-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.25);
          border-top-color: #fff;
          animation: shorts-spin 0.8s linear infinite;
        }
        .shorts-nav {
          display: none;
        }
        @media (min-width: 768px) {
          .shorts-nav {
            position: absolute;
            right: 28px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 20;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .shorts-nav button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          .shorts-nav button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.22);
          }
          .shorts-nav button:disabled {
            opacity: 0.3;
            cursor: default;
          }
          .shorts-frame {
            width: min(calc(100dvh * 9 / 16), 440px);
            height: min(100%, calc(440px * 16 / 9));
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
          }
        }
      `}</style>

      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100 }}>
        {/* ── Top bar ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            padding: "env(safe-area-inset-top, 0px) 16px 0",
            height: "calc(60px + env(safe-area-inset-top, 0px))",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              padding: "8px 8px 8px 0",
              pointerEvents: "auto",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={22} />
          </button>

          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-poppins, sans-serif)",
              letterSpacing: "-0.01em",
              pointerEvents: "none",
            }}
          >
            Shorts
          </span>

          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 500,
              marginLeft: 4,
              pointerEvents: "none",
            }}
          >
            {activeIndex + 1} / {videos.length}
          </span>
        </div>

        {/* ── Scroll container ── */}
        <div
          ref={containerRef}
          className="shorts-scroller"
          style={{
            height: "100dvh",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
          }}
        >
          {videos.map((video, i) => (
            <div
              key={video._id}
              ref={(el) => { itemRefs.current[i] = el; }}
              style={{
                height: "100dvh",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                flexShrink: 0,
              }}
            >
              <ShortItem
                video={video}
                index={i}
                activeIndex={activeIndex}
                isActive={i === activeIndex}
                muted={muted}
                onMuteToggle={() => setMuted((m) => !m)}
                commentCount={(commentsById[video._id] ?? video.comments ?? []).length}
                onOpenComments={openComments}
              />
            </div>
          ))}
        </div>

        {/* Desktop up/down (mobile swipes) */}
        <div className="shorts-nav">
          <button
            type="button"
            aria-label="Previous short"
            disabled={activeIndex === 0}
            onClick={() => scrollToIndex(activeIndex - 1)}
          >
            <ChevronUp size={22} />
          </button>
          <button
            type="button"
            aria-label="Next short"
            disabled={activeIndex >= videos.length - 1}
            onClick={() => scrollToIndex(activeIndex + 1)}
          >
            <ChevronDown size={22} />
          </button>
        </div>

        <ShortsCommentsDrawer
          key={commentsVideo?._id ?? "none"}
          video={commentsVideo}
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          comments={commentsVideo ? commentsById[commentsVideo._id] : undefined}
          onCommentsChange={(videoId, comments) =>
            setCommentsById((prev) => ({ ...prev, [videoId]: comments }))
          }
        />

        <HypemodeAuthDrawer
          open={authDrawerOpen}
          onClose={() => setAuthDrawerOpen(false)}
          defaultTab={authDrawerTab}
        />
      </div>
    </>
  );
}
