import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveConsent } from "@/features/consent/consentStore";
import { addRecentSearch, clearRecentSearches, getRecentSearches, removeRecentSearch } from "../recentSearches";

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  clearRecentSearches();
  clearCookies();
  vi.unstubAllGlobals();
});

describe("recent searches", () => {
  it("keeps searches for the current visit only without functional consent", () => {
    addRecentSearch("noir");
    addRecentSearch("Western");

    expect(getRecentSearches()).toEqual(["Western", "noir"]);
    expect(localStorage.getItem("wc_recent_searches")).toBeNull();

    expect(removeRecentSearch("NOIR")).toEqual(["Western"]);
  });

  it("persists searches with functional consent", () => {
    saveConsent({ functional: true, analytics: false, marketing: false });

    addRecentSearch("noir");

    expect(JSON.parse(localStorage.getItem("wc_recent_searches") ?? "[]")).toEqual(["noir"]);
    expect(getRecentSearches()).toEqual(["noir"]);
  });
});
