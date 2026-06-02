import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { OG, SITE_ORIGIN } from "@/lib/seo";

const TITLE = "Sign Up for WeCinema";
const DESCRIPTION = "Join WeCinema and start uploading films, selling scripts, and building your filmmaking career.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/signup`,
    images: [{ url: OG.signup, width: 1536, height: 1024, alt: "Sign Up for WeCinema" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.signup],
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
