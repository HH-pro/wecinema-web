import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import {
  acceptAll,
  consentEnv,
  decodeConsent,
  encodeConsent,
  getConsentSnapshot,
  hasConsent,
  rejectAll,
  saveConsent,
} from "../consentStore";
import { CONSENT_COOKIE, CONSENT_POLICY_VERSION, type ConsentRecord } from "../consentTypes";

const fetchMock = vi.fn();

const cookieNames = () => document.cookie.split(";").map((c) => c.split("=")[0]?.trim()).filter(Boolean);

function clearCookies() {
  for (const name of cookieNames()) document.cookie = `${name}=; Max-Age=0; Path=/`;
}

function setGpc(value: boolean | undefined) {
  Object.defineProperty(navigator, "globalPrivacyControl", { value, configurable: true });
}

const lastRequest = () => fetchMock.mock.calls.at(-1)?.[1];
const lastLoggedBody = () => JSON.parse(lastRequest()?.body as string);

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(consentEnv, "reload").mockImplementation(() => {});
});

afterEach(() => {
  clearCookies();
  setGpc(undefined);
  tokenStorage.clear();
  vi.unstubAllGlobals();
});

describe("consent store", () => {
  it("starts undecided, with only strictly necessary cookies allowed", () => {
    expect(getConsentSnapshot()).toMatchObject({ decided: false, consentId: null });
    expect(hasConsent("necessary")).toBe(true);
    expect(hasConsent("functional")).toBe(false);
    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("marketing")).toBe(false);
  });

  it("accepts every category and logs the decision", () => {
    acceptAll();

    expect(getConsentSnapshot()).toMatchObject({
      decided: true,
      categories: { functional: true, analytics: true, marketing: true },
    });
    expect(cookieNames()).toContain(CONSENT_COOKIE);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/consent$/),
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
    expect(lastLoggedBody()).toMatchObject({
      action: "accept_all",
      policyVersion: CONSENT_POLICY_VERSION,
      categories: { functional: true, analytics: true, marketing: true },
      gpc: false,
    });
  });

  it("rejects every optional category", () => {
    rejectAll();
    expect(getConsentSnapshot()).toMatchObject({
      decided: true,
      categories: { functional: false, analytics: false, marketing: false },
    });
    expect(lastLoggedBody().action).toBe("reject_all");
  });

  it("returns the same snapshot object until the choice changes", () => {
    const first = getConsentSnapshot();
    expect(getConsentSnapshot()).toBe(first);
    rejectAll();
    expect(getConsentSnapshot()).not.toBe(first);
  });

  it("treats a tampered cookie as no decision", () => {
    document.cookie = `${CONSENT_COOKIE}=not-a-real-record; Path=/`;
    expect(getConsentSnapshot().decided).toBe(false);
  });

  it("asks again when the policy version changes", () => {
    const old: ConsentRecord = {
      v: "2020-01-01",
      id: crypto.randomUUID(),
      ts: Date.now(),
      categories: { functional: true, analytics: true, marketing: true },
      gpc: false,
    };
    document.cookie = `${CONSENT_COOKIE}=${encodeConsent(old)}; Path=/`;
    expect(getConsentSnapshot().decided).toBe(false);

    const current = { ...old, v: CONSENT_POLICY_VERSION };
    expect(decodeConsent(encodeConsent(current))).toEqual(current);
  });

  it("keeps analytics and marketing off under Global Privacy Control", () => {
    setGpc(true);
    acceptAll();

    expect(hasConsent("functional")).toBe(true);
    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("marketing")).toBe(false);
    expect(lastLoggedBody()).toMatchObject({ gpc: true, categories: { analytics: false, marketing: false } });
  });

  it("keeps the same consent id when the choice changes", () => {
    acceptAll();
    const id = getConsentSnapshot().consentId;
    rejectAll();
    expect(getConsentSnapshot().consentId).toBe(id);
    expect(lastLoggedBody().consentId).toBe(id);
  });

  it("on withdrawal deletes tracker cookies and saved searches, then reloads", () => {
    acceptAll();
    document.cookie = "_ga=GA1.1.123; Path=/";
    document.cookie = "_ga_ABC123=GS1.1.1; Path=/";
    document.cookie = "_fbp=fb.1.123; Path=/";
    localStorage.setItem("wc_recent_searches", '["noir"]');

    saveConsent({ functional: false, analytics: false, marketing: false });

    expect(cookieNames()).not.toContain("_ga");
    expect(cookieNames()).not.toContain("_ga_ABC123");
    expect(cookieNames()).not.toContain("_fbp");
    expect(localStorage.getItem("wc_recent_searches")).toBeNull();
    expect(consentEnv.reload).toHaveBeenCalledTimes(1);
    expect(lastLoggedBody().action).toBe("withdraw");
  });

  it("doesn't reload when no loaded tracker is withdrawn", () => {
    rejectAll();
    saveConsent({ functional: true, analytics: false, marketing: false });
    expect(consentEnv.reload).not.toHaveBeenCalled();
  });

  it("sends the access token so a signed-in visitor's record is linked to the account", () => {
    tokenStorage.set("access-token");
    rejectAll();
    expect(lastRequest()?.headers).toMatchObject({ Authorization: "Bearer access-token" });
  });
});
