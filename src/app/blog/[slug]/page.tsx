import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { OG, SITE_ORIGIN } from "@/lib/seo";
import { getBlogPost, getBlogPosts, resolveAuthorName, resolveAuthorAvatar } from "@/features/blog/api/blogQueries";
import type { BlogPost } from "@/features/blog/api/blogQueries";
import { decodeHtmlEntities } from "@/features/blog/types";

const SITE = SITE_ORIGIN;

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

  const title       = decodeHtmlEntities(post.seoTitle ?? `${post.title} | Wecinema Blog`);
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
      images: [{ url: image, width: 1200, height: 630, alt: title }],
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
  const decodedTitle = decodeHtmlEntities(post.title);
  const imageAlt     = post.featuredImage?.alt ?? decodedTitle;
  const publishedAt  = post.publishedAt ?? post.createdAt;

  const related = (await getBlogPosts({ category: post.category })).posts
    .filter((p: BlogPost) => p.slug !== post.slug)
    .slice(0, 3);

  const shareUrl  = `${SITE}/blog/${post.slug}`;
  const shareText = encodeURIComponent(decodedTitle);

  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
            { "@type": "ListItem", position: 3, name: decodedTitle, item: shareUrl },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: decodedTitle,
          description: post.seoDescription ?? post.excerpt ?? "",
          ...(imageUrl ? { image: { "@type": "ImageObject", url: imageUrl, width: 1200, height: 630 } } : {}),
          author: {
            "@type": "Person",
            name: author,
            ...(avatar ? { image: avatar } : {}),
          },
          datePublished: publishedAt,
          dateModified: post.createdAt ?? publishedAt,
          publisher: {
            "@type": "Organization",
            name: "WeCinema",
            url: `${SITE}/`,
            logo: { "@type": "ImageObject", url: `${SITE}/seo/WeCinema.webp` },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
          keywords: post.tags?.join(", "),
          articleSection: post.category,
          inLanguage: "en-US",
          ...(post.readTime ? { timeRequired: `PT${post.readTime}M` } : {}),
          isPartOf: { "@type": "Blog", "@id": `${SITE}/blog`, name: "WeCinema Blog" },
        }}
      />

      <div className="blog-post-page">
        {/* Hero */}
        <header className="blog-post-hero">
          <div className="blog-post-container">
            <Link href="/blog" className="blog-post-back">
              <span aria-hidden>←</span> Back to Blog
            </Link>

            <Link
              href={`/blog?category=${encodeURIComponent(post.category)}`}
              className="blog-post-category"
            >
              {post.category}
            </Link>

            <h1 className="blog-post-title">{decodedTitle}</h1>

            {post.excerpt && (
              <p className="blog-post-excerpt">{post.excerpt}</p>
            )}

            <div className="blog-post-meta">
              <div className="blog-post-author">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={author}
                    width={44}
                    height={44}
                    className="blog-post-avatar"
                  />
                ) : (
                  <div className="blog-post-avatar blog-post-avatar--fallback">
                    {author[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="blog-post-author-name">{author}</p>
                  <p className="blog-post-meta-line">
                    <span>{formatDate(publishedAt)}</span>
                    {post.readTime ? <span aria-hidden>·</span> : null}
                    {post.readTime ? <span>{post.readTime} min read</span> : null}
                    {post.views ? <span aria-hidden>·</span> : null}
                    {post.views ? <span>{post.views.toLocaleString()} views</span> : null}
                  </p>
                </div>
              </div>

              <div className="blog-post-share" aria-label="Share this article">
                <a
                  className="blog-post-share-btn"
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Twitter / X"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  className="blog-post-share-btn"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12" />
                  </svg>
                </a>
                <a
                  className="blog-post-share-btn"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* Featured image */}
        {imageUrl && (
          <div className="blog-post-container">
            <div className="blog-post-featured">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1100px) 90vw, 880px"
                priority
              />
            </div>
          </div>
        )}

        {/* Body */}
        <article className="blog-post-container blog-post-article">
          {post.content ? (
            <SafeHtml html={post.content} className="prose-wecinema" />
          ) : (
            post.excerpt && (
              <p className="blog-post-fallback">{post.excerpt}</p>
            )
          )}

          {post.tags.length > 0 && (
            <div className="blog-post-tags">
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="blog-post-tag"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Author card */}
          <aside className="blog-post-author-card">
            {avatar ? (
              <Image
                src={avatar}
                alt={author}
                width={64}
                height={64}
                className="blog-post-author-card-avatar"
              />
            ) : (
              <div className="blog-post-author-card-avatar blog-post-avatar--fallback">
                {author[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="blog-post-author-card-label">Written by</p>
              <p className="blog-post-author-card-name">{author}</p>
              <p className="blog-post-author-card-bio">
                Contributing writer at Wecinema, sharing filmmaking insights and platform updates.
              </p>
            </div>
          </aside>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="blog-post-related">
            <div className="blog-post-container">
              <div className="blog-post-related-header">
                <h2>Continue reading</h2>
                <Link href="/blog" className="blog-post-related-link">
                  View all posts →
                </Link>
              </div>
              <div className="blog-post-related-grid">
                {related.map((p: BlogPost) => {
                  const pImg = p.featuredImage?.url;
                  return (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-post-related-card">
                      <div className="blog-post-related-thumb">
                        {pImg ? (
                          <Image
                            src={pImg}
                            alt={p.featuredImage?.alt ?? p.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="blog-post-related-thumb-placeholder">
                            <span>{p.category}</span>
                          </div>
                        )}
                      </div>
                      <div className="blog-post-related-body">
                        <span className="blog-post-related-category">{p.category}</span>
                        <h3 className="line-clamp-2">{p.title}</h3>
                        {p.excerpt && <p className="line-clamp-2">{p.excerpt}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
