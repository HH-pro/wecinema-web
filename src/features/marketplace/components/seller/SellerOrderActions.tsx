"use client";
// src/components/marketplace/seller/SellerOrderActions.tsx
import React, { useState, useEffect } from "react";
import { useSellerActions } from '@/hooks/useOrder';
import type { Order, OrderPermissions } from '@/types/order.types';

// ─── Status → available seller actions ───────────────────────

const SELLER_ACTIONS: Record<string, string[]> = {
  paid:        ["start_processing"],
  processing:  ["start_work"],
  in_progress: ["deliver", "contact_buyer"],
  in_revision: ["complete_revision", "contact_buyer"],
  delivered:   ["contact_buyer"],
  completed:   ["contact_support"],
  cancelled:   ["contact_support"],
  disputed:    ["contact_buyer", "contact_support"],
};

const getOrderActions = (status: string): string[] =>
  SELLER_ACTIONS[status] ?? [];

// ─── Props ───────────────────────────────────────────────────

interface SellerOrder extends Omit<Partial<Order>, 'listingId' | 'buyerId' | 'status'> {
  _id: string;
  status: string;
  orderNumber?: string;
  buyerId?: { username: string } | string;
  listingId?: { title: string } | string;
  permissions?: OrderPermissions;
  revisions?: number;
  maxRevisions?: number;
}

interface SellerOrderActionsProps {
  order: SellerOrder;
  loading?: boolean;
  onStartProcessing:   (orderId: string) => Promise<void>;
  onStartWork:         (orderId: string) => Promise<void>;
  onDeliver:           (order: SellerOrder) => void;
  onCancel:            (order: SellerOrder) => void;
  onCompleteRevision:  (order: SellerOrder) => void;
  onViewDetails:       () => void;
  onManualStatusUpdate?: (order: SellerOrder) => void;
  onOrderUpdate?:      (orderId: string, newStatus: string) => void;
}

// ─── Spinner ─────────────────────────────────────────────────

const Spinner = () => (
  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ─── Tooltip button wrapper ───────────────────────────────────

const TipBtn: React.FC<{
  tooltip: string;
  children: React.ReactNode;
}> = ({ tooltip, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-bg-tertiary text-text-primary text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
      {tooltip}
    </div>
  </div>
);

// ─── Component ───────────────────────────────────────────────

const BASE_BTN = "inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow disabled:hover:shadow-sm";

const SellerOrderActions: React.FC<SellerOrderActionsProps> = ({
  order,
  loading: parentLoading,
  onStartProcessing,
  onStartWork,
  onDeliver,
  onCancel,
  onCompleteRevision,
  onViewDetails,
  onManualStatusUpdate,
  onOrderUpdate,
}) => {
  const seller = useSellerActions(order._id, () => {
    onOrderUpdate?.(order._id, order.status);
  });

  const [error, setError] = useState<string | null>(null);
  const loading = parentLoading || seller.loading;

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (seller.error) setError(seller.error);
  }, [seller.error]);

  // ── Handlers ───────────────────────────────────────────────

  const handleStartProcessing = async () => {
    const result = await seller.startProcessing();
    if (result) {
      onOrderUpdate?.(order._id, "processing");
      await onStartProcessing(order._id);
    }
  };

  const handleStartWork = async () => {
    const result = await seller.startWork();
    if (result) {
      onOrderUpdate?.(order._id, "in_progress");
      await onStartWork(order._id);
    }
  };

  const handleQuickCancel = async () => {
    if (!window.confirm(`Cancel order ${order.orderNumber ?? order._id}? This cannot be undone.`)) return;
    const result = await seller.cancel({ cancelReason: "Seller cancelled" });
    if (result) {
      onOrderUpdate?.(order._id, "cancelled");
      onCancel(order);
    }
  };

  // ── Permissions ────────────────────────────────────────────

  const perm = order.permissions;
  const canStartProcessing = perm?.canStartProcessing  ?? order.status === "paid";
  const canStartWork       = perm?.canStartWork        ?? ["processing", "paid"].includes(order.status);
  const canDeliver         = perm?.canDeliver          ?? order.status === "in_progress";
  const canCancel          = perm?.canCancel           ?? ["paid", "processing"].includes(order.status);

  // ── Action buttons ─────────────────────────────────────────

  const getActionButton = (action: string) => {
    switch (action) {
      case "start_processing":
        if (!canStartProcessing) return null;
        return (
          <TipBtn key="processing" tooltip="Mark order as being prepared">
            <button
              onClick={handleStartProcessing}
              disabled={loading}
              className={`${BASE_BTN} bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700`}
            >
              {loading ? <><Spinner />Processing…</> : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Processing
                </>
              )}
            </button>
          </TipBtn>
        );

      case "start_work":
        if (!canStartWork) return null;
        return (
          <TipBtn key="work" tooltip="Begin working on the order deliverables">
            <button
              onClick={handleStartWork}
              disabled={loading}
              className={`${BASE_BTN} bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700`}
            >
              {loading ? <><Spinner />Starting…</> : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Start Work
                </>
              )}
            </button>
          </TipBtn>
        );

      case "deliver":
        if (!canDeliver) return null;
        return (
          <TipBtn key="deliver" tooltip="Send completed work to buyer for review">
            <button
              onClick={() => onDeliver(order)}
              disabled={loading}
              className={`${BASE_BTN} bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Deliver
            </button>
          </TipBtn>
        );

      case "complete_revision":
        if (order.status !== "in_revision") return null;
        return (
          <TipBtn key="revision" tooltip="Send revised work back to buyer">
            <button
              onClick={() => onCompleteRevision(order)}
              disabled={loading}
              className={`${BASE_BTN} bg-accent hover:bg-accent-hover text-btn-primary-text`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Complete Revision
            </button>
          </TipBtn>
        );

      case "contact_buyer":
        return (
          <TipBtn key="message" tooltip="Send a message to the buyer">
            <button
              onClick={onViewDetails}
              className={`${BASE_BTN} bg-bg-secondary text-text-secondary hover:bg-bg-tertiary border border-border`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message Buyer
            </button>
          </TipBtn>
        );

      case "contact_support":
        return (
          <TipBtn key="support" tooltip="Get help from customer support">
            <button
              onClick={() => window.open("/support", "_blank")}
              className={`${BASE_BTN} bg-danger-bg text-danger hover:opacity-80 border border-red-300`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Contact Support
            </button>
          </TipBtn>
        );

      default:
        return null;
    }
  };

  const actions = getOrderActions(order.status);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Primary actions for current status */}
        {actions.map((a) => getActionButton(a))}

        {/* Cancel */}
        {canCancel && (
          <TipBtn tooltip="Cancel this order (refunds may apply)">
            <button
              onClick={handleQuickCancel}
              disabled={loading}
              className={`${BASE_BTN} bg-danger-bg text-danger hover:opacity-80 border border-red-200`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Order
            </button>
          </TipBtn>
        )}

        {/* Manual update (admin/dev) */}
        {onManualStatusUpdate && (
          <TipBtn tooltip="Advanced: Manually update order status">
            <button
              onClick={() => onManualStatusUpdate(order)}
              disabled={loading}
              className={`${BASE_BTN} bg-info-bg text-info hover:opacity-80`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manual Update
            </button>
          </TipBtn>
        )}

        {/* View details */}
        <TipBtn tooltip="View complete order details">
          <button
            onClick={onViewDetails}
            className={`${BASE_BTN} bg-bg-secondary text-text-secondary hover:bg-bg-tertiary`}
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
        </TipBtn>
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-xs text-danger bg-danger-bg p-2 rounded-lg border border-red-200 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-danger hover:opacity-70 ml-2">✕</button>
        </div>
      )}

      {/* Debug panel (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-text-tertiary bg-bg-secondary p-2 rounded-lg border border-border">
          <div className="font-medium mb-1">Debug</div>
          <div className="grid grid-cols-2 gap-1">
            <span>Status: <b>{order.status}</b></span>
            <span>Can Process: <b className={canStartProcessing ? "text-success" : "text-danger"}>{canStartProcessing ? "Yes" : "No"}</b></span>
            <span>Can Work: <b className={canStartWork ? "text-success" : "text-danger"}>{canStartWork ? "Yes" : "No"}</b></span>
            <span>Can Deliver: <b className={canDeliver ? "text-success" : "text-danger"}>{canDeliver ? "Yes" : "No"}</b></span>
            <span>Can Cancel: <b className={canCancel ? "text-success" : "text-danger"}>{canCancel ? "Yes" : "No"}</b></span>
            <span>Order #: <code>{order.orderNumber ?? order._id.slice(-6)}</code></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrderActions;
