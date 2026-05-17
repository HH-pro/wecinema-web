import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { BookmarksClient } from "@/features/profile/components/BookmarksClient";

export const metadata: Metadata = {
  title: "Bookmarks | WeCinema",
  robots: { index: false },
};

export default async function BookmarksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Layout>
      <BookmarksClient userId={id} />
    </Layout>
  );
}
