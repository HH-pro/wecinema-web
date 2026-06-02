import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Login to WeCinema";
const DESCRIPTION = "Access your WeCinema account to manage films, scripts, marketplace listings, and creator tools.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/login`,
    images: [{ url: OG.login, width: 1725, height: 912, alt: "Login to WeCinema" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.login],
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
