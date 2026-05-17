"use client";

import { useState } from "react";

interface AvatarProps {
  src?: string | null;
  username?: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

function colorFromName(name: string): string {
  const colors = [
    "#F59E0B", "#EF4444", "#10B981", "#3B82F6",
    "#8B5CF6", "#EC4899", "#F97316", "#06B6D4",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

function fallbackSrc(username: string): string {
  const bg = colorFromName(username);
  const txt = username.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="white">${txt}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function Avatar({ src, username = "User", size = 36, style, className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const resolved = !src || errored ? fallbackSrc(username) : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={username}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        display: "block",
        ...style,
      }}
      onError={() => { if (!errored) setErrored(true); }}
    />
  );
}
