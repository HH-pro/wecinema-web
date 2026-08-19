"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import { getEntitlement, getStreamUrl } from "@/features/watch/api/rental.service";
import type { RentalSummary } from "@/features/watch/types/rental.types";
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

// Handled by WatchClient, which owns the rental checkout modal. Same
// indirection as the auth drawer above, so the player doesn't have to own
// modal state or pull the Stripe bundle into its own chunk.
function openRentEvent() {
  window.dispatchEvent(new CustomEvent("wecinema:open-rent"));
}

/** "in 41h", "in 2d", "in 18m" — coarse on purpose; the exact second is noise. */
function formatRemaining(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "soon";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `in ${hours}h`;
  return `in ${Math.floor(hours / 24)}d`;
}

export function VideoPlayer({ video }: { video: Video }) {
  const { isAuthenticated, status } = useAuth();
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

  // The gate is decided by the SERVER, not by flags the client could reason
  // about. For a rented film the backend simply doesn't send `file`, so the
  // absence of a playable URL is the lock.
  //
  // This replaces `video.isForSale === true && !video.hasPaid`, which was wrong
  // in both operands: `isForSale` means "listed on the marketplace" and
  // `hasPaid` means "is HypeMode premium content" (it is a property of the
  // video, never of the viewer). That expression paywalled marketplace listings
  // while leaving the signed URL sitting in the same JSON payload.
  const isRentable = video.isRentable === true;

  // Server-granted playback URL for a gated film, fetched on a deliberate play.
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamExpiresAt, setStreamExpiresAt] = useState<number | null>(null);
  const [rental, setRental] = useState<RentalSummary | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  // null = still checking. Avoids flashing a paywall at someone who paid.
  const [entitled, setEntitled] = useState<boolean | null>(isRentable ? null : true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playableSrc = video.file ?? streamUrl ?? undefined;
  const isLocked = isRentable && !playableSrc && entitled !== true;

  const priceLabel =
    typeof video.rentalPriceCents === "number"
      ? `$${(video.rentalPriceCents / 100).toFixed(2)}`
      : null;

  // The 1-hour plan makes pluralisation load-bearing — "1 hours" everywhere the
  // window is shown, otherwise.
  const playWindowHours = video.rentalPlayWindowHours ?? 48;
  const playWindowLabel = `${playWindowHours} ${playWindowHours === 1 ? "hour" : "hours"}`;

  const rentalTerms =
    `${video.rentalWindowDays ?? 30} days to start watching · ` +
    `${playWindowLabel} once you press play`;

  const trackView = useCallback(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    api
      .put(`/video/view/${video._id}`)
      .catch(() => {});
  }, [video._id]);

  // ── Rental entitlement ─────────────────────────────────────
  // Resolved client-side because the page is rendered without user identity
  // (the access token lives in memory only, and a per-user URL must never end
  // up in a shared/CDN-cached HTML response).
  const checkEntitlement = useCallback(() => {
    if (!isRentable || video.file) return;
    getEntitlement(video._id)
      .then((res) => {
        setEntitled(res.entitled);
        setRental(res.rental ?? null);
      })
      .catch(() => setEntitled(false));
  }, [isRentable, video.file, video._id]);

  useEffect(() => {
    if (status === "loading") return;

    // Anonymous: ask straight away, the answer can't change.
    if (status !== "authenticated") {
      checkEntitlement();
      return;
    }

    // Authenticated: we must wait for the ACCESS TOKEN, not just for `status`.
    // AuthContext flips status to "authenticated" optimistically from the user
    // cached in localStorage, while the token is still being fetched from the
    // refresh cookie. Asking before the token lands sends an unauthenticated
    // request, and the endpoint answers 200 "anonymous" — so there's no 401 to
    // trigger a retry and a paying viewer gets shown the paywall.
    if (tokenStorage.get()) {
      checkEntitlement();
      return;
    }

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (tokenStorage.get()) {
        clearInterval(timer);
        checkEntitlement();
      } else if (tries > 40) {
        // ~6s: the refresh isn't coming. Ask anyway and take the answer.
        clearInterval(timer);
        checkEntitlement();
      }
    }, 150);

    return () => clearInterval(timer);
  }, [checkEntitlement, status]);

  // Re-check after a successful checkout so the paywall swaps for the play
  // button without a reload. Dispatched by WatchClient.
  useEffect(() => {
    function onActivated() {
      setEntitled(null);
      checkEntitlement();
    }
    window.addEventListener("wecinema:rental-activated", onActivated);
    return () => window.removeEventListener("wecinema:rental-activated", onActivated);
  }, [checkEntitlement]);

  /**
   * Fetch a playable URL. THIS STARTS THE 48-HOUR CLOCK, so it runs only on a
   * deliberate play — never on mount. A viewer who opens the page and walks
   * away must not lose their window.
   */
  const requestStream = useCallback(
    async (autoplay: boolean) => {
      setUnlocking(true);
      setStreamError(null);
      try {
        const res = await getStreamUrl(video._id);
        setStreamUrl(res.url);
        setStreamExpiresAt(new Date(res.urlExpiresAt).getTime());
        if (res.renditions?.length) setRenditions(res.renditions);
        if (res.rental) setRental(res.rental);
        setEntitled(true);

        if (autoplay) {
          // Wait for React to attach the new src before playing.
          requestAnimationFrame(() => videoRef.current?.play().catch(() => {}));
        }
        return res.url;
      } catch (err) {
        const e = err as { status?: number; message?: string };
        if (e?.status === 403) {
          setEntitled(false);
          setStreamError(e.message ?? "Your rental is no longer active.");
        } else {
          setStreamError("Could not start playback. Please try again.");
        }
        return null;
      } finally {
        setUnlocking(false);
      }
    },
    [video._id],
  );

  // Signed stream URLs are short-lived. Refresh a little before expiry and
  // hot-swap, so a long film doesn't 403 mid-playback.
  useEffect(() => {
    if (!streamExpiresAt || !streamUrl) return;
    const leadMs = 2 * 60 * 1000;
    const delay = Math.max(5_000, streamExpiresAt - Date.now() - leadMs);

    refreshTimerRef.current = setTimeout(() => {
      const el = videoRef.current;
      const wasPlaying = el && !el.paused;
      getStreamUrl(video._id)
        .then((res) => {
          setStreamUrl(res.url);
          setStreamExpiresAt(new Date(res.urlExpiresAt).getTime());
          if (el) {
            const t = el.currentTime;
            el.src = res.url;
            el.load();
            el.currentTime = t;
            if (wasPlaying) el.play().catch(() => {});
          }
        })
        .catch(() => {});
    }, delay);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [streamExpiresAt, streamUrl, video._id]);

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
      if (!playableSrc) return;
      el.src = playableSrc;
    } else {
      const rendition = renditions.find((r) => r.quality === quality);
      // `rendition.fileKey` was never a usable fallback — it's a bare S3 object
      // key, not a URL. Only a signed `url` can be played.
      if (!rendition?.url) return;
      el.src = rendition.url;
    }

    setActiveQuality(quality);
    setQualityOpen(false);

    el.load();
    el.currentTime = currentTime;
    if (!wasPaused) el.play().catch(() => {});
  }

  if (isLocked) {
    return (
      <div
        className="paywalled-player"
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
              {priceLabel ? `Rent this film for ${priceLabel}` : "Rent this film"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {isAuthenticated
                ? rentalTerms
                : "Sign in or create a free account to rent this film."}
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
              // Deliberately NOT a link to /hypemode: a HypeMode subscription
              // does not grant a rental, and sending renters to a subscription
              // page they've possibly already paid for is a dead end.
              <button
                type="button"
                onClick={openRentEvent}
                style={{
                  padding: "10px 28px",
                  borderRadius: 9999,
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                  color: "#000",
                  cursor: "pointer",
                }}
              >
                {priceLabel ? `Rent for ${priceLabel}` : "Rent to Watch"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Entitled to a rented film but not playing yet: show a poster with an
  // explicit play button. We must NOT auto-request a stream URL, because that
  // call is what starts the 48-hour clock.
  if (isRentable && entitled === true && !playableSrc) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          maxHeight: 540,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
              opacity: 0.55,
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => requestStream(true)}
            disabled={unlocking}
            aria-label="Play film"
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: "none",
              cursor: unlocking ? "wait" : "pointer",
              background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
              boxShadow: "0 8px 32px rgba(245,158,11,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#000">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            {unlocking
              ? "Starting playback…"
              : rental?.firstPlayedAt
                ? `Your rental ends ${formatRemaining(rental.expiresAt)}`
                : `Press play to start your ${playWindowHours}-hour window`}
          </p>
          {streamError && (
            <p role="alert" style={{ margin: "8px 0 0", fontSize: 13, color: "#fca5a5" }}>
              {streamError}
            </p>
          )}
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

      {rental?.expiresAt && (
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 10,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 9999,
          }}
        >
          Rental ends {formatRemaining(rental.expiresAt)}
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
        src={playableSrc}
        poster={video.thumbnail}
        onPlay={trackView}
        onError={() => {
          // A gated URL that died mid-session (expired signature) is
          // recoverable — fetch a fresh one and resume where we were.
          if (isRentable && streamUrl) requestStream(false);
        }}
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
