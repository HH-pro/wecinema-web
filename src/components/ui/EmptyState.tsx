import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string | ReactNode;
  title?: string;
  label?: string;
  description?: string;
}

export function EmptyState({ icon, title, label, description }: EmptyStateProps) {
  const message = label ?? description ?? title ?? "";
  return (
    <div
      style={{
        textAlign: "center",
        padding: "80px 20px",
        color: "var(--color-text-tertiary)",
      }}
    >
      {icon && (
        <p style={{ fontSize: 48, margin: "0 0 12px" }}>
          {icon}
        </p>
      )}
      {title && !label && !description && (
        <p style={{ margin: 0, fontSize: 15 }}>{title}</p>
      )}
      {message && message !== title && (
        <p style={{ margin: 0, fontSize: 15 }}>{message}</p>
      )}
    </div>
  );
}
