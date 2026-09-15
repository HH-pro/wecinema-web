import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentProvider } from "../../ConsentProvider";
import { acceptAll, getConsentSnapshot } from "../../consentStore";
import { CookieBanner } from "../CookieBanner";
import { CookieSettingsModal } from "../CookieSettingsModal";

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

const renderConsentUi = () =>
  render(
    <ConsentProvider>
      <CookieBanner />
      <CookieSettingsModal />
    </ConsentProvider>,
  );

const banner = () => screen.queryByRole("region", { name: "Cookie consent" });

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  clearCookies();
  vi.unstubAllGlobals();
});

describe("CookieBanner", () => {
  it("offers Reject all, Accept all and Customize on a first visit", async () => {
    renderConsentUi();
    const region = await screen.findByRole("region", { name: "Cookie consent" });

    expect(within(region).getByRole("button", { name: "Reject all" })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "Accept all" })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "Customize" })).toBeInTheDocument();
    expect(within(region).getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookie-policy");
  });

  it("saves a rejection and goes away", async () => {
    const user = userEvent.setup();
    renderConsentUi();

    await user.click(await screen.findByRole("button", { name: "Reject all" }));

    await waitFor(() => expect(banner()).toBeNull());
    expect(getConsentSnapshot()).toMatchObject({
      decided: true,
      categories: { functional: false, analytics: false, marketing: false },
    });
  });

  it("opens the settings dialog from Customize", async () => {
    const user = userEvent.setup();
    renderConsentUi();

    await user.click(await screen.findByRole("button", { name: "Customize" }));

    expect(await screen.findByRole("dialog", { name: "Cookie settings" })).toBeInTheDocument();
    await waitFor(() => expect(banner()).toBeNull());
  });

  it("stays hidden once the visitor has chosen", () => {
    acceptAll();
    renderConsentUi();
    expect(banner()).toBeNull();
  });
});
