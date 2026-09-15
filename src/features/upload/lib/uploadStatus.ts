import type { UploadJob, UploadJobState } from "@/features/upload/context/UploadManagerProvider";

export function formatEta(seconds: number) {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} sec`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export function formatSpeed(bytesPerSecond: number) {
  const mbps = (bytesPerSecond * 8) / 1_000_000;
  return mbps >= 1 ? `${mbps.toFixed(1)} Mbps` : `${Math.max(1, Math.round(mbps * 1000))} kbps`;
}

export const jobPercent = (job: Pick<UploadJob, "loadedBytes" | "totalBytes">) =>
  job.totalBytes > 0 ? Math.min(100, Math.floor((job.loadedBytes / job.totalBytes) * 100)) : 0;

export type UploadTone = "active" | "waiting" | "done" | "error";

export function uploadTone(state: UploadJobState): UploadTone {
  if (state === "completed") return "done";
  if (state === "failed" || state === "cancelled") return "error";
  if (state === "paused" || state === "offline" || state === "needs-auth" || state === "needs-file") return "waiting";
  return "active";
}

/** One line describing where an upload is, e.g. "42% · 3 min left". */
export function uploadStatusText(job: UploadJob) {
  const pct = jobPercent(job);
  switch (job.state) {
    case "preparing":
      return "Preparing upload…";
    case "uploading":
      if (job.retrying) return `${pct}% · Reconnecting…`;
      return job.etaSec != null ? `${pct}% · ${formatEta(job.etaSec)} left` : `${pct}% uploaded`;
    case "paused":
      return `Paused at ${pct}%`;
    case "offline":
      return `No internet · will resume at ${pct}%`;
    case "needs-auth":
      return "Sign in to continue uploading";
    case "needs-file":
      return "Re-select the file to resume";
    case "completing":
      return "Finishing upload…";
    case "completed":
      return "Upload complete";
    case "failed":
      return job.error ?? "Upload failed";
    case "cancelled":
      return "Upload cancelled";
  }
}

export const TONE_COLOR: Record<UploadTone, string> = {
  active: "var(--color-accent-primary)",
  waiting: "#F59E0B",
  done: "rgb(34,197,94)",
  error: "#EF4444",
};
