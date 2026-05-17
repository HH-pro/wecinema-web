import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { OG } from "@/lib/seo";
import ChatbotContent from "./ChatbotContent";

export const metadata: Metadata = {
  title: "WeCinema AI — Ask Anything About the Platform",
  description: "Chat with the WeCinema AI assistant for instant answers about uploads, marketplace, HypeMode, payments, and more.",
  alternates: { canonical: "/chatbot" },
  openGraph: {
    type: "website",
    siteName: "WeCinema",
    title: "WeCinema AI Assistant",
    description: "Chat with the WeCinema AI assistant for instant answers about uploads, marketplace, HypeMode, payments, and more.",
    images: [{ url: OG.chatbot, width: 1200, height: 630, alt: "WeCinema AI Assistant" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WeCinema AI Assistant",
    description: "Chat with the WeCinema AI assistant for instant answers about uploads, marketplace, HypeMode, payments, and more.",
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
