"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { useConsent } from "../ConsentProvider";
import { isGpcEnabled } from "../consentStore";
import { CATEGORY_INFO, cookiesIn } from "../cookieRegistry";
import { OPTIONAL_CATEGORIES, type ConsentCategory, type ConsentChoices } from "../consentTypes";
import { CONSENT_BUTTON_CLASS, primaryButtonStyle, secondaryButtonStyle } from "./consentButtons";

const FOCUSABLE = 'button:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])';
const TRACKING: readonly ConsentCategory[] = ["analytics", "marketing"];

/** Per-category cookie choices, opened from the banner's "Customize" or any CookieSettingsButton. */
export function CookieSettingsModal() {
  const { ready, settingsOpen } = useConsent();
  if (!ready || !settingsOpen) return null;
  return createPortal(<SettingsDialog />, document.body);
}

function SettingsDialog() {
  const { categories, acceptAll, rejectAll, save, closeSettings } = useConsent();
  // Mounted fresh on every open, so the draft always starts from the saved choice.
  const [draft, setDraft] = useState<ConsentChoices>(categories);
  const gpc = isGpcEnabled();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog, keep Tab inside it, close on Escape, and give focus back on close.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSettings();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusTo?.focus();
    };
  }, [closeSettings]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4"
      style={{ backgroundColor: "var(--color-modal-overlay)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-border-secondary bg-bg-elevated outline-none sm:max-w-[560px] sm:rounded-2xl"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-divider px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Cookie settings
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-text-tertiary">
              Choose which cookies WeCinema may use. You can change your mind at any time from Cookie settings in the
              footer.{" "}
              <Link
                href="/cookie-policy"
                onClick={closeSettings}
                className="font-medium underline underline-offset-2"
                style={{ color: "var(--color-text-link)" }}
              >
                Read the Cookie Policy
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            aria-label="Close cookie settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "var(--color-text-secondary)", outlineColor: "var(--color-text-primary)" }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {gpc && (
            <p
              className="rounded-xl px-4 py-3 text-[13px] leading-relaxed text-text-primary"
              style={{ backgroundColor: "var(--color-info-bg)" }}
            >
              Your browser is sending a <strong>Global Privacy Control</strong> signal, so analytics and marketing
              cookies stay off.
            </p>
          )}
          <CategoryRow category="necessary" checked locked />
          {OPTIONAL_CATEGORIES.map((category) => {
            const blocked = gpc && TRACKING.includes(category);
            return (
              <CategoryRow
                key={category}
                category={category}
                checked={draft[category] && !blocked}
                disabled={blocked}
                onChange={(value) => setDraft((d) => ({ ...d, [category]: value }))}
              />
            );
          })}
        </div>

        <footer
          className="grid grid-cols-1 gap-2 border-t border-divider px-5 pt-4 sm:grid-cols-3"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button type="button" onClick={rejectAll} className={CONSENT_BUTTON_CLASS} style={secondaryButtonStyle}>
            Reject all
          </button>
          <button type="button" onClick={() => save(draft)} className={CONSENT_BUTTON_CLASS} style={primaryButtonStyle}>
            Save choices
          </button>
          <button type="button" onClick={acceptAll} className={CONSENT_BUTTON_CLASS} style={secondaryButtonStyle}>
            Accept all
          </button>
        </footer>
      </div>
    </div>
  );
}

interface CategoryRowProps {
  category: ConsentCategory;
  checked: boolean;
  /** Always on and not switchable (strictly necessary). */
  locked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

function CategoryRow({ category, checked, locked = false, disabled = false, onChange }: CategoryRowProps) {
  const { title, description } = CATEGORY_INFO[category];
  const items = cookiesIn(category);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-border-secondary bg-bg-secondary p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={titleId} className="text-[14.5px] font-semibold text-text-primary">
            {title}
          </h3>
          <p id={descriptionId} className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>
        {locked ? (
          <span
            className="mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={{ backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }}
          >
            Always on
          </span>
        ) : (
          <div className="mt-0.5 shrink-0">
            <Switch
              checked={checked}
              disabled={disabled}
              onChange={(value) => onChange?.(value)}
              labelledBy={titleId}
              describedBy={descriptionId}
            />
          </div>
        )}
      </div>

      {items.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12.5px] font-medium" style={{ color: "var(--color-text-link)" }}>
            Show {items.length} {items.length === 1 ? "item" : "items"}
          </summary>
          <ul className="mt-2 space-y-2">
            {items.map((item) => (
              <li
                key={item.name}
                className="rounded-lg border border-border-secondary bg-bg-elevated px-3 py-2 text-[12.5px]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <code className="break-all font-semibold text-text-primary">{item.name}</code>
                  <span className="text-text-tertiary">
                    {item.provider} · {item.duration}
                  </span>
                </div>
                <p className="mt-0.5 text-text-secondary">{item.purpose}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
