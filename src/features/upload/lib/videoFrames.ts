"use client";

/**
 * Thumbnail frames straight from a video, in the browser.
 *
 * Works on both a local blob: URL (fresh upload) and a signed S3 URL (editing
 * an existing video). The remote case only works because the bucket's CORS
 * policy allows GET from our origin AND the element is loaded with
 * `crossOrigin="anonymous"` — without both, the canvas is tainted and
 * toBlob() throws a SecurityError.
 */

export type FrameErrorReason = "cors" | "unsupported" | "aborted";

export class FrameCaptureError extends Error {
  constructor(public reason: FrameErrorReason, message: string) {
    super(message);
    this.name = "FrameCaptureError";
  }
}

export interface FrameCandidate {
  time: number;
  blob: Blob;
  score: number;
}

const MAX_OUTPUT_WIDTH = 1280;
const OUTPUT_QUALITY = 0.9;
const SCORE_W = 64;
const SCORE_H = 36;
const LOAD_TIMEOUT_MS = 20_000;
const SEEK_TIMEOUT_MS = 10_000;

// Skip the very start and end — intros and credits are usually black or text.
const SAMPLE_FROM = 0.08;
const SAMPLE_TO = 0.92;

/** Evenly spread sample times across the usable part of the video. */
export function sampleTimes(duration: number, count: number): number[] {
  if (!Number.isFinite(duration) || duration <= 0) return [0];
  if (duration < 2 || count <= 1) return [duration / 2];
  const span = (SAMPLE_TO - SAMPLE_FROM) * duration;
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, i) =>
    Math.round((SAMPLE_FROM * duration + step * i) * 100) / 100,
  );
}

/**
 * How good a frame is as a thumbnail, roughly 0..1, from RGBA pixels.
 * Rewards contrast and detail; black, white-out and flat frames score ~0.
 */
export function scoreFrame(data: Uint8ClampedArray, width: number): number {
  const pixels = data.length / 4;
  if (pixels === 0 || width <= 0) return 0;

  const luma = new Float32Array(pixels);
  let sum = 0;
  for (let i = 0; i < pixels; i++) {
    const o = i * 4;
    const y = 0.299 * data[o]! + 0.587 * data[o + 1]! + 0.114 * data[o + 2]!;
    luma[i] = y;
    sum += y;
  }
  const mean = sum / pixels;

  let variance = 0;
  let edges = 0;
  let edgeCount = 0;
  for (let i = 0; i < pixels; i++) {
    const y = luma[i]!;
    variance += (y - mean) ** 2;
    if ((i + 1) % width !== 0) {
      edges += Math.abs(luma[i + 1]! - y);
      edgeCount++;
    }
  }
  const stdDev = Math.sqrt(variance / pixels);
  const detail = edgeCount ? edges / edgeCount : 0;

  const exposure = 1 - Math.min(1, Math.abs(mean - 128) / 128) ** 2;
  return (0.6 * Math.min(stdDev / 64, 1) + 0.4 * Math.min(detail / 24, 1)) * exposure;
}

function abortError() {
  return new FrameCaptureError("aborted", "Frame capture was cancelled");
}

/** Wait for a one-shot media event, failing on error, timeout or abort. */
function waitFor(
  video: HTMLVideoElement,
  event: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(abortError()); return; }
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, onEvent);
      video.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => {
      cleanup();
      reject(new FrameCaptureError("unsupported", "This browser can't read frames from this video"));
    };
    const onAbort = () => { cleanup(); reject(abortError()); };
    const timer = setTimeout(() => {
      cleanup();
      reject(new FrameCaptureError("unsupported", "Timed out reading the video"));
    }, timeoutMs);
    video.addEventListener(event, onEvent);
    video.addEventListener("error", onError);
    signal?.addEventListener("abort", onAbort);
  });
}

/** Seek and resolve once the new frame is actually decoded and drawable. */
export async function seekTo(video: HTMLVideoElement, time: number, signal?: AbortSignal) {
  const target = Math.max(0, Math.min(time, (video.duration || time) - 0.05));
  if (Math.abs(video.currentTime - target) < 0.01 && video.readyState >= 2) return;
  const seeked = waitFor(video, "seeked", SEEK_TIMEOUT_MS, signal);
  video.currentTime = target;
  await seeked;
  // Some browsers fire `seeked` a tick before the frame is presented.
  if ("requestVideoFrameCallback" in video) {
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 250);
      video.requestVideoFrameCallback(() => { clearTimeout(t); resolve(); });
    });
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, OUTPUT_QUALITY));
}

/** Encode the element's current frame (WebP, JPEG where WebP encoding is missing). */
export async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight) {
    throw new FrameCaptureError("unsupported", "The video has no decodable frames");
  }
  const scale = Math.min(1, MAX_OUTPUT_WIDTH / videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(videoWidth * scale);
  canvas.height = Math.round(videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FrameCaptureError("unsupported", "Canvas is not available");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    let blob = await canvasToBlob(canvas, "image/webp");
    if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg");
    if (!blob) throw new FrameCaptureError("unsupported", "Could not encode the frame");
    return blob;
  } catch (err) {
    if (err instanceof FrameCaptureError) throw err;
    // Tainted canvas: the video host didn't send CORS headers for our origin.
    throw new FrameCaptureError("cors", "This video's host doesn't allow reading its frames");
  }
}

function measure(video: HTMLVideoElement, ctx: CanvasRenderingContext2D): number {
  ctx.drawImage(video, 0, 0, SCORE_W, SCORE_H);
  try {
    return scoreFrame(ctx.getImageData(0, 0, SCORE_W, SCORE_H).data, SCORE_W);
  } catch {
    throw new FrameCaptureError("cors", "This video's host doesn't allow reading its frames");
  }
}

/** A detached, muted element ready to seek — the caller must pass it to `releaseVideo`. */
export async function loadVideo(src: string, signal?: AbortSignal): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const loaded = waitFor(video, "loadeddata", LOAD_TIMEOUT_MS, signal);
  video.src = src;
  try {
    await loaded;
  } catch (err) {
    releaseVideo(video);
    throw err;
  }
  return video;
}

export function releaseVideo(video: HTMLVideoElement) {
  video.removeAttribute("src");
  video.load();
}

/** Output file name + type for a captured frame. */
export function frameToFile(blob: Blob, time: number): File {
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `frame-${time.toFixed(2).replace(".", "_")}s.${ext}`, { type: blob.type });
}

/**
 * Sample `count` frames across the video and score each. Returned in time
 * order; `onProgress` fires after every frame so the UI can fill in as it goes.
 */
export async function detectThumbnailCandidates(
  src: string,
  {
    count = 8,
    signal,
    onProgress,
  }: { count?: number; signal?: AbortSignal; onProgress?: (found: FrameCandidate[]) => void } = {},
): Promise<FrameCandidate[]> {
  const video = await loadVideo(src, signal);
  try {
    const scoreCanvas = document.createElement("canvas");
    scoreCanvas.width = SCORE_W;
    scoreCanvas.height = SCORE_H;
    const ctx = scoreCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new FrameCaptureError("unsupported", "Canvas is not available");

    const found: FrameCandidate[] = [];
    for (const time of sampleTimes(video.duration, count)) {
      if (signal?.aborted) throw abortError();
      await seekTo(video, time, signal);
      const score = measure(video, ctx);
      const blob = await captureFrame(video);
      found.push({ time: video.currentTime, blob, score });
      onProgress?.([...found]);
    }
    return found;
  } finally {
    releaseVideo(video);
  }
}

/** Index of the highest-scoring candidate, or -1 for an empty list. */
export function bestCandidateIndex(candidates: FrameCandidate[]): number {
  let best = -1;
  let bestScore = -Infinity;
  candidates.forEach((c, i) => {
    if (c.score > bestScore) {
      best = i;
      bestScore = c.score;
    }
  });
  return best;
}
