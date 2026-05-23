import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { getLatestScripts } from "@/features/scripts/api/scriptsQueries";
import type { Script } from "@/types";

function formatDateAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function ScriptCard({ script }: { script: Script }) {
  const authorName =
    typeof script.author === "object" && script.author !== null
      ? script.author.username ?? "Unknown"
      : "Unknown";
  const genreLabel = Array.isArray(script.genre) ? script.genre[0] : (script.genre ?? "");
  const dateStr = script.createdAt ?? script.updatedAt;

  return (
    <Link
      href={`/scripts/${script._id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 16,
        borderRadius: 12,
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-secondary)",
        textDecoration: "none",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
      }}
      aria-label={`Read script: ${script.title}`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: "var(--color-accent-primary,#FF6B00)1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText size={18} color="var(--color-accent-primary,#FF6B00)" aria-hidden />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.3,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {script.title}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.75rem",
              color: "var(--color-text-tertiary)",
              display: "flex",
              gap: 4,
              alignItems: "center",
            }}
          >
            <span>{authorName}</span>
            {dateStr && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={dateStr}>{formatDateAgo(dateStr)}</time>
              </>
            )}
          </p>
        </div>
      </div>
      {genreLabel && (
        <span
          style={{
            alignSelf: "flex-start",
            padding: "2px 8px",
            borderRadius: 9999,
            backgroundColor: "var(--color-bg-tertiary)",
            color: "var(--color-text-secondary)",
            fontSize: "0.6875rem",
            fontWeight: 500,
          }}
        >
          {genreLabel}
        </span>
      )}
    </Link>
  );
}

export async function ScriptsSection() {
  const scripts = await getLatestScripts(6);
  if (scripts.length === 0) return null;

  return (
    <section
      style={{ padding: "24px 24px 32px", contentVisibility: "auto", containIntrinsicSize: "1px 320px" } as React.CSSProperties}
      aria-labelledby="scripts-heading"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <h2
          id="scripts-heading"
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "var(--font-poppins)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.015em",
          }}
        >
          Latest Scripts
        </h2>
        <Link
          href="/scripts"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-accent-primary)",
            border: "1px solid var(--color-accent-primary)",
            borderRadius: 12,
            padding: "6px 14px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
          aria-label="View all scripts"
        >
          View all <ChevronRight size={13} aria-hidden />
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {scripts.map((script) => (
          <ScriptCard key={script._id} script={script} />
        ))}
      </div>
    </section>
  );
}
