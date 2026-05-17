import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import SupportContent from "./SupportContent";
import { FAQS } from "./data";

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;
const TITLE = "Customer Support — WeCinema Help Center & FAQs";
const DESCRIPTION = "Need help with WeCinema? Browse our FAQs, contact support via email or WhatsApp, and get answers about uploads, marketplace orders, HypeMode, and payments.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["wecinema support", "wecinema help", "wecinema faq", "customer care", "video marketplace help", "wecinema contact", "hypemode help"],
  alternates: { canonical: "/support" },
  openGraph: {
    type: "website",
    siteName: "Wecinema",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/support`,
    images: [{ url: OG.support, width: 1200, height: 630, alt: "Wecinema – Movies & Scripts Platform" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@wecinema",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG.support],
  },
};

export default function SupportPage() {
  return (
    <Layout>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE}/support`,
          publisher: {
            "@type": "Organization",
            name: "Wecinema",
            url: `${SITE}/`,
            contactPoint: {
              "@type": "ContactPoint",
              email: "support@wecinema.co",
              contactType: "customer support",
              availableLanguage: "English",
              hoursAvailable: "Mo-Fr 09:00-18:00",
            },
          },
        }}
      />
      <SupportContent />
    </Layout>
  );
}
