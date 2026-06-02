export interface BlogAuthor {
  _id: string;
  username?: string;
  avatar?: string;
}

export interface BlogFeaturedImage {
  url?: string;
  key?: string;
  alt?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category: string;
  tags: string[];
  author: BlogAuthor | string;
  views?: number;
  likes?: string[];
  readTime?: number;
  featuredImage?: BlogFeaturedImage;
  publishedAt?: string;
  createdAt: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
};

/** Decode HTML entities (e.g. `&hellip;`, `&#8217;`) into plain characters. */
export function decodeHtmlEntities(input?: string): string {
  if (!input) return "";
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

/**
 * Clean a WordPress excerpt for display: decode HTML entities and collapse the
 * trailing "read more" marker (e.g. `[…]` / `[&hellip;]` / `[...]`) into a
 * single ellipsis so cards don't show literal `[&hellip;]`.
 */
export function cleanExcerpt(input?: string): string {
  if (!input) return "";
  return decodeHtmlEntities(input)
    .replace(/\s*\[\s*(?:…|\.{3})\s*\]\s*$/u, "…")
    .trim();
}

export function resolveAuthorName(author: BlogPost["author"]): string {
  if (!author) return "Wecinema";
  if (typeof author === "string") return "Wecinema";
  return author.username ?? "Wecinema";
}

export function resolveAuthorAvatar(author: BlogPost["author"]): string | undefined {
  if (!author || typeof author === "string") return undefined;
  return author.avatar;
}
