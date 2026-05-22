import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Upload Your Script | WeCinema" },
  description:
    "Publish your screenplay or story idea and connect with filmmakers, producers, and collaborators.",
  alternates: { canonical: "/upload/script" },
};

export default function UploadScriptLayout({ children }: { children: React.ReactNode }) {
  return children;
}
