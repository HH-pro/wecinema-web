import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/features/auth/services/apiClient";
import type { PartsListing } from "@/features/upload/api/drafts";
import {
  MultipartUploader,
  PartUploadError,
  type PartTransport,
  type UploaderApi,
  type UploaderSnapshot,
} from "../multipartUploader";

/**
 * The uploader's promise to creators: a dropped connection, an expired URL or a
 * reload never sends them back to 0%. These tests drive it with an in-memory
 * "S3" and a scriptable transport.
 */

const PART = 10;

class FakeEvents {
  private handlers = { online: new Set<() => void>(), offline: new Set<() => void>() };
  addEventListener(type: "online" | "offline", fn: () => void) { this.handlers[type].add(fn); }
  removeEventListener(type: "online" | "offline", fn: () => void) { this.handlers[type].delete(fn); }
  fire(type: "online" | "offline") { for (const fn of this.handlers[type]) fn(); }
}

function setup({
  size = 25,
  alreadyUploaded = [] as number[],
  transport,
  api: apiOverrides = {},
}: {
  size?: number;
  alreadyUploaded?: number[];
  transport?: PartTransport;
  api?: Partial<UploaderApi>;
} = {}) {
  const file = new Blob([new Uint8Array(size)]);
  const stored = new Map<number, number>();
  const totalParts = Math.ceil(size / PART);
  const lengthOf = (n: number) => (n < totalParts ? PART : size - PART * (totalParts - 1));
  for (const n of alreadyUploaded) stored.set(n, lengthOf(n));

  const puts: number[] = [];
  let online = true;
  const events = new FakeEvents();
  const snapshots: UploaderSnapshot[] = [];
  let signCount = 0;

  const partOf = (url: string) => Number(new URL(url).searchParams.get("part"));

  const api: UploaderApi = {
    listParts: vi.fn(async (): Promise<PartsListing> => ({
      state: "uploading",
      totalParts,
      parts: [...stored].map(([partNumber, s]) => ({ partNumber, size: s })),
    })),
    signParts: vi.fn(async (_id: string, partNumbers: number[]) => {
      signCount += 1;
      return {
        urls: Object.fromEntries(partNumbers.map((n) => [n, `https://s3.test/put?part=${n}&sig=${signCount}`])),
      };
    }),
    complete: vi.fn(async () => {
      if (stored.size !== totalParts) {
        throw new AppError(409, "missing parts", "UPLOAD_INCOMPLETE");
      }
      return {};
    }),
    ...apiOverrides,
  };

  const defaultTransport: PartTransport = async (url, body, onProgress) => {
    const n = partOf(url);
    puts.push(n);
    onProgress(body.size);
    stored.set(n, body.size);
  };

  const uploader = new MultipartUploader({
    draftId: "draft-1",
    file,
    partSize: PART,
    api,
    transport: transport ?? defaultTransport,
    concurrency: 2,
    isOnline: () => online,
    events,
    retryDelayMs: () => 1,
    onChange: (s) => snapshots.push(s),
  });

  return {
    uploader, api, stored, puts, events, snapshots, partOf,
    setOnline(value: boolean) { online = value; events.fire(value ? "online" : "offline"); },
  };
}

const waitFor = async (predicate: () => boolean, timeoutMs = 2000) => {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((r) => setTimeout(r, 2));
  }
};

describe("MultipartUploader", () => {
  it("uploads every part and completes", async () => {
    const t = setup();
    await t.uploader.start();

    expect(t.uploader.state).toBe("completed");
    expect([...t.puts].sort()).toEqual([1, 2, 3]);
    expect(t.api.complete).toHaveBeenCalledTimes(1);
    expect(t.uploader.snapshot.loadedBytes).toBe(25);
  });

  it("resumes by skipping parts the server already has", async () => {
    const t = setup({ alreadyUploaded: [1, 2] });
    await t.uploader.start();

    expect(t.puts).toEqual([3]);
    expect(t.uploader.state).toBe("completed");
    // Progress starts from what was already uploaded, not from zero.
    expect(t.snapshots.find((s) => s.state === "uploading")?.loadedBytes).toBeGreaterThanOrEqual(20);
  });

  it("does not count a stored part whose size is wrong", async () => {
    const t = setup();
    t.stored.set(1, 3); // truncated part from an earlier, interrupted PUT
    await t.uploader.start();
    expect(t.puts).toContain(1);
  });

  it("retries a part after a network failure", async () => {
    let failures = 0;
    const t = setup({
      transport: async (url, body) => {
        const n = Number(new URL(url).searchParams.get("part"));
        if (n === 2 && failures < 2) {
          failures += 1;
          throw new PartUploadError(0, "Network error");
        }
        t.stored.set(n, body.size);
      },
    });
    await t.uploader.start();

    expect(failures).toBe(2);
    expect(t.uploader.state).toBe("completed");
  });

  it("signs a fresh URL when S3 rejects an expired one", async () => {
    const seen: string[] = [];
    const t = setup({
      transport: async (url, body) => {
        seen.push(url);
        const n = Number(new URL(url).searchParams.get("part"));
        if (url.includes("sig=1") && n === 1) throw new PartUploadError(403, "Request has expired");
        t.stored.set(n, body.size);
      },
    });
    await t.uploader.start();

    expect(t.api.signParts).toHaveBeenCalledTimes(2);
    expect(seen.filter((u) => u.includes("part=1&"))).toHaveLength(2);
    expect(t.uploader.state).toBe("completed");
  });

  it("pauses when the network drops and continues from the same place when it returns", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    let dropped = false;

    const t = setup({
      transport: async (url, body, onProgress, signal) => {
        const n = Number(new URL(url).searchParams.get("part"));
        if (n === 1 && !dropped) {
          dropped = true;
          onProgress(2);
          // Hang like a dead connection until the uploader aborts us.
          await new Promise<void>((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
        }
        await gate;
        t.stored.set(n, body.size);
      },
    });

    const done = t.uploader.start();
    await waitFor(() => dropped);
    t.setOnline(false);
    expect(t.uploader.state).toBe("offline");

    release();
    await new Promise((r) => setTimeout(r, 20));
    expect(t.uploader.state).toBe("offline");
    expect(t.api.complete).not.toHaveBeenCalled();

    t.setOnline(true);
    await done;

    expect(t.uploader.state).toBe("completed");
    // listParts runs once at start; coming back online doesn't restart from scratch.
    expect(t.api.listParts).toHaveBeenCalledTimes(1);
  });

  it("waits for sign-in on a 401 instead of failing", async () => {
    let authed = false;
    const t = setup({
      api: {
        signParts: vi.fn(async (_id: string, partNumbers: number[]) => {
          if (!authed) throw new AppError(401, "Session expired. Please log in.");
          return { urls: Object.fromEntries(partNumbers.map((n) => [n, `https://s3.test/put?part=${n}`])) };
        }),
      },
    });

    const done = t.uploader.start();
    await waitFor(() => t.uploader.state === "needs-auth");

    authed = true;
    t.uploader.resume();
    await done;
    expect(t.uploader.state).toBe("completed");
  });

  it("fills a gap the server reports at completion", async () => {
    let completeCalls = 0;
    const t = setup({
      api: {
        complete: vi.fn(async () => {
          completeCalls += 1;
          if (completeCalls === 1) {
            t.stored.delete(2); // S3 lost track of a part
            throw new AppError(409, "missing", "UPLOAD_INCOMPLETE");
          }
          return {};
        }),
      },
    });
    await t.uploader.start();

    expect(t.puts.filter((n) => n === 2)).toHaveLength(2);
    expect(t.uploader.state).toBe("completed");
  });

  it("stops and reports when the upload has expired on the server", async () => {
    const t = setup({
      api: { listParts: vi.fn(async () => ({ state: "failed" as const, totalParts: 3, parts: [] })) },
    });
    await t.uploader.start();

    expect(t.uploader.state).toBe("failed");
    expect(t.uploader.snapshot.error).toMatch(/expired/i);
  });

  it("dispose (sign-out) stops sending parts without cancelling the upload", async () => {
    let started = 0;
    const t = setup({
      size: 50,
      transport: (_url, _body, _progress, signal) => {
        started += 1;
        return new Promise<void>((_, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        });
      },
    });

    const done = t.uploader.start();
    await waitFor(() => started === 2);
    const emitted = t.snapshots.length;

    t.uploader.dispose();
    await done;
    await new Promise((r) => setTimeout(r, 20));

    // No retries, no new parts, no completion, no further state changes.
    expect(started).toBe(2);
    expect(t.api.complete).not.toHaveBeenCalled();
    expect(t.snapshots.length).toBe(emitted);
    expect(t.uploader.state).not.toBe("cancelled");
  });

  it("cancel aborts in-flight parts and never completes", async () => {
    let aborted = false;
    const t = setup({
      transport: (_url, _body, _progress, signal) =>
        new Promise<void>((_, reject) => {
          signal.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); });
        }),
    });

    const done = t.uploader.start();
    await waitFor(() => t.uploader.state === "uploading");
    t.uploader.cancel();
    await done;

    expect(aborted).toBe(true);
    expect(t.uploader.state).toBe("cancelled");
    expect(t.api.complete).not.toHaveBeenCalled();
  });
});
