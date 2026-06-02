import { apiFetch, ApiError } from "@/lib/fetch/serverFetch";
import type { BlogPost } from "@/features/blog/types";
import { cleanExcerpt } from "@/features/blog/types";

export type { BlogPost, BlogAuthor, BlogFeaturedImage } from "@/features/blog/types";
export { resolveAuthorName, resolveAuthorAvatar } from "@/features/blog/types";

/** Normalize a post for display — decodes WordPress entities in the excerpt. */
function normalizePost(post: BlogPost): BlogPost {
  return { ...post, excerpt: cleanExcerpt(post.excerpt) };
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
    const data = await apiFetch<PostsResponse>(`/blog?${params}`, {
      revalidate: REVALIDATE,
      tags: ["blog:posts"],
    });
    return { ...data, posts: (data.posts ?? []).map(normalizePost) };
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
    return normalizePost(data.post);
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

