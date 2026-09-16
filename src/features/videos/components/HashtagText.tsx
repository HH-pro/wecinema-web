"use client";

import Link from "next/link";
import { displayTag, splitHashtags, tagHref } from "@/lib/tags";

/**
 * A description with its #hashtags turned into links, the way YouTube and
 * TikTok render captions. Everything else is emitted verbatim — no markdown,
 * no HTML — so creator text can never inject markup.
 */
export function HashtagText({
  text,
  color = "var(--color-accent-primary)",
}: {
  text: string;
  color?: string;
}) {
  const pieces = splitHashtags(text);

  return (
    <>
      {pieces.map((piece, i) =>
        piece.type === "text" ? (
          <span key={i}>{piece.value}</span>
        ) : (
          <Link
            key={i}
            href={tagHref(piece.value)}
            // Descriptions live inside clickable cards in some views; stop the
            // tap from also triggering the card's own navigation.
            onClick={(e) => e.stopPropagation()}
            style={{ color, fontWeight: 600, textDecoration: "none" }}
          >
            {piece.raw}
          </Link>
        ),
      )}
    </>
  );
}

/**
 * The chip row under a video. One-word tags read as #hashtags, multi-word ones
 * as plain chips; both link to the same tag feed.
 */
export function HashtagChips({
  tags,
  max,
  size = "md",
}: {
  tags: string[];
  /** Show at most this many, with a "+N" chip for the rest. */
  max?: number;
  size?: "sm" | "md";
}) {
  if (!tags.length) return null;

  const shown = max ? tags.slice(0, max) : tags;
  const hidden = tags.length - shown.length;
  const pad = size === "sm" ? "3px 9px" : "5px 12px";
  const font = size === "sm" ? 11.5 : 13;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {shown.map((tag) => (
        <Link
          key={tag}
          href={tagHref(tag)}
          style={{
            padding: pad,
            fontSize: font,
            fontWeight: 600,
            borderRadius: 9999,
            border: "1px solid var(--color-border-secondary)",
            backgroundColor: "var(--color-bg-elevated)",
            color: "var(--color-accent-primary)",
            textDecoration: "none",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {displayTag(tag)}
        </Link>
      ))}
      {hidden > 0 && (
        <span
          style={{
            padding: pad,
            fontSize: font,
            fontWeight: 600,
            borderRadius: 9999,
            border: "1px solid var(--color-border-secondary)",
            color: "var(--color-text-tertiary)",
            lineHeight: 1.4,
          }}
        >
          +{hidden}
        </span>
      )}
    </div>
  );
}
