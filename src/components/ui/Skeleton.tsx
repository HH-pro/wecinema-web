import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  style?: CSSProperties;
  className?: string;
}

export function Skeleton({ width, height, borderRadius = 6, style, className }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--color-skeleton-base, #E5E5E5)",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ aspectRatio = "16/9" }: { aspectRatio?: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-secondary)",
      }}
    >
      <div
        style={{
          aspectRatio,
          backgroundColor: "var(--color-skeleton-base, #E5E5E5)",
        }}
      />
      <div style={{ padding: 12 }}>
        <Skeleton height={14} width="70%" style={{ marginBottom: 8 }} />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
  );
}
