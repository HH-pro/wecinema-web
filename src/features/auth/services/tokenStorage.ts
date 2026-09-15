/**
 * Token Storage — wecinema-web
 *
 * ACCESS TOKEN: memory-only. Never written to localStorage (XSS safety).
 * SESSION PERSISTENCE: httpOnly refresh cookie handled by the browser.
 * USER OBJECT: cached in localStorage for instant UI rehydration.
 */

const USER_KEY = "wc_user";

let _accessToken: string | null = null;
let _receivedAt = 0;
const _listeners = new Set<(token: string | null) => void>();

const notify = () => {
  for (const fn of _listeners) fn(_accessToken);
};

export const tokenStorage = {
  set(token: string): void {
    _accessToken = token;
    _receivedAt = Date.now();
    notify();
  },
  get(): string | null {
    return _accessToken;
  },
  /** Local time the current token arrived (0 when there is none). */
  receivedAt(): number {
    return _receivedAt;
  },
  /** Called whenever the access token is set or cleared. Returns an unsubscribe. */
  subscribe(fn: (token: string | null) => void): () => void {
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  },
  clear(): void {
    _accessToken = null;
    _receivedAt = 0;
    try { localStorage.removeItem(USER_KEY); } catch {}
    notify();
  },
  setUser(user: object): void {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
  },
  getUser<T = unknown>(): T | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
  },
};
