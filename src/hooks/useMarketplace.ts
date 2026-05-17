"use client";

/**
 * Marketplace Hooks — Wecinema
 *
 * useListings         — public feed with filters, sorting, pagination
 * useMyListings       — seller's own dashboard listings
 * useUserListings     — public profile listings for any seller
 * useSearchListings   — debounced search
 * useListingMutations — create / update / delete / toggle
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { AppError } from "@/features/auth/services/apiClient";
import * as marketplaceService from "@/features/marketplace/api/marketplace.service";
import type {
  Listing,
  GetListingsParams,
  GetMyListingsParams,
  GetUserListingsParams,
  CreateListingPayload,
  UpdateListingPayload,
  MarketplacePagination,
  ListingSeller,
} from "@/types/marketplace.types";

// ─── useListings ─────────────────────────────────────────────

export function useListings(initialParams?: GetListingsParams) {
  const [listings, setListings]     = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<MarketplacePagination | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const paramsRef    = useRef<GetListingsParams>(initialParams ?? {});
  const isMounted    = useRef(true);

  const fetch = useCallback(async (overrideParams?: GetListingsParams) => {
    const merged = { ...paramsRef.current, ...overrideParams };
    paramsRef.current = merged;

    setLoading(true);
    setError(null);
    try {
      const res = await marketplaceService.getListings(merged);
      if (!isMounted.current) return;
      setListings(res.listings);
      setPagination(res.pagination);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof AppError ? err.message : "Failed to load listings");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, []); // eslint-disable-line

  const goToPage = (page: number) => fetch({ page });

  return { listings, pagination, loading, error, refetch: fetch, goToPage };
}

// ─── useMyListings ───────────────────────────────────────────

export function useMyListings(initialParams?: GetMyListingsParams) {
  const [listings, setListings]     = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<MarketplacePagination | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetch = useCallback(async (params?: GetMyListingsParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await marketplaceService.getMyListings({ ...initialParams, ...params });
      setListings(res.data.listings);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to load your listings");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  return { listings, pagination, loading, error, refetch: fetch };
}

// ─── useUserListings ─────────────────────────────────────────

export function useUserListings(
  userId: string | undefined,
  params?: GetUserListingsParams
) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [seller, setSeller]     = useState<Pick<ListingSeller, "_id" | "username" | "avatar" | "sellerRating"> | null>(null);
  const [pagination, setPagination] = useState<MarketplacePagination | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    marketplaceService
      .getUserListings(userId, params)
      .then((res) => {
        setListings(res.listings);
        setSeller(res.user);
        setPagination(res.pagination);
      })
      .catch((err) => setError(err instanceof AppError ? err.message : "Failed to load listings"))
      .finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line

  return { listings, seller, pagination, loading, error };
}

// ─── useSearchListings ───────────────────────────────────────

export function useSearchListings(debounceMs = 350) {
  const [query, setQuery]         = useState("");
  const [listings, setListings]   = useState<Listing[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string, extraParams?: Omit<Parameters<typeof marketplaceService.searchListings>[0], "q">) => {
    setQuery(q);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!q.trim()) {
      setListings([]);
      setTotal(0);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await marketplaceService.searchListings({ q, ...extraParams });
        setListings(res.listings);
        setTotal(res.search.results);
      } catch (err) {
        setError(err instanceof AppError ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const clear = () => { setQuery(""); setListings([]); setTotal(0); };

  return { query, listings, total, loading, error, search, clear };
}

// ─── useListingMutations ─────────────────────────────────────

export function useListingMutations(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      onSuccess?.();
      return result;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Operation failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,

    create: (payload: CreateListingPayload, onUploadProgress?: (pct: number) => void) =>
      wrap(() => marketplaceService.createListing(payload, onUploadProgress)),

    update: (id: string, payload: UpdateListingPayload, onUploadProgress?: (pct: number) => void) =>
      wrap(() => marketplaceService.updateListing(id, payload, onUploadProgress)),

    remove: (id: string) =>
      wrap(() => marketplaceService.deleteListing(id)),

    toggle: (id: string, setListings?: React.Dispatch<React.SetStateAction<Listing[]>>) =>
      wrap(async () => {
        const res = await marketplaceService.toggleListingStatus(id);
        setListings?.((prev) =>
          prev.map((l) => (l._id === id ? { ...l, status: res.listing.status, statusColor: res.listing.statusColor } : l))
        );
        return res;
      }),
  };
}
