import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { apiFetch } from "@/lib/fetch/serverFetch";
import type { FullUser } from "@/types";
import { OG, SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { UserProfileClient } from "@/features/profile/components/UserProfileClient";

const SITE = SITE_ORIGIN;

const PROFILE_FALLBACK_TITLE = "Creator Profile | WeCinema";
const PROFILE_FALLBACK_DESCRIPTION =
  "View filmmaker profiles, uploaded films, scripts, and creative portfolios on WeCinema.";

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
    return {
      title: { absolute: PROFILE_FALLBACK_TITLE },
      description: PROFILE_FALLBACK_DESCRIPTION,
    };
  }

  const title = `${user.username}'s Profile | WeCinema`;
  const description = user.bio
    ? user.bio.slice(0, 155)
    : PROFILE_FALLBACK_DESCRIPTION;
  const image = user.avatar ?? OG.default;

  return {
    title: { absolute: title },
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

  let user: FullUser | null = null;
  try {
    user = await apiFetch<FullUser>(`/user/${id}`, { revalidate: 60 });
  } catch {
    // Profile renders client-side regardless; schema is best-effort.
  }

  return (
    <Layout>
      {user && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: user.username,
              url: `${SITE}/user/${id}`,
              ...(user.bio ? { description: user.bio.slice(0, 300) } : {}),
              ...(user.avatar ? { image: user.avatar } : {}),
              worksFor: { "@type": "Organization", name: "WeCinema", url: SITE },
            },
          }}
        />
      )}
      <UserProfileClient userId={id} />
    </Layout>
  );
}
