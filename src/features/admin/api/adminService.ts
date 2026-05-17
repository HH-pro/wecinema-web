import { api } from "@/features/auth/services/apiClient";
import type {
  AdminUser,
  AdminLoginPayload,
  AdminLoginResponse,
  AdminRegisterPayload,
  AdminEditUserPayload,
  GetAdminUsersResponse,
  SaveTransactionPayload,
  Transaction,
  GenericAdminResponse,
  Domain,
  MarketplaceListing,
} from "../types/admin.types";

const BASE = "/user/admin";

// ─── Auth ────────────────────────────────────────────────────

export function adminLogin(payload: AdminLoginPayload) {
  return api.post<AdminLoginResponse>(`${BASE}/login`, payload as unknown as Record<string, unknown>);
}

export function adminRegister(payload: AdminRegisterPayload) {
  return api.post<{ message: string; user: AdminUser }>(`${BASE}/register`, payload as unknown as Record<string, unknown>);
}

// ─── User Management ─────────────────────────────────────────

export function getAllUsers(params?: { page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return api.get<{ users: AdminUser[]; pagination?: { totalPages: number; totalRecords: number } }>(
    `/user${qs ? `?${qs}` : ""}`
  );
}

export function getPrivilegedUsers(role?: string) {
  const qs = role ? `?role=${role}` : "";
  return api.get<GetAdminUsersResponse>(`${BASE}/users${qs}`);
}

export function adminEditUser(id: string, payload: AdminEditUserPayload) {
  return api.put<{ message: string; user: AdminUser }>(`${BASE}/edit/${id}`, payload as Record<string, unknown>);
}

export function adminDeleteUser(id: string) {
  return api.delete<GenericAdminResponse>(`${BASE}/users/${id}`);
}

export function changeSingleUserStatus(userId: string, status: boolean) {
  return api.post<{ message: string; user: AdminUser }>(`${BASE}/change-user-status`, { userId, status });
}

export function changeUserType(id: string, userType: string) {
  return api.put<GenericAdminResponse>(`${BASE}/change-type/${id}`, { userType });
}

export function addAdminPrivilege(email: string) {
  return api.put<AdminUser>(`${BASE}/add`, { email });
}

export function removePrivileges(userId: string, opts?: { removeAdmin?: boolean; removeSubAdmin?: boolean; removeAll?: boolean }) {
  return api.put<GenericAdminResponse>(`${BASE}/remove/${userId}`, opts as Record<string, unknown>);
}

// ─── Transactions ────────────────────────────────────────────

export function getAllTransactions() {
  return api.get<Transaction[] | { transactions: Transaction[] }>(`${BASE}/transactions`);
}

export function getUserTransactions(userId: string) {
  return api.get<Transaction[]>(`${BASE}/transactions/${userId}`);
}

export function saveTransaction(payload: SaveTransactionPayload) {
  return api.post<GenericAdminResponse>(`${BASE}/save-transaction`, payload as unknown as Record<string, unknown>);
}

export function updatePaymentStatus(userId: string, hasPaid: boolean) {
  return api.post<GenericAdminResponse>(`${BASE}/update-payment-status`, { userId, hasPaid });
}

export function getPaidUsers() {
  return api.get<AdminUser[]>(`${BASE}/paid-users`);
}

// ─── Videos ──────────────────────────────────────────────────

export function getAllVideos() {
  return api.get<{ videos: unknown[] }>("/video/all");
}

export function editVideo(id: string, payload: Record<string, unknown>) {
  return api.put<GenericAdminResponse>(`/video/edit/${id}`, payload);
}

export function deleteVideo(id: string) {
  return api.delete<GenericAdminResponse>(`/video/delete/${id}`);
}

// ─── Scripts ─────────────────────────────────────────────────

export function getAllScripts() {
  return api.get<{ scripts: unknown[] }>("/video/author/scripts");
}

export function editScript(id: string, payload: Record<string, unknown>) {
  return api.put<GenericAdminResponse>(`/video/scripts/${id}`, payload);
}

export function deleteScript(id: string) {
  return api.delete<GenericAdminResponse>(`/video/scripts/${id}`);
}

// ─── Domain ──────────────────────────────────────────────────

export function getDomains() {
  return api.get<Domain[] | { domains: Domain[] }>("/domain/domains");
}

export function saveDomain(payload: { domain: { name: string; date: string }; hosting: { name: string; date: string } }) {
  return api.post<Domain>("/domain/save-domain", payload as Record<string, unknown>);
}

export function updateDomain(id: string, payload: { domain: { name: string; date: string }; hosting: { name: string; date: string } }) {
  return api.put<Domain>(`/domain/domain/${id}`, payload as Record<string, unknown>);
}

export function deleteDomain(id: string) {
  return api.delete<GenericAdminResponse>(`/domain/domain/${id}`);
}

// ─── Marketplace ─────────────────────────────────────────────

export function getMarketplaceListings() {
  return api.get<{ listings: MarketplaceListing[] }>("/marketplace/listings");
}

export function approveMarketplaceListing(id: string) {
  return api.put<GenericAdminResponse>(`/marketplace/listings/${id}/approve`, {});
}

export function rejectMarketplaceListing(id: string, reason: string) {
  return api.put<GenericAdminResponse>(`/marketplace/listings/${id}/reject`, { rejectionReason: reason });
}
