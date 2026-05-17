export type UserType = "buyer" | "seller" | "normalUser";
export type AdminUserRoleFilter = "admin" | "subadmin" | "both";

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  dob?: string;
  isAdmin: boolean;
  isSubAdmin: boolean;
  isVerified: boolean;
  hasPaid: boolean;
  status: boolean;
  userType?: UserType;
  subscriptionType?: string | null;
  createdAt: string;
  updatedAt?: string;
  lastPayment?: string | null;
  profileTags?: string[];
}

export interface Transaction {
  _id: string;
  userId: string;
  username: string;
  email: string;
  orderId: string;
  payerId: string;
  amount: number;
  currency: string;
  createdAt: string;
  timestamp?: string;
}

export interface Domain {
  _id: string;
  domain: { name: string; date: string };
  hosting: { name: string; date: string };
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalVideos: number;
  totalScripts: number;
  totalTransactions: number;
  totalRevenue: number;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: Pick<AdminUser, "_id" | "username" | "email" | "isAdmin" | "isSubAdmin" | "avatar">;
}

export interface AdminRegisterPayload {
  email: string;
  password: string;
  username: string;
  dob: string;
  isAdmin?: boolean;
  isSubAdmin?: boolean;
}

export interface AdminEditUserPayload {
  username?: string;
  email?: string;
  password?: string;
  avatar?: string;
  dob?: string;
  isVerified?: boolean;
  hasPaid?: boolean;
}

export interface GetAdminUsersResponse {
  count: number;
  users: AdminUser[];
}

export interface SaveTransactionPayload {
  userId: string;
  username: string;
  email: string;
  orderId: string;
  payerId: string;
  amount: number;
  currency: string;
  subscriptionType?: string;
}

export interface GenericAdminResponse {
  message: string;
}

export interface MarketplaceListing {
  _id: string;
  title: string;
  type: "for_sale" | "licensing" | "adaptation_rights" | "commission";
  status: "draft" | "active" | "sold" | "inactive" | "pending_review";
  price?: number;
  seller?: { _id: string; username: string; email: string };
  approved?: boolean;
  rejectionReason?: string;
  createdAt: string;
}
