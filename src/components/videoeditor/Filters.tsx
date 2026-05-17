"use client";

interface FiltersProps {
  setFilter: (filter: string) => void;
}

const FILTERS = [
  { name: "None", value: "none" },
  { name: "Grayscale", value: "grayscale(100%)" },
  { name: "Sepia", value: "sepia(100%)" },
  { name: "Blur", value: "blur(5px)" },
  { name: "Brightness", value: "brightness(1.5)" },
  { name: "Contrast", value: "contrast(150%)" },
];

export default function Filters({ setFilter }: FiltersProps) {
  return (
    <select
      onChange={(e) => setFilter(e.target.value)}
      className="p-2 rounded-lg"
      style={{
        backgroundColor: "var(--color-bg-tertiary)",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border-secondary)",
      }}
      aria-label="Video filter"
    >
      {FILTERS.map((f) => (
        <option key={f.value} value={f.value}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
