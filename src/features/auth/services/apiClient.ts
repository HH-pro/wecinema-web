/**
 * Client-side API client for wecinema-web.
 *
 * - Attaches Bearer token from tokenStorage on every request.
 * - withCredentials: sends httpOnly refresh cookie automatically (credentials: "include").
 * - On 401: silently calls POST /api/user/refresh, retries once, then calls _onUnauthorized.
 * - All refresh callers (this client and AuthContext's session restore) share one in-flight
 *   request. The backend rotates the refresh token on every call, so two parallel calls
 *   carrying the same cookie look like token reuse and revoke every session.
 */

import { tokenStorage } from "./tokenStorage";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

// ─── Silent refresh state ────────────────────────────────────

let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

export interface RefreshResult<U = unknown> {
  token: string;
  user?: U;
}

let _refreshInFlight: Promise<RefreshResult | null> | null = null;

async function doRefresh(): Promise<RefreshResult | null> {
  try {
    const res = await fetch(`${BASE}/user/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.token) return null;
    tokenStorage.set(data.token);
    if (data.user) tokenStorage.setUser(data.user);
    return data as RefreshResult;
  } catch {
    return null;
  }
}

/** Refresh the session. Concurrent callers share a single request. */
export function refreshSession<U = unknown>(): Promise<RefreshResult<U> | null> {
  if (!_refreshInFlight) {
    _refreshInFlight = doRefresh().finally(() => {
      _refreshInFlight = null;
    });
  }
  return _refreshInFlight as Promise<RefreshResult<U> | null>;
}

// ─── AppError ────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
    /**
     * Machine-readable code from the response body (`{ code: "..." }`), when
     * the backend sends one. Needed wherever a single HTTP status covers more
     * than one case — e.g. 409 is both ALREADY_RENTED and CHECKOUT_IN_PROGRESS.
     */
    public readonly code?: string,
    /**
     * The parsed error body, for endpoints that return structured context next to
     * the message — e.g. DEAL_EXISTS carries `existingDealId`.
     */
    public readonly body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ─── Core fetch wrapper ──────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | null;
  _retry?: boolean;
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { body, _retry, ...rest } = opts;

  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string>),
  };

  let serialisedBody: BodyInit | null | undefined;
  if (body instanceof FormData) {
    serialisedBody = body;
  } else if (body != null) {
    headers["Content-Type"] = "application/json";
    serialisedBody = JSON.stringify(body);
  }

  const url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers,
    body: serialisedBody,
  });

  const isAuthEntryPath =
    path.includes("/user/login") ||
    path.includes("/user/register") ||
    path.includes("/user/google") ||
    path.includes("/user/forgot-password") ||
    path.includes("/user/reset-password") ||
    path.includes("/user/verify-email-otp") ||
    path.includes("/user/resend");

  if (res.status === 401 && !_retry && !isAuthEntryPath) {
    if (path.includes("/user/refresh")) {
      _onUnauthorized?.();
      throw new AppError(401, "Session expired. Please log in.");
    }

    // The token was renewed while this request was in flight (e.g. it went out
    // before the page-load session restore finished) — just retry with it.
    const current = tokenStorage.get();
    if (current && current !== token) {
      return apiFetch<T>(path, { ...opts, _retry: true });
    }

    // Only the caller that started the refresh fires the unauthorized handler, so a
    // burst of concurrent 401s logs out once rather than once per request.
    const startedRefresh = _refreshInFlight === null;
    const refreshed = await refreshSession();
    if (refreshed?.token) {
      return apiFetch<T>(path, { ...opts, _retry: true });
    }
    if (startedRefresh) _onUnauthorized?.();
    throw new AppError(401, "Session expired. Please log in.");
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    let code: string | undefined;
    let body: Record<string, unknown> | undefined;
    try {
      const err = await res.json();
      // Joi validation failures come back as a generic "Validation failed" with
      // the real reason in details[] — surface that instead of hiding it.
      const detail = Array.isArray(err.details) ? err.details[0]?.message : undefined;
      msg = (typeof detail === "string" && detail) || err.error || err.message || msg;
      if (typeof err.code === "string") code = err.code;
      if (err && typeof err === "object") body = err as Record<string, unknown>;
    } catch {}
    throw new AppError(res.status, msg, code, body);
  }

  return res.json() as Promise<T>;
}

// ─── HTTP helpers ─────────────────────────────────────────────

export const api = {
  get<T>(path: string, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "GET" });
  },
  post<T>(path: string, body?: Record<string, unknown> | FormData, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "POST", body: body as FetchOptions["body"] });
  },
  put<T>(path: string, body?: Record<string, unknown>, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "PUT", body: body as FetchOptions["body"] });
  },
  patch<T>(path: string, body?: Record<string, unknown>, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "PATCH", body: body as FetchOptions["body"] });
  },
  delete<T>(path: string, opts?: Omit<FetchOptions, "method" | "body">) {
    return apiFetch<T>(path, { ...opts, method: "DELETE" });
  },
};
