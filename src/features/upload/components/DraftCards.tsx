"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Film, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { AppError } from "@/features/auth/services/apiClient";
import { deleteDraft, type VideoDraft } from "@/features/upload/api/drafts";
import { useUploads, isJobInProgress, type UploadJob } from "@/features/upload/context/UploadManagerProvider";
import {
  TONE_COLOR, jobPercent, uploadStatusText, uploadTone, type UploadTone,
} from "@/features/upload/lib/uploadStatus";
import { formatBytes } from "@/features/upload/components/UploadUI";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** Where a draft stands, preferring this browser's live upload over the server's view. */
export function draftStatus(draft: VideoDraft, job?: UploadJob): { text: string; tone: UploadTone; pct: number | null } {
  if (job && (isJobInProgress(job.state) || job.state === "failed")) {
    return { text: uploadStatusText(job), tone: uploadTone(job.state), pct: jobPercent(job) };
  }
  if (job?.state === "completed" || draft.upload.state === "uploaded") {
    return { text: "Ready to publish", tone: "done", pct: null };
  }
  if (draft.upload.state === "failed") return { text: "Upload failed", tone: "error", pct: null };
  return { text: "Upload interrupted", tone: "waiting", pct: null };
}

export function DraftCard({ draft, onDeleted }: { draft: VideoDraft; onDeleted: (id: string) => void }) {
  const { getJob, cancel } = useUploads();
  const job = getJob(draft._id);
  const status = draftStatus(draft, job);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    try {
      if (job) await cancel(draft._id);
      else await deleteDraft(draft._id);
      onDeleted(draft._id);
      toast.success("Draft deleted");
    } catch (err) {
      if (err instanceof AppError && err.status === 404) onDeleted(draft._id);
      else toast.error(err instanceof Error ? err.message : "Couldn't delete the draft");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link href={`/upload/video/${draft._id}`} style={{ position: "relative", display: "block", aspectRatio: "16 / 9", background: "var(--color-bg-secondary)" }}>
        {draft.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Film size={30} color="var(--color-text-tertiary)" style={{ opacity: 0.5 }} aria-hidden />
          </div>
        )}
        <span
          style={{
            position: "absolute", left: 10, top: 10,
            padding: "3px 9px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
            background: "rgba(0,0,0,0.72)", color: status.tone === "active" ? "#FFCB33" : TONE_COLOR[status.tone],
            backdropFilter: "blur(4px)",
          }}
        >
          {status.tone === "done" ? "Ready to publish" : status.tone === "error" ? "Failed" : status.tone === "waiting" ? "Paused" : "Uploading"}
        </span>
        {status.pct != null && (
          <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "rgba(0,0,0,0.4)" }}>
            <div style={{ height: "100%", width: `${status.pct}%`, background: status.tone === "waiting" ? TONE_COLOR.waiting : "linear-gradient(to right, var(--color-accent-primary), #FFCB33)", transition: "width 0.3s ease" }} />
          </div>
        )}
      </Link>

      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {draft.title || "Untitled video"}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: status.tone === "active" ? "var(--color-text-tertiary)" : TONE_COLOR[status.tone] }}>
          {status.text}
        </p>
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--color-text-tertiary)" }}>
          {draft.upload.fileSize ? `${formatBytes(draft.upload.fileSize)} · ` : ""}Edited {timeAgo(draft.updatedAt)}
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 10 }}>
          <Link
            href={`/upload/video/${draft._id}`}
            style={{
              flex: 1, textAlign: "center", padding: "8px 12px", borderRadius: 10,
              background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
              color: "var(--color-btn-primary-text, #000)", fontSize: 12.5, fontWeight: 700, textDecoration: "none",
            }}
          >
            {status.tone === "done" ? "Publish" : status.tone === "waiting" && !job ? "Resume" : "Continue"}
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={confirming ? "Confirm delete draft" : `Delete draft ${draft.title}`}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              border: "1px solid rgba(239,68,68,0.3)",
              background: confirming ? "#EF4444" : "rgba(239,68,68,0.08)",
              color: confirming ? "#fff" : "#EF4444",
              cursor: deleting ? "wait" : "pointer",
            }}
          >
            <Trash2 size={13} aria-hidden />
            {confirming ? "Delete?" : null}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DraftsGrid({ drafts, onDeleted }: { drafts: VideoDraft[]; onDeleted: (id: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
      {drafts.map((d) => <DraftCard key={d._id} draft={d} onDeleted={onDeleted} />)}
    </div>
  );
}
