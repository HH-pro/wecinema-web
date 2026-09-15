import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentProvider } from "../../ConsentProvider";
import { hasConsent } from "../../consentStore";
import { CookieSettingsButton } from "../CookieSettingsButton";
import { CookieSettingsModal } from "../CookieSettingsModal";

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

async function openSettings() {
  const user = userEvent.setup();
  render(
    <ConsentProvider>
      <CookieSettingsButton />
      <CookieSettingsModal />
    </ConsentProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Cookie settings" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Cookie settings" });
  return { user, trigger, dialog };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

afterEach(() => {
  clearCookies();
  Object.defineProperty(navigator, "globalPrivacyControl", { value: undefined, configurable: true });
  vi.unstubAllGlobals();
});

describe("CookieSettingsModal", () => {
  it("shows strictly necessary as always on, with a switch for each optional category", async () => {
    const { dialog } = await openSettings();

    expect(within(dialog).getByText("Always on")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("switch")).toHaveLength(3);
    for (const name of ["Functional", "Analytics", "Marketing"]) {
      expect(within(dialog).getByRole("switch", { name })).toHaveAttribute("aria-checked", "false");
    }
  });

  it("saves only the categories switched on", async () => {
    const { user, dialog } = await openSettings();

    await user.click(within(dialog).getByRole("switch", { name: "Analytics" }));
    await user.click(within(dialog).getByRole("button", { name: "Save choices" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("functional")).toBe(false);
    expect(hasConsent("marketing")).toBe(false);
  });

  it("closes on Escape and returns focus to the button that opened it", async () => {
    const { user, trigger } = await openSettings();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("locks analytics and marketing off under Global Privacy Control", async () => {
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    const { user, dialog } = await openSettings();

    expect(within(dialog).getByText(/Global Privacy Control/)).toBeInTheDocument();
    expect(within(dialog).getByRole("switch", { name: "Analytics" })).toBeDisabled();
    expect(within(dialog).getByRole("switch", { name: "Marketing" })).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "Accept all" }));
    expect(hasConsent("functional")).toBe(true);
    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("marketing")).toBe(false);
  });
});
