'use client';

import { useEffect, useRef, useState } from 'react';
import { sanitizeHtmlAsync, preloadDOMPurify } from '@/lib/security/sanitize';

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  /** Fallback content rendered while DOMPurify is loading (SSR + first paint) */
  fallback?: React.ReactNode;
}

/**
 * Renders server-provided HTML safely by sanitizing it with DOMPurify before
 * inserting into the DOM. Safe to use in server-component pages via a boundary.
 *
 * The component renders nothing (or a fallback) on the first SSR pass to avoid
 * hydration mismatches, then sanitizes and renders on the client.
 */
export function SafeHtml({ html, className, style, fallback = null }: SafeHtmlProps) {
  const [sanitized, setSanitized] = useState<string>('');
  const [ready, setReady] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!html) { setReady(true); return; }
    preloadDOMPurify().then(async () => {
      const clean = await sanitizeHtmlAsync(html);
      if (!isMounted.current) return;
      setSanitized(clean);
      setReady(true);
    });
  }, [html]);

  if (!ready) return <>{fallback}</>;

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
