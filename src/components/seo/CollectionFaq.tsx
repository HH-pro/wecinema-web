import { JsonLd } from "@/components/seo/JsonLd";
import type { FAQ } from "@/lib/collectionSeo";

/**
 * Renders a collection page's FAQ two ways at once:
 *   1. Visible, accessible Q&A (native <details>/<summary> — no client JS), so
 *      real users and Google's rendered DOM both see the content.
 *   2. FAQPage JSON-LD, making the page eligible for "People Also Ask" /
 *      rich results and giving AI answer engines clean, quotable passages.
 *
 * Server component — safe to drop into any RSC page. Renders nothing when there
 * are no FAQs.
 */
export function CollectionFaq({ heading, faqs }: { heading: string; faqs: FAQ[] }) {
  if (!faqs?.length) return null;

  return (
    <section aria-label="Frequently asked questions" style={{ marginTop: 40, maxWidth: 760 }}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          margin: "0 0 14px",
          fontFamily: "var(--font-poppins)",
          color: "var(--color-text-primary)",
        }}
      >
        {heading}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {faqs.map((f, i) => (
          <details
            key={i}
            style={{
              border: "1px solid var(--color-divider)",
              borderRadius: 12,
              padding: "12px 16px",
              background: "var(--color-surface, transparent)",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                listStyle: "none",
              }}
            >
              {f.q}
            </summary>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14.5,
                lineHeight: 1.65,
                color: "var(--color-text-secondary)",
              }}
            >
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
