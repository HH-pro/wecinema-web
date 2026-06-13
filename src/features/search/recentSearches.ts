/**
 * Recent search history, persisted in localStorage (YouTube-style).
 * Most-recent first, deduped case-insensitively, capped at MAX.
 */

const KEY = "wc_recent_searches";
const MAX = 8;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(term: string): string[] {
  const q = term.trim();
  if (!q || typeof window === "undefined") return getRecentSearches();
  const lower = q.toLowerCase();
  const next = [q, ...getRecentSearches().filter((t) => t.toLowerCase() !== lower)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  return next;
}

export function removeRecentSearch(term: string): string[] {
  if (typeof window === "undefined") return [];
  const lower = term.toLowerCase();
  const next = getRecentSearches().filter((t) => t.toLowerCase() !== lower);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
