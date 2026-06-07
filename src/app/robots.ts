import type { MetadataRoute } from "next";
import { clientEnv } from "@/config/env";

const raw = clientEnv.NEXT_PUBLIC_SITE_URL ?? "";
const SITE = /localhost/i.test(raw) ? "https://wecinema.co" : raw.replace(/\/$/, "");

// Private/non-content areas no crawler should index.
const DISALLOW = ["/api/", "/admin/", "/_next/"];

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
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
