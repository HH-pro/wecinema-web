import type { Metadata } from "next";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Upload Your Script | WeCinema";
const DESCRIPTION =
  "Publish your screenplay or story idea and connect with filmmakers, producers, and collaborators.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/upload/script" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/upload/script`,
    images: [{ url: OG.scriptUpload, width: 1536, height: 1024, alt: "Upload Your Script on WeCinema" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.scriptUpload],
  },
};

export default function UploadScriptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
