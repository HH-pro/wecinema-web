import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Align = "start" | "center" | "between";

interface SectionHeaderProps {
  /** Small uppercase label above the heading. Accent color — use sparingly. */
  eyebrow?: string;
  title: ReactNode;
  /** Heading element id, for the section's `aria-labelledby`. */
  titleId?: string;
  subtitle?: ReactNode;
  /** Minimal text link (no border/box), e.g. "View all". */
  link?: { href: string; label: string };
  align?: Align;
  as?: "h2" | "h3";
}

/**
 * The one canonical section header — a single editorial type treatment that
 * replaces the divergent eyebrow / heading / "View all" styles each section
 * used to hand-roll. Server component.
 */
export function SectionHeader({
  eyebrow,
  title,
  titleId,
  subtitle,
  link,
  align = "start",
  as = "h2",
}: SectionHeaderProps) {
  const Heading = as;
  const centered = align === "center";

  const heading = (
    <div style={{ minWidth: 0 }}>
      {eyebrow && (
        <span
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-accent-primary)",
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </span>
      )}
      <Heading
        id={titleId}
        style={{
          margin: 0,
          fontFamily: "var(--font-heading)",
          fontSize: as === "h3" ? "clamp(1.2rem, 2.4vw, 1.6rem)" : "clamp(1.6rem, 3.4vw, 2.4rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </Heading>
      {subtitle && (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--color-text-secondary)",
            maxWidth: 560,
            ...(centered ? { marginLeft: "auto", marginRight: "auto" } : {}),
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );

  const viewAll = link && (
    <Link
      href={link.href}
      className="hover:underline"
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 13,
        fontWeight: 600,
        color: "var(--color-accent-primary)",
        textDecoration: "none",
        transition: "opacity var(--transition-fast)",
      }}
    >
      {link.label} <ArrowRight size={14} aria-hidden />
    </Link>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: align === "between" ? "baseline" : "flex-end",
        justifyContent: align === "between" ? "space-between" : centered ? "center" : "flex-start",
        gap: 16,
        marginBottom: 22,
        textAlign: centered ? "center" : "left",
        flexWrap: "wrap",
      }}
    >
      {heading}
      {viewAll}
    </div>
  );
}
