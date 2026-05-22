import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Upload Your Film | WeCinema" },
  description:
    "Upload and stream your film on WeCinema with creator tools, analytics, and audience discovery features.",
  alternates: { canonical: "/upload/video" },
};

export default function UploadVideoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
