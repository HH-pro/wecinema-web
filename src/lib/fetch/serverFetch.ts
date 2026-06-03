import { serverEnv } from "@/config/env";

/**
 * Server-side fetch helper. Talks to BACKEND_URL directly so RSC requests skip
 * the rewrite layer (no extra hop, and Node fetch can't resolve relative URLs).
 *
 * Features:
 * - Per-request timeout via AbortController (default 8s).
 * - Typed errors via ApiError so callers can branch on status code.
 * - ISR via Next's `next.revalidate` (set to 60s by default).
 * - Optional `tags` for on-demand revalidation later.
 */

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_REVALIDATE = 60;

export interface ApiFetchOptions extends Omit<RequestInit, "signal"> {
  /** Override per-request timeout (ms). */
  timeoutMs?: number;
  /** ISR revalidation in seconds. 0 = no cache. */
  revalidate?: number;
  /** Cache tags for revalidateTag(). */
  tags?: string[];
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly path: string,
    public readonly body?: string,
  ) {
    super(`API ${status} ${statusText} for ${path}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    revalidate = DEFAULT_REVALIDATE,
    tags,
    headers,
    ...rest
  } = options;

  const url = `${serverEnv.BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      next: {
        revalidate: revalidate === 0 ? 0 : revalidate,
        ...(tags ? { tags } : {}),
      },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // Identify as the trusted SSR server so we bypass the backend's
        // IP-keyed rate limiter (all SSR traffic shares one server IP).
        ...(serverEnv.INTERNAL_API_KEY ? { "x-internal-key": serverEnv.INTERNAL_API_KEY } : {}),
        ...headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => undefined);
      throw new ApiError(res.status, res.statusText, path, body);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError(408, "Request Timeout", path);
    }
    throw new ApiError(0, (err as Error).message ?? "Network error", path);
  } finally {
    clearTimeout(timer);
  }
}
