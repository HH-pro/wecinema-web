export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        backgroundColor: "var(--color-bg-primary)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid var(--color-skeleton-base)",
          borderTopColor: "var(--color-accent-primary)",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <span className="sr-only">Loading…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
