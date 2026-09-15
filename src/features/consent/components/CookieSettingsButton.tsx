"use client";

import type { CSSProperties, ReactNode } from "react";
import { useConsent } from "../ConsentProvider";

interface CookieSettingsButtonProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Reopens cookie settings. A client island, so server components (footer, policy page) can include it. */
export function CookieSettingsButton({ className, style, children = "Cookie settings" }: CookieSettingsButtonProps) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className} style={style}>
      {children}
    </button>
  );
}
