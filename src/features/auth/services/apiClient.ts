/**
 * Client-side API client for wecinema-web.
 *
 * - Attaches Bearer token from tokenStorage on every request.
 * - withCredentials: sends httpOnly refresh cookie automatically (credentials: "include").
 * - On 401: silently calls POST /api/user/refresh, retries once, then calls _onUnauthorized.
 * - Request queue prevents multiple simultaneous refresh calls.
 */

import { tokenStorage } from "./tokenStorage";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

// ─── Silent refresh state ────────────────────────────────────

let _onUnauthorized: (() => void) | null = null;
let _refreshing = false;
let _queue: Array<(token: string | null) => void> = [];

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

function drainQueue(token: string | null) {
  _queue.forEach((cb) => cb(token));
  _queue = [];
}

async function silentRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/user/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.token) {
      tokenStorage.set(data.token);
      if (data.user) tokenStorage.setUser(data.user);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── AppError ────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
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

  if (res.status === 401 && !_retry) {
    if (path.includes("/user/refresh")) {
      _onUnauthorized?.();
      throw new AppError(401, "Session expired. Please log in.");
    }

    if (_refreshing) {
      return new Promise((resolve, reject) => {
        _queue.push(async (newToken) => {
          if (!newToken) {
            reject(new AppError(401, "Session expired. Please log in."));
          } else {
            try {
              resolve(await apiFetch<T>(path, { ...opts, _retry: true }));
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    }

    _refreshing = true;
    const newToken = await silentRefresh();
    _refreshing = false;

    if (newToken) {
      drainQueue(newToken);
      return apiFetch<T>(path, { ...opts, _retry: true });
    } else {
      drainQueue(null);
      _onUnauthorized?.();
      throw new AppError(401, "Session expired. Please log in.");
    }
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      msg = err.error ?? err.message ?? err.details ?? msg;
    } catch {}
    throw new AppError(res.status, msg);
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
