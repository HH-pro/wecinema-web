"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, ChevronRight, Film, ImageIcon, Info,
  Settings2, Tag, Upload, Video, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import { uploadDirectToS3 } from "@/features/upload/services/presignedUpload";

// ── Constants ─────────────────────────────────────────────────

const GENRES = [
  "Action", "Adventure", "Comedy", "Documentary",
  "Drama", "Horror", "Love", "Mystery", "Romance", "Thriller",
];

const THEMES = [
  "Coming-of-age story", "Good versus evil", "Love", "Redemption",
  "Family", "Death", "Oppression", "Survival", "Revenge", "Justice",
  "War", "Bravery", "Freedom", "Friendship", "Isolation", "Peace", "Perseverance",
];

const RATINGS = [
  { value: "G",     label: "G",     sub: "General Audience"           },
  { value: "PG",    label: "PG",    sub: "Parental Guidance"           },
  { value: "PG-13", label: "PG-13", sub: "Parents Strongly Cautioned"  },
  { value: "R",     label: "R",     sub: "Restricted"                  },
];

const UPLOAD_TIPS = [
  "Use MP4 (H.264) for best compatibility across devices.",
  "Upload a custom thumbnail to increase click-through rates by up to 40%.",
  "Keep titles concise and descriptive — aim for under 60 characters.",
  "Tag accurate genres so the right audience finds your content.",
  "A strong description with keywords boosts search visibility.",
];

const FORMAT_TIPS = [
  "Video: MP4, MOV, AVI, WebM — up to 500 MB",
  "Thumbnail: any image — auto-converted to WebP on upload",
  "Recommended ratio: 16:9 (1920×1080 for best quality)",
  "Min resolution: 720p for HD badge on your listing",
];

const GUIDELINES = [
  "Content must comply with WeCinema Community Guidelines.",
  "No content depicting real violence, adult material, or copyright infringement.",
  "HypeMode content is featured and earns higher revenue share.",
  "For Sale videos are held in escrow until the buyer confirms delivery.",
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

function DropZone({
  accept,
  file,
  onFile,
  onClear,
  icon: Icon,
  label,
  hint,
}: {
  accept: string;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  icon: React.ElementType;
  label: string;
  hint: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => ref.current?.click()}
      style={{
        border: `2px dashed ${file ? "rgba(139,92,246,0.6)" : "var(--color-border-secondary)"}`,
        borderRadius: 14,
        padding: "24px 16px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: file ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.01)",
        transition: "all 0.15s",
      }}
    >
      {file ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Icon style={{ width: 18, height: 18, color: "rgb(167,139,250)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
            {file.name}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", padding: 0 }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(139,92,246,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
            }}
          >
            <Icon style={{ width: 22, height: 22, color: "var(--color-text-tertiary)", opacity: 0.6 }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>{hint}</p>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ width: "100%", height: 6, borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: "linear-gradient(to right, rgb(124,58,237), rgb(168,85,247))",
          borderRadius: 9999,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function UploadVideoPage() {
  const router = useRouter();
  const { status } = useAuth();

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres]         = useState<string[]>([]);
  const [themes, setThemes]         = useState<string[]>([]);
  const [rating, setRating]         = useState("");
  const [hasPaid, setHasPaid]       = useState(false);
  const [isForSale, setIsForSale]   = useState(false);
  const [videoFile, setVideoFile]   = useState<File | null>(null);
  const [thumbFile, setThumbFile]   = useState<File | null>(null);
  const [progress, setProgress]     = useState(0);
  const [uploading, setUploading]   = useState(false);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleVideoFile = (f: File) => {
    if (f.size > 500 * 1024 * 1024) { toast.error("Video must be under 500 MB"); return; }
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    setVideoFile(f);
  };

  const handleThumbFile = (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setThumbFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile)          { toast.error("Please select a video file"); return; }
    if (!thumbFile)          { toast.error("Please add a thumbnail image"); return; }
    if (!title.trim())       { toast.error("Title is required"); return; }
    if (genres.length === 0) { toast.error("Select at least one genre"); return; }
    if (!rating)             { toast.error("Please select a rating"); return; }

    setUploading(true);
    setProgress(0);

    try {
      const videoAsset = await uploadDirectToS3(
        "video",
        videoFile,
        (pct) => setProgress(Math.round(pct * 0.9)),
      );

      let thumbnailKey: string | undefined;
      if (thumbFile) {
        const thumbAsset = await uploadDirectToS3(
          "thumbnail",
          thumbFile,
          (pct) => setProgress(90 + Math.round(pct * 0.09)),
        );
        thumbnailKey = thumbAsset.key;
      }

      setProgress(99);

      await api.post("/video/create", {
        fileKey: videoAsset.key,
        ...(thumbnailKey ? { thumbnailKey } : {}),
        title: title.trim(),
        description: description.trim(),
        genre: genres,
        theme: themes,
        rating,
        hasPaid,
        isForSale,
      } as Record<string, unknown>);

      setProgress(100);
      setDone(true);
      toast.success("Video uploaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setDone(false);
    setVideoFile(null);
    setThumbFile(null);
    setTitle("");
    setDescription("");
    setGenres([]);
    setThemes([]);
    setRating("");
    setProgress(0);
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
          Upload Complete!
        </h2>
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
          Your video is being processed and will appear on your profile shortly.
        </p>
        <p style={{ margin: "0 0 32px", fontSize: 12, color: "var(--color-text-tertiary)", opacity: 0.7 }}>
          Transcoding typically takes 2–10 minutes depending on file size.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => router.push("/")}
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
            Go Home
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
        {/* Decorative blur blob */}
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
            <Video style={{ width: 28, height: 28, color: "#fff" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>WeCinema</span>
              <ChevronRight style={{ width: 12, height: 12, color: "var(--color-text-tertiary)" }} />
              <span style={{ fontSize: 12, color: "rgb(167,139,250)", fontWeight: 600 }}>Upload Video</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
              Upload Your Film
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>
              Share your creative work with the WeCinema community
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6 items-start">
        {/* ── Left: form ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Section: Media Files */}
          <SectionCard icon={Upload} title="Media Files">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Video File</FieldLabel>
                <DropZone
                  accept="video/*"
                  file={videoFile}
                  onFile={handleVideoFile}
                  onClear={() => setVideoFile(null)}
                  icon={Video}
                  label="Click to select a video"
                  hint="MP4, MOV, AVI · Max 500 MB"
                />
              </div>
              <div>
                <FieldLabel required>Thumbnail</FieldLabel>
                <DropZone
                  accept="image/*"
                  file={thumbFile}
                  onFile={handleThumbFile}
                  onClear={() => setThumbFile(null)}
                  icon={ImageIcon}
                  label="Add a thumbnail image"
                  hint="Required · Any image · Auto-converted to WebP · Recommended 16:9"
                />
              </div>
            </div>
          </SectionCard>

          {/* Section: Content Details */}
          <SectionCard icon={Film} title="Content Details">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <FieldLabel required>Title</FieldLabel>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a compelling title for your video..."
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
                <FieldLabel>Description</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your video — what is it about, who made it, what inspired it..."
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "var(--color-bg-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: 12,
                    color: "var(--color-text-primary)",
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    lineHeight: 1.6,
                  }}
                />
              </div>
            </div>
          </SectionCard>

          {/* Section: Classification */}
          <SectionCard icon={Tag} title="Classification">
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <FieldLabel required>Genre</FieldLabel>
                <MultiSelect options={GENRES} value={genres} onChange={setGenres} />
              </div>
              <div>
                <FieldLabel>Themes</FieldLabel>
                <MultiSelect options={THEMES} value={themes} onChange={setThemes} />
              </div>
              <div>
                <FieldLabel required>Rating</FieldLabel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 8,
                  }}
                >
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRating(r.value)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 12,
                        border: rating === r.value ? "1.5px solid rgb(139,92,246)" : "1px solid var(--color-border-secondary)",
                        backgroundColor: rating === r.value ? "rgba(139,92,246,0.12)" : "var(--color-bg-primary)",
                        color: rating === r.value ? "rgb(167,139,250)" : "var(--color-text-secondary)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{r.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2, lineHeight: 1.3 }}>{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section: Settings */}
          <SectionCard icon={Settings2} title="Distribution Settings">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  label: "HypeMode (Paid Content)",
                  desc: "Your video is gated — viewers pay to access it. Earns higher revenue share.",
                  checked: hasPaid,
                  onChange: setHasPaid,
                },
                {
                  label: "List on Marketplace",
                  desc: "Buyers can purchase a license or full rights to this video content.",
                  checked: isForSale,
                  onChange: setIsForSale,
                },
              ].map(({ label, desc, checked, onChange }) => (
                <label
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    cursor: "pointer",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: checked ? "1px solid rgba(139,92,246,0.4)" : "1px solid var(--color-border-secondary)",
                    backgroundColor: checked ? "rgba(139,92,246,0.06)" : "var(--color-bg-primary)",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ paddingTop: 2 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onChange(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "rgb(124,58,237)", cursor: "pointer" }}
                    />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.4 }}>{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </SectionCard>

          {/* Upload progress */}
          {uploading && (
            <div
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 16,
                padding: "20px 24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="animate-spin"
                    style={{
                      display: "inline-block",
                      width: 14, height: 14,
                      borderRadius: "50%",
                      border: "2px solid rgba(139,92,246,0.3)",
                      borderTopColor: "rgb(139,92,246)",
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {progress < 90 ? "Uploading video…" : progress < 99 ? "Uploading thumbnail…" : "Finalizing…"}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgb(167,139,250)" }}>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>
                Please keep this page open until the upload completes.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !videoFile || !thumbFile}
            style={{
              width: "100%",
              padding: "15px",
              background: "linear-gradient(to right, rgb(124,58,237), rgb(168,85,247))",
              color: "#fff",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              border: "none",
              cursor: uploading || !videoFile || !thumbFile ? "not-allowed" : "pointer",
              opacity: uploading || !videoFile || !thumbFile ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
              boxShadow: uploading || !videoFile || !thumbFile ? "none" : "0 4px 20px rgba(124,58,237,0.4)",
            }}
          >
            {uploading ? (
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
                Uploading…
              </>
            ) : (
              <>
                <Upload style={{ width: 17, height: 17 }} />
                Publish Video
              </>
            )}
          </button>
        </form>

        {/* ── Right: tips sidebar ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <TipCard title="Upload Tips" items={UPLOAD_TIPS} />
          <TipCard title="Supported Formats" items={FORMAT_TIPS} />
          <TipCard title="Content Guidelines" items={GUIDELINES} />
        </div>
      </div>
    </div>
  );
}
