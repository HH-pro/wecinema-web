import type { Metadata } from "next";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Screenplays & Scripts Marketplace | WeCinema";
const DESCRIPTION =
  "Browse original scripts and screenplays from independent writers and filmmakers.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/scripts" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/scripts`,
    images: [{ url: OG.scripts, width: 1536, height: 1024, alt: "WeCinema Scripts Marketplace" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.scripts],
  },
};

export default function ScriptsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
