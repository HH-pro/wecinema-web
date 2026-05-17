"use client";
// src/components/marketplace/seller/OrderStatusTracker.tsx
import React from "react";
import { formatDate, getOrderProgress } from '@/utils/helpers';
import type { OrderStatus } from '@/types/order.types';

interface StatusMeta {
  icon: string;
  text: string;
  description: string;
}

const STATUS_META: Record<string, StatusMeta> = {
  pending:         { icon: "⏳", text: "Pending",          description: "Awaiting action" },
  pending_payment: { icon: "💳", text: "Pending Payment",  description: "Awaiting buyer payment" },
  paid:            { icon: "✅", text: "Paid",             description: "Payment received" },
  processing:      { icon: "⚙️",  text: "Processing",      description: "Order processing started" },
  in_progress:     { icon: "🔨", text: "In Progress",      description: "Work in progress" },
  delivered:       { icon: "📦", text: "Delivered",        description: "Work delivered to buyer" },
  completed:       { icon: "🎉", text: "Completed",        description: "Order completed and payment released" },
  in_revision:     { icon: "✏️",  text: "In Revision",     description: "Revision requested by buyer" },
  cancelled:       { icon: "❌", text: "Cancelled",        description: "Order cancelled" },
  refunded:        { icon: "↩️",  text: "Refunded",        description: "Order refunded" },
};

const getStatusMeta = (status: string): StatusMeta =>
  STATUS_META[status] ?? {
    icon: "❓",
    text: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: "",
  };

interface OrderStatusTrackerProps {
  currentStatus: OrderStatus | string;
  orderId: string;
  createdAt: string;
  paidAt?: string;
  processingAt?: string;
  startedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
}

const FLOW: string[] = [
  "pending", "pending_payment", "paid",
  "processing", "in_progress", "delivered", "completed",
];

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  currentStatus,
  orderId,
  createdAt,
  paidAt,
  processingAt,
  startedAt,
  deliveredAt,
  completedAt,
}) => {
  const currentIndex = FLOW.indexOf(currentStatus);

  const getDate = (status: string): string | undefined => {
    const map: Record<string, string | undefined> = {
      pending:         createdAt,
      pending_payment: createdAt,
      paid:            paidAt,
      processing:      processingAt,
      in_progress:     startedAt,
      delivered:       deliveredAt,
      completed:       completedAt,
    };
    return map[status];
  };

  const visibleStatuses = FLOW.filter((_, i) => i <= Math.max(currentIndex, 0));
  const progress = getOrderProgress(currentStatus);

  if (currentIndex === -1) {
    const meta = getStatusMeta(currentStatus);
    return (
      <div className="p-4 bg-bg-secondary rounded-xl border border-border">
        <h4 className="font-medium text-text-primary mb-2">Order Status</h4>
        <div className="text-center py-8">
          <span className="text-4xl mb-2 inline-block">{meta.icon}</span>
          <p className="text-text-secondary font-medium">{meta.text}</p>
          <p className="text-text-tertiary text-sm mt-1">{meta.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-text-primary">Order Timeline</h4>
        <span className="text-xs text-text-tertiary">#{orderId.slice(-6)}</span>
      </div>

      {/* Steps */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-400 via-yellow-300 to-yellow-200 z-0" />

        <div className="space-y-6 relative z-10">
          {visibleStatuses.map((status, index) => {
            const meta        = getStatusMeta(status);
            const isCompleted = index < visibleStatuses.length - 1;
            const isCurrent   = status === currentStatus;
            const date        = getDate(status);

            return (
              <div key={status} className="flex items-start gap-4">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted || isCurrent
                      ? "bg-gradient-to-br from-yellow-500 to-yellow-600 border-yellow-600 shadow-md"
                      : "bg-bg-secondary border-border"
                  } ${isCurrent ? "ring-4 ring-yellow-200 scale-110" : ""}`}>
                    <span className={`text-lg ${isCompleted || isCurrent ? "text-white" : "text-text-tertiary"}`}>
                      {isCompleted ? "✓" : meta.icon}
                    </span>
                  </div>

                  {date && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                        {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  )}
                </div>

                <div className={`flex-1 pt-1 pb-4 ${
                  index < visibleStatuses.length - 1 ? "border-b border-border" : ""
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className={`font-medium ${isCompleted || isCurrent ? "text-text-primary" : "text-text-tertiary"}`}>
                        {meta.text}
                      </h5>
                      <p className="text-sm text-text-tertiary mt-1">{meta.description}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      isCurrent
                        ? "bg-warning-bg text-warning border-yellow-200"
                        : isCompleted
                        ? "bg-success-bg text-success border-green-200"
                        : "bg-bg-secondary text-text-tertiary border-border"
                    }`}>
                      {isCurrent ? "Current" : isCompleted ? "Done" : "Pending"}
                    </span>
                  </div>

                  {date && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6 p-4 bg-warning-bg rounded-xl border border-yellow-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-yellow-800">Overall Progress</span>
          <span className="text-sm font-bold text-yellow-700">{progress}%</span>
        </div>
        <div className="w-full bg-yellow-100 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-yellow-500 to-amber-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-yellow-700 mt-2">
          <span>{visibleStatuses.length} of {FLOW.length} steps</span>
          <span>{currentStatus === "completed" ? "Completed ✓" : "In Progress"}</span>
        </div>
      </div>

      {/* Next step tip */}
      {currentStatus !== "completed" && currentIndex < FLOW.length - 1 && (
        <div className="mt-4 p-3 bg-info-bg rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-info mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-info">
              Next: {getStatusMeta(FLOW[currentIndex + 1] ?? '').description}
            </p>
          </div>
        </div>
      )}

      {/* Special status warning */}
      {["cancelled", "refunded", "disputed", "in_revision"].includes(currentStatus) && (
        <div className="mt-4 p-3 bg-danger-bg rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.258 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-danger">{getStatusMeta(currentStatus).text}</p>
              <p className="text-xs text-danger mt-1">{getStatusMeta(currentStatus).description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusTracker;
