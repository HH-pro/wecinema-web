import type { MetadataRoute } from "next";
import { clientEnv } from "@/config/env";

const raw = clientEnv.NEXT_PUBLIC_SITE_URL ?? "";
const SITE = /localhost/i.test(raw) ? "https://wecinema.co" : raw.replace(/\/$/, "");

// Private/non-content areas no crawler should index.
//
// `/_next/static/` is deliberately NOT blocked: it holds the JS and CSS Google
// needs to render and evaluate the page. Blanket-disallowing `/_next/` made
// every page render broken in Search Console's eyes. Only the non-static
// internals (RSC payloads, image optimiser, build traces) stay out.
const DISALLOW = ["/api/", "/admin/", "/_next/"];
const ALLOW = ["/", "/_next/static/"];

// AI/answer-engine crawlers we explicitly WELCOME — being cited in ChatGPT,
// Claude, Perplexity, and Google AI Overviews drives discovery for a video
// marketplace (Generative Engine Optimization). Listed by name so the policy is
// a deliberate decision, not an accident of the wildcard rule. Remove a bot
// here to opt out of having its engine train on / cite our content.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI training crawler
  "OAI-SearchBot", // ChatGPT search results
  "ChatGPT-User", // ChatGPT live browsing on a user's behalf
  "ClaudeBot", // Anthropic training crawler
  "anthropic-ai", // Anthropic (legacy UA)
  "Claude-Web", // Claude live browsing
  "PerplexityBot", // Perplexity index
  "Google-Extended", // Google Gemini / AI Overviews opt-in
  "Applebot-Extended", // Apple Intelligence opt-in
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: ALLOW, disallow: DISALLOW })),
    ],
    // Both sitemaps are listed so Google discovers the video sitemap too — it
    // existed but was referenced nowhere, so it was never fetched.
    sitemap: [`${SITE}/sitemap.xml`, `${SITE}/video-sitemap.xml`],
    host: SITE,
  };
}
