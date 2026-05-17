"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import type { Video, VideoRendition } from "@/types";

interface TranscodingStatusResponse {
  transcodingStatus?: string;
  renditions?: VideoRendition[];
}

function openAuthEvent(tab: "login" | "signup" = "login") {
  window.dispatchEvent(
    new CustomEvent("wecinema:open-auth", { detail: { tab } }),
  );
}

export function VideoPlayer({ video }: { video: Video }) {
  const { authUser, isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTrackedRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [renditions, setRenditions] = useState<VideoRendition[]>(
    video.renditions ?? [],
  );
  const [activeQuality, setActiveQuality] = useState<string>("auto");
  const [qualityOpen, setQualityOpen] = useState(false);
  const [transcodingStatus, setTranscodingStatus] = useState(
    video.transcodingStatus ?? "completed",
  );

  const isPending =
    transcodingStatus === "pending" || transcodingStatus === "processing";

  // Only paywalled if the creator marked it for sale AND this user hasn't purchased it
  const isPaywalled = video.isForSale === true && !video.hasPaid;

  const trackView = useCallback(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    api
      .put(`/video/view/${video._id}`)
      .catch(() => {});
  }, [video._id]);

  useEffect(() => {
    if (!isPending) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const data = await api.get<TranscodingStatusResponse>(
          `/video/${video._id}/transcoding-status`,
        );
        if (
          data.transcodingStatus === "completed" ||
          data.transcodingStatus === "failed"
        ) {
          setTranscodingStatus(data.transcodingStatus);
          if (data.renditions) setRenditions(data.renditions);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch {
      }
    }, 10_000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isPending, video._id]);

  function changeQuality(quality: string) {
    const el = videoRef.current;
    if (!el) return;
    const currentTime = el.currentTime;
    const wasPaused = el.paused;

    if (quality === "auto") {
      el.src = video.file;
    } else {
      const rendition = renditions.find((r) => r.quality === quality);
      if (!rendition) return;
      el.src = rendition.url ?? rendition.fileKey;
    }

    setActiveQuality(quality);
    setQualityOpen(false);

    el.load();
    el.currentTime = currentTime;
    if (!wasPaused) el.play().catch(() => {});
  }

  if (isPaywalled) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          maxHeight: 540,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "var(--color-bg-elevated)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {video.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(8px) brightness(0.35)",
            }}
          />
        )}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "0 24px",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(245,158,11,0.4)",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 20,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              Premium Content
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {isAuthenticated
                ? "This is a paid video. Upgrade your plan to watch."
                : "Sign in or create a free account to purchase this video."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => openAuthEvent("login")}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 9999,
                    fontWeight: 700,
                    fontSize: 14,
                    border: "1.5px solid rgba(255,255,255,0.6)",
                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    cursor: "pointer",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthEvent("signup")}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 9999,
                    fontWeight: 700,
                    fontSize: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                    color: "#000",
                    cursor: "pointer",
                  }}
                >
                  Sign Up Free
                </button>
              </>
            ) : (
              <Link
                href="/hypemode"
                style={{
                  padding: "10px 28px",
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                  color: "#000",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Upgrade to Watch
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {isPending && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 10,
            backgroundColor: "rgba(245,158,11,0.9)",
            color: "#000",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 9999,
            letterSpacing: "0.04em",
          }}
        >
          Processing…
        </div>
      )}

      {renditions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setQualityOpen((p) => !p)}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.6)",
              border: "none",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
            aria-label="Quality settings"
          >
            ⚙
          </button>

          {qualityOpen && (
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 0,
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-card-border)",
                borderRadius: 10,
                overflow: "hidden",
                minWidth: 110,
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {[
                { label: "Auto", value: "auto" },
                ...renditions.map((r) => ({
                  label: r.quality,
                  value: r.quality,
                })),
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => changeQuality(opt.value)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 14px",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: activeQuality === opt.value ? 700 : 400,
                    color:
                      activeQuality === opt.value
                        ? "#F59E0B"
                        : "var(--color-text-primary)",
                    backgroundColor:
                      activeQuality === opt.value
                        ? "rgba(245,158,11,0.1)"
                        : "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <video
        ref={videoRef}
        controls
        src={video.file}
        poster={video.thumbnail}
        onPlay={trackView}
        style={{
          width: "100%",
          maxHeight: 540,
          borderRadius: 12,
          display: "block",
          backgroundColor: "#000",
        }}
      />
    </div>
  );
}
