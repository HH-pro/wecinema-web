import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { LikedClient } from "@/features/profile/components/LikedClient";

export const metadata: Metadata = {
  title: "Liked Videos | WeCinema",
  robots: { index: false },
};

export default async function LikedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Layout>
      <LikedClient userId={id} />
    </Layout>
  );
}
