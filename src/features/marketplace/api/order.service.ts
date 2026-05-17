"use client";

/**
 * Order API Service — Wecinema Marketplace
 * Base path: /marketplace/orders
 */

import { api } from "@/features/auth/services/apiClient";
import { uploadManyDirectToS3 } from "@/features/marketplace/api/presignedUpload";
import { toBody } from "@/lib/api/serialize";
import type {
  DeliveryAttachment,
  CreateOrderPayload,
  CreateOrderResponse,
  GetMyOrdersResponse,
  GetMySalesResponse,
  GetOrderDetailResponse,
  GetTimelineResponse,
  GetDeliveriesResponse,
  GetDeliveryDetailResponse,
  GetDownloadFilesResponse,
  OrderSummaryResponse,
  RequestRevisionPayload,
  RevisionResponse,
  CompleteOrderResponse,
  CancelOrderPayload,
  DeliverResponse,
  BuyerStatsResponse,
  SellerStatsResponse,
  CompletedOrdersResponse,
  GetCompletedOrdersParams,
  StripeAccountStatusResponse,
  UploadFilesResponse,
  AdminUpdateStatusPayload,
  GenericOrderResponse,
} from "@/types/order.types";

const BASE = "/marketplace/orders";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

// ─── File Upload ─────────────────────────────────────────────

export async function uploadDeliveryFiles(files: File[]): Promise<UploadFilesResponse> {
  const assets = await uploadManyDirectToS3("delivery", files);
  return {
    success: true,
    message: `Uploaded ${assets.length} file(s)`,
    count:   assets.length,
    files:   assets.map((a) => ({
      filename:     a.key,
      originalName: a.originalName,
      mimeType:     a.contentType,
      size:         a.size,
      url:          a.publicUrl,
      key:          a.key,
    })),
  };
}

export function getDeliveryFileUrl(filename: string): string {
  return `${BASE_URL}${BASE}/upload/delivery/${encodeURIComponent(filename)}`;
}

// ─── Order Creation ───────────────────────────────────────────

export function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return api.post<CreateOrderResponse>(`${BASE}/create`, toBody(payload));
}

// ─── Buyer Reads ─────────────────────────────────────────────

export function getMyOrders(): Promise<GetMyOrdersResponse> {
  return api.get<GetMyOrdersResponse>(`${BASE}/my-orders`);
}

export function getBuyerStats(): Promise<BuyerStatsResponse> {
  return api.get<BuyerStatsResponse>(`${BASE}/stats/buyer`);
}

// ─── Seller Reads ─────────────────────────────────────────────

export function getMySales(): Promise<GetMySalesResponse> {
  return api.get<GetMySalesResponse>(`${BASE}/my-sales`);
}

export function getSellerStats(): Promise<SellerStatsResponse> {
  return api.get<SellerStatsResponse>(`${BASE}/stats/seller`);
}

export function getCompletedOrders(params?: GetCompletedOrdersParams): Promise<CompletedOrdersResponse> {
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<CompletedOrdersResponse>(`${BASE}/stats/completed-orders?${qs}`);
  }
  return api.get<CompletedOrdersResponse>(`${BASE}/stats/completed-orders`);
}

export function getStripeAccountStatus(): Promise<StripeAccountStatusResponse> {
  return api.get<StripeAccountStatusResponse>(`${BASE}/seller/account-status`);
}

// ─── Order Detail ────────────────────────────────────────────

export function getOrderDetail(orderId: string): Promise<GetOrderDetailResponse> {
  return api.get<GetOrderDetailResponse>(`${BASE}/${orderId}`);
}

export function getOrderTimeline(orderId: string): Promise<GetTimelineResponse> {
  return api.get<GetTimelineResponse>(`${BASE}/${orderId}/timeline`);
}

export function getDeliveries(orderId: string): Promise<GetDeliveriesResponse> {
  return api.get<GetDeliveriesResponse>(`${BASE}/${orderId}/deliveries`);
}

export function getDeliveryDetail(deliveryId: string): Promise<GetDeliveryDetailResponse> {
  return api.get<GetDeliveryDetailResponse>(`${BASE}/deliveries/${deliveryId}`);
}

export function getDownloadFiles(orderId: string): Promise<GetDownloadFilesResponse> {
  return api.get<GetDownloadFilesResponse>(`${BASE}/${orderId}/download-files`);
}

export function getOrderSummary(orderId: string): Promise<OrderSummaryResponse> {
  return api.get<OrderSummaryResponse>(`${BASE}/${orderId}/summary`);
}

// ─── Buyer Actions ───────────────────────────────────────────

export function requestRevision(orderId: string, payload: RequestRevisionPayload): Promise<RevisionResponse> {
  return api.put<RevisionResponse>(`${BASE}/${orderId}/request-revision`, toBody(payload));
}

export function completeOrder(orderId: string): Promise<CompleteOrderResponse> {
  return api.put<CompleteOrderResponse>(`${BASE}/${orderId}/complete`, {});
}

export function cancelByBuyer(orderId: string, payload?: CancelOrderPayload): Promise<GenericOrderResponse> {
  return api.put<GenericOrderResponse>(`${BASE}/${orderId}/cancel-by-buyer`, toBody(payload ?? {}));
}

// ─── Seller Actions ──────────────────────────────────────────

export function startProcessing(orderId: string): Promise<GenericOrderResponse> {
  return api.put<GenericOrderResponse>(`${BASE}/${orderId}/start-processing`, {});
}

export function startWork(orderId: string): Promise<GenericOrderResponse> {
  return api.put<GenericOrderResponse>(`${BASE}/${orderId}/start-work`, {});
}

async function resolveAttachments(input: File[] | DeliveryAttachment[]) {
  if (!input.length) return [];
  if ((input[0] as File).name !== undefined && (input[0] as File).size !== undefined && !(input[0] as DeliveryAttachment).key) {
    const files = input as File[];
    const assets = await uploadManyDirectToS3("delivery", files);
    return assets.map((a) => ({
      key:          a.key,
      originalName: a.originalName,
      mimeType:     a.contentType,
      size:         a.size,
    }));
  }
  const atts = input as DeliveryAttachment[];
  return atts.map((a) => ({
    key:          a.key ?? a.filename,
    originalName: a.originalName,
    mimeType:     a.mimeType,
    size:         a.size,
  }));
}

export async function deliverOrder(
  orderId: string,
  deliveryMessage: string,
  files: File[] | DeliveryAttachment[] = [],
  isFinalDelivery = true
): Promise<DeliverResponse> {
  const attachments = await resolveAttachments(files);
  return api.put<DeliverResponse>(`${BASE}/${orderId}/deliver`, toBody({ deliveryMessage, isFinalDelivery, attachments }));
}

export async function completeRevision(
  orderId: string,
  deliveryMessage: string,
  files: File[] | DeliveryAttachment[] = [],
  isFinalDelivery = true
): Promise<DeliverResponse> {
  const attachments = await resolveAttachments(files);
  return api.put<DeliverResponse>(`${BASE}/${orderId}/complete-revision`, toBody({ deliveryMessage: deliveryMessage ?? "Revision completed", isFinalDelivery, attachments }));
}

export function cancelBySeller(orderId: string, payload?: CancelOrderPayload): Promise<GenericOrderResponse> {
  return api.put<GenericOrderResponse>(`${BASE}/${orderId}/cancel-by-seller`, toBody(payload ?? {}));
}

// ─── Admin ───────────────────────────────────────────────────

export function adminDeleteAllOrders(): Promise<{ success: true; message: string; deletedCount: number }> {
  return api.delete<{ success: true; message: string; deletedCount: number }>(`${BASE}/delete-all-orders`);
}

export function adminUpdateStatus(orderId: string, payload: AdminUpdateStatusPayload): Promise<GenericOrderResponse> {
  return api.put<GenericOrderResponse>(`${BASE}/${orderId}/status`, toBody(payload));
}
