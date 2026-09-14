import { describe, expect, it } from "vitest";
import { validateDealForm, type DealFormValues } from "../dealSchema";

const base: DealFormValues = {
  amount: "18,000",
  dealType: "streaming_license",
  rights: "svod_rights",
  territory: "us_canada",
  termMonths: 24,
  exclusivity: "non_exclusive",
  paymentType: "flat_fee",
  deliveryMaterials: "prores_master_package",
  notes: "Happy to increase the offer to $18,000.",
};

describe("validateDealForm", () => {
  it("converts valid input into API terms in cents", () => {
    const result = validateDealForm(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.terms).toMatchObject({ amountCents: 1_800_000, currency: "USD", termMonths: 24 });
    }
  });

  it("trims notes", () => {
    const result = validateDealForm({ ...base, notes: "  hi  " });
    expect(result.ok && result.terms.notes).toBe("hi");
  });

  it("requires an amount", () => {
    const result = validateDealForm({ ...base, amount: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toBeDefined();
  });

  it("rejects amounts below the minimum", () => {
    const result = validateDealForm({ ...base, amount: "0.10" });
    expect(!result.ok && result.errors.amount).toMatch(/Minimum/);
  });

  it("rejects amounts above the maximum", () => {
    const result = validateDealForm({ ...base, amount: "1000000" });
    expect(!result.ok && result.errors.amount).toMatch(/Maximum/);
  });

  it("rejects non-numeric amounts", () => {
    expect(validateDealForm({ ...base, amount: "lots" }).ok).toBe(false);
  });

  it("rejects notes over 500 characters", () => {
    const result = validateDealForm({ ...base, notes: "x".repeat(501) });
    expect(!result.ok && result.errors.notes).toBeDefined();
  });

  it("accepts notes of exactly 500 characters", () => {
    expect(validateDealForm({ ...base, notes: "x".repeat(500) }).ok).toBe(true);
  });

  it("rejects option keys the backend doesn't know", () => {
    const result = validateDealForm({ ...base, territory: "atlantis" });
    expect(!result.ok && result.errors.territory).toBeDefined();
  });

  it("rejects term lengths outside the allowed set", () => {
    const result = validateDealForm({ ...base, termMonths: 7 });
    expect(!result.ok && result.errors.termMonths).toBeDefined();
  });

  it("accepts a perpetual term", () => {
    expect(validateDealForm({ ...base, termMonths: 0 }).ok).toBe(true);
  });
});
