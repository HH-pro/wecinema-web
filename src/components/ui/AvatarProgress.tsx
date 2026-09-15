"use client";

import { Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export type AvatarProgressState = "idle" | "active" | "waiting" | "done";

interface AvatarProgressProps {
  src?: string | null;
  username?: string;
  size?: number;
  /** 0–100. Ignored while idle. */
  progress: number;
  /**
   * active:  ring fills in the accent gradient
   * waiting: paused / offline / needs sign-in — amber, pulsing
   * done:    full green ring with a check
   */
  state: AvatarProgressState;
}

const STROKE = 2.5;

/** The header avatar with a circular upload-progress ring around it. */
export function AvatarProgress({ src, username, size = 30, progress, state }: AvatarProgressProps) {
  if (state === "idle") return <Avatar src={src} username={username} size={size} />;

  const box = size + STROKE * 2 + 2;
  const radius = (box - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = state === "done" ? 100 : Math.max(0, Math.min(100, progress));
  const stroke =
    state === "done" ? "rgb(34,197,94)" : state === "waiting" ? "#F59E0B" : "url(#avatar-progress-gradient)";
  const label =
    state === "done" ? "Upload complete" : state === "waiting" ? `Upload paused at ${Math.round(pct)}%` : `Uploading ${Math.round(pct)}%`;

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{ position: "relative", display: "inline-flex", width: box, height: box, flexShrink: 0 }}
    >
      <svg
        width={box}
        height={box}
        viewBox={`0 0 ${box} ${box}`}
        aria-hidden
        className={state === "waiting" ? "avatar-progress-pulse" : undefined}
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <defs>
          <linearGradient id="avatar-progress-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-primary)" />
            <stop offset="100%" stopColor="#FFCB33" />
          </linearGradient>
        </defs>
        <circle cx={box / 2} cy={box / 2} r={radius} fill="none" stroke="var(--color-border-secondary)" strokeWidth={STROKE} />
        <circle
          data-testid="avatar-progress-arc"
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.3s" }}
        />
      </svg>
      <span style={{ position: "absolute", top: STROKE + 1, left: STROKE + 1 }}>
        <Avatar src={src} username={username} size={size} />
      </span>
      {state === "done" && (
        <span
          aria-hidden
          style={{
            position: "absolute", right: -2, bottom: -2,
            width: 14, height: 14, borderRadius: "50%",
            background: "rgb(34,197,94)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid var(--color-bg-elevated)",
          }}
        >
          <Check size={8} strokeWidth={4} />
        </span>
      )}
      <style>{`
        @keyframes avatarProgressPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
        .avatar-progress-pulse { animation: avatarProgressPulse 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .avatar-progress-pulse { animation: none; } }
      `}</style>
    </span>
  );
}
