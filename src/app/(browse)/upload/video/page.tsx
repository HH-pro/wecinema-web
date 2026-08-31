"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, ClipboardCheck, Film, ImageIcon,
  Settings2, Tag, Upload, Video,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import { uploadDirectToS3 } from "@/features/upload/services/presignedUpload";
import { UploadWizard, type WizardStep } from "@/features/upload/components/UploadWizard";
import {
  DropZone, FieldLabel, MultiSelect, PageHero, ProgressBar, ReviewRow, TipCard,
  formatBytes, formatDuration, inputStyle, useObjectUrl,
} from "@/features/upload/components/UploadUI";
import { getRentalEligibility } from "@/features/watch/api/rental.service";

// Must match RENTAL_PLANS in wecinema-backend/src/models/videos.js — the
// backend rejects any price that isn't one of these, and derives the play
// window from the price alone.
const RENTAL_PLANS = [
  { priceCents: 500,  playWindowHours: 1,  label: "1 hour"   },
  { priceCents: 1000, playWindowHours: 48, label: "48 hours" },
] as const;
// The backend keeps 10% (config.PLATFORM_FEE_PERCENT_DECIMAL).
const PLATFORM_FEE_RATE = 0.1;

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

const FORMAT_TIPS = [
  "Video: MP4, MOV, AVI, WebM — up to 500 MB",
  "Thumbnail: any image — auto-converted to WebP on upload",
  "Recommended ratio: 16:9 (1920×1080 for best quality)",
  "Min resolution: 720p for HD badge on your listing",
];

const TITLE_TIPS = [
  "Keep titles concise and descriptive — aim for under 60 characters.",
  "A strong description with keywords boosts search visibility.",
  "Open the description with a one-line logline, then the detail.",
  "Credit your cast and crew — it is what collaborators search for.",
];

const TAGGING_TIPS = [
  "Tag accurate genres so the right audience finds your content.",
  "Two or three genres beat ten — precision outranks coverage.",
  "Themes power the /themes browse rows and related-video rails.",
  "The rating is shown on your listing and gates age-restricted rows.",
];

const GUIDELINES = [
  "Content must comply with WeCinema Community Guidelines.",
  "No content depicting real violence, adult material, or copyright infringement.",
  "HypeMode content is featured and earns higher revenue share.",
  "For Sale videos are held in escrow until the buyer confirms delivery.",
];

const REVIEW_TIPS = [
  "Check the thumbnail crop — it is the first thing viewers see.",
  "Transcoding runs after publish; the video appears once it finishes.",
  "You can edit the title, description and tags later from your profile.",
  "Keep this tab open until the upload bar reaches 100%.",
];

// ── Page ──────────────────────────────────────────────────────

export default function UploadVideoPage() {
  const router = useRouter();
  const { status } = useAuth();

  const [step, setStep] = useState(0);

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres]         = useState<string[]>([]);
  const [themes, setThemes]         = useState<string[]>([]);
  const [rating, setRating]         = useState("");
  const [hasPaid, setHasPaid]       = useState(false);
  const [isForSale, setIsForSale]   = useState(false);
  const [isShort, setIsShort]       = useState(false);
  const [duration, setDuration]     = useState<number | null>(null);
  const [videoFile, setVideoFile]   = useState<File | null>(null);
  const [thumbFile, setThumbFile]   = useState<File | null>(null);
  const [progress, setProgress]     = useState(0);
  const [uploading, setUploading]   = useState(false);
  const [done, setDone]             = useState(false);

  // ── Rentals ──────────────────────────────────────────────
  // There is no free-form price: the creator picks one of two plans, and the
  // chosen price is what identifies it to the backend. Held in cents so it can
  // be sent as-is — no dollars string, no parse step, nothing to validate.
  const [isRentable, setIsRentable]     = useState(false);
  const [rentalCents, setRentalCents]   = useState<number>(RENTAL_PLANS[1].priceCents);
  const [payoutState, setPayoutState]   = useState<"loading" | "eligible" | "blocked">("loading");

  const rentalPlan =
    RENTAL_PLANS.find((p) => p.priceCents === rentalCents) ?? RENTAL_PLANS[1];

  // Object URLs for the in-form previews. Revoked when the file changes so a
  // creator swapping thumbnails a dozen times doesn't leak a dozen blobs.
  const thumbUrl = useObjectUrl(thumbFile);
  const videoUrl = useObjectUrl(videoFile);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Check payouts up front so the toggle can be disabled before the creator
  // commits to a 500 MB upload, rather than failing afterwards.
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    getRentalEligibility()
      .then((res) => { if (!cancelled) setPayoutState(res.eligible ? "eligible" : "blocked"); })
      .catch(() => { if (!cancelled) setPayoutState("blocked"); });
    return () => { cancelled = true; };
  }, [status]);

  const handleVideoFile = (f: File) => {
    if (f.size > 500 * 1024 * 1024) { toast.error("Video must be under 500 MB"); return; }
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    setVideoFile(f);
    setDuration(null);

    // Read duration client-side so Shorts can be flagged without a server round-trip.
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration)) {
        setDuration(el.duration);
        setIsShort((prev) => prev || el.duration <= 60);
      }
      URL.revokeObjectURL(el.src);
    };
    el.src = URL.createObjectURL(f);
  };

  const handleThumbFile = (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setThumbFile(f);
  };

  const handleSubmit = async () => {
    setUploading(true);
    setProgress(0);

    try {
      const videoAsset = await uploadDirectToS3(
        "video",
        videoFile!,
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

      const created = await api.post<{ rentalWarning?: { message?: string } }>(
        "/video/create",
        {
          fileKey: videoAsset.key,
          ...(thumbnailKey ? { thumbnailKey } : {}),
          title: title.trim(),
          description: description.trim(),
          genre: genres,
          theme: themes,
          rating,
          hasPaid,
          isForSale,
          isShort,
          isRentable,
          ...(isRentable ? { rentalPriceCents: rentalPlan.priceCents } : {}),
          ...(duration != null ? { duration } : {}),
        } as Record<string, unknown>,
      );

      setProgress(100);
      setDone(true);

      // The upload always succeeds; rentals can still be declined if payouts
      // aren't ready. Say so rather than silently publishing it as free.
      if (created?.rentalWarning) {
        toast.success("Video uploaded successfully!");
        toast.error(
          created.rentalWarning.message ??
            "Renting couldn't be enabled — connect payouts, then turn it on from your video.",
          { duration: 7000 },
        );
      } else {
        toast.success("Video uploaded successfully!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setDone(false);
    setStep(0);
    setVideoFile(null);
    setThumbFile(null);
    setTitle("");
    setDescription("");
    setGenres([]);
    setThemes([]);
    setRating("");
    setHasPaid(false);
    setIsForSale(false);
    setIsShort(false);
    setDuration(null);
    setProgress(0);
    setIsRentable(false);
    setRentalCents(RENTAL_PLANS[1].priceCents);
  };

  // ── Steps ─────────────────────────────────────────────────

  const steps: WizardStep[] = useMemo(() => [
    {
      id: "media",
      title: "Media",
      hint: "Pick the film and the thumbnail viewers will click on.",
      icon: Upload,
      aside: <TipCard title="Supported Formats" items={FORMAT_TIPS} />,
      validate: () =>
        !videoFile ? "Select a video file to continue"
        : !thumbFile ? "Add a thumbnail image to continue"
        : null,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Video File</FieldLabel>
            <DropZone
              accept="video/*"
              file={videoFile}
              onFile={handleVideoFile}
              onClear={() => { setVideoFile(null); setDuration(null); }}
              icon={Video}
              label="Drop a video here or click to browse"
              hint="MP4, MOV, AVI · Max 500 MB"
              preview={
                videoUrl ? (
                  <video
                    src={videoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover", backgroundColor: "#000" }}
                  />
                ) : undefined
              }
            />
            {duration != null && (
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>
                Duration {formatDuration(duration)}
                {duration <= 60 && " · qualifies as a Short"}
              </p>
            )}
          </div>
          <div>
            <FieldLabel required>Thumbnail</FieldLabel>
            <DropZone
              accept="image/*"
              file={thumbFile}
              onFile={handleThumbFile}
              onClear={() => setThumbFile(null)}
              icon={ImageIcon}
              label="Drop an image here or click to browse"
              hint="Any image · Auto-converted to WebP · Recommended 16:9"
              preview={
                thumbUrl ? (
                  // Local blob preview — next/image would proxy it pointlessly.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbUrl}
                    alt="Selected thumbnail"
                    style={{ display: "block", width: "100%", aspectRatio: "16 / 9", objectFit: "cover", backgroundColor: "#000" }}
                  />
                ) : undefined
              }
            />
          </div>
        </div>
      ),
    },
    {
      id: "details",
      title: "Details",
      hint: "Title and description — this is what search and the cards show.",
      icon: Film,
      aside: <TipCard title="Writing Tips" items={TITLE_TIPS} />,
      validate: () => (!title.trim() ? "A title is required to continue" : null),
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <FieldLabel required>Title</FieldLabel>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title for your video..."
              maxLength={120}
              style={inputStyle}
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
              rows={6}
              placeholder="Describe your video — what is it about, who made it, what inspired it..."
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
            />
          </div>
        </div>
      ),
    },
    {
      id: "classification",
      title: "Tags",
      hint: "Genres, themes and rating decide where your film gets shown.",
      icon: Tag,
      aside: <TipCard title="Tagging Tips" items={TAGGING_TIPS} />,
      validate: () =>
        genres.length === 0 ? "Select at least one genre to continue"
        : !rating ? "Select a rating to continue"
        : null,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <FieldLabel required>Genre</FieldLabel>
            <MultiSelect options={GENRES} value={genres} onChange={setGenres} customPlaceholder="Add a custom genre…" />
          </div>
          <div>
            <FieldLabel>Themes</FieldLabel>
            <MultiSelect options={THEMES} value={themes} onChange={setThemes} customPlaceholder="Add a custom theme…" />
          </div>
          <div>
            <FieldLabel required>Rating</FieldLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RATINGS.map((r) => {
                const on = rating === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setRating(r.value)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 12,
                      border: on ? "1.5px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                      backgroundColor: on ? "var(--accent-soft)" : "var(--color-bg-primary)",
                      color: on ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2, lineHeight: 1.3 }}>{r.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "distribution",
      title: "Distribution",
      hint: "How viewers get access, and how you get paid. All optional.",
      icon: Settings2,
      aside: <TipCard title="Content Guidelines" items={GUIDELINES} />,
      content: (
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
            {
              label: "This is a Short",
              desc: "Vertical, quick-watch content — shown in the homepage Shorts row instead of regular rows.",
              checked: isShort,
              onChange: setIsShort,
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
                border: checked ? "1px solid var(--color-accent-primary)" : "1px solid var(--color-border-secondary)",
                backgroundColor: checked ? "var(--accent-soft)" : "var(--color-bg-primary)",
                transition: "all 0.15s",
              }}
            >
              <div style={{ paddingTop: 2 }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--color-accent-primary)", cursor: "pointer" }}
                />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.4 }}>{desc}</p>
              </div>
            </label>
          ))}

          {/* Rentals — rendered outside the checkbox map because it reveals
              a plan picker when enabled. Styling intentionally mirrors the
              labels above. */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: isRentable
                ? "1px solid var(--color-accent-primary)"
                : "1px solid var(--color-border-secondary)",
              backgroundColor: isRentable ? "var(--accent-soft)" : "var(--color-bg-primary)",
              transition: "all 0.15s",
              opacity: payoutState === "blocked" ? 0.75 : 1,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: payoutState === "eligible" ? "pointer" : "not-allowed",
              }}
            >
              <div style={{ paddingTop: 2 }}>
                <input
                  type="checkbox"
                  checked={isRentable}
                  disabled={payoutState !== "eligible"}
                  onChange={(e) => setIsRentable(e.target.checked)}
                  style={{
                    width: 16, height: 16,
                    accentColor: "var(--color-accent-primary)",
                    cursor: payoutState === "eligible" ? "pointer" : "not-allowed",
                  }}
                />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                  Rent this film
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.4 }}>
                  Viewers pay once to watch. They get 30 days to press play, then the
                  window you pick below runs from first play.
                </p>
              </div>
            </label>

            {payoutState === "blocked" && (
              <p style={{ margin: "10px 0 0 28px", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
                Renting needs a payout account so we can send you the money.{" "}
                <Link href="/marketplace/dashboard/seller" style={{ color: "var(--color-accent-primary)", fontWeight: 600 }}>
                  Connect payouts
                </Link>{" "}
                to enable it.
              </p>
            )}

            {isRentable && payoutState === "eligible" && (
              <div style={{ margin: "14px 0 0 28px" }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  Rental plan
                </p>

                <div role="radiogroup" aria-label="Rental plan" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {RENTAL_PLANS.map((plan) => {
                    const active = rentalCents === plan.priceCents;
                    return (
                      <button
                        key={plan.priceCents}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setRentalCents(plan.priceCents)}
                        style={{
                          padding: "10px 18px",
                          borderRadius: 12,
                          textAlign: "left",
                          cursor: "pointer",
                          border: active
                            ? "1px solid var(--color-accent-primary)"
                            : "1px solid var(--color-border-secondary)",
                          backgroundColor: active ? "var(--accent-soft)" : "transparent",
                          color: active ? "var(--color-accent-primary)" : "var(--color-text-secondary)",
                        }}
                      >
                        <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>
                          ${(plan.priceCents / 100).toFixed(2)}
                        </span>
                        <span style={{ display: "block", marginTop: 2, fontSize: 12, fontWeight: 600 }}>
                          {plan.label} to watch
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
                  You earn ${((rentalPlan.priceCents * (1 - PLATFORM_FEE_RATE)) / 100).toFixed(2)} per rental
                  after the {Math.round(PLATFORM_FEE_RATE * 100)}% platform fee.
                </p>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "review",
      title: "Review",
      hint: "One last look before it goes live.",
      icon: ClipboardCheck,
      aside: <TipCard title="Before You Publish" items={REVIEW_TIPS} />,
      content: (
        <div>
          <div style={{ display: "flex", gap: 16, marginBottom: 4, flexWrap: "wrap" }}>
            <div
              style={{
                width: 168, aspectRatio: "16 / 9", flexShrink: 0,
                borderRadius: 12, overflow: "hidden",
                backgroundColor: "var(--color-bg-primary)",
                border: "1px solid var(--color-border-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbUrl} alt="Thumbnail preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ImageIcon style={{ width: 22, height: 22, color: "var(--color-text-tertiary)" }} aria-hidden />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                {title.trim() || "Untitled"}
              </h3>
              <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
                {description.trim() || "No description added."}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <ReviewRow label="Video file">
              {videoFile
                ? `${videoFile.name} · ${formatBytes(videoFile.size)}${duration != null ? ` · ${formatDuration(duration)}` : ""}`
                : "—"}
            </ReviewRow>
            <ReviewRow label="Genre">{genres.length ? genres.join(", ") : "—"}</ReviewRow>
            <ReviewRow label="Themes">{themes.length ? themes.join(", ") : "None"}</ReviewRow>
            <ReviewRow label="Rating">{rating || "—"}</ReviewRow>
            <ReviewRow label="Distribution">
              {[
                hasPaid && "HypeMode",
                isForSale && "On Marketplace",
                isShort && "Short",
                isRentable && `Rental $${(rentalPlan.priceCents / 100).toFixed(2)} / ${rentalPlan.label}`,
              ].filter(Boolean).join(" · ") || "Free to watch"}
            </ReviewRow>
            {isRentable && (
              <ReviewRow label="You earn">
                ${((rentalPlan.priceCents * (1 - PLATFORM_FEE_RATE)) / 100).toFixed(2)} per rental
              </ReviewRow>
            )}
          </div>
        </div>
      ),
    },
  ], [
    videoFile, thumbFile, videoUrl, thumbUrl, duration,
    title, description, genres, themes, rating,
    hasPaid, isForSale, isShort, isRentable, rentalCents, rentalPlan, payoutState,
  ]);

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
              background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
              color: "var(--color-btn-primary-text, #000)",
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

  // ── Wizard ────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 16px 64px" }}>
      <PageHero
        icon={Video}
        crumb="Upload Video"
        heading="Upload Your Film"
        sub="Share your creative work with the WeCinema community"
      />

      <UploadWizard
        steps={steps}
        index={step}
        onIndexChange={setStep}
        onSubmit={handleSubmit}
        submitLabel="Publish Video"
        submitIcon={Upload}
        submitting={uploading}
        submittingLabel="Uploading…"
        footer={
          uploading ? (
            <div
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-accent-primary)",
                borderRadius: 16,
                padding: "20px 24px",
                marginTop: 18,
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
                      border: "2px solid var(--accent-ring)",
                      borderTopColor: "var(--color-accent-primary)",
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {progress < 90 ? "Uploading video…" : progress < 99 ? "Uploading thumbnail…" : "Finalizing…"}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent-primary)" }}>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>
                Please keep this page open until the upload completes.
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
