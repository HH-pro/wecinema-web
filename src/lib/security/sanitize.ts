/**
 * HTML sanitizer — wraps DOMPurify for safe dangerouslySetInnerHTML usage.
 *
 * DOMPurify only runs in browser environments. This module returns empty string
 * on the server (Next.js SSR) and sanitizes on the client after hydration.
 *
 * Usage:
 *   import { sanitizeHtml } from '@/lib/security/sanitize';
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(untrustedHtml) }} />
 */

import type DOMPurifyNS from 'dompurify';

type DOMPurifyInstance = typeof DOMPurifyNS;
type Config = Parameters<DOMPurifyInstance['sanitize']>[1];

/** Tags allowed in blog / script content */
const BLOG_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
    'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
    'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'width', 'height'],
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: true,
};

/** Minimal config for plain inline HTML (forms, tooltips) */
const INLINE_CONFIG: Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
  ALLOWED_ATTR: [],
};

let _purify: DOMPurifyInstance | null = null;

async function loadDOMPurify(): Promise<DOMPurifyInstance | null> {
  if (_purify) return _purify;
  if (typeof window === 'undefined') return null;
  const mod = await import('dompurify');
  _purify = mod.default as unknown as DOMPurifyInstance;
  return _purify;
}

/**
 * Sanitize HTML for blog / rich content rendering.
 * Returns empty string on the server, or before preloadDOMPurify() resolves.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof window === 'undefined') return '';
  if (_purify) return _purify.sanitize(dirty, BLOG_CONFIG) as string;
  return '';
}

/**
 * Async version — loads DOMPurify on first call then sanitizes.
 * Use in useEffect or event handlers.
 */
export async function sanitizeHtmlAsync(dirty: string | null | undefined): Promise<string> {
  if (!dirty) return '';
  const purify = await loadDOMPurify();
  if (!purify) return '';
  return purify.sanitize(dirty, BLOG_CONFIG) as string;
}

/**
 * Sanitize plain inline HTML (strips most tags).
 */
export async function sanitizeInlineAsync(dirty: string | null | undefined): Promise<string> {
  if (!dirty) return '';
  const purify = await loadDOMPurify();
  if (!purify) return '';
  return purify.sanitize(dirty, INLINE_CONFIG) as string;
}

/**
 * Call once at app start to eagerly load DOMPurify so synchronous
 * sanitizeHtml() calls work without awaiting.
 */
export async function preloadDOMPurify(): Promise<void> {
  await loadDOMPurify();
}
