"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, FileText, Info, AlignLeft, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";

// ── Constants ─────────────────────────────────────────────────

const GENRES = [
  "Action", "Adventure", "Comedy", "Documentary",
  "Drama", "Horror", "Love", "Mystery", "Romance", "Thriller",
];

const FORMAT_TIPS = [
  "Use standard screenplay format: scene headings, action, character names, dialogue.",
  "Scene headings: INT./EXT. LOCATION — DAY/NIGHT",
  "Character names are centered in ALL CAPS before their dialogue.",
  "Action lines describe what we see — keep them tight and visual.",
  "Dialogue should reveal character, not exposition.",
];

const STRUCTURE_TIPS = [
  "Act 1 (pages 1–25): Setup — introduce world, protagonist, and inciting incident.",
  "Act 2 (pages 25–85): Confrontation — rising stakes, midpoint, dark night of the soul.",
  "Act 3 (pages 85–110): Resolution — climax, denouement.",
  "Aim for one page = one minute of screen time.",
  "Feature films: 90–120 pages. Short films: 5–15 pages.",
];

const MARKETPLACE_TIPS = [
  "Clear, professional formatting increases buyer confidence.",
  "Add a logline summary in the description for better discoverability.",
  "Genre tags connect your script to interested buyers and producers.",
  "Buyers look for scripts with strong voice — let your style shine.",
];

// ── UI Components ─────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 20,
        padding: "24px 28px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(139,92,246,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 18, height: 18, color: "rgb(167,139,250)" }} />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function TipCard({ title, items }: { title: string; items: string[] }) {
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
        <Info style={{ width: 14, height: 14, color: "rgb(167,139,250)", flexShrink: 0 }} />
        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </h4>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((item) => (
          <li key={item} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
            <ChevronRight style={{ width: 12, height: 12, color: "rgb(124,58,237)", flexShrink: 0, marginTop: 3 }} />
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
      {children}
      {required && <span style={{ color: "rgb(248,113,113)", marginLeft: 3 }}>*</span>}
    </p>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          style={{
            padding: "5px 12px",
            fontSize: 12,
            borderRadius: 9999,
            border: value.includes(opt) ? "1px solid rgb(124,58,237)" : "1px solid var(--color-border-secondary)",
            backgroundColor: value.includes(opt) ? "rgb(124,58,237)" : "transparent",
            color: value.includes(opt) ? "#fff" : "var(--color-text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s",
            fontWeight: value.includes(opt) ? 600 : 400,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function UploadScriptPage() {
  const router = useRouter();
  const { status } = useAuth();

  const [title, setTitle]       = useState("");
  const [genres, setGenres]     = useState<string[]>([]);
  const [content, setContent]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const pageEst   = Math.round(wordCount / 185);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim())       { toast.error("Title is required"); return; }
    if (genres.length === 0) { toast.error("Select at least one genre"); return; }
    if (!content.trim())     { toast.error("Script content is required"); return; }

    setSubmitting(true);
    try {
      await api.post("/video/scripts", {
        title: title.trim(),
        genre: genres,
        script: content,
      } as Record<string, unknown>);
      setDone(true);
      toast.success("Script uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false);
    setTitle("");
    setGenres([]);
    setContent("");
  };

  // ── Success screen ────────────────────────────────────────

  if (done) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
        <div
          style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(74,222,128,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle style={{ width: 44, height: 44, color: "rgb(74,222,128)" }} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "var(--color-text-primary)" }}>
          Script Published!
        </h2>
        <p style={{ margin: "0 0 32px", fontSize: 14, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
          Your screenplay is now live on WeCinema and visible to buyers and producers.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => router.push("/scripts")}
            style={{
              padding: "11px 28px",
              background: "linear-gradient(to right, rgb(124,58,237), rgb(168,85,247))",
              color: "#fff",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Browse Scripts
          </button>
          <button
            onClick={reset}
            style={{
              padding: "11px 28px",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid var(--color-border-secondary)",
              cursor: "pointer",
            }}
          >
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px 64px" }}>
      {/* Hero header */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(168,85,247,0.05) 100%)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 22,
          padding: "28px 36px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            position: "absolute", right: -50, top: -50,
            width: 180, height: 180, borderRadius: "50%",
            background: "rgba(139,92,246,0.15)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: "linear-gradient(135deg, rgb(124,58,237), rgb(168,85,247))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
            }}
          >
            <FileText style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>WeCinema</span>
              <ChevronRight style={{ width: 12, height: 12, color: "var(--color-text-tertiary)" }} />
              <span style={{ fontSize: 12, color: "rgb(167,139,250)", fontWeight: 600 }}>Upload Script</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
              Upload Your Screenplay
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>
              Share your script with producers, studios, and buyers worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6 items-start">
        {/* ── Left: form ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Section: Script Details */}
          <SectionCard icon={Tag} title="Script Details">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <FieldLabel required>Title</FieldLabel>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Last Signal, Broken Roads, A Quiet Light..."
                  maxLength={120}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "var(--color-bg-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: 12,
                    color: "var(--color-text-primary)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right" }}>
                  {title.length}/120
                </p>
              </div>
              <div>
                <FieldLabel required>Genre</FieldLabel>
                <MultiSelect options={GENRES} value={genres} onChange={setGenres} />
              </div>
            </div>
          </SectionCard>

          {/* Section: Screenplay */}
          <SectionCard icon={AlignLeft} title="Screenplay">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <FieldLabel required>Script Content</FieldLabel>
                <div style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                    {wordCount.toLocaleString()} words
                  </span>
                  {pageEst > 0 && (
                    <span style={{ fontSize: 11, color: "rgb(167,139,250)", fontWeight: 600 }}>
                      ~{pageEst} page{pageEst !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
                Write or paste your screenplay. Standard format: scene headings, action lines, and dialogue.
                HTML is supported for basic formatting.
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={28}
                placeholder={`FADE IN:\n\nINT. LOCATION — DAY\n\nDescribe the scene here. Keep action lines brief and visual.\n\n\t\t\t\tCHARACTER NAME\n\t\t\tDialogue goes here.\n\nEXT. ANOTHER LOCATION — NIGHT\n\nThe story continues...`}
                required
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  backgroundColor: "var(--color-bg-primary)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: 12,
                  color: "var(--color-text-primary)",
                  fontSize: 13.5,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "'Courier New', Courier, monospace",
                  lineHeight: 1.85,
                  boxSizing: "border-box",
                  minHeight: 480,
                }}
              />
              {/* Bottom stats bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                  padding: "8px 12px",
                  backgroundColor: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-secondary)",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                  {content.length.toLocaleString()} characters
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                  {wordCount.toLocaleString()} words · ~{pageEst} pages
                  {pageEst >= 85 && pageEst <= 120 && (
                    <span style={{ color: "rgb(74,222,128)", marginLeft: 6 }}>✓ Feature length</span>
                  )}
                  {pageEst > 0 && pageEst < 85 && (
                    <span style={{ color: "rgb(251,191,36)", marginLeft: 6 }}>Short / Mid-length</span>
                  )}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "15px",
              background: "linear-gradient(to right, rgb(124,58,237), rgb(168,85,247))",
              color: "#fff",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
              boxShadow: submitting ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
            }}
          >
            {submitting ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    display: "inline-block",
                    width: 16, height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                  }}
                />
                Publishing…
              </>
            ) : (
              <>
                <FileText style={{ width: 17, height: 17 }} />
                Publish Script
              </>
            )}
          </button>
        </form>

        {/* ── Right: tips sidebar ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <TipCard title="Formatting Tips" items={FORMAT_TIPS} />
          <TipCard title="Script Structure" items={STRUCTURE_TIPS} />
          <TipCard title="Marketplace Tips" items={MARKETPLACE_TIPS} />
        </div>
      </div>
    </div>
  );
}
