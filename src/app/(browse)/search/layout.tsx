import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Search Films, Scripts & Creators | WeCinema" },
  description:
    "Search independent films, screenplays, filmmakers, actors, and creative projects on WeCinema.",
  alternates: { canonical: "/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
