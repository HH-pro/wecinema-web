"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchLandingPage() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) router.push(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "32px 16px",
        textAlign: "center",
      }}
    >
      <Search
        style={{
          width: 48,
          height: 48,
          color: "var(--color-text-tertiary)",
          marginBottom: 20,
          opacity: 0.5,
        }}
      />
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: 26,
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        Search WeCinema
      </h1>
      <p
        style={{
          margin: "0 0 28px",
          fontSize: 14,
          color: "var(--color-text-tertiary)",
        }}
      >
        Find movies, documentaries, and scripts
      </p>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 480 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            borderRadius: 14,
            border: "1.5px solid var(--color-border-secondary)",
            backgroundColor: "var(--color-bg-elevated)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center" }}>
            <Search style={{ width: 18, height: 18, color: "var(--color-text-tertiary)" }} />
          </div>
          <input
            autoFocus
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search movies, genres, actors…"
            style={{
              flex: 1,
              padding: "14px 0",
              border: "none",
              background: "transparent",
              color: "var(--color-text-primary)",
              fontSize: 15,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={!term.trim()}
            style={{
              padding: "0 20px",
              height: "100%",
              minHeight: 50,
              border: "none",
              backgroundColor: "var(--color-accent-primary)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: term.trim() ? "pointer" : "not-allowed",
              opacity: term.trim() ? 1 : 0.5,
              transition: "opacity 0.15s",
            }}
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
