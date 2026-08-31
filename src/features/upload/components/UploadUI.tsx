"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Info, X } from "lucide-react";

/** Sidebar hint card. */
export function TipCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 16,
        padding: "18px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Info style={{ width: 14, height: 14, color: "var(--color-accent-primary)", flexShrink: 0 }} aria-hidden />
        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </h4>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((item) => (
          <li key={item} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <ChevronRight style={{ width: 12, height: 12, color: "var(--color-accent-primary)", flexShrink: 0, marginTop: 3 }} aria-hidden />
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
      {children}
      {required && <span style={{ color: "rgb(248,113,113)", marginLeft: 3 }} aria-hidden>*</span>}
    </p>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "var(--color-bg-primary)",
  border: "1px solid var(--color-border-secondary)",
  borderRadius: 12,
  color: "var(--color-text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

/**
 * Pill picker. Passing `customPlaceholder` adds a free-text field for values
 * outside `options`; without it only the presets are selectable.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  customPlaceholder,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  customPlaceholder?: string;
}) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);

  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  const addCustom = () => {
    const v = customInput.trim();
    if (!v) return;
    if (!value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setCustomInput("");
  };

  // Selected items that aren't part of the preset list — rendered as removable chips.
  const customTags = value.filter((v) => !options.some((o) => o.toLowerCase() === v.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {options.map((opt) => {
          const on = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(opt)}
              style={{
                padding: "6px 13px",
                fontSize: 12,
                borderRadius: 9999,
                border: on ? "1px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                backgroundColor: on ? "var(--color-accent-primary)" : "transparent",
                color: on ? "var(--color-btn-primary-text, #000)" : "var(--color-text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
                fontWeight: on ? 600 : 400,
              }}
            >
              {opt}
            </button>
          );
        })}
        {customTags.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 10px 6px 13px",
              fontSize: 12, fontWeight: 600, borderRadius: 9999,
              border: "1px solid var(--color-accent-primary)",
              backgroundColor: "var(--color-accent-primary)",
              color: "var(--color-btn-primary-text, #000)",
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove ${tag}`}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-btn-primary-text, #000)", display: "flex", padding: 0, opacity: 0.7 }}
            >
              <X style={{ width: 12, height: 12 }} aria-hidden />
            </button>
          </span>
        ))}
      </div>

      {customPlaceholder && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); addCustom(); } }}
            placeholder={customPlaceholder}
            maxLength={40}
            style={{ ...inputStyle, flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 12 }}
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            style={{
              padding: "8px 14px", fontSize: 12, fontWeight: 600, borderRadius: 10,
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "transparent",
              color: customInput.trim() ? "var(--color-accent-primary)" : "var(--color-text-tertiary)",
              cursor: customInput.trim() ? "pointer" : "not-allowed",
            }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * File picker with drag-and-drop. `preview` replaces the idle illustration once
 * a file is chosen — used for the thumbnail and video posters.
 */
export function DropZone({
  accept,
  file,
  onFile,
  onClear,
  icon: Icon,
  label,
  hint,
  preview,
}: {
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  icon: React.ElementType;
  label: string;
  hint: string;
  preview?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = () => ref.current?.click();

  return (
    <div
      onClick={pick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
      style={{
        border: `2px dashed ${dragging || file ? "var(--color-accent-primary)" : "var(--color-border-secondary)"}`,
        borderRadius: 14,
        padding: file && preview ? 0 : "26px 16px",
        overflow: "hidden",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: dragging || file ? "var(--accent-soft)" : "transparent",
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      {file && preview ? (
        <div style={{ position: "relative" }}>
          {preview}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px",
              backgroundColor: "var(--color-bg-elevated)",
              borderTop: "1px solid var(--color-border-secondary)",
            }}
          >
            <Icon style={{ width: 15, height: 15, color: "var(--color-accent-primary)", flexShrink: 0 }} aria-hidden />
            <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, textAlign: "left", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file.name}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", flexShrink: 0 }}>
              {formatBytes(file.size)}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              aria-label="Remove file"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", padding: 0, flexShrink: 0 }}
            >
              <X style={{ width: 15, height: 15 }} aria-hidden />
            </button>
          </div>
        </div>
      ) : file ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Icon style={{ width: 18, height: 18, color: "var(--color-accent-primary)", flexShrink: 0 }} aria-hidden />
          <span style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
            {file.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            aria-label="Remove file"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", padding: 0 }}
          >
            <X style={{ width: 15, height: 15 }} aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              width: 46, height: 46, borderRadius: 13,
              background: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 11px",
            }}
          >
            <Icon style={{ width: 22, height: 22, color: "var(--color-accent-primary)", opacity: 0.85 }} aria-hidden />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 600 }}>{label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{hint}</p>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ width: "100%", height: 6, borderRadius: 9999, backgroundColor: "var(--color-border-secondary)", overflow: "hidden" }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
          borderRadius: 9999,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

/** One label/value line in a review summary. */
export function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "11px 0",
        borderTop: "1px solid var(--color-border-secondary)",
        alignItems: "baseline",
      }}
    >
      <span style={{ flex: "0 0 116px", fontSize: 12, fontWeight: 600, color: "var(--color-text-tertiary)" }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Gradient page header shared by the video and script upload wizards. */
export function PageHero({
  icon: Icon,
  crumb,
  heading,
  sub,
}: {
  icon: React.ElementType;
  crumb: string;
  heading: string;
  sub: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, var(--accent-soft) 0%, transparent 100%)",
        border: "1px solid var(--accent-ring)",
        borderRadius: 22,
        padding: "28px 36px",
        marginBottom: 28,
      }}
    >
      {/* Decorative blur blob */}
      <div
        aria-hidden
        style={{
          position: "absolute", right: -50, top: -50,
          width: 180, height: 180, borderRadius: "50%",
          background: "var(--accent-ring)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg, var(--color-accent-primary), #FFCB33)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px var(--accent-ring)",
          }}
        >
          <Icon style={{ width: 28, height: 28, color: "var(--color-btn-primary-text, #000)" }} aria-hidden />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>WeCinema</span>
            <ChevronRight style={{ width: 12, height: 12, color: "var(--color-text-tertiary)" }} aria-hidden />
            <span style={{ fontSize: 12, color: "var(--color-accent-primary)", fontWeight: 600 }}>{crumb}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
            {heading}
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

/** Blob URL for a picked file, revoked whenever the file changes or unmounts. */
export function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

export function formatDuration(seconds: number) {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
