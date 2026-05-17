"use client";
// src/components/marketplace/seller/UserListings.tsx
import React from "react";
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { useAuth }             from '@/features/auth/context/AuthContext';
import { useUserListings, useListingMutations } from '@/hooks/useMarketplace';
import ListingCard from "./ListingCard";
import type { GetUserListingsParams } from '@/types/marketplace.types';

interface UserListingsProps {
  userId?: string;
  show?: boolean;
}

const UserListings: React.FC<UserListingsProps> = ({ userId: propUserId, show = false }) => {
  const router = useRouter();
  const { authUser } = useAuth();

  const targetUserId = propUserId ?? authUser?._id;
  const isCurrentUser = !!authUser && authUser._id === targetUserId;

  const [params, setParams] = React.useState<GetUserListingsParams>({ page: 1, limit: 20 });
  const { listings, seller, pagination, loading, error } = useUserListings(
    show ? targetUserId : undefined,
    params
  );
  const mutations = useListingMutations();

  const handleDelete = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    const result = await mutations.remove(listingId);
    if (result) {
      toast.success("Listing deleted successfully!");
    } else {
      toast.error(mutations.error ?? "Failed to delete listing");
    }
  };

  const handleEdit = (listingId: string) => router.push(`/marketplace/edit/${listingId}`);

  const handleStatusFilter = (status: string) =>
    setParams((p) => ({ ...p, page: 1, status: (status || undefined) as any }));

  const handlePageChange = (newPage: number) =>
    setParams((p) => ({ ...p, page: newPage }));

  if (!show) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent mb-4" />
        <span className="text-lg text-text-secondary">Loading listings…</span>
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-16 bg-card-bg rounded-lg shadow border border-border px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-2xl font-semibold text-text-secondary mb-3">Login Required</h3>
          <p className="text-text-tertiary mb-6">Please login to view listings</p>
          <button
            onClick={() => router.push("/admin")}
            className="bg-accent hover:bg-accent-hover text-btn-primary-text px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  if (error && listings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-16 bg-card-bg rounded-lg shadow border border-border px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold text-text-secondary mb-3">Unable to Load Listings</h3>
          <p className="text-text-tertiary text-lg mb-6">{error}</p>
          <button
            onClick={() => setParams((p) => ({ ...p }))}
            className="bg-success-bg text-success hover:opacity-80 px-8 py-3 rounded-lg font-semibold transition-colors shadow-md border border-success/30"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentStatus = (params.status as string) ?? "";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User header */}
      {seller && (
        <div className="mb-8 p-6 bg-card-bg rounded-xl shadow-md border border-border">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-text-primary">{seller.username}'s Listings</h1>
                {isCurrentUser && (
                  <span className="bg-info-bg text-info px-3 py-1 rounded-full text-sm font-medium border border-info/30">
                    Your Profile
                  </span>
                )}
              </div>
              <p className="text-text-tertiary">
                {pagination?.total ?? listings.length} listing{(pagination?.total ?? listings.length) !== 1 ? "s" : ""} found
              </p>
            </div>
            {isCurrentUser && (
              <button
                onClick={() => router.push("/marketplace/listings/new")}
                className="bg-success-bg text-success hover:opacity-80 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-md border border-success/30"
              >
                <span className="text-lg">+</span> Add New Listing
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="mb-6 p-5 bg-bg-secondary rounded-xl border border-border">
        <h3 className="font-semibold mb-3 text-text-secondary">Filter by Status:</h3>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "",         label: "All Listings" },
            { key: "active",   label: "Active" },
            { key: "sold",     label: "Sold" },
            { key: "draft",    label: "Draft" },
            { key: "inactive", label: "Inactive" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleStatusFilter(key)}
              className={`px-5 py-2 rounded-lg transition-colors font-medium border text-sm ${
                currentStatus === key
                  ? "bg-accent text-btn-primary-text border-accent shadow"
                  : "bg-card-bg text-text-secondary border-border hover:bg-bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline error */}
      {error && listings.length > 0 && (
        <div className="mb-4 bg-warning-bg border border-accent/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-warning text-sm">{error}</p>
        </div>
      )}

      {/* Grid */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {listings.map((listing) =>
            React.createElement(ListingCard as any, {
              key: listing._id,
              listing,
              isCurrentUser,
              onEdit: handleEdit,
              onDelete: handleDelete,
            })
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-card-bg rounded-xl shadow border border-border max-w-2xl mx-auto">
          <div className="text-7xl mb-6">🏠</div>
          <h3 className="text-2xl font-semibold text-text-secondary mb-4">No listings found</h3>
          <p className="text-text-tertiary mb-8">
            {currentStatus
              ? `No ${currentStatus} listings available.`
              : "No listings yet. Create your first one!"}
          </p>
          {isCurrentUser && (
            <button
              onClick={() => router.push("/marketplace/listings/new")}
              className="bg-success-bg text-success hover:opacity-80 px-8 py-4 rounded-lg font-semibold transition-colors shadow-md text-lg border border-success/30"
            >
              Create Your First Listing
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-5 py-2.5 bg-bg-secondary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium border border-border text-text-primary"
            >
              ← Previous
            </button>

            <div className="flex gap-1 mx-2">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page =
                  pagination.page <= 3
                    ? i + 1
                    : pagination.page >= pagination.pages - 2
                    ? pagination.pages - 4 + i
                    : pagination.page - 2 + i;
                if (page < 1 || page > pagination.pages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-colors font-medium border ${
                      pagination.page === page
                        ? "bg-accent text-btn-primary-text border-accent shadow"
                        : "bg-card-bg text-text-secondary border-border hover:bg-bg-secondary"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-5 py-2.5 bg-bg-secondary rounded-lg hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium border border-border text-text-primary"
            >
              Next →
            </button>
          </div>

          <p className="text-sm text-text-tertiary bg-bg-secondary px-4 py-2 rounded-lg border border-border">
            Page {pagination.page} of {pagination.pages} · Showing {listings.length} of {pagination.total} items
          </p>
        </div>
      )}
    </div>
  );
};

export default UserListings;
