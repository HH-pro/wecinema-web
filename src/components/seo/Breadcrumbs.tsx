import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_ORIGIN } from "@/lib/seo";

export interface Crumb {
  name: string;
  /** Absolute path (e.g. "/category/action"). Omit on the current/last item. */
  href?: string;
}

/**
 * Accessible breadcrumb trail + BreadcrumbList structured data.
 *
 * Renders BOTH the visible <nav> (helps users + on-page internal links) and the
 * JSON-LD BreadcrumbList Google uses to show the breadcrumb path in search
 * results instead of a raw URL. Pass the trail from Home → … → current page;
 * the last item is treated as the current page (no link).
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const full: Crumb[] = items[0]?.href === "/" ? items : [{ name: "Home", href: "/" }, ...items];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: full.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            ...(c.href ? { item: `${SITE_ORIGIN}${c.href}` } : {}),
          })),
        }}
      />
      <nav
        aria-label="Breadcrumb"
        style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}
      >
        <ol style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
          {full.map((c, i) => {
            const last = i === full.length - 1;
            return (
              <li key={`${c.name}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    style={{ color: "var(--color-text-tertiary)", textDecoration: "none" }}
                    className="hover:!underline"
                  >
                    {c.name}
                  </Link>
                ) : (
                  <span aria-current="page" style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                    {c.name}
                  </span>
                )}
                {!last && <span aria-hidden style={{ opacity: 0.5 }}>/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
