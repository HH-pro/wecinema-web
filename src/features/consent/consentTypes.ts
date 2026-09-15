/** Bump whenever the cookies in use change: every visitor is then asked again. */
export const CONSENT_POLICY_VERSION = "2026-09-15";

export const CONSENT_COOKIE = "wc_consent";

/** Ask again after 6 months, as EU regulators (CNIL, ICO) recommend. */
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

export const CONSENT_CATEGORIES = ["necessary", "functional", "analytics", "marketing"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export type OptionalCategory = Exclude<ConsentCategory, "necessary">;
export const OPTIONAL_CATEGORIES: readonly OptionalCategory[] = ["functional", "analytics", "marketing"];

export type ConsentChoices = Record<OptionalCategory, boolean>;

/** Matches CONSENT_ACTIONS in backend/src/constants/consent.js. */
export type ConsentAction = "accept_all" | "reject_all" | "custom" | "withdraw";

/** What the wc_consent cookie holds. */
export interface ConsentRecord {
  /** Policy version the choice was made under. */
  v: string;
  /** Random id shared by this browser's consent records. */
  id: string;
  ts: number;
  categories: ConsentChoices;
  /** The browser sent Global Privacy Control. */
  gpc: boolean;
}
