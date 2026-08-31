"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import toast from "react-hot-toast";

/**
 * A step in the upload wizard.
 *
 * `validate` returns an error message to block forward navigation, or null when
 * the step is complete. It is also what drives the stepper's "done" ticks, so
 * it must be a cheap pure read of the page's state — it runs on every render.
 */
export type WizardStep = {
  id: string;
  title: string;
  /** One line under the step title inside the panel. */
  hint: string;
  icon: React.ElementType;
  content: React.ReactNode;
  /** Contextual sidebar for this step. */
  aside?: React.ReactNode;
  validate?: () => string | null;
};

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

// ── Stepper rail ──────────────────────────────────────────────

function Stepper({
  steps,
  index,
  furthest,
  isDone,
  onJump,
}: {
  steps: WizardStep[];
  index: number;
  furthest: number;
  isDone: (i: number) => boolean;
  onJump: (i: number) => void;
}) {
  return (
    <ol
      className="upload-wizard-rail"
      style={{
        display: "flex",
        alignItems: "flex-start",
        listStyle: "none",
        margin: "0 0 20px",
        padding: 0,
        // The rail is wider than a phone; let it scroll rather than crush the
        // labels into two-line stacks.
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {steps.map((step, i) => {
        const active = i === index;
        const complete = i !== index && i <= furthest && isDone(i);
        // Steps ahead of the furthest one reached are not clickable — jumping
        // to "Review" from step 1 would show an empty summary.
        const reachable = i <= furthest;

        return (
          <li key={step.id} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 96 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
              <button
                type="button"
                onClick={() => reachable && onJump(i)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: reachable ? "pointer" : "default",
                  transition: `background-color 0.25s ${EASE}, border-color 0.25s ${EASE}, box-shadow 0.25s ${EASE}`,
                  border: active || complete
                    ? "1.5px solid var(--color-accent-primary)"
                    : "1.5px solid var(--color-border-secondary)",
                  background: active
                    ? "linear-gradient(135deg, var(--color-accent-primary), #FFCB33)"
                    : complete
                      ? "var(--accent-soft)"
                      : "var(--color-bg-primary)",
                  color: active
                    ? "var(--color-btn-primary-text, #000)"
                    : complete
                      ? "var(--color-accent-primary)"
                      : "var(--color-text-tertiary)",
                  boxShadow: active ? "0 4px 14px var(--accent-ring)" : "none",
                }}
              >
                {complete ? <Check style={{ width: 15, height: 15 }} aria-hidden /> : i + 1}
              </button>
              <span
                style={{
                  marginTop: 7,
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  textAlign: "center",
                  lineHeight: 1.3,
                  color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  transition: `color 0.25s ${EASE}`,
                  whiteSpace: "nowrap",
                }}
              >
                {step.title}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                aria-hidden
                style={{
                  flex: 1,
                  height: 2,
                  minWidth: 12,
                  marginTop: 16,
                  borderRadius: 2,
                  background: i < index ? "var(--color-accent-primary)" : "var(--color-border-secondary)",
                  transition: `background-color 0.3s ${EASE}`,
                }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Wizard ────────────────────────────────────────────────────

export function UploadWizard({
  steps,
  index,
  onIndexChange,
  onSubmit,
  submitLabel,
  submitIcon: SubmitIcon,
  submitting,
  submittingLabel,
  footer,
}: {
  steps: WizardStep[];
  index: number;
  onIndexChange: (i: number) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitIcon: React.ElementType;
  submitting: boolean;
  submittingLabel: string;
  /** Rendered above the nav bar on the last step — e.g. the upload progress. */
  footer?: React.ReactNode;
}) {
  const [furthest, setFurthest] = useState(index);
  const [height, setHeight] = useState<number>();
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const topRef = useRef<HTMLDivElement>(null);
  // Suppresses the scroll-into-view on first paint: only a step *change* should
  // move the viewport, not landing on the page.
  const mounted = useRef(false);

  const last = steps.length - 1;
  const isDone = useCallback((i: number) => steps[i]?.validate?.() == null, [steps]);

  // The deck is as tall as the visible panel; the others are laid out beside it
  // and would otherwise stretch the container to the tallest one.
  useLayoutEffect(() => {
    const el = panelRefs.current[index];
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index]);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    panelRefs.current[index]?.focus({ preventScroll: true });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index]);

  const goTo = (i: number) => {
    const target = Math.max(0, Math.min(last, i));
    if (target === index) return;
    setFurthest((f) => Math.max(f, target));
    onIndexChange(target);
  };

  const next = () => {
    const error = steps[index]?.validate?.();
    if (error) { toast.error(error); return; }
    goTo(index + 1);
  };

  // Only the last step renders a submit button, so Enter is otherwise inert.
  // Treat it as "continue" — textareas keep their newlines, and the tag input
  // stops the event itself so adding a tag doesn't skip the step.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || index >= last) return;
    if (!(e.target instanceof HTMLInputElement)) return;
    if (e.target.type === "checkbox" || e.target.type === "file") return;
    e.preventDefault();
    next();
  };

  // Enter on the last step fires submit. Re-check every step first — publishing
  // a form that was skipped past would post half a video.
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (index < last) { next(); return; }
    const firstBad = steps.findIndex((s) => s.validate?.() != null);
    if (firstBad !== -1) {
      toast.error(steps[firstBad]?.validate?.() ?? "Please complete every step");
      goTo(firstBad);
      return;
    }
    onSubmit();
  };

  const navBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "12px 22px",
    borderRadius: 12,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    transition: `opacity 0.15s, background-color 0.15s`,
  };

  return (
    <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown}>
      <div ref={topRef} style={{ scrollMarginTop: 96 }} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_288px] gap-6 items-start">
        <div style={{ minWidth: 0 }}>
          <Stepper steps={steps} index={index} furthest={furthest} isDone={isDone} onJump={goTo} />

          {/*
            Deck viewport. Every panel is stacked in the same grid cell and
            slides on its own transform, rather than sitting side by side in one
            wide translated track: with a track, focusing a control inside the
            visible panel makes the browser scroll this clipping box sideways to
            "reveal" a panel the transform had already brought into view, and the
            layout shifts permanently. Same cell for all panels means there is
            nothing to scroll to.
          */}
          <div
            className="upload-wizard-viewport"
            onScroll={(e) => { e.currentTarget.scrollLeft = 0; e.currentTarget.scrollTop = 0; }}
            style={{ display: "grid", overflow: "hidden", height: height ?? "auto" }}
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  ref={(el) => { panelRefs.current[i] = el; }}
                  role="group"
                  aria-label={`Step ${i + 1} of ${steps.length}: ${step.title}`}
                  tabIndex={-1}
                  // Off-screen panels stay mounted so their state and selected
                  // files survive; `inert` keeps them out of the tab order.
                  inert={i !== index}
                  className="upload-wizard-panel"
                  style={{
                    gridArea: "1 / 1",
                    alignSelf: "start",
                    minWidth: 0,
                    transform: `translateX(${(i - index) * 100}%)`,
                    opacity: i === index ? 1 : 0,
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border-secondary)",
                      borderRadius: 20,
                      padding: "26px 28px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: "var(--accent-soft)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Icon style={{ width: 19, height: 19, color: "var(--color-accent-primary)" }} aria-hidden />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-accent-primary)" }}>
                          Step {i + 1} of {steps.length}
                        </p>
                        <h2 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.2px" }}>
                          {step.title}
                        </h2>
                        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
                          {step.hint}
                        </p>
                      </div>
                    </div>
                    {step.content}
                  </div>
                </div>
              );
            })}
          </div>

          {index === last && footer}

          {/* Nav bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 18 }}>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0 || submitting}
              style={{
                ...navBtn,
                border: "1px solid var(--color-border-secondary)",
                backgroundColor: "transparent",
                color: "var(--color-text-secondary)",
                visibility: index === 0 ? "hidden" : "visible",
                opacity: submitting ? 0.5 : 1,
              }}
            >
              <ArrowLeft style={{ width: 15, height: 15 }} aria-hidden />
              Back
            </button>

            {index < last ? (
              <button
                type="button"
                onClick={next}
                style={{
                  ...navBtn,
                  border: "none",
                  background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
                  color: "var(--color-btn-primary-text, #000)",
                  padding: "12px 26px",
                  boxShadow: "0 4px 16px var(--accent-ring)",
                }}
              >
                Continue
                <ArrowRight style={{ width: 15, height: 15 }} aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...navBtn,
                  border: "none",
                  background: "linear-gradient(to right, var(--color-accent-primary), #FFCB33)",
                  color: "var(--color-btn-primary-text, #000)",
                  padding: "13px 30px",
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  boxShadow: submitting ? "none" : "0 4px 20px var(--accent-ring)",
                }}
              >
                {submitting ? (
                  <>
                    <span
                      className="animate-spin"
                      style={{
                        display: "inline-block", width: 15, height: 15, borderRadius: "50%",
                        border: "2px solid rgba(0,0,0,0.25)",
                        borderTopColor: "var(--color-btn-primary-text, #000)",
                      }}
                    />
                    {submittingLabel}
                  </>
                ) : (
                  <>
                    <SubmitIcon style={{ width: 16, height: 16 }} aria-hidden />
                    {submitLabel}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Contextual sidebar — swaps with the step. */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">{steps[index]?.aside}</div>
      </div>
    </form>
  );
}
