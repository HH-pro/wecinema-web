"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { api } from "@/features/auth/services/apiClient";
import type { Script } from "@/types";

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function ScriptCard({ script }: { script: Script }) {
  const authorName =
    typeof script.author === "object" && script.author
      ? (script.author.username ?? "Unknown")
      : "Unknown";
  const genres = Array.isArray(script.genre)
    ? script.genre
    : script.genre
    ? [script.genre]
    : [];

  return (
    <Link
      href={`/scripts/${script._id}`}
      className="group block rounded-2xl p-5 border transition-all hover:shadow-md"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        borderColor: "var(--color-border-secondary)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: "rgba(139,92,246,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText style={{ width: 20, height: 20, color: "rgb(167,139,250)" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            className="line-clamp-2 group-hover:text-violet-400 transition-colors"
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.4,
            }}
          >
            {script.title}
          </h3>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "var(--color-text-tertiary)",
            }}
          >
            {authorName}
            {script.createdAt && <> · {timeAgo(script.createdAt)}</>}
          </p>
        </div>
      </div>

      {genres.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {genres.slice(0, 2).map((g) => (
            <span
              key={g}
              style={{
                fontSize: 11,
                padding: "2px 10px",
                borderRadius: 9999,
                backgroundColor: "rgba(139,92,246,0.1)",
                color: "rgb(167,139,250)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              {g}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filtered, setFiltered] = useState<Script[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ scripts?: Script[] } | Script[]>("/video/author/scripts")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { scripts?: Script[] }).scripts ?? [];
        setScripts(list);
        setFiltered(list);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(scripts);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      scripts.filter((s) => {
        const genres = Array.isArray(s.genre) ? s.genre : s.genre ? [s.genre] : [];
        return (
          s.title?.toLowerCase().includes(q) ||
          genres.some((g) => g.toLowerCase().includes(q))
        );
      })
    );
  }, [query, scripts]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileText style={{ width: 22, height: 22, color: "rgb(167,139,250)" }} />
          Scripts
        </h1>
        <Link
          href="/upload/script"
          style={{
            padding: "8px 16px",
            backgroundColor: "rgb(124,58,237)",
            color: "#fff",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          + Upload Script
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 16,
            height: 16,
            color: "var(--color-text-tertiary)",
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scripts..."
          style={{
            width: "100%",
            paddingLeft: 38,
            paddingRight: 16,
            paddingTop: 10,
            paddingBottom: 10,
            backgroundColor: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-secondary)",
            borderRadius: 12,
            color: "var(--color-text-primary)",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 112,
                borderRadius: 16,
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-secondary)",
              }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <FileText
            style={{
              width: 48,
              height: 48,
              color: "var(--color-text-tertiary)",
              margin: "0 auto 12px",
              opacity: 0.4,
            }}
          />
          <p style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
            {query ? "No scripts match your search" : "No scripts yet"}
          </p>
          {!query && (
            <Link
              href="/upload/script"
              style={{
                display: "inline-block",
                marginTop: 16,
                color: "rgb(167,139,250)",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Be the first to upload a script →
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((script) => (
            <ScriptCard key={script._id} script={script} />
          ))}
        </div>
      )}
    </div>
  );
}
