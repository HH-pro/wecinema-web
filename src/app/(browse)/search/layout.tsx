import type { Metadata } from "next";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Search Films, Scripts & Creators | WeCinema";
const DESCRIPTION =
  "Search independent films, screenplays, filmmakers, actors, and creative projects on WeCinema.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/search" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/search`,
    images: [{ url: OG.search, width: 1536, height: 1024, alt: "Search on WeCinema" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.search],
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
