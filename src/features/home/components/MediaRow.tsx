import type { ReactNode } from "react";

interface MediaRowProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * YouTube-style video grid: 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export function MediaRow({ title, icon, children }: MediaRowProps) {
  return (
    <section style={{ padding: "20px var(--space-section-x) 28px" }}>
      {title && (
        <h2
          style={{
            margin: "0 0 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "clamp(1.15rem, 2.2vw, 1.45rem)",
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          {icon}
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {children}
      </div>
    </section>
  );
}
