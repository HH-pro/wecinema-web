import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * env.ts validates at module load so a misconfigured deploy fails fast instead of
 * half-working. These tests pin that it really does fail — a schema that silently
 * accepts a missing value is how BACKEND_URL ends up as "undefined" in a fetch URL.
 */

async function loadEnv(vars: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(vars)) {
    // Vitest deletes the key when the value is undefined, which is what an
    // unset variable actually looks like.
    vi.stubEnv(k, v as string);
  }
  return import("../env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server env", () => {
  it("accepts a valid configuration", async () => {
    const { serverEnv } = await loadEnv({
      NODE_ENV: "test",
      BACKEND_URL: "http://localhost:3000",
      INTERNAL_API_KEY: "s".repeat(32),
    });
    expect(serverEnv.BACKEND_URL).toBe("http://localhost:3000");
    expect(serverEnv.INTERNAL_API_KEY).toHaveLength(32);
  });

  it("throws when BACKEND_URL is missing", async () => {
    await expect(
      loadEnv({ NODE_ENV: "test", BACKEND_URL: undefined }),
    ).rejects.toThrow(/Invalid server environment/);
  });

  it("throws when BACKEND_URL is not an absolute http(s) URL", async () => {
    // `new URL("localhost:3000")` parses — scheme "localhost:" — so a bare
    // host:port sails through a plain .url() check and every SSR fetch then
    // silently goes nowhere.
    await expect(
      loadEnv({ NODE_ENV: "test", BACKEND_URL: "localhost:3000" }),
    ).rejects.toThrow(/Invalid server environment/);

    await expect(
      loadEnv({ NODE_ENV: "test", BACKEND_URL: "ftp://backend.internal" }),
    ).rejects.toThrow(/Invalid server environment/);
  });

  it("treats an empty string as unset so defaults still apply", async () => {
    // Setting a var to "" in a deploy dashboard is an easy mistake; it must not
    // defeat the schema default and take the app down at boot.
    const { clientEnv } = await loadEnv({
      NODE_ENV: "test",
      BACKEND_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_URL: "",
    });
    expect(clientEnv.NEXT_PUBLIC_SITE_URL).toBe("https://wecinema.co");
  });

  it("treats INTERNAL_API_KEY as optional", async () => {
    const { serverEnv } = await loadEnv({
      NODE_ENV: "test",
      BACKEND_URL: "http://localhost:3000",
      INTERNAL_API_KEY: undefined,
    });
    // Optional by design: without it SSR fetches still work, they just share the
    // backend's IP-keyed rate limit bucket.
    expect(serverEnv.INTERNAL_API_KEY).toBeFalsy();
  });
});

describe("client env", () => {
  it("falls back to documented defaults", async () => {
    const { clientEnv } = await loadEnv({
      NODE_ENV: "test",
      BACKEND_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_API_BASE_URL: undefined,
    });
    expect(clientEnv.NEXT_PUBLIC_SITE_URL).toBe("https://wecinema.co");
    expect(clientEnv.NEXT_PUBLIC_API_BASE_URL).toBe("/api");
  });

  it("rejects a non-URL NEXT_PUBLIC_SITE_URL", async () => {
    await expect(
      loadEnv({
        NODE_ENV: "test",
        BACKEND_URL: "http://localhost:3000",
        NEXT_PUBLIC_SITE_URL: "wecinema.co",
      }),
    ).rejects.toThrow(/Invalid client environment/);
  });

  it("exposes no server secret through the client object", async () => {
    const { clientEnv } = await loadEnv({
      NODE_ENV: "test",
      BACKEND_URL: "http://localhost:3000",
      INTERNAL_API_KEY: "super-secret-value-32-chars-long",
    });
    expect(JSON.stringify(clientEnv)).not.toContain("super-secret-value");
    expect(Object.keys(clientEnv).every((k) => k.startsWith("NEXT_PUBLIC_"))).toBe(true);
  });
});
