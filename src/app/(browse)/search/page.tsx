"use client";

import { Search } from "lucide-react";
import SearchBar from "@/features/search/SearchBar";

export default function SearchLandingPage() {
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
      <div style={{ width: "100%", maxWidth: 520, textAlign: "left" }}>
        <SearchBar variant="page" autoFocus />
      </div>
    </div>
  );
}
