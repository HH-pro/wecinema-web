"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useConsent } from "../ConsentProvider";
import { CONSENT_BUTTON_CLASS, primaryButtonStyle, secondaryButtonStyle } from "./consentButtons";

/**
 * First-visit cookie notice. It doesn't block the page or take focus, and nothing optional
 * runs until the visitor chooses. "Reject all" is exactly as prominent as "Accept all".
 */
export function CookieBanner() {
  const { ready, decided, settingsOpen, acceptAll, rejectAll, openSettings } = useConsent();
  const visible = ready && !decided && !settingsOpen;

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          key="cookie-banner"
          aria-label="Cookie consent"
          aria-describedby="cookie-banner-text"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-x-3 bottom-3 z-[9998] rounded-2xl border border-border-secondary bg-bg-elevated p-5 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[420px]"
          style={{
            boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
            marginBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 14%, transparent)",
                color: "var(--color-accent-primary)",
              }}
            >
              <Cookie size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-text-primary">We value your privacy</h2>
              <p id="cookie-banner-text" className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                We use strictly necessary cookies to keep you signed in and the site secure. With your permission,
                we&apos;d also use analytics and marketing cookies to understand how WeCinema is used and to measure
                our ads.{" "}
                <Link
                  href="/cookie-policy"
                  className="font-medium underline underline-offset-2"
                  style={{ color: "var(--color-text-link)" }}
                >
                  Cookie Policy
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={rejectAll} className={CONSENT_BUTTON_CLASS} style={primaryButtonStyle}>
              Reject all
            </button>
            <button type="button" onClick={acceptAll} className={CONSENT_BUTTON_CLASS} style={primaryButtonStyle}>
              Accept all
            </button>
            <button
              type="button"
              onClick={openSettings}
              className={`${CONSENT_BUTTON_CLASS} col-span-2`}
              style={secondaryButtonStyle}
            >
              Customize
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
