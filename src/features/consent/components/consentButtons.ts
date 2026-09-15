import type { CSSProperties } from "react";

export const CONSENT_BUTTON_CLASS =
  "inline-flex min-h-[42px] items-center justify-center rounded-xl px-4 text-[13.5px] font-semibold transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2";

export const primaryButtonStyle: CSSProperties = {
  backgroundColor: "var(--color-accent-primary)",
  color: "var(--color-btn-primary-text)",
  outlineColor: "var(--color-text-primary)",
};

export const secondaryButtonStyle: CSSProperties = {
  backgroundColor: "var(--color-btn-secondary-bg)",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-btn-secondary-border)",
  outlineColor: "var(--color-text-primary)",
};
