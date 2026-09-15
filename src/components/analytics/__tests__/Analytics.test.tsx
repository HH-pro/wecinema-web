import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { saveConsent } from "@/features/consent/consentStore";
import { Analytics } from "../Analytics";

vi.mock("next/script", () => ({
  default: ({ id, src, children }: { id?: string; src?: string; children?: string }) => (
    <script data-testid={id ?? src} data-inline={children} />
  ),
}));
vi.mock("next/web-vitals", () => ({ useReportWebVitals: vi.fn() }));

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
  clearCookies();
  vi.unstubAllGlobals();
});

describe("Analytics", () => {
  it("loads nothing without analytics consent", () => {
    const { container } = render(<Analytics />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("loads nothing when only other categories are allowed", () => {
    saveConsent({ functional: true, analytics: false, marketing: true });
    const { container } = render(<Analytics />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("loads GA with advertising storage denied once analytics is allowed", () => {
    saveConsent({ functional: false, analytics: true, marketing: false });
    const { container } = render(<Analytics />);

    expect(container.querySelectorAll("script")).toHaveLength(2);
    const init = container.querySelector('[data-testid="ga4-init"]')?.getAttribute("data-inline") ?? "";
    expect(init).toContain("gtag('consent', 'default'");
    expect(init).toContain("ad_storage: 'denied'");
    expect(init.indexOf("gtag('consent'")).toBeLessThan(init.indexOf("gtag('config'"));
  });
});
