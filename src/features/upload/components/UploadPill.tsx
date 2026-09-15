"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUploads, isJobInProgress } from "@/features/upload/context/UploadManagerProvider";

/**
 * Phone-width upload indicator: a floating pill above the bottom nav, where the
 * header avatar is too small to read. CSS-hidden on wider screens.
 */
export function UploadPill({ bottomOffset }: { bottomOffset: number }) {
  const pathname = usePathname();
  const { jobs, totalProgress, ringState } = useUploads();
  const current = jobs.find((j) => isJobInProgress(j.state));

  // The draft editor has its own status bar.
  if (!current || pathname.startsWith("/upload/video")) return null;

  const pct = Math.floor(totalProgress);
  const waiting = ringState === "waiting";
  const r = 9;
  const c = 2 * Math.PI * r;

  return (
    <>
      <style>{`
        .upload-pill { position: fixed; right: 12px; z-index: 61; display: flex; align-items: center; gap: 8px;
          padding: 6px 14px 6px 6px; border-radius: 9999px; text-decoration: none;
          background: var(--color-bg-elevated); border: 1px solid var(--color-border-secondary);
          box-shadow: 0 6px 24px rgba(0,0,0,0.18); transition: bottom 0.25s ease; }
        @media (min-width: 769px) { .upload-pill { display: none; } }
      `}</style>
      <Link
        href={`/upload/video/${current.draftId}`}
        className="upload-pill"
        style={{ bottom: `calc(${bottomOffset + 12}px + env(safe-area-inset-bottom, 0px))` }}
        aria-label={waiting ? `Upload paused at ${pct}%` : `Uploading ${pct}%`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden style={{ transform: "rotate(-90deg)" }}>
          <circle cx="12" cy="12" r={r} fill="none" stroke="var(--color-border-secondary)" strokeWidth="3" />
          <circle
            cx="12" cy="12" r={r} fill="none"
            stroke={waiting ? "#F59E0B" : "var(--color-accent-primary)"}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-text-primary)" }}>
          {waiting ? "Paused" : "Uploading"} {pct}%
        </span>
      </Link>
    </>
  );
}
