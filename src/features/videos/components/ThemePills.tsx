import Link from "next/link";
import { THEMES } from "@/lib/constants";

export function ThemePills() {
  return (
    <nav
      aria-label="Browse by theme"
      className="hide-scrollbar"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "12px var(--space-section-x)",
        backgroundColor: "var(--color-nav-bg)",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      {THEMES.map((t) => (
        <Link
          key={t}
          href={`/themes/${t.toLowerCase()}`}
          style={{
            flexShrink: 0,
            whiteSpace: "nowrap",
            padding: "8px 16px",
            borderRadius: 9999,
            border: "1px solid var(--color-border-secondary)",
            backgroundColor: "var(--color-bg-elevated)",
            color: "var(--color-text-secondary)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            transition: "all 0.15s",
          }}
          className="hover:!bg-[var(--color-accent-primary)] hover:!text-black hover:!border-transparent"
        >
          {t}
        </Link>
      ))}
    </nav>
  );
}
