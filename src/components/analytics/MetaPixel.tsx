"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { isPublicPage } from "./publicRoutes";

/**
 * Meta (Facebook) Pixel — public pages only.
 *
 * Fires a PageView on public marketing/content routes (see ./publicRoutes) and
 * stays completely silent on the authenticated app (admin, dashboards, uploads,
 * account tabs, …): on private routes the Pixel script isn't even loaded.
 *
 * Because the app is a client-navigated SPA, the raw <script> snippet's single
 * PageView (which only runs once on hard load) isn't enough — we re-fire on
 * each client-side navigation to a public route via usePathname.
 *
 * The Pixel ID is public (it ships in the page source), so it's safe to keep
 * here. Override per-environment with NEXT_PUBLIC_META_PIXEL_ID.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1011498991591445";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const isPublic = isPublicPage(pathname ?? "");
  // Last path we sent a PageView for, so the initial fire (onReady) and the
  // navigation fire (effect) never double-count the same page regardless of
  // which runs first.
  const lastTracked = useRef<string | null>(null);

  const fire = useCallback(() => {
    if (typeof window === "undefined" || !window.fbq) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    window.fbq("track", "PageView");
  }, [pathname]);

  useEffect(() => {
    if (!PIXEL_ID) return;
    if (!isPublic) {
      // Reset so re-entering the same public page after a private detour
      // (which unmounts the Pixel) fires a fresh PageView.
      lastTracked.current = null;
      return;
    }
    fire();
  }, [isPublic, fire]);

  if (!PIXEL_ID || !isPublic) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        // Runs once the base snippet has executed and window.fbq exists — the
        // reliable moment to fire the first PageView without racing hydration.
        onReady={fire}
      >
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
