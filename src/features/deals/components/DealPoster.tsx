"use client";

import { useState } from "react";
import Image from "next/image";
import { Film } from "lucide-react";

interface DealPosterProps {
  src: string | null | undefined;
  title: string;
  className?: string;
  sizes?: string;
}

/**
 * Listing poster for deal screens. Poster URLs are short-lived signed S3 links,
 * so they're served unoptimized — routing them through the image optimizer would
 * cache an image under a URL that stops working.
 */
export function DealPoster({ src, title, className = "", sizes = "112px" }: DealPosterProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative flex-shrink-0 overflow-hidden rounded-lg border border-card-border bg-bg-tertiary ${className}`}>
      {src && !failed ? (
        <Image
          src={src}
          alt={`${title} poster`}
          fill
          sizes={sizes}
          unoptimized
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center"
          style={{
            background:
              "linear-gradient(160deg, var(--color-bg-tertiary), color-mix(in srgb, var(--color-accent-primary) 14%, var(--color-bg-tertiary)))",
          }}
        >
          <Film size={18} className="text-text-tertiary" aria-hidden="true" />
          <span className="line-clamp-2 text-[9px] font-semibold uppercase tracking-widest text-text-secondary">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
