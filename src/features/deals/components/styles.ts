import type { CSSProperties } from "react";

/** Amber-outlined secondary button, used for the non-primary deal actions in the mockups. */
export const accentOutline: CSSProperties = {
  borderColor: "var(--color-accent-primary)",
  color: "var(--color-accent-primary)",
  backgroundColor: "transparent",
};

/** Faint amber glow in the top-right corner of deal cards. */
export const cardGlow: CSSProperties = {
  backgroundImage:
    "radial-gradient(90% 120% at 100% 0%, color-mix(in srgb, var(--color-accent-primary) 8%, transparent), transparent 60%)",
};
