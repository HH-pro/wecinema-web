/**
 * Inline JSON-LD via the standard `<script type="application/ld+json">` tag.
 *
 * RSC-safe: no client JS, just a pre-rendered script element. dangerouslySetInnerHTML
 * is the recommended approach for structured data per next.js docs.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
