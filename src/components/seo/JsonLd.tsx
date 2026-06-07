/**
 * Inline JSON-LD via the standard `<script type="application/ld+json">` tag.
 *
 * RSC-safe: no client JS, just a pre-rendered script element. dangerouslySetInnerHTML
 * is the recommended approach for structured data per next.js docs.
 *
 * The `<` → `<` escape is required because user-generated content (video
 * titles, listing descriptions) flows through here — without it a payload like
 * `</script><script>…` would break out of the JSON-LD block (XSS). See the
 * Next.js JSON-LD guide.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
