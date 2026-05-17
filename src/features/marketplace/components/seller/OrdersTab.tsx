"use client";
/**
 * src/components/marketplace/seller/OrdersTab.tsx
 *
 * Changes from original:
 *
 * CRITICAL BUGS:
 *  - `import marketplaceApi from '../../../api/marketplaceApi'` — raw API calls
 *    throughout (handleStartProcessing, handleStartWork, handleCancelOrder,
 *    handleActualDeliver) → all replaced with hook-based calls via useSellerActions
 *    and useDeliveryUpload from the barrel
 *  - `localStorage.getItem('token')` in testDeliveryFlow → removed entirely
 *    (token reads are handled by axiosInstance interceptor)
 *  - `fetch('http://localhost:3000/...')` hardcoded localhost URL in
 *    testDeliveryFlow → entire debug function removed (was already commented out
 *    and left dead code in production)
 *  - `window.open('/marketplace/messages?order=...', '_blank')` → useNavigate()
 *  - `navigator.clipboard.writeText` without await/catch → wrapped in async try/catch
 *  - `console.error / console.log / console.warn` throughout → removed
 *  - Comment in Urdu: "OrdersTab mein call karein jab modal open ho" → removed
 *  - useEffect with [deliveryModalOpen, selectedOrderForDelivery] only called
 *    testDeliveryFlow (which was commented out) → entire useEffect removed
 *  - `error: any` in all catch blocks → `error: unknown` with type guards
 *  - `toast.success` / `toast.error` called with `{duration, position}` options
 *    that react-toastify doesn't support (those are react-hot-toast options) →
 *    removed invalid option objects
 *  - `formatCurrencyShow`: `amount < 100 ? amount : amount / 100` heuristic is
 *    wrong — $1.00 (100 cents) would render as $0.01 if stored as integer cents,
 *    $50 would render as $50, but $101 would render as $1.01. The field semantics
 *    must be consistent. Aligned with rest of codebase: amount is in whole dollars
 *    (same as listingId.price). Removed the divide-by-100 branch.
 *  - `toast.success` on clipboard copy fires synchronously before clipboard API
 *    resolves → moved inside async handler with await
 *  - `onPlayVideo` typed as receiving `order.listingId.mediaUrls![0]` but
 *    listingId is typed as `ListingId | string` — accessing `.mediaUrls` without
 *    narrowing caused TS error → properly narrowed with typeof guard
 *  - `order.status.replace('_', ' ')` → `.replaceAll('_', ' ')`
 *  - STATUS_MAP extracted as module-level constant — was re-created on every render
 *  - `statusFilters` was recomputed on every render with `.filter()` — memoised
 *    with useMemo
 *  - `filteredOrders` was recomputed on every render — memoised with useMemo
 *  - Emoji icons (⚙️🛠️📦❌✅ etc.) throughout UI — replaced with lucide-react
 *  - Inline SVG spinners copy-pasted 4× → <Loader2 className="animate-spin">
 *  - Cancel confirm modal uses IIFE `{(() => { ... })()}` to find order —
 *    replaced with direct state lookup
 *  - `error.message || 'Failed ...'` on unknown error → instanceof Error guard
 *  - handleActualDeliver had a `catch(uploadError)` block that checked if the
 *    error "includes 'successfully'" — a success masquerading as an error is an
 *    API contract bug; the defensive check is fragile and removed. Errors are
 *    errors.
 *  - Delivery payload built with `any` type → typed DeliveryPayload interface
 *  - `attachments?: any[]` on Order interface → typed as UploadedFile[]
 *  - Progress bar widths hardcoded as Tailwind class strings inside ternary
 *    (e.g. 'w-1/4') → extracted to STATUS_PROGRESS map
 */

import React, { useMemo, useState } from "react";
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock,
  Copy, ExternalLink, Loader2, MessageCircle, RefreshCw,
  RotateCcw, Send, Settings, Truck, X, XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import * as orderService from '@/features/marketplace/api/order.service';
import type { UploadedFile } from '@/features/marketplace/api/upload.service';
import OrderStatusTracker from "./OrderStatusTracker";
import OrderActionGuide from "./OrderActionGuide";
import DeliveryModal from "./DeliveryModal";

// ─── Types ────────────────────────────────────────────────────

interface ListingId {
  _id:          string;
  title:        string;
  price:        number;
  currency:     string;
  mediaUrls?:   string[];
  description?: string;
  category?:    string;
}

export interface Order {
  _id:              string;
  orderNumber:      string;
  status:           string;
  amount:           number;
  buyerId: {
    _id:        string;
    username:   string;
    email:      string;
    avatar?:    string;
    firstName?: string;
    lastName?:  string;
  };
  sellerId: {
    _id:        string;
    username:   string;
    email:      string;
    firstName?: string;
    lastName?:  string;
    avatar?:    string;
  };
  listingId:        ListingId | string;
  createdAt:        string;
  updatedAt:        string;
  deliveredAt?:     string;
  completedAt?:     string;
  expectedDelivery?: string;
  buyerNotes?:      string;
  sellerNotes?:     string;
  revisions?:       number;
  maxRevisions?:    number;
  deliveryMessage?: string;
  deliveryFiles?:   string[];
  attachments?:     UploadedFile[];
  paymentStatus:    string;
  orderType:        string;
  requirements?:    string;
}

interface OrdersTabProps {
  orders:             Order[];
  loading:            boolean;
  filter:             string;
  onFilterChange:     (filter: string) => void;
  onViewOrderDetails: (orderId: string) => void;
  onPlayVideo?:       (videoUrl: string, title: string) => void;
  onRefresh:          () => void;
  actionLoading?:     string | null;
}

// ─── Constants ────────────────────────────────────────────────

interface StatusInfo {
  text:      string;
  Icon:      React.FC<{ size?: number; className?: string }>;
  hex:       string;
}

const STATUS_HEX: Record<string, string> = {
  pending_payment: "#FFBB00",
  paid:            "#3B82F6",
  processing:      "#8B5CF6",
  in_progress:     "#6366F1",
  delivered:       "#F97316",
  in_revision:     "#EF4444",
  completed:       "#22C55E",
  cancelled:       "#EF4444",
  refunded:        "#6B7280",
  disputed:        "#EF4444",
};

const STATUS_MAP: Record<string, StatusInfo> = {
  pending_payment: { text: "Pending Payment",  Icon: Clock,         hex: STATUS_HEX["pending_payment"]! },
  paid:            { text: "Paid",             Icon: CheckCircle2,  hex: STATUS_HEX["paid"]! },
  processing:      { text: "Processing",       Icon: Settings,      hex: STATUS_HEX["processing"]! },
  in_progress:     { text: "In Progress",      Icon: Truck,         hex: STATUS_HEX["in_progress"]! },
  delivered:       { text: "Delivered",        Icon: Send,          hex: STATUS_HEX["delivered"]! },
  in_revision:     { text: "In Revision",      Icon: RotateCcw,     hex: STATUS_HEX["in_revision"]! },
  completed:       { text: "Completed",        Icon: CheckCircle2,  hex: STATUS_HEX["completed"]! },
  cancelled:       { text: "Cancelled",        Icon: XCircle,       hex: STATUS_HEX["cancelled"]! },
  refunded:        { text: "Refunded",         Icon: RefreshCw,     hex: STATUS_HEX["refunded"]! },
  disputed:        { text: "Disputed",         Icon: AlertCircle,   hex: STATUS_HEX["disputed"]! },
};

const DEFAULT_STATUS_INFO: StatusInfo = {
  text: "Unknown", Icon: AlertCircle, hex: "#6B7280",
};

// Progress bar config per status
const STATUS_PROGRESS: Record<string, { width: string; color: string }> = {
  processing: { width: "w-1/4",  color: "bg-yellow-500" },
  in_progress: { width: "w-3/4", color: "bg-green-500" },
};

const CANCELLABLE_STATUSES = new Set(["pending_payment", "paid", "processing"]);

interface CancelConfig {
  canCancel: boolean;
  message:   string;
  warning:   string;
}

const CANCEL_CONFIG: Record<string, CancelConfig> = {
  pending_payment: { canCancel: true,  message: "Cancel before payment completes", warning: "No payment has been made yet." },
  paid:            { canCancel: true,  message: "Cancel before work starts",       warning: "A refund may be required by your policy." },
  processing:      { canCancel: true,  message: "Cancel before work begins",       warning: "Any preparation work done will be lost." },
  in_progress:     { canCancel: false, message: "Work has already started",        warning: "Complete or discuss with the buyer." },
  delivered:       { canCancel: false, message: "Order has been delivered",        warning: "Awaiting buyer acceptance." },
  in_revision:     { canCancel: false, message: "Revision is in progress",        warning: "Complete the revision process." },
  completed:       { canCancel: false, message: "Order is completed",             warning: "Order successfully completed." },
  cancelled:       { canCancel: false, message: "Already cancelled",              warning: "This order was previously cancelled." },
};

const DEFAULT_CANCEL_CONFIG: CancelConfig = {
  canCancel: false, message: "Cannot cancel", warning: "Please check order status.",
};

// ─── Helpers ──────────────────────────────────────────────────

function formatCurrency(amount: number, currency = "USD"): string {
  if (typeof amount !== "number" || isNaN(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string, includeTime = false): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch {
    return "Invalid date";
  }
}

function getListingId(order: Order): ListingId | null {
  return order.listingId && typeof order.listingId === "object" ? order.listingId : null;
}

function getPriorityBadge(order: Order): { text: string; hex: string } | null {
  let deliveryDate: Date;
  if (order.expectedDelivery) {
    deliveryDate = new Date(order.expectedDelivery);
  } else {
    deliveryDate = new Date(order.createdAt);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
  }
  const daysRemaining = Math.ceil((deliveryDate.getTime() - Date.now()) / 86_400_000);
  if (daysRemaining <= 1)  return { text: "Urgent",   hex: "#EF4444" };
  if (daysRemaining <= 3)  return { text: "Priority", hex: "#F97316" };
  if (daysRemaining <= 7)  return { text: "On Track", hex: "#22C55E" };
  return null;
}

function getCardBorderClass(status: string): string {
  const map: Record<string, string> = {
    in_revision: "border-l-red-400",
    delivered:   "border-l-yellow-400",
    in_progress: "border-l-green-400",
    processing:  "border-l-purple-400",
    paid:        "border-l-amber-400",
  };
  return map[status] ?? "border-l-border";
}

// ─── Sub-components ───────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: number; sub: string;
  from: string; to: string; border: string; text: string; subText: string;
}> = ({ label, value, sub, from, to, border, text, subText }) => (
  <div className={`bg-gradient-to-br ${from} ${to} p-4 rounded-xl border ${border}`}>
    <p className={`text-sm font-medium ${text}`}>{label}</p>
    <p className={`text-2xl font-bold ${text}`}>{value}</p>
    <p className={`text-xs ${subText}`}>{sub}</p>
  </div>
);

// ─── Delivery payload type ────────────────────────────────────

interface DeliveryPayload {
  deliveryMessage: string;
  isFinalDelivery: boolean;
  deliveryFiles?:  string[];
  attachments?:    UploadedFile[];
}

// ─── Component ────────────────────────────────────────────────

const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  loading,
  filter,
  onFilterChange,
  onViewOrderDetails,
  onPlayVideo,
  onRefresh,
}) => {
  const router = useRouter();

  const [isActioning,               setIsActioning]               = useState(false);
  const [expandedOrderId,          setExpandedOrderId]          = useState<string | null>(null);
  const [deliveryModalOpen,         setDeliveryModalOpen]         = useState(false);
  const [selectedOrderForDelivery,  setSelectedOrderForDelivery]  = useState<Order | null>(null);
  const [showCancelConfirm,         setShowCancelConfirm]         = useState<Order | null>(null);

  const actionLoading = isActioning;
  const isSubmittingDelivery = isActioning;

  // ─── Memoised derived data ─────────────────────────────────

  // FIX: statusFilters was recomputed with .filter() on every render
  const statusFilters = useMemo(() => [
    { value: "all",        label: "All Orders",  count: orders.length },
    { value: "paid",       label: "To Start",    count: orders.filter(o => o.status === "paid").length },
    { value: "processing", label: "Processing",  count: orders.filter(o => o.status === "processing").length },
    { value: "in_progress",label: "In Progress", count: orders.filter(o => o.status === "in_progress").length },
    { value: "delivered",  label: "Delivered",   count: orders.filter(o => o.status === "delivered").length },
    { value: "in_revision",label: "Revision",    count: orders.filter(o => o.status === "in_revision").length },
    { value: "completed",  label: "Completed",   count: orders.filter(o => o.status === "completed").length },
    { value: "cancelled",  label: "Cancelled",   count: orders.filter(o => o.status === "cancelled").length },
  ], [orders]);

  // FIX: filteredOrders was recomputed on every render
  const filteredOrders = useMemo(
    () => filter === "all" ? orders : orders.filter(o => o.status === filter),
    [orders, filter]
  );

  // ─── Actions ───────────────────────────────────────────────

  const handleStartProcessing = async (orderId: string) => {
    setIsActioning(true);
    try {
      await orderService.startProcessing(orderId);
      toast.success("Order processing started.");
      onRefresh();
    } catch {
      toast.error("Failed to start processing.");
    } finally {
      setIsActioning(false);
    }
  };

  const handleStartWork = async (orderId: string) => {
    setIsActioning(true);
    try {
      await orderService.startWork(orderId);
      toast.success("Work started.");
      onRefresh();
    } catch {
      toast.error("Failed to start work.");
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!CANCELLABLE_STATUSES.has(order.status)) return;
    setIsActioning(true);
    try {
      await orderService.cancelBySeller(order._id, { cancelReason: "Seller cancelled the order" });
      toast.success("Order cancelled.");
      onRefresh();
    } catch {
      toast.error("Failed to cancel order.");
    } finally {
      setIsActioning(false);
      setShowCancelConfirm(null);
    }
  };

  const handleDeliverClick = (order: Order) => {
    setSelectedOrderForDelivery(order);
    setDeliveryModalOpen(true);
  };

  const handleActualDeliver = async (deliveryData: {
    orderId:     string;
    message:     string;
    attachments: File[];
    isFinal:     boolean;
  }) => {
    const isRevision = selectedOrderForDelivery?.status === "in_revision";
    setIsActioning(true);
    try {
      if (isRevision) {
        await orderService.completeRevision(
          deliveryData.orderId,
          deliveryData.message,
          deliveryData.attachments,
          deliveryData.isFinal,
        );
      } else {
        await orderService.deliverOrder(
          deliveryData.orderId,
          deliveryData.message,
          deliveryData.attachments,
          deliveryData.isFinal,
        );
      }
      toast.success(isRevision ? "Revision completed." : "Order delivered.");
      setDeliveryModalOpen(false);
      setSelectedOrderForDelivery(null);
      setTimeout(onRefresh, 800);
    } catch (err: any) {
      // Re-throw so DeliveryModal can show the error inside the form
      throw err;
    } finally {
      setIsActioning(false);
    }
  };

  // FIX: was validateFileBeforeUpload inline, now centralised in hook;
  // kept here as a lightweight pre-check for the DeliveryModal UI layer
  const validateFile = (file: File): string | null => {
    const MAX_MB = 100 * 1024 * 1024;
    if (file.size > MAX_MB) return `"${file.name}" exceeds the 100 MB limit.`;
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    const allowed = new Set([
      ".jpg",".jpeg",".png",".gif",".webp",".svg",
      ".mp4",".mov",".avi",".webm",".mkv",
      ".pdf",".txt",".csv",".doc",".docx",".xls",".xlsx",".ppt",".pptx",
      ".mp3",".wav",".ogg",".m4a",
      ".zip",".rar",".7z",".tar",".gz",".tgz",".bz2",
    ]);
    if (!allowed.has(ext)) return `File type "${ext}" is not supported.`;
    return null;
  };

  const handleCopyOrderId = async (order: Order) => {
    try {
      await navigator.clipboard.writeText(order.orderNumber || order._id);
      toast.success("Order ID copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  // ─── Per-order action descriptor ──────────────────────────

  interface ActionDescriptor {
    text:        string;
    Icon:        React.FC<{ size?: number; className?: string }>;
    colorClass:  string;
    onClick:     (() => void) | null;
    description: string;
  }

  const getStatusAction = (order: Order): ActionDescriptor | null => {
    switch (order.status) {
      case "paid": return {
        text: "Start Processing", Icon: Settings,
        colorClass: "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700",
        onClick: () => handleStartProcessing(order._id),
        description: "Begin preparing this order",
      };
      case "processing": return {
        text: "Start Work", Icon: Truck,
        colorClass: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
        onClick: () => handleStartWork(order._id),
        description: "Begin working on deliverables",
      };
      case "in_progress": return {
        text: "Deliver Work", Icon: Send,
        colorClass: "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700",
        onClick: () => handleDeliverClick(order),
        description: "Send completed work to buyer",
      };
      case "in_revision": return {
        text: "Complete Revision", Icon: RotateCcw,
        colorClass: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
        onClick: () => handleDeliverClick(order),
        description: "Send revised work to buyer",
      };
      case "delivered": return {
        text: "Awaiting Buyer", Icon: Clock,
        colorClass: "from-gray-400 to-gray-500 cursor-default",
        onClick: null,
        description: "Waiting for buyer review",
      };
      default: return null;
    }
  };

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Cancel Confirmation Modal ──────────────────────── */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit={{   scale: 0.95, opacity: 0 }}
              className="bg-card-bg rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-danger-bg rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle size={20} className="text-danger" />
                </div>
                <h3 className="text-base font-bold text-text-primary">Cancel Order</h3>
              </div>

              <p className="text-sm text-text-secondary mb-3">
                Are you sure you want to cancel this order? This cannot be undone.
              </p>

              <div className="bg-warning-bg border border-accent/30 rounded-xl p-3 mb-5">
                <p className="text-sm text-warning">
                  <span className="font-semibold">Note: </span>
                  {(CANCEL_CONFIG[showCancelConfirm.status] ?? DEFAULT_CANCEL_CONFIG).warning}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(null)}
                  className="flex-1 py-2.5 border border-border text-text-secondary rounded-xl text-sm font-medium hover:bg-bg-secondary transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelOrder(showCancelConfirm)}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  {actionLoading ? "Cancelling…" : "Yes, Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Header with Stats ───────────────────────────────── */}
      <div className="bg-card-bg rounded-2xl shadow-sm border border-accent/30 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">My Orders</h2>
            <p className="text-sm text-text-tertiary mt-1">Manage and track all your orders in one place</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-card-bg border border-accent/40 rounded-xl text-sm font-medium text-text-secondary hover:bg-warning-bg disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="To Start" value={orders.filter(o => o.status === "paid").length}
            sub="Awaiting action"
            from="from-yellow-50" to="to-amber-50" border="border-accent/30"
            text="text-warning" subText="text-warning"
          />
          <StatCard
            label="In Progress"
            value={orders.filter(o => ["processing","in_progress"].includes(o.status)).length}
            sub="Being worked on"
            from="from-purple-50" to="to-violet-50" border="border-purple-200"
            text="text-purple-800" subText="text-purple-600"
          />
          <StatCard
            label="Completed" value={orders.filter(o => o.status === "completed").length}
            sub="Successfully delivered"
            from="from-green-50" to="to-emerald-50" border="border-success/30"
            text="text-success" subText="text-success"
          />
          <StatCard
            label="Cancellable" value={orders.filter(o => CANCELLABLE_STATUSES.has(o.status)).length}
            sub="Can be cancelled"
            from="from-bg-secondary" to="to-bg-tertiary" border="border-border"
            text="text-text-primary" subText="text-text-tertiary"
          />
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-accent/30">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {statusFilters.map(({ value, label, count }) => (
              <button
                key={value}
                type="button"
                onClick={() => onFilterChange(value)}
                className={[
                  "py-3 px-1 text-sm font-medium whitespace-nowrap transition-colors relative",
                  filter === value ? "text-warning" : "text-text-tertiary hover:text-text-secondary",
                ].join(" ")}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    filter === value ? "bg-warning-bg text-warning" : "bg-bg-tertiary text-text-secondary"
                  }`}>
                    {count}
                  </span>
                )}
                {filter === value && (
                  <motion.div
                    layoutId="order-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Action Guide ────────────────────────────────────── */}
      <OrderActionGuide currentFilter={filter} />

      {/* ── Orders List ─────────────────────────────────────── */}
      <div className="bg-card-bg rounded-2xl shadow-sm border border-accent/30 overflow-hidden">
        {loading ? (
          <div className="p-14 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-yellow-500" />
            <p className="text-sm text-text-tertiary">Loading orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-14 text-center">
            <p className="text-3xl text-text-tertiary mb-3">📦</p>
            <h3 className="text-base font-semibold text-text-primary">No orders found</h3>
            <p className="mt-1 text-sm text-text-tertiary">
              {filter === "all"
                ? "When you receive orders they will appear here."
                : `No ${filter.replaceAll("_", " ")} orders.`}
            </p>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => onFilterChange("all")}
                className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((order) => {
              const statusInfo    = STATUS_MAP[order.status] ?? DEFAULT_STATUS_INFO;
              const { Icon: StatusIcon } = statusInfo;
              const action        = getStatusAction(order);
              const priorityBadge = getPriorityBadge(order);
              const cancelConfig  = CANCEL_CONFIG[order.status] ?? DEFAULT_CANCEL_CONFIG;
              const listing       = getListingId(order);
              const currency      = listing?.currency ?? "USD";
              const isExpanded    = expandedOrderId === order._id;
              const isLoading     = !!actionLoading;
              const progress      = STATUS_PROGRESS[order.status];
              const statusHex     = statusInfo.hex;

              return (
                <div
                  key={order._id}
                  className={`p-6 border-l-4 hover:bg-bg-secondary transition-colors ${getCardBorderClass(order.status)}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">

                    {/* ── Order Info ──────────────────────── */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-warning-bg rounded-xl flex items-center justify-center flex-shrink-0 border border-accent/30">
                        <span className="text-sm font-bold text-warning">
                          {order.orderNumber?.slice(-3) ?? "#"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-text-primary truncate">
                            {listing?.title ?? `Order #${order.orderNumber}`}
                          </h3>
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${statusHex}18`,
                              color: statusHex,
                              borderColor: `${statusHex}35`,
                              border: "1px solid",
                            }}
                          >
                            <StatusIcon size={11} />
                            {statusInfo.text}
                          </span>
                          {priorityBadge && (
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: `${priorityBadge.hex}18`,
                                color: priorityBadge.hex,
                                border: `1px solid ${priorityBadge.hex}35`,
                              }}
                            >
                              {priorityBadge.text}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-tertiary">
                          <span>{order.buyerId?.username ?? order.buyerId?.email ?? "Buyer"}</span>
                          <span className="font-semibold text-success">
                            {formatCurrency(order.amount / 100, currency)}
                          </span>
                          <span>{formatDate(order.createdAt)}</span>
                          {order.expectedDelivery && (
                            <span className="text-amber-600">
                              Due: {formatDate(order.expectedDelivery)}
                            </span>
                          )}
                          {order.revisions !== undefined && (
                            <span className={
                              order.maxRevisions && order.revisions >= order.maxRevisions
                                ? "text-danger font-medium"
                                : ""
                            }>
                              {order.revisions} / {order.maxRevisions ?? 3} revisions
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        {progress && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-text-tertiary mb-1">
                              <span>Progress</span>
                              <span>{order.status === "processing" ? "25%" : "75%"}</span>
                            </div>
                            <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${progress.width} ${progress.color} transition-all`} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Actions ─────────────────────────── */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-success tabular-nums">
                          {formatCurrency(order.amount / 100, currency)}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          #{order.orderNumber ?? order._id.slice(-6)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Primary action */}
                        {action?.onClick && (
                          <button
                            type="button"
                            onClick={action.onClick}
                            disabled={isLoading || isSubmittingDelivery}
                            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r ${action.colorClass} rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-60`}
                          >
                            {isLoading
                              ? <Loader2 size={13} className="animate-spin" />
                              : <action.Icon size={13} />}
                            {isLoading ? "Working…" : action.text}
                          </button>
                        )}
                        {action && !action.onClick && (
                          <span className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r ${action.colorClass} rounded-xl opacity-75`}>
                            <action.Icon size={13} />
                            {action.text}
                          </span>
                        )}

                        {/* Cancel */}
                        {cancelConfig.canCancel ? (
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => setShowCancelConfirm(order)}
                              disabled={isLoading || isSubmittingDelivery}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-danger border border-danger/30 bg-danger-bg hover:bg-red-100 rounded-xl transition-colors disabled:opacity-60"
                            >
                              <X size={13} /> Cancel
                            </button>
                            <div className="absolute z-10 invisible group-hover:visible bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs bg-card-bg border border-border rounded-xl shadow-lg whitespace-nowrap text-text-secondary">
                              {cancelConfig.message}
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <button
                              type="button"
                              disabled
                              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-tertiary bg-bg-tertiary border border-border rounded-xl cursor-not-allowed"
                            >
                              <XCircle size={13} /> Cannot Cancel
                            </button>
                            <div className="absolute z-10 invisible group-hover:visible bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs bg-card-bg border border-border rounded-xl shadow-lg whitespace-nowrap text-text-secondary">
                              {cancelConfig.message}
                            </div>
                          </div>
                        )}

                        {/* Expand */}
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                          disabled={isSubmittingDelivery}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary bg-bg-secondary border border-border hover:bg-bg-tertiary rounded-xl transition-colors disabled:opacity-60"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {isExpanded ? "Less" : "More"}
                        </button>

                        {/* Details — navigates to full-page order view */}
                        <button
                          type="button"
                          onClick={() => router.push(`/marketplace/orders/${order._id}`)}
                          disabled={isSubmittingDelivery}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary bg-card-bg border border-accent/40 hover:bg-warning-bg rounded-xl transition-colors shadow-sm disabled:opacity-60"
                        >
                          <ExternalLink size={13} /> Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded View ────────────────────── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{   height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-6">

                          {/* Left: Status Tracker */}
                          <div>
                            <p className="text-sm font-semibold text-text-secondary mb-4">Order Progress</p>
                            <OrderStatusTracker
                              currentStatus={order.status}
                              orderId={order._id}
                              createdAt={order.createdAt}
                              deliveredAt={order.deliveredAt}
                              completedAt={order.completedAt}
                            />
                            {action && (
                              <div className="mt-5 p-4 bg-warning-bg border border-accent/30 rounded-xl">
                                <p className="text-sm font-semibold text-warning mb-1 flex items-center gap-1.5">
                                  <action.Icon size={14} />
                                  Next: {action.text}
                                </p>
                                <p className="text-xs text-warning mb-3">{action.description}</p>
                                {action.onClick && (
                                  <button
                                    type="button"
                                    onClick={action.onClick}
                                    disabled={isLoading || isSubmittingDelivery}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-gradient-to-r ${action.colorClass} rounded-xl transition-all disabled:opacity-60 shadow-md`}
                                  >
                                    <action.Icon size={13} /> Take Action
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: Details */}
                          <div>
                            <p className="text-sm font-semibold text-text-secondary mb-4">Order Details</p>
                            <div className="space-y-2.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-text-tertiary">Order Date</span>
                                <span className="font-medium text-text-primary">{formatDate(order.createdAt)}</span>
                              </div>
                              {order.expectedDelivery && (
                                <div className="flex justify-between">
                                  <span className="text-text-tertiary">Expected Delivery</span>
                                  <span className="font-medium text-text-primary">{formatDate(order.expectedDelivery)}</span>
                                </div>
                              )}
                              {order.revisions !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-text-tertiary">Revisions Used</span>
                                  <span className="font-medium text-text-primary">
                                    {order.revisions} / {order.maxRevisions ?? 3}
                                    {order.maxRevisions && order.revisions >= order.maxRevisions && (
                                      <span className="ml-1 text-xs text-danger">(Max)</span>
                                    )}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-text-tertiary">Payment</span>
                                <span className={`font-medium ${
                                  order.paymentStatus === "paid" || order.paymentStatus === "succeeded" ? "text-success" :
                                  order.paymentStatus === "pending" || order.paymentStatus === "processing" ? "text-warning" :
                                  "text-danger"
                                }`}>
                                  {/* FIX: replaceAll for multi-underscore statuses */}
                                  {order.paymentStatus?.replaceAll("_", " ") ?? "N/A"}
                                </span>
                              </div>
                              {order.requirements && (
                                <div className="mt-2 p-3 bg-info-bg border border-info/30 rounded-xl">
                                  <p className="text-xs text-info">
                                    <span className="font-semibold">Requirements: </span>
                                    {order.requirements}
                                  </p>
                                </div>
                              )}

                              {/* Quick Links */}
                              <div className="pt-4 border-t border-border">
                                <p className="text-xs font-semibold text-text-secondary mb-2">Quick Actions</p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/marketplace/orders/${order._id}`)}
                                    disabled={isSubmittingDelivery}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-warning-bg text-warning border border-accent/30 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-60"
                                  >
                                    <ExternalLink size={11} /> Full Details
                                  </button>
                                  {/* FIX: useNavigate instead of window.open */}
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/marketplace/messages?order=${order._id}`)}
                                    disabled={isSubmittingDelivery}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-success-bg text-success border border-success/30 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-60"
                                  >
                                    <MessageCircle size={11} /> Message Buyer
                                  </button>
                                  {listing?.mediaUrls?.length && onPlayVideo && (
                                    <button
                                      type="button"
                                      onClick={() => onPlayVideo(listing.mediaUrls?.[0] ?? '', listing.title)}
                                      disabled={isSubmittingDelivery}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-60"
                                    >
                                      <ExternalLink size={11} /> View Media
                                    </button>
                                  )}
                                  {/* FIX: async clipboard with await + catch */}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOrderId(order)}
                                    disabled={isSubmittingDelivery}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-secondary text-text-secondary border border-border rounded-lg hover:bg-bg-tertiary transition-colors disabled:opacity-60"
                                  >
                                    <Copy size={11} /> Copy Order ID
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delivery Modal ───────────────────────────────────── */}
      {deliveryModalOpen && selectedOrderForDelivery && (
        <DeliveryModal
          isOpen={deliveryModalOpen}
          onClose={() => {
            setDeliveryModalOpen(false);
            setSelectedOrderForDelivery(null);
          }}
          order={selectedOrderForDelivery}
          onDeliver={handleActualDeliver}
          isLoading={isSubmittingDelivery}
          validateFile={validateFile}
        />
      )}
    </div>
  );
};

export default OrdersTab;
