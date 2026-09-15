/**
 * Every cookie and browser-storage item WeCinema uses. The cookie settings dialog and the
 * /cookie-policy page both render from this list, so they can't drift apart — add an
 * entry (and bump CONSENT_POLICY_VERSION) whenever something new is stored.
 */

import type { ConsentCategory } from "./consentTypes";

export type StorageKind = "cookie" | "localStorage" | "indexedDB";

export interface CookieInfo {
  name: string;
  provider: string;
  category: ConsentCategory;
  purpose: string;
  duration: string;
  storage: StorageKind;
}

export const STORAGE_LABEL: Record<StorageKind, string> = {
  cookie: "Cookie",
  localStorage: "Local storage",
  indexedDB: "IndexedDB",
};

export const CATEGORY_INFO: Record<ConsentCategory, { title: string; description: string }> = {
  necessary: {
    title: "Strictly necessary",
    description:
      "Needed for WeCinema to work: keeping you signed in and secure, remembering your cookie choices and the preferences you set yourself, and taking payments. These can't be switched off.",
  },
  functional: {
    title: "Functional",
    description: "Remember things that make the site more convenient, such as your recent searches.",
  },
  analytics: {
    title: "Analytics",
    description:
      "Help us understand how WeCinema is used and how fast pages load, through Google Analytics. Google's advertising features are turned off.",
  },
  marketing: {
    title: "Marketing",
    description:
      "Measure how our ads on Facebook and Instagram perform, through the Meta Pixel. Used on public pages only, never inside your account.",
  },
};

export const COOKIE_REGISTRY: readonly CookieInfo[] = [
  // ─── Strictly necessary ───
  {
    name: "__Host-wc_refresh",
    provider: "WeCinema",
    category: "necessary",
    purpose: "Keeps you signed in. Secure and httpOnly, so page scripts can't read it.",
    duration: "30 days",
    storage: "cookie",
  },
  {
    name: "wc_consent",
    provider: "WeCinema",
    category: "necessary",
    purpose: "Remembers your cookie choices.",
    duration: "6 months",
    storage: "cookie",
  },
  {
    name: "wc_user",
    provider: "WeCinema",
    category: "necessary",
    purpose: "Caches your basic profile so the site shows you as signed in straight away.",
    duration: "Until you sign out",
    storage: "localStorage",
  },
  {
    name: "wc_theme",
    provider: "WeCinema",
    category: "necessary",
    purpose: "Remembers light or dark mode, once you choose one.",
    duration: "Until cleared",
    storage: "localStorage",
  },
  {
    name: "lastVolume",
    provider: "WeCinema",
    category: "necessary",
    purpose: "Remembers the video player volume you set.",
    duration: "Until cleared",
    storage: "localStorage",
  },
  {
    name: "analyticsGraphsVisible",
    provider: "WeCinema",
    category: "necessary",
    purpose: "Remembers whether you showed or hid the charts on the home page.",
    duration: "Until cleared",
    storage: "localStorage",
  },
  {
    name: "wecinema-uploads",
    provider: "WeCinema",
    category: "necessary",
    purpose: "Lets an interrupted video upload resume where it stopped.",
    duration: "Until the upload finishes",
    storage: "indexedDB",
  },
  {
    name: "firebaseLocalStorageDb",
    provider: "Google Firebase",
    category: "necessary",
    purpose: "Completes Sign in with Google. Only set if you use it.",
    duration: "Until you sign out",
    storage: "indexedDB",
  },
  {
    name: "__stripe_mid",
    provider: "Stripe",
    category: "necessary",
    purpose: "Fraud prevention for card payments. Set only when a checkout form opens.",
    duration: "1 year",
    storage: "cookie",
  },
  {
    name: "__stripe_sid",
    provider: "Stripe",
    category: "necessary",
    purpose: "Fraud prevention for card payments. Set only when a checkout form opens.",
    duration: "30 minutes",
    storage: "cookie",
  },
  {
    name: "PayPal checkout cookies",
    provider: "PayPal",
    category: "necessary",
    purpose: "Process subscription payments. Set by paypal.com only when PayPal checkout opens.",
    duration: "Set by PayPal",
    storage: "cookie",
  },

  // ─── Functional ───
  {
    name: "wc_recent_searches",
    provider: "WeCinema",
    category: "functional",
    purpose: "Remembers your recent searches. Without consent they're kept for your current visit only.",
    duration: "Until cleared",
    storage: "localStorage",
  },

  // ─── Analytics ───
  {
    name: "_ga",
    provider: "Google Analytics",
    category: "analytics",
    purpose: "Distinguishes visitors so usage can be counted.",
    duration: "2 years",
    storage: "cookie",
  },
  {
    name: "_ga_<container-id>",
    provider: "Google Analytics",
    category: "analytics",
    purpose: "Keeps session state for Google Analytics 4.",
    duration: "2 years",
    storage: "cookie",
  },

  // ─── Marketing ───
  {
    name: "_fbp",
    provider: "Meta",
    category: "marketing",
    purpose: "Identifies the browser to measure and improve our ads on Facebook and Instagram.",
    duration: "3 months",
    storage: "cookie",
  },
  {
    name: "_fbc",
    provider: "Meta",
    category: "marketing",
    purpose: "Records the ad click that brought you to WeCinema.",
    duration: "3 months",
    storage: "cookie",
  },
];

export const cookiesIn = (category: ConsentCategory): CookieInfo[] =>
  COOKIE_REGISTRY.filter((c) => c.category === category);
