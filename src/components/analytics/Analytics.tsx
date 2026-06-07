"use client";

import Script from "next/script";
import { useReportWebVitals } from "next/web-vitals";

/**
 * Google Analytics 4 + Core Web Vitals RUM — fully gated.
 *
 * Set NEXT_PUBLIC_GA_ID (e.g. "G-XXXXXXXXXX") in the environment to activate.
 * Until then this renders nothing and adds zero script weight, so it's safe to
 * ship now and switch on later. Web Vitals (LCP/CLS/INP/FCP/TTFB) are forwarded
 * to GA4 as events via next/web-vitals — no extra dependency required.
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  // Hook must run unconditionally; it no-ops until gtag exists.
  useReportWebVitals((metric) => {
    if (!GA_ID) return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (!w.gtag) return;
    w.gtag("event", metric.name, {
      metric_id: metric.id,
      // CLS is unitless (~0-1); scale so GA's integer value stays meaningful.
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      metric_value: metric.value,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  });

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { send_page_view: true });`}
      </Script>
    </>
  );
}
