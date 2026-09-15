"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Accessible name, when there's no visible label to reference with `labelledBy`. */
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  id?: string;
}

/** Accessible on/off toggle (role="switch"). Space and Enter toggle it, like any button. */
export function Switch({ checked, onChange, disabled = false, label, labelledBy, describedBy, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        backgroundColor: checked ? "var(--color-accent-primary)" : "var(--color-border-primary)",
        outlineColor: "var(--color-text-primary)",
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: `translateX(${checked ? 22 : 2}px)` }}
      />
    </button>
  );
}
