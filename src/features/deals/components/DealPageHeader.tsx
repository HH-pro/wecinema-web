"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface DealPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Where Back goes. Falls back to browser history. */
  backHref?: string;
  aside?: ReactNode;
}

export function DealPageHeader({ title, subtitle, backHref, aside }: DealPageHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
          className="mt-1.5 inline-flex flex-shrink-0 items-center gap-1 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-text-primary sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-xs text-text-tertiary sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {aside && <div className="flex-shrink-0">{aside}</div>}
    </header>
  );
}
