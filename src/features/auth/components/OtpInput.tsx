"use client";

import { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, error, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.split("");
      if (next[i]) {
        next[i] = "";
      } else if (i > 0) {
        next[i - 1] = "";
        refs.current[i - 1]?.focus();
      }
      onChange(next.join(""));
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    const next = value.padEnd(6, " ").split("");
    next[i] = digit || " ";
    onChange(next.join("").trimEnd().replace(/ /g, ""));
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => value[i] ?? "").map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          autoFocus={i === 0}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all duration-150"
          style={{
            background: digit
              ? "color-mix(in srgb, var(--color-accent-primary) 12%, var(--color-input-bg))"
              : "var(--color-input-bg)",
            border: `2px solid ${
              digit
                ? "var(--color-accent-primary)"
                : error
                  ? "var(--color-danger)"
                  : "var(--color-input-border)"
            }`,
            color: digit ? "var(--color-accent-primary)" : "var(--color-text-primary)",
            boxShadow: digit
              ? "0 0 0 3px color-mix(in srgb, var(--color-accent-primary) 16%, transparent)"
              : "none",
          }}
        />
      ))}
    </div>
  );
}
