"use client";
// src/components/marketplace/seller/RecentOrders.tsx
import React from "react";
import { formatDate, formatCurrency, getOrderProgress } from '@/utils/helpers';
import type { Order, OrderStatus } from '@/types/order.types';

// ─── Status helpers ────────────────────────────────────────────

// Hex colors used for inline-style badge approach — works in both light and dark
// (transparent bg from hex + 15% opacity, solid text color)
const STATUS_HEX: Record<string, string> = {
  pending_payment: "#FFBB00",
  pending:         "#FFBB00",
  paid:            "#3B82F6",
  processing:      "#8B5CF6",
  in_progress:     "#6366F1",
  delivered:       "#10B981",
  completed:       "#059669",
  cancelled:       "#EF4444",
  in_revision:     "#F59E0B",
  disputed:        "#F43F5E",
};

const getStatusDot   = (s: string) => STATUS_HEX[s] ?? "#6B7280";
const getStatusBadgeStyle = (s: string): React.CSSProperties => {
  const hex = STATUS_HEX[s] ?? "#6B7280";
  return {
    backgroundColor: `${hex}18`,
    color: hex,
    borderColor: `${hex}35`,
  };
};
const getStatusLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

// ─── Props ────────────────────────────────────────────────────

interface PopulatedOrder extends Omit<Order, 'listingId' | 'buyerId'> {
  buyerId?: { username: string; avatar?: string } | string;
  listingId?: { title: string } | string;
}

interface RecentOrdersProps {
  orders:             PopulatedOrder[];
  onViewOrderDetails: (orderId: string) => void;
  onStartProcessing:  (order: PopulatedOrder) => void;
  onStartWork:        (order: PopulatedOrder) => void;
  onDeliver:          (order: PopulatedOrder) => void;
  onCancel:           (order: PopulatedOrder) => void;
  onCompleteRevision: (order: PopulatedOrder) => void;
  onViewAll:          () => void;
  onCreateListing:    () => void;
  orderActionLoading: string | null;
}

// ─── Spinner ──────────────────────────────────────────────────

const Spinner = () => (
  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────

const RecentOrders: React.FC<RecentOrdersProps> = ({
  orders,
  onViewOrderDetails,
  onStartProcessing,
  onStartWork,
  onDeliver,
  onCancel,
  onCompleteRevision,
  onViewAll,
  onCreateListing,
  orderActionLoading,
}) => {
  const isLoading = (id: string) => orderActionLoading === id;

  const btn = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    colorClass: string,
    disabled: boolean,
    loadingLabel: string,
  ) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-medium ${colorClass} rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow flex items-center gap-1`}
    >
      {disabled ? <><Spinner />{loadingLabel}</> : <>{icon}{label}</>}
    </button>
  );

  const getActions = (order: PopulatedOrder) => {
    const loading = isLoading(order._id);
    const actions: React.ReactNode[] = [];

    switch (order.status as OrderStatus) {
      case "paid":
        actions.push(btn("Process",
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
          () => onStartProcessing(order),
          "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700",
          loading, "Processing…"));
        break;
      case "processing":
        actions.push(btn("Start Work",
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
          () => onStartWork(order),
          "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700",
          loading, "Starting…"));
        break;
      case "in_progress":
        actions.push(btn("Deliver",
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
          () => onDeliver(order),
          "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700",
          loading, "Delivering…"));
        break;
      case "in_revision":
        actions.push(btn("Revise",
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
          () => onCompleteRevision(order),
          "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700",
          loading, "Revising…"));
        break;
    }

    if (["pending_payment", "pending", "paid", "processing", "in_progress"].includes(order.status)) {
      actions.push(
        <button key="cancel" onClick={() => onCancel(order)} disabled={loading}
          className="px-3 py-1.5 text-xs font-medium bg-danger-bg text-danger rounded-lg hover:opacity-80 transition-colors disabled:opacity-50 border border-danger flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Cancel
        </button>
      );
    }

    actions.push(
      <button key="details" onClick={() => onViewOrderDetails(order._id)}
        className="px-3 py-1.5 text-xs font-medium bg-bg-tertiary text-text-secondary rounded-lg hover:opacity-80 transition-colors border border-border flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        Details
      </button>
    );

    return actions;
  };

  const totalEarnings = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  if (!orders.length) {
    return (
      <div className="bg-card-bg rounded-2xl shadow-sm border border-border overflow-hidden theme-transition">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Recent Orders</h2>
        </div>
        <div className="p-6 text-center py-10">
          <div className="text-5xl mb-4 text-text-tertiary">📦</div>
          <h3 className="text-lg font-medium text-text-primary">No orders yet</h3>
          <p className="mt-2 text-text-tertiary">When you receive orders, they'll appear here.</p>
          <button onClick={onCreateListing}
            className="mt-4 px-4 py-2.5 bg-accent text-btn-primary-text font-medium rounded-lg hover:bg-accent-hover transition-all shadow-md flex items-center justify-center mx-auto gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Create Your First Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-2xl shadow-sm border border-border overflow-hidden theme-transition">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Recent Orders</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
              <span><span className="font-medium text-text-primary">{orders.length}</span> recent orders</span>
              <span className="h-4 w-px bg-border" />
              <span>Total: <span className="font-medium text-success">{formatCurrency(totalEarnings / 100)}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm text-text-secondary bg-bg-secondary px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-success rounded-full mr-2" />
              {orders.filter((o) => o.status === "completed").length} completed
            </div>
            <button onClick={onViewAll}
              className="text-sm font-medium text-warning hover:opacity-80 bg-warning-bg px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-bg-secondary">
              <tr>
                {["Order & Buyer", "Amount", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card-bg divide-y divide-border">
              {orders.slice(0, 5).map((order) => {
                const buyer   = typeof order.buyerId  === "object" && order.buyerId  ? order.buyerId  as { username: string } : null;
                const listing = typeof order.listingId === "object" && order.listingId ? order.listingId as { title: string }  : null;
                const progress = getOrderProgress(order.status);

                return (
                  <tr key={order._id} className="hover:bg-bg-secondary transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/30 shadow-sm flex-shrink-0">
                          <span className="font-bold text-accent text-lg">
                            {buyer?.username?.charAt(0).toUpperCase() ?? "B"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary text-sm truncate max-w-xs">
                            {listing?.title ?? "Order"}
                          </p>
                          <p className="text-xs text-text-tertiary mt-0.5">{buyer?.username ?? "Unknown Buyer"}</p>
                          <div className="mt-1 w-24 bg-bg-tertiary rounded-full h-1">
                            <div className="bg-accent h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-success text-base">
                        {formatCurrency((order.amount || 0) / 100)}
                      </span>
                      <p className="text-xs text-text-tertiary font-mono mt-1">
                        #{order.orderNumber ?? order._id.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border" style={getStatusBadgeStyle(order.status)}>
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getStatusDot(order.status) }} />
                        {getStatusLabel(order.status)}
                      </span>
                      {order.deliveredAt && (
                        <p className="text-xs text-text-tertiary mt-1">Delivered: {formatDate(order.deliveredAt)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-text-primary">{formatDate(order.createdAt)}</span>
                      {order.completedAt && (
                        <p className="text-xs text-success mt-1">Completed: {formatDate(order.completedAt)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">{getActions(order)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length > 5 && (
          <p className="mt-4 text-center text-sm text-text-tertiary">
            Showing <span className="font-medium text-text-primary">5</span> of{" "}
            <span className="font-medium text-text-primary">{orders.length}</span> orders
          </p>
        )}
      </div>
    </div>
  );
};

export default RecentOrders;
