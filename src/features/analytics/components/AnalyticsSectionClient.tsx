"use client";

import dynamic from "next/dynamic";

// chart.js (~290 KB) stays out of the initial bundle and never runs during SSR.
const AnalyticsSection = dynamic(() => import("./AnalyticsSection"), { ssr: false });

export function AnalyticsSectionClient({ title }: { title?: string }) {
  return <AnalyticsSection title={title} />;
}
