import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The single-flight refresh is the reason users were being bounced to the login
 * screen at random: three components mounting at once each hit a 401, and each
 * fires its own POST /user/refresh. The backend rotates the refresh cookie on
 * every call, so refreshes 2 and 3 present an already-rotated cookie, fail, and
 * log the user out — with a correct token sitting in memory.
 *
 * These tests pin the contract: N concurrent 401s produce exactly ONE refresh.
 */

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Fresh module instance — apiClient keeps _refreshing/_queue in module scope. */
async function loadApiClient() {
  vi.resetModules();
  return import("../apiClient");
}

let calls: FetchArgs[];

beforeEach(() => {
  calls = [];
});

function installFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push([input, init]);
    return handler(String(input), init);
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

const urlsOf = () => calls.map(([u]) => String(u));

describe("apiClient — silent refresh", () => {
  it("issues exactly one refresh for concurrent 401s and retries every caller", async () => {
    const { api } = await loadApiClient();

    let refreshed = false;
    installFetch((url) => {
      if (url.includes("/user/refresh")) {
        refreshed = true;
        return jsonResponse({ token: "new-access-token" });
      }
      return refreshed
        ? jsonResponse({ ok: true, path: url })
        : jsonResponse({ error: "expired" }, 401);
    });

    const results = await Promise.all([
      api.get<{ ok: boolean }>("/user/me"),
      api.get<{ ok: boolean }>("/video/list"),
      api.get<{ ok: boolean }>("/marketplace/listings"),
    ]);

    expect(results.every((r) => r.ok)).toBe(true);

    const refreshCalls = urlsOf().filter((u) => u.includes("/user/refresh"));
    expect(refreshCalls).toHaveLength(1);
  });

  it("attaches the refreshed token to the retried request", async () => {
    const { api } = await loadApiClient();

    let refreshed = false;
    installFetch((url) => {
      if (url.includes("/user/refresh")) {
        refreshed = true;
        return jsonResponse({ token: "new-access-token" });
      }
      return refreshed ? jsonResponse({ ok: true }) : jsonResponse({ error: "expired" }, 401);
    });

    await api.get("/user/me");

    const retry = calls.find(
      ([u], i) => String(u).includes("/user/me") && i === calls.length - 1,
    );
    const headers = retry?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer new-access-token");
  });

  it("does NOT attempt a refresh when the login endpoint returns 401", async () => {
    const { api, AppError } = await loadApiClient();

    installFetch(() => jsonResponse({ error: "Invalid credentials" }, 401));

    await expect(api.post("/user/login", { email: "a@b.c", password: "x" })).rejects.toBeInstanceOf(
      AppError,
    );

    // A wrong password is not an expired session. Refreshing here would burn the
    // user's real refresh cookie on someone else's failed login attempt.
    expect(urlsOf().some((u) => u.includes("/user/refresh"))).toBe(false);
  });

  it("does not refresh on the other auth entry points either", async () => {
    const { api } = await loadApiClient();
    installFetch(() => jsonResponse({ error: "no" }, 401));

    for (const path of [
      "/user/register",
      "/user/google",
      "/user/forgot-password",
      "/user/reset-password",
      "/user/verify-email-otp",
    ]) {
      await api.post(path, {}).catch(() => {});
    }

    expect(urlsOf().some((u) => u.includes("/user/refresh"))).toBe(false);
  });

  it("calls the unauthorized handler exactly once when the refresh itself fails", async () => {
    const { api, setUnauthorizedHandler } = await loadApiClient();

    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    installFetch((url) =>
      url.includes("/user/refresh")
        ? jsonResponse({ error: "invalid refresh" }, 401)
        : jsonResponse({ error: "expired" }, 401),
    );

    await Promise.all([
      api.get("/user/me").catch(() => {}),
      api.get("/video/list").catch(() => {}),
    ]);

    expect(urlsOf().filter((u) => u.includes("/user/refresh"))).toHaveLength(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("surfaces the machine-readable error code from the response body", async () => {
    const { api, AppError } = await loadApiClient();

    installFetch(() => jsonResponse({ error: "Already rented", code: "ALREADY_RENTED" }, 409));

    // 409 covers both ALREADY_RENTED and CHECKOUT_IN_PROGRESS; the UI branches on
    // the code, so dropping it silently degrades the message to a generic error.
    await expect(api.post("/video/rent/1", {})).rejects.toMatchObject({
      status: 409,
      code: "ALREADY_RENTED",
    });
    await expect(api.post("/video/rent/1", {})).rejects.toBeInstanceOf(AppError);
  });

  it("sends credentials on every request so the httpOnly refresh cookie travels", async () => {
    const { api } = await loadApiClient();
    installFetch(() => jsonResponse({ ok: true }));

    await api.get("/user/me");

    expect(calls[0]?.[1]?.credentials).toBe("include");
  });

  it("does not set Content-Type on FormData bodies", async () => {
    const { api } = await loadApiClient();
    installFetch(() => jsonResponse({ ok: true }));

    const fd = new FormData();
    fd.append("file", new Blob(["x"]), "a.txt");
    await api.post("/uploads", fd);

    // Setting it by hand strips the multipart boundary and the upload fails.
    const headers = calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
  });
});

/**
 * "Token expired while I was using the site": a flaky connection or a second tab must
 * never end a live session. Only the server saying the session is over may.
 */
describe("apiClient — a live session never expires on its own", () => {
  it("does not log out when the refresh can't reach the server", async () => {
    const { api, setUnauthorizedHandler } = await loadApiClient();
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    installFetch((url) => {
      if (url.includes("/user/refresh")) throw new TypeError("Failed to fetch");
      return jsonResponse({ error: "expired" }, 401);
    });

    await expect(api.get("/user/me")).rejects.toMatchObject({ status: null, code: "SESSION_REFRESH_UNAVAILABLE" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it.each([429, 500, 503])("does not log out when the refresh answers %i", async (status) => {
    const { api, setUnauthorizedHandler } = await loadApiClient();
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);

    installFetch((url) =>
      url.includes("/user/refresh") ? jsonResponse({ error: "busy" }, status) : jsonResponse({ error: "expired" }, 401),
    );

    await api.get("/user/me").catch(() => {});
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("serialises refreshes across tabs with the Web Locks API", async () => {
    const { api } = await loadApiClient();
    const request = vi.fn((_name: string, fn: () => Promise<unknown>) => fn());
    vi.stubGlobal("navigator", { ...navigator, locks: { request } });

    let refreshed = false;
    installFetch((url) => {
      if (url.includes("/user/refresh")) {
        refreshed = true;
        return jsonResponse({ token: "new-access-token" });
      }
      return refreshed ? jsonResponse({ ok: true }) : jsonResponse({ error: "expired" }, 401);
    });

    await api.get("/user/me");
    expect(request).toHaveBeenCalledWith("wecinema-session-refresh", expect.any(Function));
  });

  it("sends the refresh with keepalive so a reload can't strand the rotated cookie", async () => {
    const { refreshSession } = await loadApiClient();
    installFetch(() => jsonResponse({ token: "t" }));

    await refreshSession();
    expect(calls[0]?.[1]?.keepalive).toBe(true);
  });
});

describe("startSessionKeeper", () => {
  const MIN = 60_000;

  function fakeJwt(lifetimeMs: number, iat = 1_700_000_000) {
    const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    return `${b64url({ alg: "HS256" })}.${b64url({ iat, exp: iat + lifetimeMs / 1000 })}.sig`;
  }

  async function setupKeeper() {
    vi.useFakeTimers();
    const client = await loadApiClient();
    const { tokenStorage } = await import("../tokenStorage");
    let refreshes = 0;
    installFetch((url) => {
      if (url.includes("/user/refresh")) {
        refreshes += 1;
        return jsonResponse({ token: fakeJwt(15 * MIN) });
      }
      return jsonResponse({ ok: true });
    });
    tokenStorage.set(fakeJwt(15 * MIN));
    const stop = client.startSessionKeeper();
    return { client, tokenStorage, stop, refreshes: () => refreshes };
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the lifetime from the token's own claims", async () => {
    const { tokenLifetimeMs } = await loadApiClient();
    expect(tokenLifetimeMs(fakeJwt(15 * MIN))).toBe(15 * MIN);
    expect(tokenLifetimeMs("not-a-jwt")).toBeNull();
  });

  it("renews the token a minute before it expires, and keeps doing so", async () => {
    const t = await setupKeeper();

    await vi.advanceTimersByTimeAsync(13 * MIN);
    expect(t.refreshes()).toBe(0);

    await vi.advanceTimersByTimeAsync(1 * MIN + 1000);
    expect(t.refreshes()).toBe(1);

    await vi.advanceTimersByTimeAsync(14 * MIN + 1000);
    expect(t.refreshes()).toBe(2);
    t.stop();
  });

  it("renews immediately when a tab comes back after its token went stale", async () => {
    const t = await setupKeeper();

    // Background tabs have their timers throttled: time passes, the timer hasn't fired.
    vi.setSystemTime(Date.now() + 20 * MIN);
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(0);

    expect(t.refreshes()).toBe(1);
    t.stop();
  });

  it("retries quietly after a transient failure instead of logging out", async () => {
    const t = await setupKeeper();
    const onUnauthorized = vi.fn();
    t.client.setUnauthorizedHandler(onUnauthorized);

    let attempts = 0;
    installFetch((url) => {
      if (url.includes("/user/refresh")) {
        attempts += 1;
        return attempts === 1 ? jsonResponse({ error: "down" }, 502) : jsonResponse({ token: fakeJwt(15 * MIN) });
      }
      return jsonResponse({ ok: true });
    });

    await vi.advanceTimersByTimeAsync(14 * MIN + 1000);
    expect(attempts).toBe(1);
    await vi.advanceTimersByTimeAsync(31_000);
    expect(attempts).toBe(2);
    expect(onUnauthorized).not.toHaveBeenCalled();
    t.stop();
  });

  it("stops renewing once stopped (sign-out)", async () => {
    const t = await setupKeeper();
    t.stop();
    await vi.advanceTimersByTimeAsync(30 * MIN);
    expect(t.refreshes()).toBe(0);
  });
});
