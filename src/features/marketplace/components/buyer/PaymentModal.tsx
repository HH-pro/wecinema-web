// @ts-nocheck
"use client";

// TODO: npm install @stripe/react-stripe-js @stripe/stripe-js

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiAlertCircle,
  FiCheck,
  FiCreditCard,
  FiImage,
  FiLoader,
  FiMail,
  FiUser,
  FiX,
} from 'react-icons/fi';
// @ts-ignore — run: npm install @stripe/react-stripe-js @stripe/stripe-js
import {
  AddressElement,
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
// @ts-ignore
import type { Stripe, StripeAddressElementChangeEvent } from '@stripe/stripe-js';
// @ts-ignore
import { loadStripe } from '@stripe/stripe-js';
import { confirmOfferPayment } from '@/features/marketplace/api/offer.service';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { Listing } from '@/types/marketplace.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

// ─── Stripe ──────────────────────────────────────────────────

let stripePromise: Promise<Stripe | null> | null = null;

const getStripePromise = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = fetch(`${BASE_URL}/payments/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { stripePublishableKey?: string } | null) => {
        const key = data?.stripePublishableKey;
        return key ? loadStripe(key) : null;
      })
      .catch(() => null);
  }
  return stripePromise;
};

const STRIPE_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#FFBB00',
    borderRadius: '0.625rem',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
};

// ─── Utilities ───────────────────────────────────────────────

const formatCurrency = (amount?: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount ?? 0);

// ─── Types ───────────────────────────────────────────────────

export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface BillingDetails {
  name: string;
  email: string;
  phone?: string;
  address: BillingAddress;
}

export interface OfferPaymentData {
  type: 'offer';
  amount: number;
  tempOfferId: string;
  clientSecret: string;
}

export interface DirectPurchaseData {
  type: 'direct_purchase';
  amount: number;
  orderId: string;
  clientSecret: string;
  listing: Listing;
}

export type OfferData = OfferPaymentData | DirectPurchaseData;

export interface PaymentModalProps {
  show: boolean;
  clientSecret: string;
  offerData: OfferData | null;
  onClose: () => void;
  onSuccess: () => void;
  paymentStatus: PaymentStatus;
  setPaymentStatus: (status: PaymentStatus) => void;
  billingDetails: BillingDetails;
  onBillingDetailsChange: (partial: Partial<BillingDetails>) => void;
  getThumbnailUrl: (listing: Listing) => string;
}

// ─── PaymentModal ─────────────────────────────────────────────

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  clientSecret,
  offerData,
  onClose,
  onSuccess,
  paymentStatus,
  setPaymentStatus,
  billingDetails,
  onBillingDetailsChange,
  getThumbnailUrl,
}) => {
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && paymentStatus !== 'processing') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, paymentStatus, onClose]);

  if (!show || !offerData) return null;

  const isDirectPurchase = offerData.type === 'direct_purchase';
  const listing = isDirectPurchase ? (offerData as DirectPurchaseData).listing : null;
  const thumbnailUrl = listing ? getThumbnailUrl(listing) : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="mp-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && paymentStatus !== 'processing' && onClose()}
    >
      <div className="mp-modal" style={{ maxWidth: '540px' }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="mp-modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 15%, transparent)' }}>
              <FiCreditCard size={17} style={{ color: 'var(--color-accent-primary)' }} />
            </div>
            <div>
              <h3 id="payment-modal-title" className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {isDirectPurchase ? 'Complete Purchase' : 'Complete Offer Payment'}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Payment secured by Stripe · Funds held in escrow
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close payment dialog"
            onClick={onClose}
            disabled={paymentStatus === 'processing'}
            className="mp-btn mp-btn-ghost mp-btn-sm !rounded-full !p-0 w-8 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────── */}
        <div className="mp-modal-body space-y-4">

          {/* Payment Summary */}
          <div className="rounded-2xl p-4"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent-primary) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-accent-primary) 25%, transparent)',
            }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}>
                <FiCreditCard style={{ color: '#000' }} size={18} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {isDirectPurchase ? 'Purchase Amount' : 'Offer Amount'}
                </p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(offerData.amount)}
                </p>
              </div>
            </div>

            {listing && (
              <div className="mt-3 pt-3 flex items-start gap-3"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--color-accent-primary) 20%, transparent)' }}>
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ border: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiImage size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {listing.title}
                  </h4>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {listing.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stripe Elements + Form */}
          <div className="rounded-2xl p-4"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-divider)' }}>
            <Elements
              stripe={getStripePromise()}
              options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
            >
              <PaymentForm
                offerData={offerData}
                onSuccess={onSuccess}
                onClose={onClose}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                billingDetails={billingDetails}
                onBillingDetailsChange={onBillingDetailsChange}
              />
            </Elements>
          </div>

          {/* Security notice */}
          <div className="mp-alert mp-alert-info">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)' }}>
              <FiCheck size={13} style={{ color: 'var(--color-info)' }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-info)' }}>Secure Payment</h4>
              <p className="text-xs" style={{ color: 'var(--color-info)', opacity: 0.8 }}>
                Processed via Stripe. Funds are held in escrow until the order is delivered and confirmed.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── PaymentForm ──────────────────────────────────────────────

interface PaymentFormProps {
  offerData: OfferData;
  onSuccess: () => void;
  onClose: () => void;
  paymentStatus: PaymentStatus;
  setPaymentStatus: (status: PaymentStatus) => void;
  billingDetails: BillingDetails;
  onBillingDetailsChange: (partial: Partial<BillingDetails>) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  offerData,
  onSuccess,
  onClose,
  paymentStatus,
  setPaymentStatus,
  billingDetails,
  onBillingDetailsChange,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { authUser } = useAuth();
  const user = authUser as any;

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); }, []);

  const isBusy = isSubmitting || paymentStatus === 'processing' || paymentStatus === 'success';

  const handleAddressChange = useCallback(
    (event: StripeAddressElementChangeEvent) => {
      if (!event.complete) return;
      const { address } = event.value;
      onBillingDetailsChange({
        address: {
          line1: address.line1 ?? '',
          line2: address.line2 ?? '',
          city: address.city ?? '',
          state: address.state ?? '',
          postal_code: address.postal_code ?? '',
          country: address.country ?? 'US',
        },
      });
    },
    [onBillingDetailsChange]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!stripe || !elements) {
        setError('Payment system not ready. Please refresh and try again.');
        return;
      }

      setIsSubmitting(true);
      setPaymentStatus('processing');
      setError('');

      try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          setError(submitError.message ?? 'Please check your payment details.');
          setPaymentStatus('failed');
          return;
        }

        const billingDetailsForStripe = {
          name: billingDetails.name || user?.username,
          email: billingDetails.email || user?.email || undefined,
          phone: billingDetails.phone || undefined,
          address: {
            line1: billingDetails.address.line1 || undefined,
            line2: billingDetails.address.line2 || undefined,
            city: billingDetails.address.city || undefined,
            state: billingDetails.address.state || undefined,
            postal_code: billingDetails.address.postal_code || undefined,
            country: billingDetails.address.country || 'US',
          },
        };

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/marketplace/payment/success`,
            payment_method_data: { billing_details: billingDetailsForStripe },
          },
          redirect: 'if_required',
        });

        if (stripeError) {
          setError(stripeError.message ?? 'Payment failed. Please try again.');
          setPaymentStatus('failed');
          return;
        }

        if (!paymentIntent) {
          setError('No payment confirmation received. Please contact support.');
          setPaymentStatus('failed');
          return;
        }

        if (offerData.type === 'offer') {
          await confirmOfferPayment({
            paymentIntentId: paymentIntent.id,
            tempOfferId: offerData.tempOfferId,
          });
        }

        setPaymentStatus('success');
        successTimerRef.current = setTimeout(onSuccess, 1500);

      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err !== null && 'error' in err
              ? String((err as { error: unknown }).error)
              : 'Payment failed. Please try again.';
        setError(message);
        setPaymentStatus('failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    [stripe, elements, billingDetails, offerData, user, setPaymentStatus, onSuccess]
  );

  const displayName = billingDetails.name || user?.username || 'Not provided';
  const displayEmail = billingDetails.email || user?.email || 'Not provided';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* ── Billing Information ──────────────────────────── */}
      <div className="rounded-xl border p-4"
        style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-card-bg)' }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <FiUser size={14} aria-hidden="true" />
            Billing Information
          </h4>
          <button
            type="button"
            onClick={() => setShowBillingForm((v) => !v)}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--color-accent-primary)' }}
            aria-expanded={showBillingForm}
          >
            {showBillingForm ? 'Hide' : 'Edit'}
          </button>
        </div>

        {showBillingForm ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="billing-name" className="block text-xs font-medium mb-1"
                style={{ color: 'var(--color-text-secondary)' }}>
                Full Name
              </label>
              <input
                id="billing-name"
                type="text"
                value={billingDetails.name}
                onChange={(e) => onBillingDetailsChange({ name: e.target.value })}
                placeholder={user?.username}
                className="mp-input"
                required
              />
            </div>
            <div>
              <label htmlFor="billing-email" className="block text-xs font-medium mb-1"
                style={{ color: 'var(--color-text-secondary)' }}>
                Email Address
              </label>
              <input
                id="billing-email"
                type="email"
                value={billingDetails.email}
                onChange={(e) => onBillingDetailsChange({ email: e.target.value })}
                placeholder={user?.email}
                className="mp-input"
                required
              />
            </div>
            <div>
              <label htmlFor="billing-phone" className="block text-xs font-medium mb-1"
                style={{ color: 'var(--color-text-secondary)' }}>
                Phone{' '}
                <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="billing-phone"
                type="tel"
                value={billingDetails.phone ?? ''}
                onChange={(e) => onBillingDetailsChange({ phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="mp-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Billing Address
              </label>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-input-border)' }}>
                <AddressElement
                  options={{
                    mode: 'billing',
                    allowedCountries: ['US', 'CA', 'GB', 'AU', 'IN'],
                    fields: { phone: 'always' },
                    validation: { phone: { required: 'never' } },
                    defaultValues: {
                      name: billingDetails.name || user?.username,
                      phone: billingDetails.phone ?? '',
                      address: {
                        line1: billingDetails.address.line1,
                        line2: billingDetails.address.line2 ?? '',
                        city: billingDetails.address.city,
                        state: billingDetails.address.state,
                        postal_code: billingDetails.address.postal_code,
                        country: billingDetails.address.country || 'US',
                      },
                    },
                  }}
                  onChange={handleAddressChange}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center gap-2">
              <FiUser size={13} aria-hidden="true" />
              <span>{displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMail size={13} aria-hidden="true" />
              <span>{displayEmail}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Payment Details ──────────────────────────────── */}
      <div className="rounded-xl border p-4"
        style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-card-bg)' }}>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <FiCreditCard size={14} aria-hidden="true" />
            Payment Details
          </label>
          <div className="flex items-center gap-1" aria-hidden="true">
            <div className="w-6 h-4 bg-blue-500 rounded-sm" />
            <div className="w-6 h-4 bg-red-500 rounded-sm" />
            <div className="w-6 h-4 rounded-sm" style={{ backgroundColor: 'var(--color-accent-primary)' }} />
          </div>
        </div>
        <div className="min-h-[200px]">
          <PaymentElement
            options={{
              layout: 'tabs',
              wallets: { applePay: 'auto', googlePay: 'auto' },
              fields: {
                billingDetails: {
                  name: 'auto',
                  email: 'auto',
                  phone: 'auto',
                  address: { country: 'auto', postalCode: 'auto' },
                },
              },
            }}
          />
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────── */}
      {error && (
        <div role="alert" className="mp-alert mp-alert-danger">
          <FiAlertCircle size={17} aria-hidden="true" className="flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold mb-0.5">Payment Error</h4>
            <p className="text-xs opacity-85">{error}</p>
          </div>
        </div>
      )}

      {/* ── Success banner ──────────────────────────────────── */}
      {paymentStatus === 'success' && (
        <div role="status" className="mp-alert mp-alert-success">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)' }}>
            <FiCheck size={14} aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Payment Successful!</h4>
            <p className="text-xs opacity-80">Redirecting to your orders…</p>
          </div>
        </div>
      )}

      {/* ── Action buttons ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t"
        style={{ borderColor: 'var(--color-divider)' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="mp-btn mp-btn-secondary flex-1"
        >
          <FiX size={14} aria-hidden="true" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={!stripe || isBusy}
          className="mp-btn mp-btn-primary flex-1"
          style={{ fontSize: '14px', height: '44px' }}
        >
          {isBusy && paymentStatus !== 'success' ? (
            <>
              <FiLoader className="animate-spin" size={15} aria-hidden="true" />
              Processing…
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <FiCheck size={15} aria-hidden="true" />
              Success!
            </>
          ) : (
            `Pay ${formatCurrency(offerData.amount)}`
          )}
        </button>
      </div>

    </form>
  );
};

export default PaymentModal;
