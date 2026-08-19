/**
 * Video rental API calls. Everything goes through `api`, which attaches the
 * in-memory access token and silently refreshes on 401.
 */

import { api } from "@/features/auth/services/apiClient";
import type {
  EntitlementResponse,
  RentalCheckoutResponse,
  StreamGrantResponse,
  MyRental,
} from "../types/rental.types";

/** Can the current user offer rentals (i.e. are payouts connected)? */
export function getRentalEligibility() {
  return api.get<{
    success: boolean;
    eligible: boolean;
    code?: string;
    message?: string;
    stripeAccountStatus?: string;
  }>("/rentals/eligibility");
}

/** Which player UI to show. Never returns a playable URL. */
export function getEntitlement(videoId: string) {
  return api.get<EntitlementResponse>(`/rentals/entitlement/${videoId}`);
}

/** Create (or reuse) a pending rental and get a Stripe client secret. */
export function startRentalCheckout(videoId: string) {
  return api.post<RentalCheckoutResponse>("/rentals/checkout", { videoId });
}

/**
 * Fast-path activation after Stripe confirms. The webhook is still the source
 * of truth; this just avoids making the viewer wait for webhook delivery.
 */
export function confirmRental(rentalId: string) {
  return api.post<{ success: boolean; rental?: unknown; status?: string }>(
    `/rentals/${rentalId}/confirm`,
  );
}

/**
 * Exchange an entitlement for a short-lived playable URL.
 *
 * CALLING THIS STARTS THE PLAY CLOCK — only call it on a deliberate play, never
 * on page load, or a viewer who opens the page and wanders off burns their
 * 48-hour window.
 */
export function getStreamUrl(videoId: string) {
  return api.get<StreamGrantResponse>(`/rentals/stream/${videoId}`);
}

export function listMyRentals(status: "active" | "expired" | "all" = "active") {
  return api.get<{ success: boolean; count: number; rentals: MyRental[] }>(
    `/rentals/mine?status=${status}`,
  );
}
