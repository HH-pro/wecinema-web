/**
 * Recent search history (YouTube-style).
 * Most-recent first, deduped case-insensitively, capped at MAX.
 *
 * Persisted in localStorage only with Functional cookie consent; without it the
 * list lasts for the current visit only.
 */

import { hasConsent } from "@/features/consent/consentStore";

const KEY = "wc_recent_searches";
const MAX = 8;

let sessionSearches: string[] = [];

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  if (!hasConsent("functional")) return [...sessionSearches];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(list: string[]): void {
  if (!hasConsent("functional")) {
    sessionSearches = list;
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function addRecentSearch(term: string): string[] {
  const q = term.trim();
  if (!q || typeof window === "undefined") return getRecentSearches();
  const lower = q.toLowerCase();
  const next = [q, ...getRecentSearches().filter((t) => t.toLowerCase() !== lower)].slice(0, MAX);
  saveRecentSearches(next);
  return next;
}

export function removeRecentSearch(term: string): string[] {
  if (typeof window === "undefined") return [];
  const lower = term.toLowerCase();
  const next = getRecentSearches().filter((t) => t.toLowerCase() !== lower);
  saveRecentSearches(next);
  return next;
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  sessionSearches = [];
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
