"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { FileText, Loader2, Send, ShieldCheck, X } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  DEAL_TYPES,
  DELIVERY_MATERIALS,
  EXCLUSIVITY,
  NOTES_MAX,
  PAYMENT_TYPES,
  RIGHTS,
  TERM_MONTHS,
  TERRITORIES,
  type DealOption,
} from "../lib/constants";
import { centsToDollarsInput, dollarsToCents, termsEqual } from "../lib/dealFormat";
import { validateDealForm, type DealFormErrors, type DealFormValues } from "../lib/dealSchema";
import { accentOutline } from "./styles";
import type { DealTerms } from "../types/deal.types";

type SelectField = "dealType" | "rights" | "territory" | "exclusivity" | "paymentType" | "deliveryMaterials";

export function termsToFormValues(t: DealTerms): DealFormValues {
  return {
    amount: centsToDollarsInput(t.amountCents),
    dealType: t.dealType,
    rights: t.rights,
    territory: t.territory,
    termMonths: t.termMonths,
    exclusivity: t.exclusivity,
    paymentType: t.paymentType,
    deliveryMaterials: t.deliveryMaterials,
    notes: t.notes ?? "",
  };
}

function Row({
  id,
  label,
  required,
  error,
  alignTop,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  alignTop?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-[96px_minmax(0,1fr)] gap-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3 ${
        alignTop ? "items-start" : "items-center"
      }`}
    >
      <label htmlFor={id} className={`text-[11px] text-text-secondary sm:text-xs ${alignTop ? "pt-2" : ""}`}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <div className="min-w-0">
        {children}
        {error && (
          <p className="mt-1 text-[11px] text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

interface DealTermsFormProps {
  initialTerms: DealTerms;
  title?: string;
  submitLabel: string;
  busy?: boolean;
  /** When set, identical terms are rejected client-side (a counter must change something). */
  unchangedFrom?: DealTerms;
  onSubmit: (terms: DealTerms) => void;
  onCancel: () => void;
  /** Fires on every amount keystroke with integer cents, or null when empty/invalid. */
  onAmountChange?: (cents: number | null) => void;
  footnote?: string;
}

export function DealTermsForm({
  initialTerms,
  title = "Counter Offer Terms",
  submitLabel,
  busy = false,
  unchangedFrom,
  onSubmit,
  onCancel,
  onAmountChange,
  footnote = "Your offer will be sent securely through WeCinema.",
}: DealTermsFormProps) {
  const [values, setValues] = useState<DealFormValues>(() => termsToFormValues(initialTerms));
  const [errors, setErrors] = useState<DealFormErrors>({});

  const update = <K extends keyof DealFormValues>(key: K, value: DealFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    if (key === "amount") {
      const raw = String(value);
      const cents = dollarsToCents(raw);
      onAmountChange?.(raw.trim() && Number.isFinite(cents) ? cents : null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const result = validateDealForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (unchangedFrom && termsEqual(result.terms, unchangedFrom)) {
      toast.error("Change at least one term before sending a counter offer.");
      return;
    }
    onSubmit(result.terms);
  };

  const select = (field: SelectField, label: string, options: DealOption[]) => (
    <Row id={`deal-${field}`} label={label} error={errors[field]}>
      <select
        id={`deal-${field}`}
        className="mp-select !py-2 !text-xs"
        value={values[field]}
        onChange={(e) => update(field, e.target.value)}
        disabled={busy}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Row>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <section className="mp-card p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-text-primary">
          <FileText size={15} className="text-text-secondary" aria-hidden="true" />
          {title}
        </h3>

        <div className="space-y-2.5">
          <Row id="deal-amount" label="Offer Amount" required error={errors.amount}>
            <div className="flex items-stretch overflow-hidden rounded-[10px] border border-input-border bg-input-bg focus-within:border-input-focus">
              <span
                className="flex items-center px-3 text-xs font-bold text-accent"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-accent-primary) 10%, transparent)" }}
                aria-hidden="true"
              >
                $
              </span>
              <input
                id="deal-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-text-primary outline-none"
                value={values.amount}
                onChange={(e) => update("amount", e.target.value)}
                placeholder="0"
                aria-invalid={!!errors.amount}
                disabled={busy}
              />
            </div>
          </Row>

          {select("dealType", "Deal Type", DEAL_TYPES)}
          {select("rights", "Rights", RIGHTS)}
          {select("territory", "Territory", TERRITORIES)}

          <Row id="deal-termMonths" label="Term Length" error={errors.termMonths}>
            <select
              id="deal-termMonths"
              className="mp-select !py-2 !text-xs"
              value={String(values.termMonths)}
              onChange={(e) => update("termMonths", Number(e.target.value))}
              disabled={busy}
            >
              {TERM_MONTHS.map((o) => (
                <option key={o.value} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
          </Row>

          {select("exclusivity", "Exclusivity", EXCLUSIVITY)}
          {select("paymentType", "Payment Type", PAYMENT_TYPES)}
          {select("deliveryMaterials", "Delivery Materials", DELIVERY_MATERIALS)}

          <Row id="deal-notes" label="Additional Notes" error={errors.notes} alignTop>
            <textarea
              id="deal-notes"
              className="mp-textarea !text-xs"
              rows={3}
              maxLength={NOTES_MAX}
              value={values.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Anything the other party should know"
              disabled={busy}
            />
            <p className="mt-1 text-right text-[10px] tabular-nums text-text-tertiary">
              {values.notes.length}/{NOTES_MAX}
            </p>
          </Row>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <button type="submit" disabled={busy} className="mp-btn mp-btn-primary !h-10">
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="mp-btn mp-btn-secondary !h-10" style={accentOutline}>
          <X size={14} aria-hidden="true" />
          Cancel
        </button>
      </div>

      {footnote && (
        <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-text-tertiary">
          <ShieldCheck size={12} aria-hidden="true" />
          {footnote}
        </p>
      )}
    </form>
  );
}
