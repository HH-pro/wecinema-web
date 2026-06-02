"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  type BlogPost,
  resolveAuthorName,
  resolveAuthorAvatar,
} from "@/features/blog/types";

const LOAD_MORE_SIZE = 3;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BlogCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  const author   = resolveAuthorName(post.author);
  const avatar   = resolveAuthorAvatar(post.author);
  const imageUrl = post.featuredImage?.url;
  const imageAlt = post.featuredImage?.alt ?? post.title;

  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{ textDecoration: "none" }}
      className={`group block rounded-2xl overflow-hidden border border-[var(--color-border-secondary)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-accent-primary)] hover:-translate-y-1 transition-all duration-200 ${featured ? "md:grid md:grid-cols-2" : ""}`}
    >
      <div className={`relative overflow-hidden bg-[var(--color-bg-tertiary)] ${featured ? "min-h-[220px]" : "h-48"}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ fontSize: "4rem", fontWeight: 900, opacity: 0.08, color: "var(--color-accent-primary)" }}>
              {post.title[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <span style={{
          position: "absolute", top: 10, left: 10, padding: "3px 10px",
          borderRadius: 9999, fontSize: 11, fontWeight: 700,
          backgroundColor: "rgba(0,0,0,0.65)", color: "var(--color-accent-primary)",
          backdropFilter: "blur(4px)", border: "1px solid rgba(255,187,0,0.3)",
        }}>
          {post.category}
        </span>
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h2 style={{
            margin: "0 0 8px", fontSize: featured ? 18 : 15, fontWeight: 700,
            fontFamily: "var(--font-heading)", color: "var(--color-text-primary)",
            lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {post.title}
          </h2>
          {post.excerpt && (
            <p style={{
              margin: 0, fontSize: 13, color: "var(--color-text-secondary)",
              lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {post.excerpt}
            </p>
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={author} width={26} height={26} className="rounded-full object-cover" style={{ width: 26, height: 26 }} />
            ) : (
              <div style={{ width: 26, height: 26, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--color-accent-primary)" }}>
                {author[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{author}</span>
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {post.readTime && <span>{post.readTime}m read</span>}
            <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface BlogListProps {
  initialPosts: BlogPost[];
  initialTotal: number;
  category?: string;
}

export default function BlogList({ initialPosts, initialTotal, category }: BlogListProps) {
  const [posts, setPosts]     = useState<BlogPost[]>(initialPosts);
  const [total, setTotal]     = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

  const featured = posts[0];
  const rest     = posts.slice(1);
  const hasMore  = posts.length < total;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("skip",  String(posts.length));
      params.set("limit", String(LOAD_MORE_SIZE));
      if (category) params.set("category", category);

      const res = await fetch(`${API_BASE}/blog?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { posts: BlogPost[]; total: number };

      const incoming = Array.isArray(data.posts) ? data.posts : [];
      setPosts(prev => {
        const seen = new Set(prev.map(p => p._id));
        const merged = [...prev];
        for (const p of incoming) if (!seen.has(p._id)) merged.push(p);
        return merged;
      });
      if (typeof data.total === "number") setTotal(data.total);
    } catch (err) {
      console.error("[blog] load more failed", err);
      setError("Couldn't load more posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {featured && (
        <div style={{ marginBottom: 20 }}>
          <BlogCard post={featured} featured />
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {rest.map(post => (
          <BlogCard key={post._id} post={post} />
        ))}
      </div>

      {error && (
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--color-text-tertiary)" }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            style={{
              padding: "10px 28px",
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-heading)",
              color: "#000",
              backgroundColor: "var(--color-accent-primary)",
              border: "1px solid var(--color-accent-primary)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "transform 0.12s, opacity 0.12s",
            }}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        ) : null}
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>
          Showing {posts.length} of {total} posts
        </p>
      </div>
    </>
  );
}
