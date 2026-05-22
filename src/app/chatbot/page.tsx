import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { OG } from "@/lib/seo";
import ChatbotContent from "./ChatbotContent";

const CHATBOT_TITLE = "WeCinema AI – Built for Film";
const CHATBOT_DESCRIPTION =
  "Use WeCinema AI for script ideas, story development, filmmaking inspiration, and creative assistance.";

export const metadata: Metadata = {
  title: { absolute: CHATBOT_TITLE },
  description: CHATBOT_DESCRIPTION,
  alternates: { canonical: "/chatbot" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: CHATBOT_TITLE,
    description: CHATBOT_DESCRIPTION,
    images: [{ url: OG.chatbot, width: 1200, height: 630, alt: "WeCinema AI Assistant" }],
  },
  twitter: {
    card: "summary_large_image",
    title: CHATBOT_TITLE,
    description: CHATBOT_DESCRIPTION,
    images: [OG.chatbot],
  },
};

export default function ChatbotPage() {
  return (
    <Layout>
      <ChatbotContent />
    </Layout>
  );
}
