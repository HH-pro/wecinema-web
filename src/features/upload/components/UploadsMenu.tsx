"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Film, Pause, Play, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useUploads, type UploadJob } from "@/features/upload/context/UploadManagerProvider";
import { TONE_COLOR, jobPercent, uploadStatusText, uploadTone } from "@/features/upload/lib/uploadStatus";

const iconBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: 8, border: "none",
  background: "transparent", color: "var(--color-text-tertiary)", cursor: "pointer", flexShrink: 0,
};

function UploadRow({ job, onNavigate }: { job: UploadJob; onNavigate: () => void }) {
  const { pause, resume, cancel, dismiss } = useUploads();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const tone = uploadTone(job.state);
  const pct = tone === "done" ? 100 : jobPercent(job);
  const canPause = job.state === "uploading" || job.state === "preparing";
  const canResume = job.state === "paused";
  const finished = job.state === "completed" || job.state === "failed" || job.state === "cancelled";

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await cancel(job.draftId);
      toast.success("Upload cancelled and draft deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the draft");
    }
  };

  return (
    <div style={{ padding: "8px 10px", borderRadius: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: tone === "done" ? "rgba(34,197,94,0.12)" : "var(--accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {tone === "done"
            ? <CheckCircle2 size={17} color={TONE_COLOR.done} />
            : <Film size={16} color="var(--color-accent-primary)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.fileName}
          </p>
          <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: tone === "active" ? "var(--color-text-tertiary)" : TONE_COLOR[tone], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {uploadStatusText(job)}
          </p>
        </div>
        {canPause && (
          <button type="button" style={iconBtn} onClick={() => pause(job.draftId)} aria-label={`Pause ${job.fileName}`} title="Pause">
            <Pause size={14} />
          </button>
        )}
        {canResume && (
          <button type="button" style={iconBtn} onClick={() => resume(job.draftId)} aria-label={`Resume ${job.fileName}`} title="Resume">
            <Play size={14} />
          </button>
        )}
        {finished ? (
          <button type="button" style={iconBtn} onClick={() => dismiss(job.draftId)} aria-label="Hide from this list" title="Hide">
            <X size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            aria-label={confirmDelete ? "Confirm: cancel upload and delete draft" : `Cancel upload of ${job.fileName}`}
            title={confirmDelete ? "Click again to delete" : "Cancel upload"}
            style={{
              ...iconBtn,
              width: confirmDelete ? "auto" : 26,
              padding: confirmDelete ? "0 8px" : 0,
              color: confirmDelete ? "#EF4444" : iconBtn.color,
              background: confirmDelete ? "rgba(239,68,68,0.1)" : "transparent",
              fontSize: 11, fontWeight: 700, fontFamily: "inherit",
            }}
          >
            {confirmDelete ? "Delete?" : <Trash2 size={13} />}
          </button>
        )}
      </div>

      {!finished && (
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${job.fileName} upload progress`}
          style={{ height: 4, borderRadius: 9999, background: "var(--color-border-secondary)", overflow: "hidden", margin: "8px 0 0 44px" }}
        >
          <div
            style={{
              height: "100%", width: `${pct}%`, borderRadius: 9999,
              background: tone === "waiting" ? TONE_COLOR.waiting : "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      <Link
        href={`/upload/video/${job.draftId}`}
        onClick={onNavigate}
        style={{ display: "inline-block", margin: "6px 0 0 44px", fontSize: "0.72rem", fontWeight: 600, color: "var(--color-accent-primary)", textDecoration: "none" }}
      >
        {job.state === "completed" ? "Publish →" : job.state === "needs-file" ? "Re-select file →" : "Edit details →"}
      </Link>
    </div>
  );
}

/** Uploads list for the header's user menu. Renders nothing without uploads. */
export function UploadsMenuSection({ onNavigate }: { onNavigate: () => void }) {
  const { jobs, activeCount } = useUploads();
  if (jobs.length === 0) return null;

  return (
    <div style={{ padding: "6px 4px", borderBottom: "1px solid var(--color-divider)", maxHeight: 320, overflowY: "auto" }}>
      <p style={{ margin: "4px 0 2px 10px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--color-text-tertiary)" }}>
        Uploads{activeCount > 0 ? ` · ${activeCount} in progress` : ""}
      </p>
      {jobs.map((job) => <UploadRow key={job.draftId} job={job} onNavigate={onNavigate} />)}
    </div>
  );
}
