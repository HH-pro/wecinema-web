"use client";
/**
 * VideoPlayerModal — Wecinema Marketplace (Seller)
 * Light + dark mode, lucide-react icons, framer-motion,
 * ref-based video controls (no document.querySelector).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Download, Maximize2, Minimize2, Pause, Play,
  Volume2, VolumeX, X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────

interface VideoPlayerModalProps {
  videoUrl: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────

function getVideoType(url: string): string {
  if (url.includes(".webm")) return "video/webm";
  if (url.includes(".ogg"))  return "video/ogg";
  if (url.includes(".mov"))  return "video/quicktime";
  return "video/mp4";
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── VideoPlayerModal ─────────────────────────────────────────

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  videoUrl,
  title,
  isOpen,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playing,   setPlaying]   = useState(false);
  const [muted,     setMuted]     = useState(false);
  const [volume,    setVolume]    = useState(1);
  const [progress,  setProgress]  = useState(0);   // 0–1
  const [duration,  setDuration]  = useState(0);
  const [current,   setCurrent]   = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Close on Escape ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") toggleMute();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, playing, muted]); // eslint-disable-line

  // ── Reset when URL changes ─────────────────────────────────
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrent(0);
    setDuration(0);
  }, [videoUrl]);

  // ── Controls auto-hide ─────────────────────────────────────
  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 3000);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // ── Video event handlers ───────────────────────────────────
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setCurrent(v.currentTime);
    setProgress(v.currentTime / v.duration);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  };

  const handleEnded = () => setPlaying(false);

  // ── Playback controls ─────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleVolumeChange = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
    v.muted = val === 0;
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = videoRef.current?.closest("[data-video-container]") as HTMLElement | null;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.96,  y: 8  }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            data-video-container
            className="relative w-full max-w-4xl bg-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col"
            style={{ maxHeight: "calc(100vh - 2rem)" }}
            onMouseMove={showControls}
          >
            {/* ── Header ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
              <h3 className="text-sm font-semibold text-white truncate pr-4">{title || "Video Preview"}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            {/* ── Video ───────────────────────────────────────── */}
            <div
              className="relative bg-black flex-1 cursor-pointer select-none"
              onClick={togglePlay}
            >
              <video
                ref={videoRef}
                key={videoUrl}
                className="w-full h-full max-h-[60vh] object-contain"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              >
                <source src={videoUrl} type={getVideoType(videoUrl)} />
                Your browser does not support the video tag.
              </video>

              {/* Big play overlay — shown only when paused */}
              <AnimatePresence>
                {!playing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <Play size={28} className="text-white ml-1" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Controls ────────────────────────────────────── */}
            <motion.div
              animate={{ opacity: controlsVisible ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-900 border-t border-gray-800 px-4 pb-4 pt-3 flex-shrink-0"
            >
              {/* Progress bar */}
              <div
                className="w-full h-1.5 bg-gray-700 rounded-full mb-3 cursor-pointer group relative"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all pointer-events-none relative"
                  style={{ width: `${progress * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between gap-3">
                {/* Left: play + mute + volume + time */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    className="p-2 rounded-xl text-white hover:bg-gray-700 transition-colors"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? <Pause size={16} /> : <Play size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    className="p-2 rounded-xl text-white hover:bg-gray-700 transition-colors"
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Volume slider */}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => { e.stopPropagation(); handleVolumeChange(Number(e.target.value)); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 accent-yellow-500 cursor-pointer"
                    aria-label="Volume"
                  />

                  <span className="text-xs text-gray-400 tabular-nums">
                    {formatTime(current)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right: fullscreen */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="p-2 rounded-xl text-white hover:bg-gray-700 transition-colors"
                    aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayerModal;
