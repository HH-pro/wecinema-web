import { AppError } from "@/features/auth/services/apiClient";
import type { PartsListing } from "@/features/upload/api/drafts";

/**
 * Resumable upload of one file into an S3 multipart upload.
 *
 * The file is cut into fixed-size parts that go straight to S3 through
 * presigned URLs, a few at a time. Losing the network, a token refresh, a pause
 * or a reload costs at most the parts that were in flight:
 *
 *  - offline:  in-flight parts are dropped, everything waits for `online`
 *  - errors:   each part retries with exponential backoff, indefinitely
 *  - 403:      the part URL expired — a fresh one is signed and the part retried
 *  - 401:      the API session is gone — the upload parks in "needs-auth" until
 *              resume() is called after sign-in; it never logs anyone out
 *  - reload:   start() asks the server which parts S3 already holds and skips them
 */

export type UploaderState =
  | "preparing"
  | "uploading"
  | "paused"
  | "offline"
  | "needs-auth"
  | "completing"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploaderSnapshot {
  state: UploaderState;
  loadedBytes: number;
  totalBytes: number;
  /** Bytes per second over the last few seconds; 0 when idle. */
  speedBps: number;
  etaSec: number | null;
  /** A request failed and is being retried. */
  retrying: boolean;
  error: string | null;
}

export interface UploaderApi {
  listParts(draftId: string): Promise<PartsListing>;
  signParts(draftId: string, partNumbers: number[]): Promise<{ urls: Record<string, string> }>;
  complete(draftId: string): Promise<unknown>;
}

export class PartUploadError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "PartUploadError";
  }
}

/** PUT one part. Must reject with PartUploadError on HTTP/network failure. */
export type PartTransport = (
  url: string,
  body: Blob,
  onProgress: (loadedBytes: number) => void,
  signal: AbortSignal,
) => Promise<void>;

interface EventSource {
  addEventListener(type: "online" | "offline", fn: () => void): void;
  removeEventListener(type: "online" | "offline", fn: () => void): void;
}

export interface UploaderOptions {
  draftId: string;
  file: Blob;
  partSize: number;
  api: UploaderApi;
  transport?: PartTransport;
  concurrency?: number;
  onChange?: (snapshot: UploaderSnapshot) => void;
  isOnline?: () => boolean;
  /** Where online/offline events come from. Defaults to window. */
  events?: EventSource | null;
  now?: () => number;
  retryDelayMs?: (attempt: number) => number;
}

const URL_MAX_AGE_MS = 50 * 60 * 1000; // server signs for 60 min
const SIGN_BATCH = 20;
const SPEED_WINDOW_MS = 8000;
// A connection that silently dies can leave an XHR hanging for minutes.
const STALL_TIMEOUT_MS = 45_000;

class CancelledError extends Error {
  constructor() {
    super("Upload cancelled");
  }
}

class UploadGoneError extends Error {
  constructor() {
    super("The upload is no longer available on the server");
  }
}

const defaultRetryDelay = (attempt: number) =>
  Math.min(30_000, 1000 * 2 ** Math.min(attempt - 1, 5)) * (0.8 + Math.random() * 0.4);

function isRetryable(err: unknown) {
  if (err instanceof AppError) {
    const s = err.status;
    return s == null || s === 0 || s === 408 || s === 429 || s >= 500;
  }
  // fetch() network failures are TypeErrors; anything else unknown is retried too.
  return true;
}

function messageOf(err: unknown) {
  return err instanceof Error ? err.message : "Upload failed";
}

export const xhrTransport: PartTransport = (url, body, onProgress, signal) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastActivity = Date.now();
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearInterval(watchdog);
      signal.removeEventListener("abort", onAbort);
      fn();
    };
    const onAbort = () => {
      settle(() => reject(new DOMException("Aborted", "AbortError")));
      xhr.abort();
    };
    const watchdog = setInterval(() => {
      if (Date.now() - lastActivity > STALL_TIMEOUT_MS) {
        settle(() => reject(new PartUploadError(0, "Upload stalled")));
        xhr.abort();
      }
    }, 5000);

    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort);

    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      lastActivity = Date.now();
      onProgress(e.loaded);
    };
    xhr.onload = () =>
      settle(() =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new PartUploadError(xhr.status, `Part upload failed (${xhr.status})`)),
      );
    xhr.onerror = () => settle(() => reject(new PartUploadError(0, "Network error")));
    xhr.send(body);
  });

export class MultipartUploader {
  readonly draftId: string;
  readonly totalParts: number;

  private readonly file: Blob;
  private readonly partSize: number;
  private readonly api: UploaderApi;
  private readonly transport: PartTransport;
  private readonly concurrency: number;
  private readonly onChange?: (s: UploaderSnapshot) => void;
  private readonly isOnline: () => boolean;
  private readonly events: EventSource | null;
  private readonly now: () => number;
  private readonly retryDelayMs: (attempt: number) => number;

  private done = new Set<number>();
  private inflight = new Map<number, number>();
  private urls = new Map<number, { url: string; at: number }>();
  private signing: Promise<void> | null = null;
  private controllers = new Set<AbortController>();
  private waiters = new Set<() => void>();
  private samples: { t: number; bytes: number }[] = [];

  private uploadedBytes = 0;
  private synced = false;
  private running: Promise<void> | null = null;

  private phase: "preparing" | "uploading" | "completing" = "preparing";
  private terminal: "completed" | "failed" | "cancelled" | null = null;
  private paused = false;
  private offline = false;
  private needsAuth = false;
  /** dispose() was called: the loop exits and nothing is emitted any more. */
  private disposed = false;
  private retrying = false;
  private error: string | null = null;

  constructor(opts: UploaderOptions) {
    this.draftId = opts.draftId;
    this.file = opts.file;
    this.partSize = opts.partSize;
    this.api = opts.api;
    this.transport = opts.transport ?? xhrTransport;
    this.concurrency = Math.max(1, opts.concurrency ?? 3);
    this.onChange = opts.onChange;
    this.isOnline = opts.isOnline ?? (() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
    this.events = opts.events !== undefined ? opts.events : typeof window === "undefined" ? null : window;
    this.now = opts.now ?? Date.now;
    this.retryDelayMs = opts.retryDelayMs ?? defaultRetryDelay;
    this.totalParts = Math.max(1, Math.ceil(this.file.size / this.partSize));
    this.offline = !this.isOnline();

    this.events?.addEventListener("online", this.handleOnline);
    this.events?.addEventListener("offline", this.handleOffline);
  }

  // ── Public API ────────────────────────────────────────────────

  get snapshot(): UploaderSnapshot {
    const loadedBytes = this.terminal === "completed"
      ? this.file.size
      : Math.min(this.file.size, this.uploadedBytes + [...this.inflight.values()].reduce((a, b) => a + b, 0));
    const state = this.state;
    const speedBps = state === "uploading" ? this.speed() : 0;
    return {
      state,
      loadedBytes,
      totalBytes: this.file.size,
      speedBps,
      etaSec: speedBps > 0 ? Math.max(0, Math.round((this.file.size - loadedBytes) / speedBps)) : null,
      retrying: this.retrying,
      error: this.error,
    };
  }

  get state(): UploaderState {
    if (this.terminal) return this.terminal;
    if (this.paused) return "paused";
    if (this.needsAuth) return "needs-auth";
    if (this.offline) return "offline";
    return this.phase;
  }

  /** Start or continue. Resolves when the upload reaches a final state. */
  start(): Promise<void> {
    if (this.terminal || this.disposed) return Promise.resolve();
    if (!this.running) {
      this.running = this.run().finally(() => {
        this.running = null;
      });
    }
    return this.running;
  }

  pause() {
    if (this.terminal || this.paused) return;
    this.paused = true;
    this.abortInflight();
    this.emit();
  }

  /** Resume after pause() or after sign-in restored the session. */
  resume() {
    if (this.terminal || this.disposed) return;
    this.paused = false;
    this.needsAuth = false;
    this.offline = !this.isOnline();
    this.emit();
    this.wake();
    void this.start();
  }

  cancel() {
    if (this.terminal) return;
    this.cancelled();
  }

  /**
   * Stop for good without touching the server-side upload — e.g. on sign-out,
   * so a later sign-in can resume it with a fresh uploader. The loop exits and
   * no further parts are sent.
   */
  dispose() {
    this.disposed = true;
    this.detach();
    this.abortInflight();
    this.wake();
  }

  // ── Main loop ─────────────────────────────────────────────────

  private async run() {
    try {
      for (let round = 0; ; round += 1) {
        if (!this.synced) await this.sync();
        if (this.terminal) return;

        try {
          await this.uploadPending();
        } catch (err) {
          if (err instanceof UploadGoneError && round < 3) {
            this.synced = false;
            continue;
          }
          throw err;
        }

        this.phase = "completing";
        this.emit();
        try {
          await this.callApi(() => this.api.complete(this.draftId));
        } catch (err) {
          // The server re-read S3 and found a gap: re-sync and fill it.
          if (err instanceof AppError && err.code === "UPLOAD_INCOMPLETE" && round < 3) {
            this.synced = false;
            continue;
          }
          throw err;
        }
        this.finish();
        return;
      }
    } catch (err) {
      if (err instanceof CancelledError || this.terminal === "cancelled" || this.disposed) return;
      if (err instanceof AppError && err.code === "UPLOAD_ALREADY_COMPLETE") {
        this.finish();
        return;
      }
      this.fail(err);
    }
  }

  /** Learn which parts S3 already holds. */
  private async sync() {
    this.phase = "preparing";
    this.emit();
    const listing = await this.callApi(() => this.api.listParts(this.draftId));
    if (listing.state === "uploaded") {
      this.finish();
      return;
    }
    if (listing.state === "failed") {
      throw new Error("This upload expired. Delete the draft and upload the file again.");
    }

    this.done.clear();
    this.uploadedBytes = 0;
    for (const part of listing.parts) {
      if (part.partNumber <= this.totalParts && part.size === this.partLength(part.partNumber)) {
        this.done.add(part.partNumber);
        this.uploadedBytes += part.size;
      }
    }
    this.synced = true;
    this.emit();
  }

  private async uploadPending() {
    for (;;) {
      await this.waitUntilActive();
      const queue = this.pendingParts();
      if (queue.length === 0) return;

      this.phase = "uploading";
      this.emit();
      const workers = Array.from({ length: Math.min(this.concurrency, queue.length) }, () => this.worker(queue));
      try {
        await Promise.all(workers);
      } catch (err) {
        this.abortInflight();
        throw err;
      }
    }
  }

  private async worker(queue: number[]) {
    while (queue.length > 0) {
      if (this.interrupted()) return;
      const partNumber = queue.shift()!;
      if (this.done.has(partNumber)) continue;
      const finished = await this.uploadPart(partNumber);
      if (!finished) {
        queue.unshift(partNumber);
        return;
      }
    }
  }

  /** true once the part is stored; false if interrupted (it will be retried). */
  private async uploadPart(partNumber: number): Promise<boolean> {
    let attempt = 0;
    for (;;) {
      if (this.interrupted()) return false;
      const url = await this.urlFor(partNumber);
      if (this.interrupted()) return false;

      const start = (partNumber - 1) * this.partSize;
      const body = this.file.slice(start, Math.min(start + this.partSize, this.file.size));
      const controller = new AbortController();
      this.controllers.add(controller);

      try {
        await this.transport(url, body, (loaded) => {
          if (controller.signal.aborted) return;
          this.inflight.set(partNumber, Math.min(loaded, body.size));
          this.emit();
        }, controller.signal);

        this.inflight.delete(partNumber);
        this.done.add(partNumber);
        this.uploadedBytes += body.size;
        this.retrying = false;
        this.emit();
        return true;
      } catch (err) {
        this.inflight.delete(partNumber);
        if (controller.signal.aborted || this.interrupted()) {
          this.emit();
          return false;
        }

        const status = err instanceof PartUploadError ? err.status : 0;
        if (status === 404) throw new UploadGoneError();
        if (status === 400 || status === 403) this.urls.delete(partNumber); // expired signature

        if (!this.isOnline()) {
          this.goOffline();
          return false;
        }
        attempt += 1;
        this.retrying = true;
        this.emit();
        await this.sleep(this.retryDelayMs(attempt));
      } finally {
        this.controllers.delete(controller);
      }
    }
  }

  /** A fresh presigned URL for the part, signing the next batch when needed. */
  private async urlFor(partNumber: number): Promise<string> {
    const fresh = (n: number) => {
      const entry = this.urls.get(n);
      return entry && this.now() - entry.at < URL_MAX_AGE_MS ? entry.url : null;
    };

    for (;;) {
      const cached = fresh(partNumber);
      if (cached) return cached;

      if (this.signing) {
        await this.signing.catch(() => {});
        continue;
      }

      const batch = [
        partNumber,
        ...this.pendingParts().filter((n) => n !== partNumber && !this.inflight.has(n) && !fresh(n)),
      ].slice(0, SIGN_BATCH);
      const signedAt = this.now();

      this.signing = this.callApi(() => this.api.signParts(this.draftId, batch))
        .then(({ urls }) => {
          for (const [n, url] of Object.entries(urls)) this.urls.set(Number(n), { url, at: signedAt });
        })
        .finally(() => {
          this.signing = null;
        });
      await this.signing;
      if (!fresh(partNumber)) throw new Error("The server did not issue an upload URL");
    }
  }

  /** Call the API, waiting out offline/auth loss and retrying transient failures. */
  private async callApi<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    for (;;) {
      await this.waitUntilActive();
      try {
        const result = await fn();
        this.retrying = false;
        return result;
      } catch (err) {
        if (this.terminal === "cancelled" || this.disposed) throw new CancelledError();
        if (err instanceof AppError && err.status === 401) {
          this.needsAuth = true;
          this.abortInflight();
          this.emit();
          continue;
        }
        if (!isRetryable(err)) throw err;
        if (!this.isOnline()) {
          this.goOffline();
          continue;
        }
        attempt += 1;
        this.retrying = true;
        this.emit();
        await this.sleep(this.retryDelayMs(attempt));
      }
    }
  }

  // ── State helpers ─────────────────────────────────────────────

  private partLength(partNumber: number) {
    return partNumber < this.totalParts ? this.partSize : this.file.size - this.partSize * (this.totalParts - 1);
  }

  private pendingParts() {
    const pending: number[] = [];
    for (let n = 1; n <= this.totalParts; n += 1) if (!this.done.has(n)) pending.push(n);
    return pending;
  }

  private interrupted() {
    return this.terminal !== null || this.disposed || this.paused || this.offline || this.needsAuth;
  }

  private async waitUntilActive() {
    while ((this.paused || this.offline || this.needsAuth) && !this.disposed) {
      if (this.terminal) break;
      await new Promise<void>((resolve) => {
        const done = () => {
          this.waiters.delete(done);
          resolve();
        };
        this.waiters.add(done);
      });
    }
    if (this.terminal === "cancelled" || this.disposed) throw new CancelledError();
  }

  /** Sleep that ends early on resume/online/cancel. */
  private sleep(ms: number) {
    return new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        this.waiters.delete(done);
        resolve();
      };
      const timer = setTimeout(done, ms);
      this.waiters.add(done);
    });
  }

  private wake() {
    for (const waiter of [...this.waiters]) waiter();
  }

  private abortInflight() {
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
    this.inflight.clear();
    this.samples = [];
  }

  private goOffline() {
    this.offline = true;
    this.abortInflight();
    this.emit();
  }

  private handleOnline = () => {
    if (this.terminal) return;
    this.offline = false;
    this.emit();
    this.wake();
  };

  private handleOffline = () => {
    if (this.terminal) return;
    this.goOffline();
  };

  private finish() {
    this.terminal = "completed";
    this.retrying = false;
    this.error = null;
    this.uploadedBytes = this.file.size;
    this.detach();
    this.emit();
    this.wake();
  }

  private fail(err: unknown) {
    this.terminal = "failed";
    this.retrying = false;
    this.error = messageOf(err);
    this.abortInflight();
    this.detach();
    this.emit();
    this.wake();
  }

  private cancelled() {
    this.terminal = "cancelled";
    this.abortInflight();
    this.detach();
    this.emit();
    this.wake();
  }

  private detach() {
    this.events?.removeEventListener("online", this.handleOnline);
    this.events?.removeEventListener("offline", this.handleOffline);
  }

  private speed() {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0]!;
    const last = this.samples[this.samples.length - 1]!;
    const seconds = (last.t - first.t) / 1000;
    return seconds >= 1 ? Math.max(0, (last.bytes - first.bytes) / seconds) : 0;
  }

  private emit() {
    if (this.disposed) return;
    const t = this.now();
    const bytes = this.uploadedBytes + [...this.inflight.values()].reduce((a, b) => a + b, 0);
    this.samples.push({ t, bytes });
    while (this.samples.length > 2 && t - this.samples[0]!.t > SPEED_WINDOW_MS) this.samples.shift();
    this.onChange?.(this.snapshot);
  }
}
