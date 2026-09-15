/**
 * Cookie consent store — the single source of truth for what the visitor has agreed to.
 *
 * A plain module rather than React state, so non-React code (e.g. recentSearches) can ask
 * hasConsent() too. The choice lives in the first-party `wc_consent` cookie; React reads it
 * through useSyncExternalStore (see ConsentProvider).
 *
 * - Nothing optional is on until the visitor opts in.
 * - A record made under an older CONSENT_POLICY_VERSION counts as no decision, so the
 *   banner asks again.
 * - A browser sending Global Privacy Control never gets analytics or marketing.
 */

import { z } from "zod";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_POLICY_VERSION,
  OPTIONAL_CATEGORIES,
  type ConsentAction,
  type ConsentCategory,
  type ConsentChoices,
  type ConsentRecord,
  type OptionalCategory,
} from "./consentTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const CHANNEL_NAME = "wc-consent";

// First-party cookies set by the trackers, keyed by the category that allows them.
const TRACKER_COOKIES: Partial<Record<OptionalCategory, RegExp>> = {
  analytics: /^_(ga|gid|gat)(_.*)?$/,
  marketing: /^_(fbp|fbc)$/,
};

// Browser storage that may only persist with Functional consent.
const FUNCTIONAL_STORAGE_KEYS = ["wc_recent_searches"];

const RecordSchema = z.object({
  v: z.string().max(32),
  id: z.uuid(),
  ts: z.number(),
  categories: z.object({ functional: z.boolean(), analytics: z.boolean(), marketing: z.boolean() }),
  gpc: z.boolean(),
});

export const NO_CONSENT: ConsentChoices = { functional: false, analytics: false, marketing: false };

export interface ConsentState {
  /** The visitor has chosen under the current policy version. */
  decided: boolean;
  categories: ConsentChoices;
  consentId: string | null;
}

const UNDECIDED: ConsentState = { decided: false, categories: NO_CONSENT, consentId: null };

/** Seams for tests: jsdom can't reload a page. */
export const consentEnv = {
  reload: () => window.location.reload(),
};

// ─── Cookie encoding ──────────────────────────────────────────

export function encodeConsent(record: ConsentRecord): string {
  return btoa(JSON.stringify(record)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Parse a wc_consent value. Anything invalid, tampered or from an old policy is null. */
export function decodeConsent(raw: string | null | undefined): ConsentRecord | null {
  if (!raw) return null;
  try {
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64 + "===".slice((base64.length + 3) % 4));
    const parsed = RecordSchema.safeParse(JSON.parse(json));
    if (!parsed.success || parsed.data.v !== CONSENT_POLICY_VERSION) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function readRawCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${CONSENT_COOKIE}=`;
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) return cookie.slice(prefix.length);
  }
  return null;
}

export function isGpcEnabled(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}

// ─── Reading ──────────────────────────────────────────────────

// useSyncExternalStore needs a stable snapshot, so only re-parse when the cookie changes.
let cachedRaw: string | null | undefined;
let cachedState: ConsentState = UNDECIDED;

export function getConsentSnapshot(): ConsentState {
  const raw = readRawCookie();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    const record = decodeConsent(raw);
    cachedState = record
      ? {
          decided: true,
          // GPC switched on after the choice was made still wins.
          categories: isGpcEnabled() ? { ...record.categories, analytics: false, marketing: false } : record.categories,
          consentId: record.id,
        }
      : UNDECIDED;
  }
  return cachedState;
}

export const getServerConsentSnapshot = (): ConsentState => UNDECIDED;

export function hasConsent(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  return getConsentSnapshot().categories[category];
}

// ─── Subscribing ──────────────────────────────────────────────

const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
let listening = false;

const notify = () => listeners.forEach((fn) => fn());

// Another tab changed the choice. If it withdrew a tracker this tab has loaded, reload.
const onRemoteChange = () => {
  const before = cachedState.categories;
  const after = getConsentSnapshot().categories;
  notify();
  if ((before.analytics && !after.analytics) || (before.marketing && !after.marketing)) consentEnv.reload();
};

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  // Cookie writes fire no `storage` event, so tabs tell each other here...
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = onRemoteChange;
    // Node's BroadcastChannel (tests, SSR tooling) would otherwise keep the process alive.
    (channel as BroadcastChannel & { unref?: () => void }).unref?.();
  }
  // ...and re-read when a tab comes back, in case the cookie expired or was cleared.
  document.addEventListener("visibilitychange", notify);
}

export function subscribeConsent(fn: () => void): () => void {
  listen();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ─── Writing ──────────────────────────────────────────────────

function newConsentId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // randomUUID needs a secure context; build a v4 UUID by hand elsewhere.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function writeCookie(record: ConsentRecord) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeConsent(record)}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

/** The host and each parent domain — GA sets its cookies on the widest one it can. */
function cookieDomainAttributes(): string[] {
  const parts = window.location.hostname.split(".");
  const attributes = [""];
  for (let i = 0; i < parts.length - 1; i += 1) attributes.push(`; Domain=.${parts.slice(i).join(".")}`);
  return attributes;
}

function deleteCookies(pattern: RegExp) {
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0]?.trim() ?? "")
    .filter((name) => pattern.test(name));
  for (const name of names) {
    for (const domain of cookieDomainAttributes()) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
    }
  }
}

/** Remove whatever a refused category would have stored. */
function purge(categories: ConsentChoices, { storage }: { storage: boolean }) {
  for (const category of OPTIONAL_CATEGORIES) {
    if (categories[category]) continue;
    const pattern = TRACKER_COOKIES[category];
    if (pattern) deleteCookies(pattern);
    if (storage && category === "functional") {
      for (const key of FUNCTIONAL_STORAGE_KEYS) {
        try {
          localStorage.removeItem(key);
        } catch {
          /* storage unavailable */
        }
      }
    }
  }
}

/**
 * Delete tracker cookies the visitor hasn't allowed. GA and the Meta Pixel used to load for
 * everyone, so returning visitors can still carry their cookies. Functional storage is left
 * alone until the visitor actually refuses it.
 */
export function purgeDisallowedTrackers() {
  purge(getConsentSnapshot().categories, { storage: false });
}

function logDecision(record: ConsentRecord, action: ConsentAction) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  // Best effort, and deliberately not apiClient: its 401 handling would start a session
  // refresh. The choice is already saved in the cookie whatever happens here.
  try {
    fetch(`${API_BASE}/consent`, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      headers,
      body: JSON.stringify({
        consentId: record.id,
        policyVersion: record.v,
        action,
        categories: record.categories,
        gpc: record.gpc,
      }),
    }).catch(() => {});
  } catch {
    /* fetch unavailable */
  }
}

export function saveConsent(choices: ConsentChoices, action: ConsentAction = "custom"): void {
  listen();
  const previous = getConsentSnapshot();
  const gpc = isGpcEnabled();
  const categories: ConsentChoices = {
    functional: choices.functional,
    analytics: choices.analytics && !gpc,
    marketing: choices.marketing && !gpc,
  };
  const record: ConsentRecord = {
    v: CONSENT_POLICY_VERSION,
    id: previous.consentId ?? newConsentId(),
    ts: Date.now(),
    categories,
    gpc,
  };

  writeCookie(record);
  purge(categories, { storage: true });

  const withdrawn = OPTIONAL_CATEGORIES.filter((c) => previous.categories[c] && !categories[c]);
  logDecision(record, action === "custom" && withdrawn.length > 0 ? "withdraw" : action);

  notify();
  channel?.postMessage("changed");

  // A tracker script that has already run can't be unloaded; reload so it's gone.
  if (withdrawn.some((c) => c !== "functional")) consentEnv.reload();
}

export const acceptAll = () => saveConsent({ functional: true, analytics: true, marketing: true }, "accept_all");
export const rejectAll = () => saveConsent(NO_CONSENT, "reject_all");
