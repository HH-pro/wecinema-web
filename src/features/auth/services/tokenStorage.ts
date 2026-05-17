/**
 * Token Storage — wecinema-web
 *
 * ACCESS TOKEN: memory-only. Never written to localStorage (XSS safety).
 * SESSION PERSISTENCE: httpOnly refresh cookie handled by the browser.
 * USER OBJECT: cached in localStorage for instant UI rehydration.
 */

const USER_KEY = "wc_user";

let _accessToken: string | null = null;

export const tokenStorage = {
  set(token: string): void {
    _accessToken = token;
  },
  get(): string | null {
    return _accessToken;
  },
  clear(): void {
    _accessToken = null;
    try { localStorage.removeItem(USER_KEY); } catch {}
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
