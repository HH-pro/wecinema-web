// ============================================================
// Chat Types — Wecinema Marketplace
// Mirrors backend marketplace/chatRoutes.js
// ============================================================

export type ChatStatus = "active" | "archived";

// ─── Sub-docs ────────────────────────────────────────────────

export interface ChatUser {
  _id: string;
  username: string;
  avatar?: string;
  email: string;
}

export interface ChatListing {
  _id: string;
  title: string;
  mediaUrls?: string[];
  price?: number;
}

export interface ChatOrder {
  _id: string;
  amount: number;
  status: string;
  orderType?: string;
  listingTitle?: string;
  createdAt?: string;
}

export interface ChatLastMessage {
  message: string;
  senderId: string;
  createdAt: string;
  read: boolean;
}

// ─── Chat ────────────────────────────────────────────────────

/** Shape returned by /my-chats and /create/:orderId */
export interface Chat {
  _id: string;
  firebaseChatId: string;   // falls back to `chat_${_id}` if Firebase unavailable
  orderId?: string;
  listing: ChatListing;
  order: ChatOrder | null;
  otherUser: ChatUser;
  lastMessage?: string;     // truncated to 100 chars
  lastMessageAt?: string;
  unreadCount?: number;
  status: ChatStatus;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by /by-firebase-id/:id and /by-order/:orderId */
export interface ChatDetail {
  _id: string;
  firebaseChatId: string;
  orderId?: string;
  listingId?: string;
  otherUser: ChatUser;
  otherUserId: string;
  listing: ChatListing | null;
  order: ChatOrder | null;
  lastMessage: ChatLastMessage | null;
  unreadCount: number;
  status?: ChatStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Payloads ────────────────────────────────────────────────

export interface LogMessagePayload {
  orderId: string;
  message: string;
  firebaseChatId?: string;
  senderId?: string;
}

// ─── Responses ───────────────────────────────────────────────

export interface GetMyChatsResponse {
  success: true;
  message: string;
  data: Chat[];
  count: number;
}

export interface GetChatDetailResponse {
  success: true;
  data: ChatDetail;
}

export interface CreateChatResponse {
  success: true;
  message: string;
  data: Chat & { chatLink?: string };
}

export interface MarkReadResponse {
  success: true;
  message: string;
  count?: number;
}

export interface ArchiveChatResponse {
  success: true;
  message: string;
  data: { chatId: string };
}

export interface LogMessageResponse {
  success: true;
  message: string;
  data: { messageId: string };
}

export interface ChatHealthResponse {
  success: true;
  message: string;
  timestamp: string;
  services: {
    mongodb: "connected" | "disconnected";
    firebase?: "connected" | "optional_not_required";
  };
  note?: string;
}