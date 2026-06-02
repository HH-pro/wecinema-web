/**
 * Hardcoded production origin for OG / Twitter Card image URLs.
 *
 * NEVER use an env var here — NEXT_PUBLIC_* vars are baked in at build time
 * and will embed localhost if the var isn't set correctly during CI/CD.
 * OG images must always point to the live production domain.
 */
export const SITE_ORIGIN = "https://wecinema.co";

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
} as const;

export type OGKey = keyof typeof OG;
