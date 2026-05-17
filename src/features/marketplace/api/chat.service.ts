"use client";
/**
 * Chat API Service + Hooks — Wecinema Marketplace
 * Base path: /marketplace/chat
 */

import { useCallback, useEffect, useState } from "react";
import { api, AppError } from "@/features/auth/services/apiClient";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import type {
  Chat,
  ChatDetail,
  LogMessagePayload,
  GetMyChatsResponse,
  GetChatDetailResponse,
  CreateChatResponse,
  MarkReadResponse,
  ArchiveChatResponse,
  LogMessageResponse,
  ChatHealthResponse,
} from "@/types/chat.types";

const BASE = "/marketplace/chat";

// ─── Service ─────────────────────────────────────────────────

export function getMyChats(): Promise<GetMyChatsResponse> {
  return api.get(`${BASE}/my-chats`) as Promise<GetMyChatsResponse>;
}

export function getChatByFirebaseId(firebaseChatId: string): Promise<GetChatDetailResponse> {
  return api.get(`${BASE}/by-firebase-id/${firebaseChatId}`) as Promise<GetChatDetailResponse>;
}

export function getChatByOrder(orderId: string): Promise<GetChatDetailResponse> {
  return api.get(`${BASE}/by-order/${orderId}`) as Promise<GetChatDetailResponse>;
}

export function createChat(orderId: string): Promise<CreateChatResponse> {
  return api.post(`${BASE}/create/${orderId}`) as Promise<CreateChatResponse>;
}

export function archiveChat(chatId: string): Promise<ArchiveChatResponse> {
  return api.put(`${BASE}/archive/${chatId}`) as Promise<ArchiveChatResponse>;
}

export function markReadByOrder(orderId: string): Promise<MarkReadResponse> {
  return api.put(`${BASE}/mark-read/${orderId}`) as Promise<MarkReadResponse>;
}

export function markReadByFirebaseId(firebaseChatId: string): Promise<MarkReadResponse> {
  return api.put(`${BASE}/mark-read-by-firebase/${firebaseChatId}`) as Promise<MarkReadResponse>;
}

export function logMessage(payload: LogMessagePayload): Promise<LogMessageResponse> {
  return api.post(`${BASE}/log-message`, payload as unknown as Record<string, unknown>) as Promise<LogMessageResponse>;
}

export function healthCheck(): Promise<ChatHealthResponse> {
  return api.get(`${BASE}/firebase/health`) as Promise<ChatHealthResponse>;
}

// ─── Hooks ───────────────────────────────────────────────────

export function useMyChats() {
  const [chats, setChats]     = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!tokenStorage.get()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyChats();
      setChats(res.data);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, []); // eslint-disable-line

  const removeLocal = (chatId: string) =>
    setChats((prev) => prev.filter((c) => c._id !== chatId));

  const totalUnread = chats.reduce((n, c) => n + (c.unreadCount ?? 0), 0);

  return { chats, loading, error, totalUnread, refetch: fetch, removeLocal };
}

export function useChat(params: { firebaseChatId?: string; orderId?: string }) {
  const [chat, setChat]       = useState<ChatDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!params.firebaseChatId && !params.orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = params.firebaseChatId
        ? await getChatByFirebaseId(params.firebaseChatId)
        : await getChatByOrder(params.orderId!);
      setChat(res.data);
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [params.firebaseChatId, params.orderId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { chat, loading, error, refetch: fetch };
}

export function useCreateChat() {
  const [chat, setChat]       = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const create = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createChat(orderId);
      setChat(res.data);
      return res.data;
    } catch (err) {
      setError(err instanceof AppError ? err.message : "Failed to create chat");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { chat, create, loading, error };
}

export function useChatActions(onArchive?: (chatId: string) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
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
    archive: (chatId: string) =>
      wrap(async () => {
        const res = await archiveChat(chatId);
        onArchive?.(chatId);
        return res;
      }),
    markReadByOrder: (orderId: string) =>
      wrap(() => markReadByOrder(orderId)),
    markReadByFirebaseId: (firebaseChatId: string) =>
      wrap(() => markReadByFirebaseId(firebaseChatId)),
    logMessage: (payload: LogMessagePayload) => {
      logMessage(payload).catch(() => null);
    },
  };
}
