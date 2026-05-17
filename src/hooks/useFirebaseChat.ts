"use client";

/**
 * useFirebaseChat — real-time Firestore chat hook.
 * Mirrors the wecinema-frontend implementation, adapted for Next.js.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  deleteDoc,
  where,
  writeBatch,
  getDocs,
  type Firestore,
  type Unsubscribe,
  type FirestoreError,
} from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase/config";

// ─── Types ───────────────────────────────────────────────────

export type MessageType = "text" | "system" | "image" | "file";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: Date;
  read: boolean;
  messageType: MessageType;
  metadata?: {
    orderId?: string;
    isSystemMessage?: boolean;
    isUserMessage?: boolean;
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface SendMessagePayload {
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  messageType?: MessageType;
  metadata?: Message["metadata"];
}

export interface UseFirebaseChatReturn {
  messages: Message[];
  typingUsers: string[];
  loading: boolean;
  error: string | null;
  sendMessage: (payload: SendMessagePayload) => Promise<boolean>;
  markAllAsRead: (currentUserId: string) => Promise<void>;
  sendTypingStatus: (isTyping: boolean, userId: string) => Promise<void>;
}

const MESSAGE_LIMIT = 100;
const TYPING_TTL_MS = 5_000;

// ─── Hook ────────────────────────────────────────────────────

export function useFirebaseChat(chatId: string | undefined): UseFirebaseChatReturn {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const msgUnsubRef    = useRef<Unsubscribe | null>(null);
  const typingUnsubRef = useRef<Unsubscribe | null>(null);
  const firestoreRef   = useRef<Firestore | null>(null);

  function toMessage(id: string, data: Record<string, unknown>): Message {
    const timestamp =
      data.timestamp && typeof (data.timestamp as { toDate?: () => Date }).toDate === "function"
        ? (data.timestamp as { toDate: () => Date }).toDate()
        : data.timestamp instanceof Date
          ? data.timestamp
          : new Date();
    return {
      id,
      content:      (data.text as string) ?? (data.content as string) ?? "",
      senderId:     (data.senderId as string) ?? "",
      senderName:   (data.senderName as string) ?? "User",
      senderAvatar: (data.senderAvatar as string) ?? "",
      timestamp,
      read:         (data.read as boolean) ?? false,
      messageType:  (data.messageType as MessageType) ?? "text",
      metadata:     (data.metadata as Message["metadata"]) ?? undefined,
    };
  }

  const teardown = useCallback(() => {
    msgUnsubRef.current?.();
    typingUnsubRef.current?.();
    msgUnsubRef.current    = null;
    typingUnsubRef.current = null;
  }, []);

  const subscribeMessages = useCallback((id: string) => {
    const firestore = firestoreRef.current;
    if (!firestore) return;
    const q = query(
      collection(firestore, "chats", id, "messages"),
      orderBy("timestamp", "asc"),
      limit(MESSAGE_LIMIT),
    );
    setLoading(true);
    setError(null);
    msgUnsubRef.current = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => toMessage(d.id, d.data() as Record<string, unknown>)));
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(normalizeError(err));
        setLoading(false);
      },
    );
  }, []);

  const subscribeTyping = useCallback((id: string) => {
    const firestore = firestoreRef.current;
    if (!firestore) return;
    typingUnsubRef.current = onSnapshot(
      collection(firestore, "chats", id, "typing"),
      (snap) => {
        const now = Date.now();
        const active: string[] = [];
        snap.docs.forEach((d) => {
          const data = d.data() as { isTyping?: boolean; updatedAt?: { toDate?: () => Date } };
          if (!data.isTyping) return;
          const updatedAt = typeof data.updatedAt?.toDate === "function" ? data.updatedAt.toDate().getTime() : 0;
          if (now - updatedAt < TYPING_TTL_MS) active.push(d.id);
        });
        setTypingUsers(active);
      },
      () => { /* typing errors are non-critical */ },
    );
  }, []);

  useEffect(() => {
    if (!chatId) { setMessages([]); setLoading(false); return; }
    let cancelled = false;
    teardown();
    (async () => {
      if (!firestoreRef.current) firestoreRef.current = await getFirebaseFirestore();
      if (cancelled) return;
      subscribeMessages(chatId);
      subscribeTyping(chatId);
    })();
    return () => { cancelled = true; teardown(); };
  }, [chatId, subscribeMessages, subscribeTyping, teardown]);

  const sendMessage = useCallback(async (payload: SendMessagePayload): Promise<boolean> => {
    if (!chatId) return false;
    try {
      const fs = firestoreRef.current ?? (firestoreRef.current = await getFirebaseFirestore());
      await addDoc(collection(fs, "chats", chatId, "messages"), {
        text:         payload.content,
        content:      payload.content,
        senderId:     payload.senderId,
        senderName:   payload.senderName,
        senderAvatar: payload.senderAvatar,
        timestamp:    serverTimestamp(),
        read:         false,
        messageType:  payload.messageType ?? "text",
        metadata:     payload.metadata ?? {},
      });
      return true;
    } catch { return false; }
  }, [chatId]);

  const markAllAsRead = useCallback(async (currentUserId: string) => {
    if (!chatId || !currentUserId) return;
    try {
      const fs = firestoreRef.current ?? (firestoreRef.current = await getFirebaseFirestore());
      const snap = await getDocs(query(
        collection(fs, "chats", chatId, "messages"),
        where("read", "==", false),
        where("senderId", "!=", currentUserId),
      ));
      if (snap.empty) return;
      const batch = writeBatch(fs);
      snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
      await updateDoc(doc(fs, "chats", chatId), {
        [`unreadCount.${currentUserId}`]: 0,
      }).catch(() => null);
    } catch (err) { console.warn("[useFirebaseChat] markAllAsRead:", err); }
  }, [chatId]);

  const sendTypingStatus = useCallback(async (isTyping: boolean, userId: string) => {
    if (!chatId || !userId) return;
    try {
      const fs = firestoreRef.current ?? (firestoreRef.current = await getFirebaseFirestore());
      const ref = doc(fs, "chats", chatId, "typing", userId);
      if (isTyping) {
        await setDoc(ref, { userId, isTyping: true, updatedAt: serverTimestamp() });
      } else {
        await deleteDoc(ref).catch(() => null);
      }
    } catch { /* non-critical */ }
  }, [chatId]);

  return { messages, typingUsers, loading, error, sendMessage, markAllAsRead, sendTypingStatus };
}

function normalizeError(err: FirestoreError): string {
  switch (err.code) {
    case "permission-denied":  return "You don't have permission to access this chat.";
    case "unavailable":        return "Chat service temporarily unavailable. Reconnecting…";
    case "not-found":          return "This chat room does not exist.";
    case "unauthenticated":    return "Please log in to access this chat.";
    case "resource-exhausted": return "Too many requests. Please wait a moment.";
    default:                   return "Chat connection failed. Please refresh.";
  }
}
