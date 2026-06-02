import type { Metadata } from "next";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import { getBlogPosts, getBlogCategories } from "@/features/blog/api/blogQueries";
import { decodeHtmlEntities } from "@/features/blog/types";
import BlogList from "@/features/blog/components/BlogList";

const INITIAL_PAGE_SIZE = 13;

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

const BLOG_TITLE = "WeCinema Blog – Film News & Creator Tips";
const BLOG_DESCRIPTION =
  "Read filmmaking advice, industry updates, creator success stories, and movie discussions.";

export const metadata: Metadata = {
  title: { absolute: BLOG_TITLE },
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: `${SITE}/blog`,
    images: [{ url: OG.blog, width: 1200, height: 630, alt: "Wecinema Blog" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    images: [OG.blog],
  },
};

export const revalidate = 120;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp       = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;

  // The (WordPress) blog backend can't reliably filter by category *name*, so
  // when a category is selected we fetch the full set and filter here instead.
  // With no filter we keep normal server pagination (13 + load-more of 3).
  const FILTER_FETCH_LIMIT = 100;
  const [listResult, categories] = await Promise.all([
    getBlogPosts({ limit: category ? FILTER_FETCH_LIMIT : INITIAL_PAGE_SIZE }),
    getBlogCategories(),
  ]);

  const posts = category
    ? listResult.posts.filter(p => p.category === category)
    : listResult.posts;
  const total = category ? posts.length : listResult.total;

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

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
          {/* Main */}
          <main style={{ minWidth: 0 }}>
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
                    {decodeHtmlEntities(cat)}
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
              <BlogList initialPosts={posts} initialTotal={total} />
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
