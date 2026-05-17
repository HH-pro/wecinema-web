"use client";
/**
 * BuyerDashboard — Wecinema Marketplace
 * Styled with Tailwind CSS (matches Browse.tsx theme)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaShoppingBag, FaClock, FaCheckCircle, FaWallet,
  FaShoppingCart, FaBoxOpen, FaSync, FaTruck,
  FaFilter, FaDollarSign, FaCalendar, FaEye,
  FaCreditCard, FaComment, FaReply, FaTimes,
  FaDownload, FaStar, FaListAlt, FaChartLine,
  FaHistory, FaSpinner, FaTag, FaFileInvoiceDollar,
  FaArrowRight, FaEllipsisV, FaRegFileAlt, FaSearch,
  FaShippingFast, FaFileDownload, FaFileArchive,
  FaHeadset, FaReceipt, FaUndo,
  FaCreditCard as FaCreditCardOutline,
  FaUserCircle, FaRegClock, FaRegCheckCircle,
  FaRegTimesCircle, FaExclamationCircle, FaPlus,
  FaPalette, FaPencilAlt, FaCode, FaBullhorn,
  FaVideo, FaMusic, FaUserTie, FaCamera, FaLanguage,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { useAuth } from '@/features/auth/context/AuthContext';
import * as orderService from '@/features/marketplace/api/order.service';
import type { Order, BuyerOrderStats } from '@/types/order.types';

// ─── Types ────────────────────────────────────────────────────

interface BuyerOrder extends Order {
  orderNumber?: string;
}

interface ConfirmModalState {
  isOpen:      boolean;
  title:       string;
  message:     string;
  inputLabel?: string;
  inputMin?:   number;
  onConfirm:   (inputValue?: string) => void;
}

// ─── Utility ──────────────────────────────────────────────────

function formatCurrency(amountInCents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);
}

// ─── Status config ────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  color: string; bgColor: string; icon: React.ReactElement; text: string;
  twColor: string; twBg: string;
}> = {
  pending_payment:  { color: '#FFB74D', bgColor: '#FFF3E0', icon: <FaRegClock />,         text: 'Payment Pending', twColor: 'text-yellow-400',  twBg: 'bg-yellow-400/10' },
  paid:             { color: '#64B5F6', bgColor: '#E3F2FD', icon: <FaCreditCardOutline />, text: 'Paid',            twColor: 'text-blue-400',    twBg: 'bg-blue-400/10' },
  processing:       { color: '#9575CD', bgColor: '#F3E5F5', icon: <FaBoxOpen />,           text: 'Processing',      twColor: 'text-purple-400',  twBg: 'bg-purple-400/10' },
  in_progress:      { color: '#4DB6AC', bgColor: '#E0F2F1', icon: <FaSync />,              text: 'In Progress',     twColor: 'text-teal-400',    twBg: 'bg-teal-400/10' },
  delivered:        { color: '#81C784', bgColor: '#E8F5E9', icon: <FaTruck />,             text: 'Delivered',       twColor: 'text-green-400',   twBg: 'bg-green-400/10' },
  in_revision:      { color: '#FF8A65', bgColor: '#FBE9E7', icon: <FaUndo />,              text: 'In Revision',     twColor: 'text-orange-400',  twBg: 'bg-orange-400/10' },
  completed:        { color: '#66BB6A', bgColor: '#E8F5E9', icon: <FaRegCheckCircle />,    text: 'Completed',       twColor: 'text-green-400',   twBg: 'bg-green-400/10' },
  cancelled:        { color: '#90A4AE', bgColor: '#ECEFF1', icon: <FaRegTimesCircle />,    text: 'Cancelled',       twColor: 'text-gray-400',    twBg: 'bg-gray-400/10' },
  disputed:         { color: '#E57373', bgColor: '#FFEBEE', icon: <FaExclamationCircle />, text: 'Disputed',        twColor: 'text-red-400',     twBg: 'bg-red-400/10' },
  pending:          { color: '#FFD54F', bgColor: '#FFFDE7', icon: <FaRegClock />,          text: 'Pending',         twColor: 'text-yellow-300',  twBg: 'bg-yellow-300/10' },
  refunded:         { color: '#78909C', bgColor: '#ECEFF1', icon: <FaRegTimesCircle />,    text: 'Refunded',        twColor: 'text-slate-400',   twBg: 'bg-slate-400/10' },
};

const CATEGORY_ICONS: Record<string, { icon: React.ReactElement; twColor: string; twBg: string }> = {
  digital_art:    { icon: <FaPalette />,    twColor: 'text-violet-400',  twBg: 'bg-violet-400/10' },
  graphic_design: { icon: <FaPencilAlt />,  twColor: 'text-sky-400',     twBg: 'bg-sky-400/10' },
  writing:        { icon: <FaRegFileAlt />, twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10' },
  programming:    { icon: <FaCode />,       twColor: 'text-amber-400',   twBg: 'bg-amber-400/10' },
  marketing:      { icon: <FaBullhorn />,   twColor: 'text-pink-400',    twBg: 'bg-pink-400/10' },
  video_editing:  { icon: <FaVideo />,      twColor: 'text-indigo-400',  twBg: 'bg-indigo-400/10' },
  music:          { icon: <FaMusic />,      twColor: 'text-violet-400',  twBg: 'bg-violet-400/10' },
  consulting:     { icon: <FaUserTie />,    twColor: 'text-cyan-400',    twBg: 'bg-cyan-400/10' },
  photography:    { icon: <FaCamera />,     twColor: 'text-red-400',     twBg: 'bg-red-400/10' },
  translation:    { icon: <FaLanguage />,   twColor: 'text-teal-400',    twBg: 'bg-teal-400/10' },
  default:        { icon: <FaBoxOpen />,    twColor: 'text-gray-400',    twBg: 'bg-gray-400/10' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { color: '#6B7280', bgColor: '#F9FAFB', icon: <FaClock />, text: status, twColor: 'text-gray-400', twBg: 'bg-gray-400/10' };
}

function getCategoryIcon(order: BuyerOrder): { icon: React.ReactElement; twColor: string; twBg: string } {
  const cat = typeof order.listingId === 'object' && order.listingId !== null
    ? ((order.listingId as any).category as string | undefined) ?? 'default'
    : 'default';
  return CATEGORY_ICONS[cat.toLowerCase()] ?? CATEGORY_ICONS['default'] ?? { icon: <FaBoxOpen />, twColor: 'text-gray-400', twBg: 'bg-gray-400/10' };
}

function getProgressWidth(status: string): string {
  const map: Record<string, string> = {
    pending_payment: '25%', pending: '25%', paid: '30%',
    processing: '50%', in_progress: '75%',
    delivered: '90%', in_revision: '90%', completed: '100%',
  };
  return map[status] ?? '0%';
}

// ─── Order field helpers ──────────────────────────────────────

function getSellerUsername(order: BuyerOrder): string {
  if (typeof order.sellerId === 'object' && order.sellerId !== null) {
    const s = order.sellerId as any;
    return s.firstName
      ? `${s.firstName} ${s.lastName ?? ''}`.trim()
      : (s.username as string | undefined) ?? 'Unknown Seller';
  }
  return 'Unknown Seller';
}

function getListingTitle(order: BuyerOrder): string {
  if (typeof order.listingId === 'object' && order.listingId !== null) {
    return ((order.listingId as any).title as string | undefined) ?? 'Unnamed Listing';
  }
  return 'Unnamed Listing';
}

function getListingCategory(order: BuyerOrder): string {
  if (typeof order.listingId === 'object' && order.listingId !== null) {
    return ((order.listingId as any).category as string | undefined) ?? 'General';
  }
  return 'General';
}

// ─── Confirm Modal ────────────────────────────────────────────

interface ConfirmDialogProps {
  state:    ConfirmModalState;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onCancel }) => {
  const [inputValue, setInputValue] = useState('');
  if (!state.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-card-bg border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 theme-transition"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">{state.title}</h3>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-btn-secondary-bg transition-colors"
            aria-label="Close"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-text-secondary text-sm">{state.message}</p>
          {state.inputLabel && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {state.inputLabel}
              </label>
              <textarea
                rows={3}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={`Minimum ${state.inputMin ?? 0} characters…`}
                className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-input-focus resize-vertical theme-transition"
              />
              {state.inputMin && inputValue.trim().length > 0 && inputValue.trim().length < state.inputMin && (
                <p className="text-danger text-xs mt-1">
                  Must be at least {state.inputMin} characters ({inputValue.trim().length}/{state.inputMin})
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition"
          >
            Cancel
          </button>
          <button
            disabled={!!state.inputMin && inputValue.trim().length < state.inputMin}
            onClick={() => state.onConfirm(inputValue || undefined)}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-btn-primary-text text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed theme-transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────

const BuyerDashboard: React.FC = () => {
  const router = useRouter();
  const { authUser, isAuthenticated } = useAuth();

  const [orders,         setOrders]        = useState<BuyerOrder[]>([]);
  const [filteredOrders, setFiltered]      = useState<BuyerOrder[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [actionLoading,  setActionLoading] = useState<string | null>(null);

  const [searchQuery,        setSearchQuery]        = useState('');
  const [statusFilter,       setStatusFilter]       = useState('all');
  const [sortBy,             setSortBy]             = useState('newest');
  const [categoryFilter,     setCategoryFilter]     = useState('all');
  const [dateRange,          setDateRange]          = useState({ start: '', end: '' });
  const [minAmount,          setMinAmount]          = useState<number | ''>('');
  const [maxAmount,          setMaxAmount]          = useState<number | ''>('');
  const [sellerFilter,       setSellerFilter]       = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [openMenuId,       setOpenMenuId]       = useState<string | null>(null);
  const [actionsOrder,     setActionsOrder]     = useState<BuyerOrder | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false, title: '', message: '', onConfirm: () => {},
  });

  const actionsModalRef = useRef<HTMLDivElement>(null);

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) router.push('/');
  }, [isAuthenticated, router]);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders();
      setOrders((res.orders ?? []) as BuyerOrder[]);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Filter / sort ───────────────────────────────────────────
  useEffect(() => {
    let list = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        getListingTitle(o).toLowerCase().includes(q) ||
        getSellerUsername(o).toLowerCase().includes(q) ||
        (o.orderNumber ?? '').toLowerCase().includes(q) ||
        o._id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all')   list = list.filter(o => o.status === statusFilter);
    if (categoryFilter !== 'all') list = list.filter(o => getListingCategory(o) === categoryFilter);
    if (dateRange.start) {
      const s = new Date(dateRange.start);
      list = list.filter(o => new Date(o.createdAt) >= s);
    }
    if (dateRange.end) {
      const e = new Date(dateRange.end);
      list = list.filter(o => new Date(o.createdAt) <= e);
    }
    if (minAmount !== '') list = list.filter(o => o.amount >= (minAmount as number));
    if (maxAmount !== '') list = list.filter(o => o.amount <= (maxAmount as number));
    if (sellerFilter.trim()) {
      const q = sellerFilter.toLowerCase();
      list = list.filter(o => getSellerUsername(o).toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'newest':     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_high': return b.amount - a.amount;
        case 'price_low':  return a.amount - b.amount;
        case 'status':     return a.status.localeCompare(b.status);
        case 'title_asc':  return getListingTitle(a).localeCompare(getListingTitle(b));
        case 'title_desc': return getListingTitle(b).localeCompare(getListingTitle(a));
        default:           return 0;
      }
    });

    setFiltered(list);
  }, [orders, searchQuery, statusFilter, sortBy, categoryFilter, dateRange, minAmount, maxAmount, sellerFilter]);

  // ── Outside click closes actions modal ──────────────────────
  useEffect(() => {
    if (!showActionsModal) return;
    const handler = (e: MouseEvent) => {
      if (!actionsModalRef.current?.contains(e.target as Node)) {
        setShowActionsModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showActionsModal]);

  // ── Stats ───────────────────────────────────────────────────
  const stats = {
    total:     orders.length,
    active:    orders.filter(o => ['processing', 'in_progress', 'delivered', 'in_revision'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    spent:     orders.filter(o => ['completed', 'delivered', 'paid', 'in_progress'].includes(o.status)).reduce((s, o) => s + o.amount, 0),
  };

  // ── Confirm helper ──────────────────────────────────────────
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: (val?: string) => void,
    inputLabel?: string,
    inputMin?: number
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, inputLabel, inputMin });
  };

  const closeConfirm = () => {
    setConfirmModal(s => ({ ...s, isOpen: false }));
  };

  // ── Order actions ───────────────────────────────────────────
  const handleOrderAction = useCallback(async (orderId: string, action: string) => {
    setActionLoading(`${orderId}:${action}`);
    try {
      switch (action) {
        case 'view_details':     router.push(`/marketplace/orders/${orderId}`);                  break;
        case 'complete_payment': router.push(`/marketplace/payment/${orderId}`);                 break;
        case 'contact_seller':   router.push(`/marketplace/messages?order=${orderId}`);          break;
        case 'view_timeline':    router.push(`/marketplace/orders/${orderId}?tab=timeline`);     break;
        case 'download_files':   router.push(`/marketplace/orders/${orderId}?tab=files`);        break;
        case 'view_invoice':     router.push(`/marketplace/orders/${orderId}/invoice`);          break;
        case 'view_payment':     router.push(`/marketplace/orders/${orderId}?tab=payment`);      break;
        case 'contact_support':  router.push('/support');                                break;
        case 'complete_order':
          showConfirm(
            'Complete Order',
            'This will approve the delivery and release payment to the seller. Are you sure?',
            async () => {
              closeConfirm();
              await orderService.completeOrder(orderId);
              await fetchOrders();
            }
          );
          break;
        case 'request_revision':
          showConfirm(
            'Request Revision',
            'Please describe the changes needed:',
            async (notes) => {
              closeConfirm();
              if (!notes?.trim()) return;
              await orderService.requestRevision(orderId, { revisionNotes: notes.trim() });
              await fetchOrders();
            },
            'Revision notes',
            10
          );
          break;
        case 'cancel_order':
          showConfirm(
            'Cancel Order',
            'Please provide a reason for cancellation:',
            async (reason) => {
              closeConfirm();
              if (!reason?.trim()) return;
              await orderService.cancelByBuyer(orderId, { cancelReason: reason.trim() });
              await fetchOrders();
            },
            'Cancellation reason',
            1
          );
          break;
        default:
          console.warn('Unknown action:', action);
      }
    } catch (err) {
      console.error('Order action error:', err);
    } finally {
      setActionLoading(null);
      setShowActionsModal(false);
    }
  }, [router, fetchOrders]);

  // ── CSV export ──────────────────────────────────────────────
  const exportOrders = () => {
    if (!filteredOrders.length) return;
    const rows = filteredOrders.map(o => ({
      'Order Number':      o.orderNumber ?? 'N/A',
      'Listing':           getListingTitle(o),
      'Seller':            getSellerUsername(o),
      'Amount':            formatCurrency(o.amount),
      'Status':            getStatusConfig(o.status).text,
      'Payment Status':    o.paymentStatus ?? 'N/A',
      'Created Date':      new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      'Expected Delivery': o.expectedDelivery
        ? new Date(o.expectedDelivery).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A',
      'Revisions': `${o.revisions ?? 0}/${o.maxRevisions ?? 0}`,
    }));

    const headers = Object.keys(rows[0] ?? {}).join(',');
    const body    = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob    = new Blob([`${headers}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const link    = document.createElement('a');
    link.href     = URL.createObjectURL(blob);
    link.download = `buyer_orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all');
    setDateRange({ start: '', end: '' }); setMinAmount(''); setMaxAmount('');
    setSellerFilter(''); setSortBy('newest'); setShowAdvancedFilters(false);
  };

  // ── Quick actions ───────────────────────────────────────────
  const quickActions = [
    { icon: <FaShoppingCart />, label: 'Browse Marketplace', description: 'Explore new listings', action: () => router.push('/marketplace'),              twColor: 'text-indigo-400', twBg: 'bg-indigo-400/10' },
    { icon: <FaComment />,      label: 'Messages',           description: 'Chat with sellers',    action: () => router.push('/marketplace/messages'),            twColor: 'text-sky-400',    twBg: 'bg-sky-400/10' },
    { icon: <FaChartLine />,    label: 'Analytics',          description: 'View insights',         action: () => router.push('/marketplace/stats/buyer'), twColor: 'text-violet-400', twBg: 'bg-violet-400/10' },
    { icon: <FaHeadset />,      label: 'Support',            description: 'Get help',              action: () => router.push('/support'),                 twColor: 'text-pink-400',   twBg: 'bg-pink-400/10' },
  ];

  // ── Per-order action list ───────────────────────────────────
  const getOrderActions = (order: BuyerOrder) => {
    const always = [
      { label: 'View Full Details', action: 'view_details',   icon: <FaEye />,     twColor: 'text-indigo-400', twBg: 'bg-indigo-400/10', description: 'View complete order info' },
      { label: 'Contact Support',   action: 'contact_support', icon: <FaHeadset />, twColor: 'text-gray-400',   twBg: 'bg-gray-400/10',   description: 'Get help from support' },
    ];

    const byStatus: Record<string, { label: string; action: string; icon: React.ReactElement; twColor: string; twBg: string; description: string }[]> = {
      pending_payment: [
        { label: 'Complete Payment', action: 'complete_payment', icon: <FaCreditCard />, twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', description: 'Complete payment securely' },
        { label: 'Cancel Order',     action: 'cancel_order',     icon: <FaTimes />,      twColor: 'text-red-400',     twBg: 'bg-red-400/10',     description: 'Cancel this order' },
      ],
      pending: [
        { label: 'Complete Payment', action: 'complete_payment', icon: <FaCreditCard />, twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', description: 'Complete payment' },
        { label: 'Cancel Order',     action: 'cancel_order',     icon: <FaTimes />,      twColor: 'text-red-400',     twBg: 'bg-red-400/10',     description: 'Cancel order' },
      ],
      paid: [
        { label: 'View Timeline',  action: 'view_timeline',  icon: <FaHistory />, twColor: 'text-violet-400', twBg: 'bg-violet-400/10', description: 'Track progress' },
        { label: 'Contact Seller', action: 'contact_seller', icon: <FaComment />, twColor: 'text-sky-400',    twBg: 'bg-sky-400/10',    description: 'Message seller' },
      ],
      processing: [
        { label: 'View Timeline',  action: 'view_timeline',  icon: <FaHistory />, twColor: 'text-violet-400', twBg: 'bg-violet-400/10', description: 'Track progress' },
        { label: 'Contact Seller', action: 'contact_seller', icon: <FaComment />, twColor: 'text-sky-400',    twBg: 'bg-sky-400/10',    description: 'Message seller' },
      ],
      in_progress: [
        { label: 'View Timeline',  action: 'view_timeline',  icon: <FaHistory />, twColor: 'text-violet-400', twBg: 'bg-violet-400/10', description: 'Track progress' },
        { label: 'Contact Seller', action: 'contact_seller', icon: <FaComment />, twColor: 'text-sky-400',    twBg: 'bg-sky-400/10',    description: 'Message seller' },
      ],
      delivered: [
        ...(
          (order.revisions ?? 0) < (order.maxRevisions ?? 3)
            ? [{ label: 'Request Revision',  action: 'request_revision', icon: <FaReply />,        twColor: 'text-amber-400',   twBg: 'bg-amber-400/10',   description: 'Request changes' }]
            : []
        ),
        { label: 'Download Files',   action: 'download_files', icon: <FaFileDownload />,   twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', description: 'Download delivered files' },
        { label: 'Mark as Complete', action: 'complete_order', icon: <FaCheckCircle />,    twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', description: 'Release payment to seller' },
      ],
      in_revision: [
        { label: 'Contact Seller',        action: 'contact_seller', icon: <FaComment />,     twColor: 'text-sky-400',    twBg: 'bg-sky-400/10',    description: 'Discuss revision' },
        { label: 'Download Latest Files', action: 'download_files', icon: <FaFileArchive />, twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', description: 'Download revised files' },
      ],
      completed: [
        { label: 'Download Files',  action: 'download_files', icon: <FaDownload />,          twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', description: 'Download files' },
        { label: 'View Invoice',    action: 'view_invoice',   icon: <FaFileInvoiceDollar />, twColor: 'text-violet-400',  twBg: 'bg-violet-400/10',  description: 'View invoice' },
        { label: 'Payment Details', action: 'view_payment',   icon: <FaReceipt />,           twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10', description: 'View payment info' },
      ],
    };

    return [...(byStatus[order.status] ?? []), ...always];
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading && orders.length === 0) {
    return (
      <MarketplaceLayout>
        <div className="mp-loading-state" style={{ minHeight: "60vh" }}>
          <div className="mp-spinner" style={{ marginBottom: 20 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px", fontFamily: "var(--font-heading)" }}>Loading Dashboard</p>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>Fetching your order history…</p>
        </div>
      </MarketplaceLayout>
    );
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <MarketplaceLayout>
      <div className="bg-bg-secondary theme-transition py-8">

        {/* Ambient background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* ── Header ── */}
          <div className="mb-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold text-text-primary theme-transition">
                  Buyer Dashboard
                </h1>
                <p className="text-text-secondary text-lg theme-transition">
                  Track, manage, and review all your purchases
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { icon: <FaShoppingBag size={12} />, label: `${stats.total} Total` },
                    { icon: <FaCheckCircle size={12} />, label: `${stats.completed} Completed` },
                    { icon: <FaSync size={12} />,        label: `${stats.active} Active` },
                    { icon: <FaDollarSign size={12} />,  label: formatCurrency(stats.spent) },
                  ].map(b => (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card-bg border border-border text-text-secondary text-xs font-medium theme-transition"
                    >
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition disabled:opacity-60"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} size={13} />
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
                <button
                  onClick={() => router.push('/marketplace')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-btn-primary-text font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all theme-transition"
                >
                  <FaPlus size={13} /> New Order
                </button>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { icon: <FaShoppingBag />, value: stats.total,               label: 'Total Orders',  sub: 'All time',          twColor: 'text-indigo-400', twBg: 'bg-indigo-400/10' },
              { icon: <FaSync />,        value: stats.active,              label: 'Active Orders', sub: 'In progress',       twColor: 'text-sky-400',    twBg: 'bg-sky-400/10' },
              { icon: <FaCheckCircle />, value: stats.completed,           label: 'Completed',     sub: 'Successfully done', twColor: 'text-emerald-400', twBg: 'bg-emerald-400/10' },
              { icon: <FaWallet />,      value: formatCurrency(stats.spent), label: 'Total Spent', sub: 'All purchases',     twColor: 'text-amber-400',  twBg: 'bg-amber-400/10' },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-card-bg border border-border rounded-2xl p-5 flex gap-4 items-start hover:border-accent/40 transition-all theme-transition"
              >
                <div className={`w-10 h-10 flex-shrink-0 rounded-xl ${s.twBg} flex items-center justify-center ${s.twColor}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary leading-tight">{s.value}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{s.label}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick Actions ── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary theme-transition">Quick Actions</h2>
                <p className="text-sm text-text-secondary theme-transition">Common tasks and shortcuts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.action}
                  className="flex items-center gap-4 p-4 bg-card-bg border border-border rounded-2xl hover:border-accent/40 hover:bg-btn-secondary-bg transition-all duration-200 text-left group theme-transition"
                >
                  <div className={`w-10 h-10 flex-shrink-0 rounded-xl ${a.twBg} flex items-center justify-center ${a.twColor}`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{a.label}</p>
                    <p className="text-xs text-text-secondary truncate">{a.description}</p>
                  </div>
                  <FaArrowRight className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0" size={13} />
                </button>
              ))}
            </div>
          </div>

          {/* ── Orders Section ── */}
          <div>
            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-text-primary theme-transition">Your Orders</h2>
                <p className="text-sm text-text-secondary theme-transition">
                  {filteredOrders.length} orders • {formatCurrency(filteredOrders.reduce((s, o) => s + o.amount, 0))}
                </p>
              </div>
              <button
                onClick={exportOrders}
                disabled={!filteredOrders.length}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaDownload size={13} /> Export CSV
              </button>
            </div>

            {/* Search + sort bar */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search orders…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input-border bg-input-bg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-input-focus transition-all theme-transition"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-input-border bg-input-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 theme-transition"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_high">Price: High → Low</option>
                <option value="price_low">Price: Low → High</option>
                <option value="status">By status</option>
                <option value="title_asc">Title A–Z</option>
                <option value="title_desc">Title Z–A</option>
              </select>
              <button
                onClick={() => setShowAdvancedFilters(v => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all theme-transition ${
                  showAdvancedFilters
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-btn-secondary-bg text-btn-secondary-text hover:bg-btn-secondary-hover'
                }`}
              >
                <FaFilter size={13} /> Filters
              </button>
              {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-danger/40 bg-danger/10 text-danger text-sm font-medium transition-all hover:bg-danger/20"
                >
                  <FaTimes size={12} /> Clear
                </button>
              )}
            </div>

            {/* Advanced filters */}
            {showAdvancedFilters && (
              <div className="bg-card-bg border border-border rounded-2xl p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 theme-transition">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Seller name</label>
                  <input
                    value={sellerFilter}
                    onChange={e => setSellerFilter(e.target.value)}
                    placeholder="Filter by seller…"
                    className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 theme-transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">From date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 theme-transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">To date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 theme-transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Min amount</label>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={e => setMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 theme-transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Max amount</label>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={e => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="∞"
                    className="w-full px-3 py-2 rounded-lg border border-input-border bg-input-bg text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 theme-transition"
                  />
                </div>
              </div>
            )}

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all theme-transition ${
                  statusFilter === 'all'
                    ? 'bg-accent text-btn-primary-text border-accent'
                    : 'bg-card-bg text-text-secondary border-border hover:border-accent/40'
                }`}
              >
                <FaListAlt size={11} /> All
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{orders.length}</span>
              </button>
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const count = orders.filter(o => o.status === status).length;
                if (!count) return null;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all theme-transition ${
                      statusFilter === status
                        ? `${cfg.twBg} ${cfg.twColor} border-current`
                        : 'bg-card-bg text-text-secondary border-border hover:border-accent/40'
                    }`}
                  >
                    <span className="text-[11px]">{cfg.icon}</span>
                    {cfg.text}
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Orders list */}
            {filteredOrders.length > 0 ? (
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const cfg     = getStatusConfig(order.status);
                  const catIcon = getCategoryIcon(order);
                  const seller  = getSellerUsername(order);
                  const title   = getListingTitle(order);
                  const sellerRating = typeof order.sellerId === 'object' && order.sellerId
                    ? ((order.sellerId as any).sellerRating as number | undefined) ?? 0
                    : 0;
                  const progressSteps = ['pending_payment', 'paid', 'processing', 'in_progress', 'delivered', 'in_revision', 'completed'];
                  const progressIdx   = progressSteps.indexOf(order.status);

                  return (
                    <div
                      key={order._id}
                      onClick={() => router.push(`/marketplace/orders/${order._id}`)}
                      className="bg-card-bg border border-border rounded-2xl p-5 flex flex-col lg:flex-row gap-5 cursor-pointer hover:border-accent/40 hover:shadow-lg transition-all duration-200 group theme-transition"
                    >
                      {/* Category icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl ${catIcon.twBg} flex items-center justify-center ${catIcon.twColor} text-2xl`}>
                          {catIcon.icon}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Title row */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{title}</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-1">
                              {order.orderNumber && (
                                <span className="text-xs text-text-tertiary font-mono">#{order.orderNumber}</span>
                              )}
                              <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                                <FaCalendar size={10} />
                                {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${catIcon.twBg} ${catIcon.twColor}`}>
                                <FaTag size={9} /> {getListingCategory(order)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-text-primary">{formatCurrency(order.amount)}</p>
                            <p className="text-xs text-text-tertiary font-mono">ID: {order._id.slice(-8)}</p>
                          </div>
                        </div>

                        {/* Seller */}
                        <div className="flex items-center gap-2">
                          <FaUserCircle className={catIcon.twColor} size={14} />
                          <span className="text-sm text-text-secondary">Seller: {seller}</span>
                          {sellerRating > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <FaStar size={10} /> {sellerRating.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cfg.twColor.replace('text-', 'bg-')} transition-all duration-500`}
                              style={{ width: getProgressWidth(order.status) }}
                            />
                          </div>
                          <div className="flex justify-between mt-1.5">
                            {['Ordered', 'Processing', 'Delivered', 'Completed'].map((label, i) => {
                              const activeAt = [0, 2, 4, 6];
                              return (
                                <span
                                  key={label}
                                  className={`text-[10px] font-medium ${progressIdx >= (activeAt[i] ?? 0) ? 'text-accent' : 'text-text-tertiary'}`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Extra info */}
                        <div className="flex flex-wrap gap-3">
                          {(order.revisions ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                              <FaReply size={10} /> Revisions: {order.revisions}/{order.maxRevisions ?? 3}
                            </span>
                          )}
                          {order.expectedDelivery && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                              <FaClock size={10} /> Expected: {new Date(order.expectedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {order.deliveredAt && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <FaShippingFast size={10} /> Delivered: {new Date(order.deliveredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right column: status + actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 flex-shrink-0 lg:w-44">
                        {/* Status badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.twBg} ${cfg.twColor}`}>
                          <span className="text-[11px]">{cfg.icon}</span> {cfg.text}
                        </div>

                        {/* Payment status */}
                        <div>
                          {order.paymentReleased ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                              <FaCheckCircle size={10} /> Payment Released
                            </span>
                          ) : order.paidAt ? (
                            <span className="inline-flex items-center gap-1 text-xs text-sky-400">
                              <FaCreditCard size={10} /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                              <FaClock size={10} /> Payment Pending
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/marketplace/orders/${order._id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-xs font-medium transition-all theme-transition"
                          >
                            <FaEye size={11} /> View
                          </button>
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => handleOrderAction(order._id, 'download_files')}
                              disabled={actionLoading === `${order._id}:download_files`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/40 text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 text-xs font-medium transition-all disabled:opacity-60"
                            >
                              {actionLoading === `${order._id}:download_files`
                                ? <FaSpinner className="animate-spin" size={11} />
                                : <FaDownload size={11} />}
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => { setActionsOrder(order); setShowActionsModal(true); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-xs font-medium transition-all theme-transition"
                          >
                            <FaEllipsisV size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                  <FaBoxOpen size={36} />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">No orders found</h3>
                <p className="text-text-secondary max-w-sm mb-6 text-sm">
                  {orders.length === 0
                    ? "You haven't placed any orders yet. Start exploring our marketplace!"
                    : "No orders match your filters. Try adjusting your search."}
                </p>
                <div className="flex gap-3">
                  {orders.length === 0 ? (
                    <button
                      onClick={() => router.push('/marketplace')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-btn-primary-text font-semibold text-sm transition-all theme-transition"
                    >
                      <FaShoppingCart size={14} /> Start Shopping
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition"
                      >
                        Clear Filters
                      </button>
                      <button
                        onClick={() => router.push('/marketplace')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-btn-primary-text text-sm font-semibold transition-all theme-transition"
                      >
                        Browse Marketplace
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Actions Modal ── */}
      {showActionsModal && actionsOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={actionsModalRef}
            className="bg-card-bg border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 theme-transition"
          >
            <div className="flex items-start justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Order Actions</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  #{actionsOrder.orderNumber ?? actionsOrder._id.slice(-8)} • {getListingTitle(actionsOrder)}
                </p>
              </div>
              <button
                onClick={() => setShowActionsModal(false)}
                className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-btn-secondary-bg transition-colors"
                aria-label="Close"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto">
              {getOrderActions(actionsOrder).map((action, i) => (
                <button
                  key={i}
                  disabled={actionLoading === `${actionsOrder._id}:${action.action}`}
                  onClick={() => handleOrderAction(actionsOrder._id, action.action)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-btn-secondary-bg hover:border-accent/40 hover:bg-btn-secondary-hover transition-all text-left disabled:opacity-60 group theme-transition"
                >
                  <div className={`w-8 h-8 flex-shrink-0 rounded-lg ${action.twBg} flex items-center justify-center ${action.twColor} text-sm`}>
                    {actionLoading === `${actionsOrder._id}:${action.action}`
                      ? <FaSpinner className="animate-spin" size={13} />
                      : action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{action.label}</p>
                    <p className="text-xs text-text-secondary truncate">{action.description}</p>
                  </div>
                  <FaArrowRight className="text-text-tertiary group-hover:text-accent transition-colors flex-shrink-0" size={11} />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowActionsModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-btn-secondary-text bg-btn-secondary-bg hover:bg-btn-secondary-hover text-sm font-medium transition-all theme-transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { router.push(`/marketplace/orders/${actionsOrder._id}`); setShowActionsModal(false); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-btn-primary-text text-sm font-semibold transition-all theme-transition"
              >
                <FaEye size={13} /> View Full Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog state={confirmModal} onCancel={closeConfirm} />

    </MarketplaceLayout>
  );
};

// ─── BuyerStatsPage ───────────────────────────────────────────

export const BuyerStatsPage: React.FC = () => {
  const router = useRouter();
  return (
    <MarketplaceLayout>
      <div className="bg-bg-secondary theme-transition flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-400/10 flex items-center justify-center text-indigo-400">
          <FaChartLine size={32} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Buyer Analytics</h2>
        <p className="text-text-secondary text-sm">Detailed stats coming soon.</p>
        <button
          onClick={() => router.push('/marketplace/dashboard/buyer')}
          className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-btn-primary-text text-sm font-semibold transition-all theme-transition"
        >
          Back to Dashboard
        </button>
      </div>
    </MarketplaceLayout>
  );
};

export default BuyerDashboard;
