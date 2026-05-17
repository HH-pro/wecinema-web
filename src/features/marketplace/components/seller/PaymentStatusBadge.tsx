"use client";
import React from 'react';

interface Order {
  stripePaymentIntentId?: string;
  paymentStatus?: string;
}

interface PaymentStatusBadgeProps {
  order: Order;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ order }) => {
  if (!order.stripePaymentIntentId) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-bg-secondary text-text-secondary border border-border">
        Payment Pending
      </span>
    );
  }

  switch (order.paymentStatus) {
    case 'succeeded':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-bg text-success border border-green-200">
          Paid
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-bg text-info border border-blue-200">
          Processing
        </span>
      );
    case 'requires_payment_method':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-bg text-danger border border-red-200">
          Payment Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-bg text-warning border border-yellow-200">
          Payment Pending
        </span>
      );
  }
};

export default PaymentStatusBadge;
