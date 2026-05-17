"use client";

/**
 * Order Hooks — Wecinema Marketplace
 *
 * useMyOrders          — buyer's order list + stats
 * useMySales           — seller's sale list + stats
 * useOrderDetail       — single order with permissions/timeline
 * useOrderTimeline     — standalone timeline
 * useOrderDeliveries   — delivery history for an order
 * useOrderActions      — buyer: complete, cancel, request-revision
 * useSellerActions     — seller: start-work, deliver, cancel, revise
 * useDeliveryUpload    — file upload with progress
 * useSellerStats       — seller dashboard stats
 * useStripeStatus      — Stripe account health check
 * useAdminOrderOps     — admin status override / delete all
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AppError } from "@/features/auth/services/apiClient";
import * as orderService from "@/features/marketplace/api/order.service";
import type {
  Order,
  OrderStatus,
  Delivery,
  TimelineEntry,
  DeliveryAttachment,
  BuyerOrderStats,
  SellerOrderStats,
  OrderPermissions,
  RequestRevisionPayload,
  CancelOrderPayload,
  GetCompletedOrdersParams,
} from "@/types/order.types";

// ─── Shared helpers ──────────────────────────────────────────

interface Async<T> { data: T; loading: boolean; error: string | null }

function useAsyncData<T>(initial: T): [Async<T>, (p: Promise<T>) => Promise<void>, (v: T) => void] {
  const [state, setState] = useState<Async<T>>({ data: initial, loading: false, error: null });
  const isMounted = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  const run = useCallback(async (promise: Promise<T>) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await promise;
      if (!isMounted.current) return;
      setState({ data, loading: false, error: null });
    } catch (err) {
      if (!isMounted.current) return;
      setState((s) => ({ ...s, loading: false, error: err instanceof AppError ? err.message : "Something went wrong" }));
    }
  }, []);

  const set = useCallback((v: T) => setState((s) => ({ ...s, data: v })), []);
  return [state, run, set];
}

// ─── useMyOrders ─────────────────────────────────────────────

export function useMyOrders() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [stats, setStats]     = useState<BuyerOrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getMyOrders();
      if (!isMounted.current) return;
      setOrders(res.orders);
      setStats(res.stats);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof AppError ? err.message : "Failed to load orders");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, []); // eslint-disable-line

  return { orders, stats, loading, error, refetch: fetch };
}

// ─── useMySales ──────────────────────────────────────────────

export function useMySales() {
  const [sales, setSales]     = useState<Order[]>([]);
  const [stats, setStats]     = useState<SellerOrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getMySales();
      if (!isMounted.current) return;
      setSales(res.sales);
      setStats(res.stats);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof AppError ? err.message : "Failed to load sales");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetch();
    return () => { isMounted.current = false; };
  }, []); // eslint-disable-line

  return { sales, stats, loading, error, refetch: fetch };
}

// ─── useOrderDetail ──────────────────────────────────────────

export function useOrderDetail(orderId: string | undefined) {
  const [order, setOrder]             = useState<Order | null>(null);
  const [deliveries, setDeliveries]   = useState<Delivery[]>([]);
  const [timeline, setTimeline]       = useState<TimelineEntry[]>([]);
  const [permissions, setPermissions] = useState<OrderPermissions | null>(null);
  const [userRole, setUserRole]       = useState<"buyer" | "seller" | "admin">("buyer");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetch = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrderDetail(id);
      if (!isMounted.current) return;
      setOrder(res.order);
      setDeliveries(res.deliveries);
      setTimeline(res.timeline);
      setPermissions(res.permissions);
      setUserRole(res.userRole);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof AppError ? err.message : "Failed to load order");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    if (orderId) fetch(orderId);
    return () => { isMounted.current = false; };
  }, [orderId, fetch]);

  return { order, deliveries, timeline, permissions, userRole, loading, error, refetch: () => orderId && fetch(orderId) };
}

// ─── useOrderTimeline ────────────────────────────────────────

export function useOrderTimeline(orderId: string | undefined) {
  const [state, run] = useAsyncData<TimelineEntry[]>([]);

  useEffect(() => {
    if (orderId) run(orderService.getOrderTimeline(orderId).then((r) => r.timeline));
  }, [orderId]); // eslint-disable-line

  return { timeline: state.data, loading: state.loading, error: state.error };
}

// ─── useOrderDeliveries ──────────────────────────────────────

export function useOrderDeliveries(orderId: string | undefined) {
  const [state, run] = useAsyncData<Delivery[]>([]);
  const [meta, setMeta] = useState<{ revisionsUsed: number; revisionsLeft: number; canRequestRevision: boolean } | null>(null);

  useEffect(() => {
    if (!orderId) return;
    run(
      orderService.getDeliveries(orderId).then((r) => {
        setMeta({ revisionsUsed: r.revisionsUsed, revisionsLeft: r.revisionsLeft, canRequestRevision: r.canRequestRevision });
        return r.deliveries;
      })
    );
  }, [orderId]); // eslint-disable-line

  return { deliveries: state.data, meta, loading: state.loading, error: state.error };
}

// ─── useOrderActions (Buyer) ─────────────────────────────────

export function useOrderActions(orderId: string | undefined, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (!orderId) return null;
    setLoading(true);
    setError(null);
    try {
      const r = await fn();
      onSuccess?.();
      return r;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Action failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    requestRevision: (payload: RequestRevisionPayload) =>
      wrap(() => orderService.requestRevision(orderId!, payload)),
    completeOrder: () =>
      wrap(() => orderService.completeOrder(orderId!)),
    cancel: (payload?: CancelOrderPayload) =>
      wrap(() => orderService.cancelByBuyer(orderId!, payload)),
  };
}

// ─── useSellerActions ────────────────────────────────────────

export function useSellerActions(orderId: string | undefined, onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (!orderId) return null;
    setLoading(true);
    setError(null);
    try {
      const r = await fn();
      onSuccess?.();
      return r;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Action failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    startProcessing: () =>
      wrap(() => orderService.startProcessing(orderId!)),
    startWork: () =>
      wrap(() => orderService.startWork(orderId!)),
    deliver: (message: string, files?: File[], isFinal = true) =>
      wrap(() => orderService.deliverOrder(orderId!, message, files, isFinal)),
    completeRevision: (message: string, files?: File[], isFinal = true) =>
      wrap(() => orderService.completeRevision(orderId!, message, files, isFinal)),
    cancel: (payload?: CancelOrderPayload) =>
      wrap(() => orderService.cancelBySeller(orderId!, payload)),
  };
}

// ─── useDeliveryUpload ───────────────────────────────────────

export function useDeliveryUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<DeliveryAttachment[]>([]);
  const [uploading, setUploading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const upload = useCallback(async (files: File[]) => {
    setUploading(true);
    setError(null);
    try {
      const res = await orderService.uploadDeliveryFiles(files);
      setUploadedFiles((prev) => [...prev, ...res.files]);
      return res.files;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const remove = (filename: string) =>
    setUploadedFiles((prev) => prev.filter((f) => f.filename !== filename));

  const clear = () => setUploadedFiles([]);

  return { uploadedFiles, upload, remove, clear, uploading, error };
}

// ─── useSellerStats ──────────────────────────────────────────

export function useSellerStats() {
  const [state, run] = useAsyncData<null>(null);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof orderService.getSellerStats>>["data"] | null>(null);

  useEffect(() => {
    run(
      orderService.getSellerStats().then((r) => {
        setStats(r.data);
        return null;
      })
    );
  }, []); // eslint-disable-line

  return { stats, loading: state.loading, error: state.error };
}

export function useCompletedOrders(params?: GetCompletedOrdersParams) {
  const [state, run] = useAsyncData<null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof orderService.getCompletedOrders>>["data"] | null>(null);

  const fetch = useCallback((overrideParams?: GetCompletedOrdersParams) => {
    run(
      orderService.getCompletedOrders({ ...params, ...overrideParams }).then((r) => {
        setData(r.data);
        return null;
      })
    );
  }, []); // eslint-disable-line

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  return { data, loading: state.loading, error: state.error, refetch: fetch };
}

// ─── useStripeStatus ─────────────────────────────────────────

export function useStripeStatus() {
  const [state, run] = useAsyncData<Awaited<ReturnType<typeof orderService.getStripeAccountStatus>> | null>(null);

  const check = useCallback(() => {
    run(orderService.getStripeAccountStatus());
  }, [run]);

  useEffect(() => { check(); }, []); // eslint-disable-line

  const isReady   = state.data?.status.canReceivePayments ?? false;
  const setupLink = state.data?.setupLink ?? null;

  return { accountStatus: state.data, isReady, setupLink, loading: state.loading, error: state.error, recheck: check };
}

// ─── useAdminOrderOps ────────────────────────────────────────

export function useAdminOrderOps() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Admin operation failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateStatus: (orderId: string, status: OrderStatus) =>
      wrap(() => orderService.adminUpdateStatus(orderId, { status })),
    deleteAllOrders: () =>
      wrap(() => orderService.adminDeleteAllOrders()),
  };
}
