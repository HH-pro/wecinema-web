import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DraftEditor } from "@/features/upload/components/DraftEditor";

export const metadata: Metadata = {
  title: { absolute: "Video details | WeCinema" },
  robots: { index: false, follow: false },
};

export default async function DraftEditorPage({ params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  if (!/^[0-9a-f]{24}$/i.test(draftId)) notFound();
  return <DraftEditor draftId={draftId} />;
}
