import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { getVideoBySlug } from "@/features/videos/api/videoQueries";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import { WatchClient } from "@/features/watch/components/WatchClient";

export const revalidate = 0;

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) {
    return { title: "Video Not Found" };
  }

  const title = `${video.title} | WeCinema`;
  const description = video.description ?? "Watch this video on WeCinema.";
  const image = video.thumbnail ?? OG.video;

  return {
    title,
    description,
    alternates: { canonical: `/watch/${slug}` },
    openGraph: {
      type: "video.other",
      siteName: "WeCinema",
      title,
      description,
      url: `${SITE}/watch/${slug}`,
      images: [{ url: image, width: 1200, height: 630, alt: video.title }],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) notFound();

  return (
    <Layout>
      <WatchClient video={video} />
    </Layout>
  );
}
