/**
 * Deal option enums + display labels.
 *
 * The backend stores and validates the keys; the frontend owns the labels.
 * Keep the keys in sync with wecinema-backend/src/constants/deals.js.
 */

import type { DealFilter, DealTerms } from "../types/deal.types";

export interface DealOption<V extends string | number = string> {
  value: V;
  label: string;
  /** Compact label for stat tiles / cards, when the full one is long. */
  short?: string;
}

export const DEAL_TYPES: DealOption[] = [
  { value: "streaming_license",  label: "Streaming License" },
  { value: "svod",               label: "SVOD License" },
  { value: "avod",               label: "AVOD License" },
  { value: "tvod",               label: "TVOD License" },
  { value: "theatrical",         label: "Theatrical Release" },
  { value: "broadcast_tv",       label: "Broadcast TV" },
  { value: "distribution",       label: "Distribution" },
  { value: "festival_screening", label: "Festival Screening" },
  { value: "adaptation_rights",  label: "Adaptation Rights" },
  { value: "remake_rights",      label: "Remake Rights" },
  { value: "full_purchase",      label: "Full Purchase" },
  { value: "commission",         label: "Commission" },
];

export const RIGHTS: DealOption[] = [
  { value: "svod_rights",          label: "SVOD rights (subscription streaming)", short: "SVOD rights" },
  { value: "avod_rights",          label: "AVOD rights (ad-supported streaming)", short: "AVOD rights" },
  { value: "tvod_rights",          label: "TVOD rights (rental / purchase)",      short: "TVOD rights" },
  { value: "all_digital_rights",   label: "All digital rights" },
  { value: "theatrical_rights",    label: "Theatrical rights" },
  { value: "tv_rights",            label: "TV rights" },
  { value: "home_video_rights",    label: "Home video rights" },
  { value: "all_media_rights",     label: "All media rights" },
  { value: "adaptation_rights",    label: "Adaptation rights" },
  { value: "remake_sequel_rights", label: "Remake & sequel rights" },
];

export const TERRITORIES: DealOption[] = [
  { value: "worldwide",     label: "Worldwide" },
  { value: "us_canada",     label: "United States & Canada", short: "US & Canada" },
  { value: "usa",           label: "United States" },
  { value: "canada",        label: "Canada" },
  { value: "latin_america", label: "Latin America" },
  { value: "uk_ireland",    label: "UK & Ireland" },
  { value: "europe",        label: "Europe" },
  { value: "mena",          label: "Middle East & North Africa", short: "MENA" },
  { value: "africa",        label: "Africa" },
  { value: "asia_pacific",  label: "Asia Pacific" },
  { value: "india",         label: "India" },
  { value: "china",         label: "China" },
  { value: "australia_nz",  label: "Australia & New Zealand", short: "AU & NZ" },
  { value: "other",         label: "Other (see notes)", short: "Other" },
];

/** 0 = perpetual. */
export const TERM_MONTHS: DealOption<number>[] = [6, 12, 24, 36, 60, 84, 120, 0].map((m) => ({
  value: m,
  label: m === 0 ? "Perpetual" : `${m} months`,
}));

export const EXCLUSIVITY: DealOption[] = [
  { value: "non_exclusive",  label: "Non-exclusive" },
  { value: "exclusive",      label: "Exclusive" },
  { value: "semi_exclusive", label: "Semi-exclusive" },
];

export const PAYMENT_TYPES: DealOption[] = [
  { value: "flat_fee",                  label: "Flat Fee" },
  { value: "revenue_share",             label: "Revenue Share" },
  { value: "minimum_guarantee_royalty", label: "Minimum Guarantee + Royalty", short: "MG + Royalty" },
  { value: "installments",              label: "Installments" },
];

export const DELIVERY_MATERIALS: DealOption[] = [
  { value: "screener_only",         label: "Screener only" },
  { value: "digital_file",          label: "Digital file (H.264 / MP4)" },
  { value: "prores_master_package", label: "ProRes master + trailer + poster + subtitles (EN)" },
  { value: "dcp_package",           label: "DCP package" },
  { value: "full_deliverables",     label: "Full deliverables (M&E, stems, EPK)" },
];

export const NOTES_MAX = 500;
export const AMOUNT_MIN_CENTS = 50;
export const AMOUNT_MAX_CENTS = 99_999_999;

export const LISTING_TYPE_DEFAULT_DEAL_TYPE: Record<string, string> = {
  for_sale: "full_purchase",
  licensing: "streaming_license",
  adaptation_rights: "adaptation_rights",
  commission: "commission",
};

export const FILTER_CHIPS: { value: DealFilter; label: string }[] = [
  { value: "all",               label: "All" },
  { value: "negotiating",       label: "Negotiating" },
  { value: "awaiting_response", label: "Awaiting Response" },
  { value: "accepted",          label: "Accepted" },
  { value: "completed",         label: "Completed" },
  { value: "declined",          label: "Declined" },
];

/** Sensible starting terms for a new deal on a listing. */
export function defaultTerms(listingType?: string, listPriceCents = 0): DealTerms {
  return {
    amountCents: Math.max(listPriceCents, 0),
    currency: "USD",
    dealType: (listingType && LISTING_TYPE_DEFAULT_DEAL_TYPE[listingType]) || "streaming_license",
    rights: "svod_rights",
    territory: "us_canada",
    termMonths: 24,
    exclusivity: "non_exclusive",
    paymentType: "flat_fee",
    deliveryMaterials: "prores_master_package",
    notes: "",
  };
}
