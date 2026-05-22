import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Screenplays & Scripts Marketplace | WeCinema" },
  description:
    "Browse original scripts and screenplays from independent writers and filmmakers.",
  alternates: { canonical: "/scripts" },
};

export default function ScriptsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
