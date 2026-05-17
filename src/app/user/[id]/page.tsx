import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { apiFetch } from "@/lib/fetch/serverFetch";
import type { FullUser } from "@/types";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import { UserProfileClient } from "@/features/profile/components/UserProfileClient";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let user: FullUser | null = null;
  try {
    user = await apiFetch<FullUser>(`/user/${id}`, { revalidate: 60 });
  } catch {
    // graceful fallback
  }

  if (!user) {
    return { title: "Profile | WeCinema" };
  }

  const title = `${user.username}'s Profile | WeCinema`;
  const description = user.bio
    ? user.bio.slice(0, 155)
    : `View ${user.username}'s profile on WeCinema.`;
  const image = user.avatar ?? OG.default;

  return {
    title,
    description,
    alternates: { canonical: `/user/${id}` },
    openGraph: {
      type: "profile",
      siteName: "WeCinema",
      title,
      description,
      url: `${SITE}/user/${id}`,
      images: [{ url: image, width: 400, height: 400, alt: user.username }],
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Layout>
      <UserProfileClient userId={id} />
    </Layout>
  );
}
