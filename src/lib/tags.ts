/**
 * Tags & hashtags, client side.
 *
 * Mirrors wecinema-backend/src/utils/hashtags.js — the limits and the slug
 * rules must match, or the upload form will accept a tag the API then rewrites
 * under the creator's feet. The server normalises everything it stores; this
 * file exists so the form can show the same result before it saves.
 */

export const TAG_MAX_LENGTH = 30;
export const TAG_MIN_LENGTH = 2;
export const MAX_TAGS = 20;
export const TAGS_MAX_TOTAL_CHARS = 500;

const SLUG_STRIP = /[^\p{L}\p{N}_]+/gu;
const HASHTAG_IN_TEXT = /(?:^|[\s([{,.;:!?"'])#([\p{L}\p{N}_]{2,30})/gu;

/** Canonical lookup key — what /tags/:slug resolves and what dedupes a list. */
export function slugifyTag(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(SLUG_STRIP, "")
    .toLowerCase()
    .slice(0, TAG_MAX_LENGTH);
}

/** Display form: no leading '#', no runs of whitespace, no markup characters. */
export function cleanTag(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}_ \-&']+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TAG_MAX_LENGTH)
    .trim();
}

/** A tag renders as #hashtag only when it is a single token — as on TikTok. */
export function isHashtagShaped(tag: string): boolean {
  return !/[\s\-&']/.test(tag);
}

/** "#SciFi" for one-word tags, "Sci Fi" for the rest. */
export function displayTag(tag: string): string {
  return isHashtagShaped(tag) ? `#${tag}` : tag;
}

/** Characters left in the 500-char budget the API enforces. */
export function tagsCharsUsed(tags: string[]): number {
  return tags.reduce((n, t) => n + t.length + 1, 0);
}

export interface AddTagResult {
  tags: string[];
  /** Why the tag was not added — null when it was. */
  rejected: "empty" | "too-short" | "duplicate" | "max-tags" | "no-room" | null;
}

/**
 * Append one tag to a list under the same rules the server applies, so the
 * form can explain a rejection instead of silently dropping it.
 */
export function addTag(tags: string[], raw: string): AddTagResult {
  const display = cleanTag(raw);
  const slug = slugifyTag(display);

  if (!display) return { tags, rejected: "empty" };
  if (slug.length < TAG_MIN_LENGTH) return { tags, rejected: "too-short" };
  if (tags.some((t) => slugifyTag(t) === slug)) return { tags, rejected: "duplicate" };
  if (tags.length >= MAX_TAGS) return { tags, rejected: "max-tags" };
  if (tagsCharsUsed(tags) + display.length + 1 > TAGS_MAX_TOTAL_CHARS) {
    return { tags, rejected: "no-room" };
  }

  return { tags: [...tags, display], rejected: null };
}

/** Split a pasted or typed run of text into candidate tags. */
export function splitTagInput(input: string): string[] {
  return input
    .split(/[,\n\r\t]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Hashtags written inline in a title or description. */
export function extractHashtags(text: string | undefined | null): string[] {
  if (!text) return [];
  return [...text.matchAll(HASHTAG_IN_TEXT)].flatMap((m) => (m[1] ? [m[1]] : []));
}

/**
 * The tags a video will end up with: the explicit list plus the hashtags in
 * its description, deduped by slug with the explicit spellings winning. The
 * server does this at publish; the form previews it.
 */
export function mergeTagsWithHashtags(
  tags: string[],
  title?: string,
  description?: string,
): string[] {
  let out: string[] = [];
  for (const candidate of [...tags, ...extractHashtags(title), ...extractHashtags(description)]) {
    out = addTag(out, candidate).tags;
  }
  return out;
}

export const tagHref = (tag: string) => `/tags/${encodeURIComponent(slugifyTag(tag))}`;

/**
 * Split text into plain runs and hashtag runs so a description can render its
 * hashtags as links. Returns the pieces in order; a hashtag piece carries the
 * word without the '#'.
 */
export type TextPiece =
  | { type: "text"; value: string }
  | { type: "hashtag"; value: string; raw: string };

export function splitHashtags(text: string): TextPiece[] {
  const pieces: TextPiece[] = [];
  let cursor = 0;

  for (const match of text.matchAll(HASHTAG_IN_TEXT)) {
    // The pattern eats the character before the '#' so "C#" isn't a tag; find
    // where the '#' itself starts so that character stays in the text run.
    const tag = match[1];
    if (!tag) continue;
    const hashAt = match.index! + match[0].indexOf("#");
    if (hashAt > cursor) pieces.push({ type: "text", value: text.slice(cursor, hashAt) });
    pieces.push({ type: "hashtag", value: tag, raw: `#${tag}` });
    cursor = hashAt + tag.length + 1;
  }

  if (cursor < text.length) pieces.push({ type: "text", value: text.slice(cursor) });
  return pieces;
}
