import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { clientEnv } from "@/config/env";
import { getBlogPosts, getBlogCategories, resolveAuthorName, resolveAuthorAvatar } from "@/features/blog/api/blogQueries";
import type { BlogPost } from "@/features/blog/api/blogQueries";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: "Blog — Filmmaking Insights & Platform Updates",
  description:
    "Explore the Wecinema blog for filmmaking insights, platform tutorials, creator stories, and the latest updates from the WeCinema team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: "Wecinema Blog — Insights, Tutorials & Film Industry Updates",
    description:
      "Explore the Wecinema blog for filmmaking insights, platform tutorials, creator stories, and the latest updates from the WeCinema team.",
    url: `${SITE}/blog`,
    images: [{ url: `${SITE}/seo/Wecinema-Blog.webp`, width: 1200, height: 630, alt: "Wecinema Blog" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: "Wecinema Blog",
    description: "Filmmaking insights, platform tutorials, and creator stories.",
    images: [`${SITE}/seo/Wecinema-Blog.webp`],
  },
};

export const revalidate = 120;

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function BlogCard({ post, featured }: { post: BlogPost; featured?: boolean }) {
  const author     = resolveAuthorName(post.author);
  const avatar     = resolveAuthorAvatar(post.author);
  const imageUrl   = post.featuredImage?.url;
  const imageAlt   = post.featuredImage?.alt ?? post.title;

  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{ textDecoration: "none" }}
      className={`group block rounded-2xl overflow-hidden border border-[var(--color-border-secondary)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-accent-primary)] hover:-translate-y-1 transition-all duration-200 ${featured ? "md:grid md:grid-cols-2" : ""}`}
    >
      {/* Image */}
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

      {/* Body */}
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

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp       = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;

  const [{ posts, total }, categories] = await Promise.all([
    getBlogPosts({ category }),
    getBlogCategories(),
  ]);

  const featured = posts[0];
  const rest     = posts.slice(1);

  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Wecinema Blog",
          description: "Filmmaking insights, platform tutorials, and creator stories.",
          url: `${SITE}/blog`,
          publisher: { "@type": "Organization", name: "Wecinema", url: `${SITE}/` },
        }}
      />

      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-primary)" }}>
        {/* Hero */}
        <div style={{
          position: "relative", overflow: "hidden", padding: "64px 24px",
          textAlign: "center", borderBottom: "1px solid var(--color-divider)",
          background: "linear-gradient(to bottom, color-mix(in srgb, var(--color-accent-primary) 5%, transparent), transparent)",
        }}>
          <h1 style={{ margin: "0 0 10px", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}>
            Wecinema <span style={{ color: "var(--color-accent-primary)" }}>Blog</span>
          </h1>
          <p style={{ margin: 0, fontSize: 17, color: "var(--color-text-secondary)", maxWidth: 480, marginInline: "auto" }}>
            Insights, tutorials, and updates from the Wecinema team
          </p>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 32 }}>
          {/* Main */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Category filter */}
            {categories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                <Link
                  href="/blog"
                  style={{
                    padding: "5px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                    textDecoration: "none",
                    backgroundColor: !category ? "color-mix(in srgb, var(--color-accent-primary) 15%, transparent)" : "var(--color-bg-elevated)",
                    color: !category ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                    border: !category ? "1px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent)" : "1px solid var(--color-border-secondary)",
                  }}
                >
                  All
                </Link>
                {categories.map(cat => (
                  <Link
                    key={cat}
                    href={`/blog?category=${encodeURIComponent(cat)}`}
                    style={{
                      padding: "5px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                      textDecoration: "none",
                      backgroundColor: category === cat ? "color-mix(in srgb, var(--color-accent-primary) 15%, transparent)" : "var(--color-bg-elevated)",
                      color: category === cat ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                      border: category === cat ? "1px solid color-mix(in srgb, var(--color-accent-primary) 30%, transparent)" : "1px solid var(--color-border-secondary)",
                    }}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}

            {posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--color-text-tertiary)" }}>
                <p style={{ fontSize: 18, margin: 0 }}>No posts found</p>
                {category && (
                  <Link href="/blog" style={{ marginTop: 12, display: "inline-block", fontSize: 14, color: "var(--color-accent-primary)" }}>
                    Clear filter
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Featured */}
                {featured && (
                  <div style={{ marginBottom: 20 }}>
                    <BlogCard post={featured} featured />
                  </div>
                )}
                {/* Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 16,
                }}>
                  {rest.map(post => (
                    <BlogCard key={post._id} post={post} />
                  ))}
                </div>
                <p style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "var(--color-text-tertiary)" }}>
                  Showing {posts.length} of {total} posts
                </p>
              </>
            )}
          </main>

          {/* Sidebar — hidden on narrow screens via grid */}
          {categories.length > 0 && (
            <aside style={{ width: 220, flexShrink: 0 }} className="hidden lg:block">
              <div style={{
                backgroundColor: "var(--color-bg-elevated)", borderRadius: 16,
                border: "1px solid var(--color-border-secondary)", padding: "18px 16px",
              }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Categories
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  {categories.map(cat => (
                    <li key={cat}>
                      <Link
                        href={`/blog?category=${encodeURIComponent(cat)}`}
                        style={{
                          display: "block", padding: "7px 10px", borderRadius: 10,
                          fontSize: 13, textDecoration: "none", fontWeight: 500,
                          color: category === cat ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                          backgroundColor: category === cat ? "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" : "transparent",
                          transition: "background-color 0.12s",
                        }}
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Layout>
  );
}
