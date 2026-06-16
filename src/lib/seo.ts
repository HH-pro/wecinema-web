/**
 * Hardcoded production origin for OG / Twitter Card image URLs.
 *
 * NEVER use an env var here — NEXT_PUBLIC_* vars are baked in at build time
 * and will embed localhost if the var isn't set correctly during CI/CD.
 * OG images must always point to the live production domain.
 */
export const SITE_ORIGIN = "https://wecinema.co";

/**
 * Official WeCinema social profiles — the canonical `sameAs` set for
 * Organization structured data. Keeping these in one place lets search engines
 * and AI answer engines resolve "WeCinema" as a single, verified entity across
 * the web. Mirrors the links shown in the site footer.
 */
export const SOCIAL_PROFILES = [
  "https://twitter.com/wecinema",
  "https://instagram.com/wecinema",
  "https://youtube.com/@wecinema",
  "https://facebook.com/wecinema",
] as const;

export const OG = {
  default: `${SITE_ORIGIN}/seo/WeCinema.webp`,
  blog:    `${SITE_ORIGIN}/seo/Wecinema-Blog.webp`,
  video:   `${SITE_ORIGIN}/seo/Video.webp`,
  report:  `${SITE_ORIGIN}/seo/Report.webp`,
  chatbot: `${SITE_ORIGIN}/seo/Chatbot.webp`,
  support: `${SITE_ORIGIN}/seo/WeCinemaSupport.webp`,
  explore: `${SITE_ORIGIN}/seo/Explore.webp`,
  privacy: `${SITE_ORIGIN}/seo/Privacy.webp`,
  about:   `${SITE_ORIGIN}/seo/WeCinema-About.webp`,
  login:        `${SITE_ORIGIN}/seo/Login.webp`,
  signup:       `${SITE_ORIGIN}/seo/signup.webp`,
  scripts:      `${SITE_ORIGIN}/seo/script.webp`,
  scriptUpload: `${SITE_ORIGIN}/seo/script-upload.webp`,
  search:       `${SITE_ORIGIN}/seo/search.webp`,
  videoUpload:  `${SITE_ORIGIN}/seo/upload-video.webp`,
  marketplace:          `${SITE_ORIGIN}/seo/marketplace.webp`,
  marketplaceBrowse:    `${SITE_ORIGIN}/seo/marketplace-browse.webp`,
  marketplaceResources: `${SITE_ORIGIN}/seo/marketplace-resources.webp`,
} as const;

export type OGKey = keyof typeof OG;
