import type { CSSProperties, ReactNode } from "react";

type Spacing = "default" | "compact" | "none";
type MaxWidth = number | "content" | "prose" | "none";

interface SectionProps {
  children: ReactNode;
  /** Vertical rhythm. `compact` for content rows, `default` for editorial blocks. */
  spacing?: Spacing;
  /** Constrain + center inner content. */
  maxWidth?: MaxWidth;
  /** Top hairline divider — replaces ad-hoc `borderTop` usage. */
  divider?: boolean;
  /** Faint elevated surface for "panel" sections. */
  surface?: "none" | "elevated";
  id?: string;
  ariaLabelledby?: string;
  ariaLabel?: string;
  /** Escape hatch — merged last so callers can override during migration. */
  style?: CSSProperties;
}

const PAD_Y: Record<Spacing, string> = {
  default: "var(--space-section-y)",
  compact: "clamp(24px, 3vw, 32px)",
  none: "0",
};

function resolveMaxWidth(m: MaxWidth): string | undefined {
  if (m === "none") return undefined;
  if (m === "content") return "var(--max-content)";
  if (m === "prose") return "var(--max-prose)";
  return `${m}px`;
}

/**
 * Shared section wrapper — gives the homepage one consistent vertical rhythm,
 * horizontal gutter, and optional centered max-width, so sections stop
 * hand-rolling their own spacing. Server component (no client JS).
 */
export function Section({
  children,
  spacing = "default",
  maxWidth = "none",
  divider = false,
  surface = "none",
  id,
  ariaLabelledby,
  ariaLabel,
  style,
}: SectionProps) {
  const maxW = resolveMaxWidth(maxWidth);

  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
      style={{
        padding: `${PAD_Y[spacing]} var(--space-section-x)`,
        ...(divider ? { borderTop: "1px solid var(--color-divider)" } : {}),
        ...(surface === "elevated"
          ? { backgroundColor: "var(--color-bg-secondary)" }
          : {}),
        ...style,
      }}
    >
      <div style={maxW ? { maxWidth: maxW, margin: "0 auto" } : undefined}>
        {children}
      </div>
    </section>
  );
}
