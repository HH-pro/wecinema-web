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

export function resolveAuthorName(author: BlogPost["author"]): string {
  if (!author) return "Wecinema";
  if (typeof author === "string") return "Wecinema";
  return author.username ?? "Wecinema";
}

export function resolveAuthorAvatar(author: BlogPost["author"]): string | undefined {
  if (!author || typeof author === "string") return undefined;
  return author.avatar;
}
