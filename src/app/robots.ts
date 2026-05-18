import type { MetadataRoute } from "next";
import { clientEnv } from "@/config/env";

const raw = clientEnv.NEXT_PUBLIC_SITE_URL ?? "";
const SITE = /localhost/i.test(raw) ? "https://wecinema.co" : raw.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
