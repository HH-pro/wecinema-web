import Link from "next/link";
import { Hash } from "lucide-react";
import { displayTag, tagHref } from "@/lib/tags";
import type { TagSummary } from "@/features/videos/api/videoQueries";

/**
 * A horizontal rail of hashtags — the discovery entry point that makes tags
 * worth setting. `active` is the slug of the tag whose page we are already on,
 * which is highlighted rather than hidden so its position stays stable.
 */
export function TrendingTags({
  tags,
  active,
  heading = "Trending hashtags",
}: {
  tags: TagSummary[];
  active?: string;
  heading?: string;
}) {
  if (!tags.length) return null;

  return (
    <nav aria-label={heading}>
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          margin: "0 0 12px",
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-text-tertiary)",
        }}
      >
        <Hash size={13} aria-hidden />
        {heading}
      </h2>
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "thin",
        }}
      >
        {tags.map((t) => {
          const on = t.tag === active;
          return (
            <Link
              key={t.tag}
              href={tagHref(t.tag)}
              aria-current={on ? "page" : undefined}
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 6,
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                border: on
                  ? "1px solid var(--color-accent-primary)"
                  : "1px solid var(--color-border-secondary)",
                backgroundColor: on ? "var(--color-accent-primary)" : "var(--color-bg-elevated)",
                color: on ? "var(--color-btn-primary-text, #000)" : "var(--color-text-secondary)",
              }}
            >
              {displayTag(t.label || t.tag)}
              <span style={{ fontSize: 11, opacity: 0.65, fontWeight: 500 }}>{t.count}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
