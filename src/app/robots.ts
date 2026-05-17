import type { MetadataRoute } from "next";
import { clientEnv } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/"],
      },
    ],
    sitemap: `${clientEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
    host: clientEnv.NEXT_PUBLIC_SITE_URL,
  };
}
