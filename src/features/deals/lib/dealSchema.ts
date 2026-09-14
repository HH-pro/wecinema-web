/**
 * Zod schema for the deal terms form (create + counter).
 *
 * The form works in dollars as typed; `toTerms` converts to the integer cents the
 * API expects. Enum values are validated against the option lists so a stale
 * client can't submit a key the backend no longer accepts.
 */

import { z } from "zod";
import {
  AMOUNT_MAX_CENTS,
  AMOUNT_MIN_CENTS,
  DEAL_TYPES,
  DELIVERY_MATERIALS,
  EXCLUSIVITY,
  NOTES_MAX,
  PAYMENT_TYPES,
  RIGHTS,
  TERM_MONTHS,
  TERRITORIES,
  type DealOption,
} from "./constants";
import { dollarsToCents } from "./dealFormat";
import type { DealTerms } from "../types/deal.types";

const oneOf = (options: DealOption[], label: string) =>
  z.string().refine((v) => options.some((o) => o.value === v), { message: `Select a valid ${label}` });

export const dealFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Enter an offer amount")
    .refine((v) => Number.isFinite(dollarsToCents(v)), "Enter a valid amount")
    .refine((v) => dollarsToCents(v) >= AMOUNT_MIN_CENTS, `Minimum offer is $${AMOUNT_MIN_CENTS / 100}`)
    .refine(
      (v) => dollarsToCents(v) <= AMOUNT_MAX_CENTS,
      `Maximum offer is $${(AMOUNT_MAX_CENTS / 100).toLocaleString("en-US")}`,
    ),
  dealType: oneOf(DEAL_TYPES, "deal type"),
  rights: oneOf(RIGHTS, "rights option"),
  territory: oneOf(TERRITORIES, "territory"),
  termMonths: z
    .number()
    .refine((v) => TERM_MONTHS.some((o) => o.value === v), { message: "Select a valid term length" }),
  exclusivity: oneOf(EXCLUSIVITY, "exclusivity"),
  paymentType: oneOf(PAYMENT_TYPES, "payment type"),
  deliveryMaterials: oneOf(DELIVERY_MATERIALS, "delivery option"),
  notes: z.string().max(NOTES_MAX, `Notes can be at most ${NOTES_MAX} characters`),
});

export type DealFormValues = z.input<typeof dealFormSchema>;

export type DealFormErrors = Partial<Record<keyof DealFormValues, string>>;

export function toTerms(values: z.output<typeof dealFormSchema>): DealTerms {
  return {
    amountCents: dollarsToCents(values.amount),
    currency: "USD",
    dealType: values.dealType,
    rights: values.rights,
    territory: values.territory,
    termMonths: values.termMonths,
    exclusivity: values.exclusivity,
    paymentType: values.paymentType,
    deliveryMaterials: values.deliveryMaterials,
    notes: values.notes.trim(),
  };
}

/** Validate form values; returns terms on success or a field→message map. */
export function validateDealForm(
  values: DealFormValues,
): { ok: true; terms: DealTerms } | { ok: false; errors: DealFormErrors } {
  const parsed = dealFormSchema.safeParse(values);
  if (parsed.success) return { ok: true, terms: toTerms(parsed.data) };
  const errors: DealFormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof DealFormValues | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
