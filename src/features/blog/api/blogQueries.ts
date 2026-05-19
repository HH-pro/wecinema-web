import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";

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

interface PostsResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  pages: number;
}

interface PostResponse {
  post: BlogPost;
}

const REVALIDATE = 120; // 2 minutes

export async function getBlogPosts(opts: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
} = {}): Promise<PostsResponse> {
  const params = new URLSearchParams();
  if (opts.page)     params.set("page",     String(opts.page));
  if (opts.limit)    params.set("limit",    String(opts.limit));
  if (opts.category) params.set("category", opts.category);
  if (opts.tag)      params.set("tag",      opts.tag);
  if (opts.search)   params.set("search",   opts.search);

  try {
    return await apiFetch<PostsResponse>(`/blog?${params}`, {
      revalidate: REVALIDATE,
      tags: ["blog:posts"],
    });
  } catch (err) {
    if (err instanceof ApiError) console.warn("[blog] list", err.status, err.statusText);
    else console.error("[blog] list", err);
    return { posts: [], total: 0, page: 1, pages: 0 };
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const data = await apiFetch<PostResponse>(`/blog/${encodeURIComponent(slug)}`, {
      revalidate: REVALIDATE,
      tags: [`blog:post:${slug}`],
    });
    return data.post;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    if (err instanceof ApiError) console.warn("[blog] post", err.status, err.statusText);
    else console.error("[blog] post", err);
    return null;
  }
}

export async function getBlogCategories(): Promise<string[]> {
  try {
    const data = await apiFetch<{ categories: string[] }>("/blog/categories", {
      revalidate: REVALIDATE,
      tags: ["blog:categories"],
    });
    return [...new Set(data.categories)];
  } catch {
    return [];
  }
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
