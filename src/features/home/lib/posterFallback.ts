/**
 * Branded gradient poster fallback.
 *
 * Replaces the previous flat-black placeholder so missing/broken thumbnails
 * never render as black boxes. The SVG is a self-contained data URI (no network
 * request, safe for next/image `unoptimized`) using WeCinema's accent palette
 * with a small film-reel glyph.
 */
export const POSTER_FALLBACK =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgOTAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIHNsaWNlIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMyYTFmMTYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxNDExMGYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiBmaWxsPSJ1cmwoI2cpIi8+PGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkY2QjAwIiBzdHJva2Utb3BhY2l0eT0iMC41NSIgc3Ryb2tlLXdpZHRoPSIyLjUiPjxjaXJjbGUgY3g9IjgwIiBjeT0iNDIiIHI9IjE2Ii8+PGNpcmNsZSBjeD0iODAiIGN5PSI0MiIgcj0iNCIgZmlsbD0iI0ZGNkIwMCIgZmlsbC1vcGFjaXR5PSIwLjU1IiBzdHJva2U9Im5vbmUiLz48L2c+PHRleHQgeD0iODAiIHk9IjcyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI4IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjRkY2QjAwIiBmaWxsLW9wYWNpdHk9IjAuNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+V2VDaW5lbWE8L3RleHQ+PC9zdmc+";

/** True when a thumbnail string is missing, empty, or already the fallback. */
export function resolveThumb(thumb?: string | null): string {
  if (!thumb || thumb.trim() === "") return POSTER_FALLBACK;
  return thumb;
}
