"use client";
// src/pages/marketplace/SellerDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Layout
import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';
import { useAuth } from '@/features/auth/context/AuthContext';

// Hooks — replaces manual fetch functions
import { useMyListings } from '@/hooks/useMarketplace';
import { useMySales, useSellerStats, useStripeStatus } from '@/hooks/useOrder';

// Services — used for mutation calls
import * as marketplaceService from '@/features/marketplace/api/marketplace.service';
import * as orderService from '@/features/marketplace/api/order.service';

// Types
import type { Listing } from '@/types/marketplace.types';
import type { Order } from '@/types/order.types';

// Sub-components
import DashboardHeader from '@/features/marketplace/components/seller/DashboardHeader';
import TabNavigation from '@/features/marketplace/components/seller/TabNavigation';
import WelcomeCard from '@/features/marketplace/components/seller/WelcomeCard';
import RecentOrders from '@/features/marketplace/components/seller/RecentOrders';
import ActionCard from '@/features/marketplace/components/seller/ActionCard';
import OrderWorkflowGuide from '@/features/marketplace/components/seller/OrderWorkflowGuide';
import StripeAccountStatus from '@/features/marketplace/components/seller/StripeAccountStatus';
import StripeSuccessAlert from '@/features/marketplace/components/seller/StripeSuccessAlert';
import ListingsTab from '@/features/marketplace/components/seller/ListingsTab';
import OrdersTab from '@/features/marketplace/components/seller/OrdersTab';
import WithdrawTab from '@/features/marketplace/components/seller/WithdrawTab';
import EarningsTab from '@/features/marketplace/components/seller/EarningsTab';
import StripeSetupModal from '@/features/marketplace/components/seller/StripeSetupModal';
import OrderDetailsModal from '@/features/marketplace/components/seller/OrderDetailsModal';
import EditListingModal from '@/features/marketplace/components/seller/EditListingModal';
import DeleteListingModal from '@/features/marketplace/components/seller/DeleteListingModal';
import VideoPlayerModal from '@/features/marketplace/components/seller/VideoPlayerModal';

// ─── Helpers ──────────────────────────────────────────────────

const fmt = (dollars: number | undefined): string => {
  if (dollars == null || isNaN(dollars)) return '$0.00';
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Safely guards component existence (avoids "not a function" errors)
function safe<T>(c: T): T {
  return (typeof c === 'function' || (typeof c === 'object' && c !== null)) ? c : (() => null) as unknown as T;
}

const SafeDashboardHeader = safe(DashboardHeader);
const SafeTabNavigation = safe(TabNavigation);
const SafeWelcomeCard = safe(WelcomeCard);
const SafeRecentOrders = safe(RecentOrders);
const SafeActionCard = safe(ActionCard);
const SafeOrderWorkflowGuide = safe(OrderWorkflowGuide);
const SafeStripeAccountStatus = safe(StripeAccountStatus);
const SafeStripeSuccessAlert = safe(StripeSuccessAlert);
const SafeListingsTab = safe(ListingsTab);
const SafeOrdersTab = safe(OrdersTab);
const SafeWithdrawTab = safe(WithdrawTab);
const SafeEarningsTab = safe(EarningsTab);
const SafeStripeSetupModal = safe(StripeSetupModal);
const SafeOrderDetailsModal = safe(OrderDetailsModal);
const SafeEditListingModal = safe(EditListingModal);
const SafeDeleteListingModal = safe(DeleteListingModal);
const SafeVideoPlayerModal = safe(VideoPlayerModal);

// ─── Component ────────────────────────────────────────────────

const SellerDashboard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showStripeSuccessAlert, setShowStripeSuccessAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stripeAccountLinked, setStripeAccountLinked] = useState(false);

  // ── Data hooks ──────────────────────────────────────────────

  const {
    sales: orders,
    stats: salesStats,
    loading: ordersLoading,
    refetch: refetchSales,
  } = useMySales();

  const {
    listings,
    pagination: listingsPagination,
    loading: listingsLoading,
    refetch: refetchListings,
  } = useMyListings();

  const {
    stats: sellerStats,
    loading: earningsLoading,
  } = useSellerStats();

  const {
    accountStatus: stripeAccount,
    loading: stripeLoading,
    recheck: recheckStripe,
  } = useStripeStatus();

  // ── Auth guard ──────────────────────────────────────────────

  useEffect(() => {
    if (!authUser) router.push('/login');
  }, [router]);

  // ── Stripe onboarding return URL handler ────────────────────
  // Stripe redirects back to /marketplace/dashboard?stripe=success|refresh
  useEffect(() => {
    const stripeParam = searchParams.get('stripe');
    if (!stripeParam) return;

    // Clean up URL params immediately so refresh doesn't re-trigger
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete('stripe');
    clean.delete('account_id');
    router.replace(`${window.location.pathname}${clean.toString() ? `?${clean.toString()}` : ''}`);

    if (stripeParam === 'success') {
      setStripeAccountLinked(true);
      recheckStripe();
      setShowStripeSuccessAlert(true);
      setSuccessMessage('Stripe account connected! Complete any remaining verification steps to start receiving payments.');
    } else if (stripeParam === 'refresh') {
      // Onboarding link expired — re-open setup modal so user can resume
      recheckStripe();
      setShowStripeSetup(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tab-driven refresh ──────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'listings') refetchListings();
    else if (activeTab === 'orders') refetchSales();
  }, [activeTab]);

  // ── Derived data ────────────────────────────────────────────

  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === 'active').length;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrdersList = orders.filter(o =>
    ['pending_payment', 'paid', 'processing', 'in_progress', 'delivered', 'in_revision'].includes(o.status)
  );

  const thisMonthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const thisMonthRevenue =
    thisMonthOrders
      .filter(o => o.status === 'completed')
      .reduce((s, o) => s + o.amount, 0) / 100;

  // salesStats.totalRevenue comes in cents from the API
  const totalRevenueDollars = (salesStats?.totalRevenue ?? 0) / 100;
  const pendingRevenueDollars = (salesStats?.pendingRevenue ?? 0) / 100;

  const orderStats = {
    totalOrders: salesStats?.total ?? orders.length,
    activeOrders: salesStats?.active ?? activeOrdersList.length,
    completed: salesStats?.completed ?? completedOrders.length,
    cancelled: salesStats?.cancelled ?? 0,
    totalRevenue: totalRevenueDollars,
    pendingRevenue: pendingRevenueDollars,
    thisMonthRevenue,
    thisMonthOrders: thisMonthOrders.length,
    completedOrdersCount: salesStats?.completed ?? completedOrders.length,
    completedRevenue: totalRevenueDollars,
    availableBalance: 0,
    pendingPayment: orders.filter(o => o.status === 'pending_payment').length,
    processing: orders.filter(o => o.status === 'processing').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  // Adapt useStripeStatus data to the shape expected by child components
  const stripeIsActive   = stripeAccount?.status?.chargesEnabled ?? false;
  const stripeHasAccount = stripeAccountLinked || (stripeAccount?.success === true);
  const hasMissingReqs   = (stripeAccount?.status?.missingRequirements?.length ?? 0) > 0;

  const stripeStatusForChildren = {
    connected: stripeHasAccount,
    chargesEnabled: stripeIsActive,
    detailsSubmitted: stripeAccount?.status?.payoutsEnabled ?? false,
    status: {
      canReceivePayments: stripeAccount?.status?.canReceivePayments ?? false,
      isActive: stripeIsActive,
      needsAction: hasMissingReqs,
      missingRequirements: stripeAccount?.status?.missingRequirements ?? [],
    },
    account: stripeHasAccount ? {
      charges_enabled: stripeIsActive,
      payouts_enabled: stripeAccount?.status?.payoutsEnabled ?? false,
      details_submitted: stripeHasAccount,
      requirements: hasMissingReqs ? {
        currently_due:        stripeAccount?.status?.missingRequirements ?? [],
        eventually_due:       [] as string[],
        past_due:             [] as string[],
        pending_verification: [] as string[],
      } : undefined,
    } : undefined,
    balance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    requirements: hasMissingReqs ? {
      currently_due:        stripeAccount?.status?.missingRequirements ?? [],
      eventually_due:       [] as string[],
      past_due:             [] as string[],
      pending_verification: [] as string[],
      disabled_reason:      '',
    } : undefined,
    verificationNeeded: hasMissingReqs,
    missingRequirements: stripeAccount?.status?.missingRequirements,
    pendingVerification: undefined,
    disabledReason: undefined,
  };

  const stripeConnected = stripeIsActive;

  // ── Withdrawal state ─────────────────────────────────────────

  const [withdrawalsPage, setWithdrawalsPage] = useState(1);

  // ── Modal state ──────────────────────────────────────────────

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStripeSetup, setShowStripeSetup] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');

  // ── Action loading ───────────────────────────────────────────

  const [listingActionLoading, setListingActionLoading] = useState<string | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);

  // ── Listing filter state ────────────────────────────────────

  const [listingsStatusFilter, setListingsStatusFilter] = useState('');
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsLimit] = useState(10);
  const [ordersFilter, setOrdersFilter] = useState('all');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(10);

  // ── Refresh all ─────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      await Promise.all([refetchSales(), refetchListings(), recheckStripe()]);
      setSuccessMessage('Dashboard refreshed!');
    } catch {
      setError('Failed to refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [refetchSales, refetchListings, recheckStripe]);

  // ── Listing mutations ───────────────────────────────────────

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setShowEditModal(true);
  };

  const handleEditModalSave = async (data: { title: string; description: string; price: number; mediaFiles?: File[] }) => {
    if (!editingListing) return;
    setListingActionLoading(`edit-${editingListing._id}`);
    try {
      const res = await marketplaceService.updateListing(editingListing._id, data);
      if (res.listing) {
        setSuccessMessage('Listing updated successfully!');
        setShowEditModal(false);
        setEditingListing(null);
        refetchListings();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update listing.');
    } finally {
      setListingActionLoading(null);
    }
  };

  const handleDeleteListing = (listing: Listing) => {
    setDeletingListing(listing);
    setShowDeleteModal(true);
  };

  const handleDeleteModalConfirm = async () => {
    if (!deletingListing) return;
    setListingActionLoading(`delete-${deletingListing._id}`);
    try {
      await marketplaceService.deleteListing(deletingListing._id);
      setSuccessMessage('Listing deleted successfully!');
      setShowDeleteModal(false);
      setDeletingListing(null);
      refetchListings();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete listing.');
    } finally {
      setListingActionLoading(null);
    }
  };

  const handleToggleListingStatus = async (listing: Listing) => {
    setListingActionLoading(`toggle-${listing._id}`);
    try {
      const res = await marketplaceService.toggleListingStatus(listing._id);
      const newStatus = res.listing.status;
      setSuccessMessage(`Listing ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      refetchListings();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update listing status.');
    } finally {
      setListingActionLoading(null);
    }
  };

  // ── Order actions ───────────────────────────────────────────

  const handleSimpleStartProcessing = async (order: Order) => {
    setOrderActionLoading(order._id);
    try {
      await orderService.startProcessing(order._id);
      setSuccessMessage('Order is now processing!');
      refetchSales();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start processing.');
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleSimpleStartWork = async (order: Order) => {
    setOrderActionLoading(order._id);
    try {
      await orderService.startWork(order._id);
      setSuccessMessage('Work started on order!');
      refetchSales();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start work.');
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleSimpleDeliver = async (order: Order) => {
    setOrderActionLoading(order._id);
    try {
      await orderService.deliverOrder(order._id, 'Your order is ready!', [], true);
      setSuccessMessage('Order delivered successfully!');
      refetchSales();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to deliver order.');
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleSimpleCancel = async (order: Order) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setOrderActionLoading(order._id);
    try {
      await orderService.cancelBySeller(order._id, { cancelReason: 'Seller requested cancellation' });
      setSuccessMessage('Order cancelled successfully.');
      refetchSales();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to cancel order.');
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleViewOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderModal(true);
  };

  const handlePlayVideo = (videoUrl: string, title: string) => {
    setCurrentVideoUrl(videoUrl);
    setCurrentVideoTitle(title);
    setShowVideoModal(true);
  };

  // ── Stripe handlers ─────────────────────────────────────────

  const handleStripeSetupSuccess = () => {
    setShowStripeSetup(false);
    setShowStripeSuccessAlert(true);
    setSuccessMessage('Stripe account connected! You can now receive payments.');
    recheckStripe();
  };

  const handleStripeDisconnectSuccess = () => {
    setSuccessMessage('Stripe account disconnected.');
    recheckStripe();
  };

  // ── Computed values for display ────────────────────────────

  const recentOrdersForDisplay = orders.slice(0, 5).map(order => ({
    ...order,
    buyerName: order.buyerId && typeof order.buyerId === 'object'
      ? (order.buyerId.username ?? 'Unknown Buyer')
      : 'Unknown Buyer',
    listingTitle: order.listingId && typeof order.listingId === 'object'
      ? (order.listingId.title ?? 'Unknown Listing')
      : 'Unknown Listing',
  }));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', badge: undefined },
    { id: 'earnings', label: 'Earnings', icon: '💰', badge: undefined },
    { id: 'listings', label: 'Listings', icon: '🏠', badge: totalListings > 0 ? totalListings : undefined },
    { id: 'orders', label: 'Orders', icon: '📦', badge: orderStats.activeOrders > 0 ? orderStats.activeOrders : undefined },
    { id: 'withdraw', label: 'Withdraw', icon: '💸', badge: undefined },
  ];

  const actionCards = [
    {
      title: 'Analytics Dashboard',
      description: 'View detailed analytics and performance metrics for your listings.',
      icon: '📊',
      iconBg: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-indigo-500/10',
      borderColor: 'border-blue-500/20',
      actions: [{ label: 'View Analytics', onClick: () => router.push('/marketplace/analytics'), variant: 'primary' as const }],
    },
    {
      title: 'Seller Resources',
      description: 'Access guides, tutorials, and tips to grow your business on the Marketplace.',
      icon: '📚',
      iconBg: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-500/10 to-amber-500/10',
      borderColor: 'border-orange-500/20',
      actions: [{ label: 'Learn More', onClick: () => router.push('/marketplace/resources'), variant: 'secondary' as const }],
    },
    {
      title: 'Quick Start Guide',
      description: 'Get started with selling on our platform with our step-by-step guide.',
      icon: '🚀',
      iconBg: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-500/10 to-violet-500/10',
      borderColor: 'border-purple-500/20',
      actions: [{ label: 'Get Started', onClick: () => router.push('/marketplace/guide'), variant: 'primary' as const }],
    },
  ];

  const tabLoading =
    (activeTab === 'overview' && ordersLoading && orders.length === 0) ||
    (activeTab === 'listings' && listingsLoading && listings.length === 0) ||
    (activeTab === 'orders' && ordersLoading && orders.length === 0) ||
    (activeTab === 'earnings' && earningsLoading && !sellerStats);

  const isInitialLoad =
    ordersLoading && orders.length === 0 &&
    listingsLoading && listings.length === 0;

  // ── Initial loading screen ──────────────────────────────────

  if (isInitialLoad) {
    return (
      <MarketplaceLayout>
        <div className="mp-loading-state" style={{ minHeight: "60vh" }}>
          <div className="mp-spinner" style={{ marginBottom: 20 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px", fontFamily: "var(--font-heading)" }}>Loading Dashboard</p>
          <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>Fetching your seller data…</p>
        </div>
      </MarketplaceLayout>
    );
  }

  // ── Main render ─────────────────────────────────────────────

  return (
    <MarketplaceLayout>
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-secondary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 8, paddingBottom: 48, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Stripe setup success ──────────────────────────── */}
          {showStripeSuccessAlert && (
            <SafeStripeSuccessAlert
              show={showStripeSuccessAlert}
              onClose={() => setShowStripeSuccessAlert(false)}
            />
          )}

          {/* ── Header ───────────────────────────────────────── */}
          <SafeDashboardHeader
            title="Seller Dashboard"
            subtitle="Manage orders, track earnings, and grow your business"
            earnings={fmt(orderStats.totalRevenue)}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            stripeStatus={{
              connected: stripeIsActive,
              chargesEnabled: stripeIsActive,
              detailsSubmitted: stripeAccount?.status?.payoutsEnabled ?? false,
              status: stripeIsActive ? 'active' : stripeHasAccount ? 'pending' : 'inactive',
              availableBalance: 0,
            }}
            onCheckStripe={recheckStripe}
          />

          {/* ── Notifications ────────────────────────────────── */}
          {successMessage && (
            <div className="mp-alert mp-alert-success" style={{ borderRadius: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "var(--color-success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg style={{ width: 12, height: 12, color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p style={{ flex: 1, margin: 0, fontSize: 13.5, fontWeight: 600 }}>{successMessage}</p>
              <button onClick={() => setSuccessMessage('')} style={{ color: "var(--color-success)", opacity: 0.7, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", transition: "opacity 0.15s ease" }}>
                <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {error && (
            <div className="mp-alert mp-alert-danger" style={{ borderRadius: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "var(--color-danger)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg style={{ width: 12, height: 12, color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <p style={{ flex: 1, margin: 0, fontSize: 13.5, fontWeight: 600 }}>{error}</p>
              <button onClick={() => setError('')} style={{ color: "var(--color-danger)", opacity: 0.7, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", transition: "opacity 0.15s ease" }}>
                <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Stripe account status card ───────────────────── */}
         
             
          {/* ── Stats overview bar ───────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "Total Revenue",  value: fmt(orderStats.totalRevenue),      icon: "💰", bg: "rgba(255,187,0,0.1)" },
              { label: "Active Orders",  value: orderStats.activeOrders,           icon: "📦", bg: "rgba(59,130,246,0.1)" },
              { label: "Total Listings", value: totalListings,                     icon: "🏠", bg: "rgba(34,197,94,0.1)" },
              { label: "This Month",     value: fmt(orderStats.thisMonthRevenue),  icon: "📅", bg: "rgba(168,85,247,0.1)" },
            ].map(({ label, value, icon, bg }) => (
              <div key={label} className="mp-stat-card" style={{ padding: "16px" }}>
                <div className="mp-stat-card-icon" style={{ backgroundColor: bg, width: 38, height: 38, borderRadius: 10, fontSize: 18 }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, fontFamily: "var(--font-heading)", color: "var(--color-text-primary)", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Tab navigation ───────────────────────────────── */}
          <SafeTabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* ── Tab content ──────────────────────────────────── */}
          <div>
            {tabLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", textAlign: "center" }}>
                <div className="mp-spinner" style={{ width: 36, height: 36, marginBottom: 14 }} />
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>Loading {activeTab}…</p>
              </div>
            ) : (
              <>
                {/* Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <SafeWelcomeCard
                      title="Welcome back, Seller! 👋"
                      subtitle="Manage your business efficiently with real-time insights and quick actions."
                      primaryAction={{ label: '+ Create Listing', onClick: () => router.push('/marketplace/listings/new') }}
                      secondaryAction={{
                        label: '💰 Setup Payments',
                        onClick: () => setShowStripeSetup(true),
                        visible: !stripeConnected,
                      }}
                    />

                    <div className="hidden sm:block">
                      <SafeOrderWorkflowGuide />
                    </div>

                    {orders.length > 0 ? (
                      <SafeRecentOrders
                        orders={recentOrdersForDisplay}
                        onViewOrderDetails={handleViewOrderDetails}
                        onStartProcessing={handleSimpleStartProcessing as any}
                        onStartWork={handleSimpleStartWork as any}
                        onDeliver={handleSimpleDeliver as any}
                        onCancel={handleSimpleCancel as any}
                        onCompleteRevision={() => {}}
                        onViewAll={() => setActiveTab('orders')}
                        onCreateListing={() => router.push('/marketplace/listings/new')}
                        orderActionLoading={orderActionLoading}
                      />
                    ) : (
                      <div className="mp-card">
                        <div className="mp-empty-state" style={{ padding: "48px 24px" }}>
                          <div className="mp-empty-state-icon"><span style={{ fontSize: 28 }}>📦</span></div>
                          <h3 className="mp-empty-state-title">No orders yet</h3>
                          <p className="mp-empty-state-text">
                            {stripeConnected
                              ? 'Your account can accept payments. Create listings to start receiving orders!'
                              : 'Create listings and connect Stripe to start receiving orders.'}
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                            <button
                              onClick={() => router.push('/marketplace/listings/new')}
                              className="mp-btn mp-btn-primary"
                              style={{ height: 42, paddingLeft: 22, paddingRight: 22 }}
                            >
                              + Create Your First Listing
                            </button>
                            {!stripeConnected && (
                              <button
                                onClick={() => setShowStripeSetup(true)}
                                className="mp-btn mp-btn-secondary"
                                style={{ height: 42, paddingLeft: 22, paddingRight: 22 }}
                              >
                                💰 Setup Payments
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick-action cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {actionCards.map((card, i) => (
                        <SafeActionCard
                          key={i}
                          title={card.title}
                          description={card.description}
                          icon={card.icon}
                          iconBg={card.iconBg}
                          bgGradient={card.bgGradient}
                          borderColor={card.borderColor}
                          actions={card.actions}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Earnings */}
                {activeTab === 'earnings' && (
                  <SafeEarningsTab
                    onCreateListing={() => router.push('/marketplace/listings/new')}
                    onSetupPayments={() => setShowStripeSetup(true)}
                  />
                )}

                {/* Listings */}
                {activeTab === 'listings' && (
                  <SafeListingsTab
                    listingsData={{
                      listings: listings as any,
                      pagination: listingsPagination ?? {
                        page: listingsPage,
                        limit: listingsLimit,
                        total: listings.length,
                        pages: Math.ceil(listings.length / listingsLimit),
                      },
                    }}
                    loading={listingsLoading}
                    statusFilter={listingsStatusFilter}
                    currentPage={listingsPage}
                    onStatusFilterChange={setListingsStatusFilter}
                    onPageChange={setListingsPage}
                    onEditListing={handleEditListing as any}
                    onDeleteListing={handleDeleteListing as any}
                    onToggleStatus={handleToggleListingStatus as any}
                    onPlayVideo={handlePlayVideo}
                    onRefresh={refetchListings}
                    actionLoading={listingActionLoading}
                    onCreateListing={() => router.push('/marketplace/listings/new')}
                  />
                )}

                {/* Orders */}
                {activeTab === 'orders' && (
                  <SafeOrdersTab
                    orders={orders as any}
                    loading={ordersLoading}
                    filter={ordersFilter}
                    onFilterChange={setOrdersFilter}
                    onViewOrderDetails={handleViewOrderDetails}
                    onRefresh={refetchSales}
                  />
                )}

                {/* Withdraw */}
                {activeTab === 'withdraw' && (
                  <SafeWithdrawTab
                    loading={false}
                    currentPage={withdrawalsPage}
                    onPageChange={setWithdrawalsPage}
                    onRefresh={handleRefresh}
                    totalRevenue={orderStats.totalRevenue}
                    thisMonthRevenue={orderStats.thisMonthRevenue}
                    pendingRevenue={orderStats.pendingRevenue}
                    completedRevenue={orderStats.completedRevenue}
                  />
                )}
              </>
            )}
          </div>

          {/* ── Modals ───────────────────────────────────────── */}
          {showStripeSetup && (
            <SafeStripeSetupModal
              show={showStripeSetup}
              onClose={() => setShowStripeSetup(false)}
              onSuccess={handleStripeSetupSuccess}
              onDisconnectSuccess={handleStripeDisconnectSuccess}
              stripeConnected={stripeHasAccount}
            />
          )}

          {selectedOrderId && (
            <SafeOrderDetailsModal
              orderId={selectedOrderId}
              isOpen={showOrderModal}
              onClose={() => { setShowOrderModal(false); setSelectedOrderId(null); }}
              onOrderUpdate={() => refetchSales()}
            />
          )}

          {showEditModal && editingListing && (
            <SafeEditListingModal
              listing={editingListing}
              isOpen={showEditModal}
              onClose={() => { setShowEditModal(false); setEditingListing(null); }}
              onSave={handleEditModalSave}
              loading={listingActionLoading?.startsWith('edit-') ?? false}
            />
          )}

          {showDeleteModal && deletingListing && (
            <SafeDeleteListingModal
              listing={deletingListing}
              isOpen={showDeleteModal}
              onClose={() => { setShowDeleteModal(false); setDeletingListing(null); }}
              onConfirm={handleDeleteModalConfirm}
              loading={listingActionLoading?.startsWith('delete-') ?? false}
            />
          )}

          {showVideoModal && (
            <SafeVideoPlayerModal
              videoUrl={currentVideoUrl}
              title={currentVideoTitle}
              isOpen={showVideoModal}
              onClose={() => setShowVideoModal(false)}
            />
          )}
        </div>
      </div>
    </MarketplaceLayout>
  );
};

export default SellerDashboard;
