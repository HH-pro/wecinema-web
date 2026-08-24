import { z } from "zod";

/**
 * Server-only env. Validated at module load. Never imported from a "use client" file.
 *
 * If you add a server-only secret, put it here and reference it from RSC / route
 * handlers / server actions only. Throws on startup if anything is missing or wrong,
 * so misconfigured deploys fail fast instead of half-working in production.
 */
/**
 * `z.string().url()` accepts anything `new URL()` parses — including "localhost:3000",
 * which reads as the scheme "localhost:" and would silently send every SSR fetch
 * nowhere. Require a real http(s) origin.
 *
 * `.trim()` + treating "" as absent matters because a deploy that sets an env var to
 * an empty string (a very easy mistake in a dashboard) would otherwise skip the
 * schema default and crash the app at boot.
 */
const httpUrl = () =>
  z
    .string()
    .trim()
    .refine((v) => /^https?:\/\//.test(v), {
      message: "must be an absolute http(s) URL",
    })
    .refine(
      (v) => {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      { message: "must be a valid URL" },
    );

/** Treats "" as not-set so schema defaults still apply. */
const optionalEnv = (v: string | undefined) => (v && v.trim() !== "" ? v : undefined);

const ServerEnv = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_URL: httpUrl().describe("Origin the /api/* rewrite proxies to"),
  INTERNAL_API_KEY: z
    .string()
    .optional()
    .describe(
      "Shared secret sent as `x-internal-key` so SSR fetches bypass the backend's " +
        "IP-keyed rate limiter. MUST equal the backend's INTERNAL_API_KEY.",
    ),
});

/**
 * Client-exposed env. MUST be prefixed `NEXT_PUBLIC_`.
 * Listed via destructured statics so Next.js bundler can inline them at build time.
 */
const ClientEnv = z.object({
  NEXT_PUBLIC_SITE_URL: httpUrl()
    .default("https://wecinema.co")
    .describe("Canonical absolute URL — used for metadataBase, sitemap, OG tags"),
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .default("/api")
    .describe("Path the browser hits; goes through next.config rewrite"),
  NEXT_PUBLIC_APP_URL: httpUrl()
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
    NODE_ENV: optionalEnv(process.env.NODE_ENV),
    BACKEND_URL: optionalEnv(process.env.BACKEND_URL),
    INTERNAL_API_KEY: optionalEnv(process.env.INTERNAL_API_KEY),
  });
  if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${format(parsed.error)}`);
  }
  return parsed.data;
}

function parseClient() {
  const parsed = ClientEnv.safeParse({
    NEXT_PUBLIC_SITE_URL: optionalEnv(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_API_BASE_URL: optionalEnv(process.env.NEXT_PUBLIC_API_BASE_URL),
    NEXT_PUBLIC_APP_URL: optionalEnv(process.env.NEXT_PUBLIC_APP_URL),
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
