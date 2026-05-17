import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import { getBlogPost, resolveAuthorName, resolveAuthorAvatar } from "@/features/blog/api/blogQueries";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const title       = post.seoTitle ?? `${post.title} | Wecinema Blog`;
  const description = post.seoDescription ?? post.excerpt ?? "";
  const image       = post.ogImage ?? post.featuredImage?.url ?? OG.blog;
  const canonical   = `/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      siteName: "Wecinema",
      title,
      description,
      url: `${SITE}${canonical}`,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      locale: "en_US",
      publishedTime: post.publishedAt,
      authors: [resolveAuthorName(post.author)],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      site: "@wecinema",
      title,
      description,
      images: [image],
    },
  };
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const author       = resolveAuthorName(post.author);
  const avatar       = resolveAuthorAvatar(post.author);
  const imageUrl     = post.featuredImage?.url;
  const imageAlt     = post.featuredImage?.alt ?? post.title;
  const publishedAt  = post.publishedAt ?? post.createdAt;

  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.seoDescription ?? post.excerpt ?? "",
          ...(imageUrl ? { image: imageUrl } : {}),
          author: { "@type": "Person", name: author },
          datePublished: publishedAt,
          dateModified: post.createdAt,
          publisher: { "@type": "Organization", name: "Wecinema", url: `${SITE}/` },
          mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${post.slug}` },
        }}
      />

      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-primary)" }}>
        {/* Back */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 0" }}>
          <Link
            href="/blog"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", textDecoration: "none" }}
            className="hover:text-[var(--color-accent-primary)] transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>

        <article style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px 64px" }}>
          {/* Category */}
          <div style={{ marginBottom: 14 }}>
            <Link
              href={`/blog?category=${encodeURIComponent(post.category)}`}
              style={{
                display: "inline-block", padding: "3px 12px", borderRadius: 9999,
                fontSize: 12, fontWeight: 700, textDecoration: "none",
                backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 12%, transparent)",
                color: "var(--color-accent-primary)",
                border: "1px solid color-mix(in srgb, var(--color-accent-primary) 25%, transparent)",
              }}
            >
              {post.category}
            </Link>
          </div>

          {/* Title */}
          <h1 style={{
            margin: "0 0 18px", fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 900, fontFamily: "var(--font-heading)",
            color: "var(--color-text-primary)", lineHeight: 1.2,
          }}>
            {post.title}
          </h1>

          {/* Author + meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={author} width={36} height={36} className="rounded-full object-cover" style={{ width: 36, height: 36 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 9999, background: "var(--color-accent-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                {author[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{author}</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                {formatDate(publishedAt)}
                {post.readTime ? ` · ${post.readTime} min read` : ""}
                {post.views ? ` · ${post.views.toLocaleString()} views` : ""}
              </p>
            </div>
          </div>

          {/* Featured image */}
          {imageUrl && (
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
              <Image src={imageUrl} alt={imageAlt} fill className="object-cover" sizes="(max-width: 800px) 100vw, 800px" priority />
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  style={{
                    padding: "3px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 500,
                    textDecoration: "none", color: "var(--color-text-secondary)",
                    backgroundColor: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border-secondary)",
                  }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Content */}
          {post.content ? (
            <SafeHtml
              html={post.content}
              className="prose-wecinema"
              style={{
                fontSize: 16, lineHeight: 1.8,
                color: "var(--color-text-primary)",
              }}
            />
          ) : (
            post.excerpt && (
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--color-text-secondary)" }}>
                {post.excerpt}
              </p>
            )
          )}

          {/* Footer divider */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--color-divider)" }}>
            <Link
              href="/blog"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--color-accent-primary)", textDecoration: "none" }}
            >
              ← More from the Blog
            </Link>
          </div>
        </article>
      </div>
    </Layout>
  );
}
