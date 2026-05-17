"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with your error reporter (Sentry, etc.)
    console.error("[app:error]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 20 }}>
          The page hit an unexpected error. You can try again or go back home.
        </p>
        {error.digest && (
          <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 16 }}>
            Reference: <code>{error.digest}</code>
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "10px 20px",
            borderRadius: 9999,
            backgroundColor: "var(--color-accent-primary)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
