"use client";

import { useState } from "react";
import Image from "next/image";
import { POSTER_FALLBACK, resolveThumb } from "@/features/home/lib/posterFallback";

/**
 * Hero featured-film backdrop. Falls back to the branded poster gradient when
 * the thumbnail is missing OR fails to load (broken/expired S3 URL) — so the
 * hero never renders a blank/black backdrop. Includes the Ken Burns zoom.
 */
export function HeroBackdrop({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(() => resolveThumb(src));
  const isData = imgSrc.startsWith("data:");

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div className="hero-kenburns" style={{ position: "absolute", inset: 0 }}>
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          unoptimized={isData}
          placeholder="blur"
          blurDataURL={POSTER_FALLBACK}
          onError={() => {
            if (!isData) setImgSrc(POSTER_FALLBACK);
          }}
        />
      </div>
    </div>
  );
}
