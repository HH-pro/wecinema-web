/**
 * Public vs. authenticated-app route classification.
 *
 * "Public" = the open marketing/content site that unauthenticated visitors and
 * search/ad traffic land on (home, about, signup, login, hypemode, blog,
 * watch, public profiles, legal pages, marketplace browsing, …). These are the
 * only routes the Meta Pixel fires a PageView on.
 *
 * "Private" = the logged-in application surface (admin panel, dashboards,
 * uploads, orders/offers/messages, the video editor, account tabs). We do NOT
 * want ad-tracking pixels firing on authenticated app usage.
 *
 * This is an explicit ALLOWLIST: a route is public only if it matches one of
 * PUBLIC_PREFIXES/PUBLIC_EXACT below. Anything not listed is treated as private
 * (untracked) by default, so a newly added app surface never leaks into the
 * Pixel — add new marketing/content pages here when they ship.
 */

// Public routes matched by prefix: a path matches if it equals the prefix or
// starts with the prefix + "/" (so "/blog" also covers "/blog/my-post").
const PUBLIC_PREFIXES = [
  "/about",
  "/hypemode",
  "/signup",
  "/login",
  "/welcome",
  "/explore",
  "/shorts",
  "/category", // /category/[genre]
  "/ratings", // /ratings/[rating]
  "/themes", // /themes/[slug]
  "/search", // /search/[query]
  "/scripts", // /scripts/[id]
  "/blog", // /blog/[slug]
  "/watch", // /watch/[slug]
  "/user", // /user/[id] public profile (account sub-tabs carved out below)
  "/privacy-policy",
  "/terms-and-conditions",
  "/support",
  "/report",
  // Marketplace browsing surfaces (dashboards/orders/etc. are NOT listed).
  "/marketplace/browse",
  "/marketplace/guide",
  "/marketplace/resources",
  "/marketplace/listings", // /marketplace/listings/[id] (…/new carved out below)
] as const;

// Public routes matched exactly (a prefix would over-match): the home page and
// the marketplace landing page.
const PUBLIC_EXACT = ["/", "/marketplace"] as const;

// Private children living under an otherwise-public prefix. These win over the
// allowlist so they stay untracked.
//   /user/[id]/{bookmarks,history,liked} — personal account tabs under /user
//   /marketplace/listings/new            — the create-listing form under /marketplace/listings
const PRIVATE_OVERRIDES = [
  /^\/user\/[^/]+\/(bookmarks|history|liked)\/?$/,
  /^\/marketplace\/listings\/new(\/.*)?$/,
];

export function isPublicPage(pathname: string): boolean {
  if (!pathname) return false;
  const path = (pathname.split(/[?#]/)[0] ?? "").replace(/\/+$/, "") || "/";

  if (PRIVATE_OVERRIDES.some((re) => re.test(path))) return false;

  if ((PUBLIC_EXACT as readonly string[]).includes(path)) return true;

  return PUBLIC_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
