import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { saveConsent } from "@/features/consent/consentStore";
import { MetaPixel } from "../MetaPixel";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));
vi.mock("next/script", () => ({
  default: ({ id, children }: { id?: string; children?: string }) => <script data-testid={id} data-inline={children} />,
}));

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

beforeEach(() => {
  pathname.current = "/";
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  clearCookies();
  vi.unstubAllGlobals();
});

describe("MetaPixel", () => {
  it("stays off without marketing consent", () => {
    saveConsent({ functional: true, analytics: true, marketing: false });
    const { container } = render(<MetaPixel />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("loads on public pages with marketing consent, with no noscript fallback", () => {
    saveConsent({ functional: false, analytics: false, marketing: true });
    const { container } = render(<MetaPixel />);

    expect(container.querySelector('[data-testid="meta-pixel"]')).not.toBeNull();
    expect(container.querySelector("noscript")).toBeNull();
  });

  it("stays off inside the app even with marketing consent", () => {
    pathname.current = "/marketplace/listings/new";
    saveConsent({ functional: false, analytics: false, marketing: true });
    const { container } = render(<MetaPixel />);
    expect(container.querySelector("script")).toBeNull();
  });
});
