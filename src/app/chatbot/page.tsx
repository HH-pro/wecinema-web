import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import ChatbotContent from "./ChatbotContent";

export const metadata: Metadata = {
  title: "WeCinema AI — Ask Anything About the Platform",
  description: "Chat with the WeCinema AI assistant for instant answers about uploads, marketplace, HypeMode, payments, and more.",
  alternates: { canonical: "/chatbot" },
};

export default function ChatbotPage() {
  return (
    <Layout>
      <ChatbotContent />
    </Layout>
  );
}
