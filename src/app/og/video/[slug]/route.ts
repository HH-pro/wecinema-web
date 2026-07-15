import { getVideoBySlug } from "@/features/videos/api/videoQueries";
import { OG } from "@/lib/seo";

/**
 * Stable Open Graph image proxy for a video.
 *
 * The backend injects a *pre-signed* S3 URL into `video.thumbnail` that expires
 * after a few hours (`X-Amz-Expires`). Putting that URL straight into an
 * `og:image` / schema `thumbnailUrl` means social share cards and Google's
 * cached preview 403 once the signature lapses.
 *
 * This route exposes a signature-free, cacheable public URL
 * (`/og/video/<slug>`) and resolves it to the *current* thumbnail server-side
 * on every crawl, so the public tag never goes stale. Streaming the bytes (vs a
 * redirect) keeps it compatible with crawlers that don't follow image
 * redirects. Falls back to the static branded OG image when no thumbnail is
 * available or the upstream fetch fails.
 */
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const video = await getVideoBySlug(slug);
    const src = video?.thumbnail?.trim();

    if (src) {
      const upstream = await fetch(src, { cache: "no-store" });
      if (upstream.ok && upstream.body) {
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "image/webp",
            // Cache the resolved image at the CDN so we don't re-proxy on every
            // crawl; comfortably shorter than the S3 signature lifetime.
            "Cache-Control":
              "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
          },
        });
      }
    }
  } catch {
    // fall through to the static branded fallback
  }

  // 302 to the always-valid static OG image (absolute URL required).
  return Response.redirect(OG.video, 302);
}
