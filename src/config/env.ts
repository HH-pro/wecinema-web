import { z } from "zod";

/**
 * Server-only env. Validated at module load. Never imported from a "use client" file.
 *
 * If you add a server-only secret, put it here and reference it from RSC / route
 * handlers / server actions only. Throws on startup if anything is missing or wrong,
 * so misconfigured deploys fail fast instead of half-working in production.
 */
const ServerEnv = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_URL: z.string().url().describe("Origin the /api/* rewrite proxies to"),
});

/**
 * Client-exposed env. MUST be prefixed `NEXT_PUBLIC_`.
 * Listed via destructured statics so Next.js bundler can inline them at build time.
 */
const ClientEnv = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("https://wecinema.co")
    .describe("Canonical absolute URL — used for metadataBase, sitemap, OG tags"),
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .default("/api")
    .describe("Path the browser hits; goes through next.config rewrite"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:5173")
    .describe("WeCinema frontend SPA URL — used for auth/payment CTAs"),
});

function format(error: z.ZodError): string {
  return error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

function parseServer() {
  const parsed = ServerEnv.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    BACKEND_URL: process.env.BACKEND_URL,
  });
  if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${format(parsed.error)}`);
  }
  return parsed.data;
}

function parseClient() {
  const parsed = ClientEnv.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    throw new Error(`Invalid client environment:\n${format(parsed.error)}`);
  }
  return parsed.data;
}

export const serverEnv = parseServer();
export const clientEnv = parseClient();

export const isProd = serverEnv.NODE_ENV === "production";
export const isDev = serverEnv.NODE_ENV === "development";
