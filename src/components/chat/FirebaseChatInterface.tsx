"use client";

import React, {
  useState, useRef, useEffect, useCallback,
  type FormEvent, type KeyboardEvent,
} from "react";
import {
  doc, setDoc, getDoc, serverTimestamp,
  collection, updateDoc, increment,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Send, ChevronDown, ExternalLink, Wifi, WifiOff, Lock } from "lucide-react";

import { getFirebaseFirestore } from "@/lib/firebase/config";
import { useFirebaseChat, type Message as FirebaseMessage } from "@/hooks/useFirebaseChat";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useChatActions } from "@/features/marketplace/api/chat.service";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import type { ChatUser } from "@/types/chat.types";

// ─── Types ───────────────────────────────────────────────────

interface SystemMessage {
  id: string;
  content: string;
  timestamp: Date;
  messageType: "system";
  metadata?: { orderId?: string };
}

type AnyMessage = FirebaseMessage | SystemMessage;

interface FirebaseChatInterfaceProps {
  chatId: string;
  currentUser: ChatUser | null;
  otherUser?: Pick<ChatUser, "_id" | "username" | "avatar">;
  orderId?: string;
  onSendMessage?: (message: string) => void;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function isSystemMessage(msg: AnyMessage): msg is SystemMessage {
  return msg.messageType === "system";
}

function getInitial(username: string | undefined): string {
  return username?.trim().charAt(0).toUpperCase() || "U";
}

function formatMessageTime(timestamp: Date): string {
  return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Avatar ──────────────────────────────────────────────────

const Avatar: React.FC<{ username?: string; avatar?: string; size?: "sm" | "md" }> = ({ username, avatar, size = "sm" }) => {
  const dim = size === "md" ? "w-8 h-8 text-sm" : "w-5 h-5 text-xs";
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatar} alt={username ?? "User"} className={`${dim} rounded-full object-cover ring-2 flex-shrink-0`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"; }} />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-violet-500 ring-2 flex-shrink-0 flex items-center justify-center text-white font-bold`}>
      {getInitial(username)}
    </div>
  );
};

// ─── Guard screens ────────────────────────────────────────────

const AuthRequired: React.FC<{ className: string }> = ({ className }) => (
  <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}
    style={{ background: "var(--color-bg-elevated)" }}>
    <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
      <Lock size={24} color="#EF4444" />
    </div>
    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Authentication Required</h3>
    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>Please log in to access this chat.</p>
  </div>
);

const ChatError: React.FC<{ message: string; className: string }> = ({ message, className }) => (
  <div className={`flex flex-col items-center justify-center h-full p-8 ${className}`}
    style={{ background: "var(--color-bg-elevated)" }}>
    <WifiOff size={28} color="#EF4444" style={{ marginBottom: 12 }} />
    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>Connection Error</h3>
    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>{message}</p>
    <button onClick={() => window.location.reload()}
      style={{ fontSize: 12, padding: "8px 16px", borderRadius: 10, border: "none", background: "var(--color-accent-primary)", color: "#fff", cursor: "pointer" }}>
      Retry
    </button>
  </div>
);

const ChatInitializing: React.FC<{ className: string }> = ({ className }) => (
  <div className={`flex flex-col items-center justify-center h-full ${className}`}
    style={{ background: "var(--color-bg-elevated)" }}>
    <div className="animate-spin" style={{ width: 32, height: 32, border: "2px solid var(--color-accent-primary)", borderTopColor: "transparent", borderRadius: "50%", marginBottom: 12 }} />
    <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Initializing chat…</p>
  </div>
);

// ─── Message Bubble ──────────────────────────────────────────

const MessageBubble: React.FC<{
  message: AnyMessage;
  isOwn: boolean;
  otherUser: Pick<ChatUser, "_id" | "username" | "avatar"> | undefined;
}> = ({ message, isOwn, otherUser }) => {
  if (isSystemMessage(message)) {
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontStyle: "italic", background: "var(--color-bg-tertiary)", padding: "2px 12px", borderRadius: 9999 }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12, justifyContent: isOwn ? "flex-end" : "flex-start" }}>
      {!isOwn && <Avatar username={otherUser?.username} avatar={otherUser?.avatar} size="sm" />}
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "72%", alignItems: isOwn ? "flex-end" : "flex-start" }}>
        {!isOwn && (
          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4, marginLeft: 4 }}>
            {"senderName" in message ? message.senderName : otherUser?.username ?? "User"}
          </span>
        )}
        <div style={{
          padding: "10px 14px", borderRadius: 18, fontSize: 13, lineHeight: 1.5, wordBreak: "break-word",
          ...(isOwn
            ? { background: "var(--color-accent-primary)", color: "#fff", borderBottomRightRadius: 4 }
            : { background: "var(--color-bg-elevated)", color: "var(--color-text-primary)", borderBottomLeftRadius: 4, border: "1px solid var(--color-border-secondary)" }),
        }}>
          {message.content}
        </div>
        <time style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 4, marginLeft: 4, marginRight: 4 }}>
          {formatMessageTime(message.timestamp)}
        </time>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────

const FirebaseChatInterface: React.FC<FirebaseChatInterfaceProps> = ({
  chatId, currentUser, otherUser: propOtherUser, orderId, onSendMessage, className = "",
}) => {
  const otherUser = propOtherUser ?? { _id: "unknown", username: "User", avatar: "" };

  const [inputValue, setInputValue]         = useState("");
  const [isSending, setIsSending]           = useState(false);
  const [showScrollBtn, setShowScrollBtn]   = useState(false);
  const [chatExists, setChatExists]         = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [initError, setInitError]           = useState<string | null>(null);
  const [isOtherTyping]                     = useState(false);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);

  const { messages, loading, error, sendMessage, markAllAsRead, sendTypingStatus } = useFirebaseChat(chatId);
  const { logMessage } = useChatActions();
  const { authUser } = useAuth();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allMessages: AnyMessage[] = [...systemMessages, ...messages].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const checkChatExists = useCallback(async () => {
    if (!chatId || chatInitialized) return false;
    try {
      const fs = await getFirebaseFirestore();
      const exists = (await getDoc(doc(fs, "chats", chatId))).exists();
      setChatExists(exists);
      if (exists) setChatInitialized(true);
      return exists;
    } catch { setChatExists(false); return false; }
  }, [chatId, chatInitialized]);

  const initializeChat = useCallback(async () => {
    if (!chatId || !currentUser?._id || !otherUser._id || chatInitialized || chatExists) return;
    try {
      const fs = await getFirebaseFirestore();
      await setDoc(doc(fs, "chats", chatId), {
        id: chatId, firebaseChatId: chatId,
        buyerId: currentUser._id, sellerId: otherUser._id, orderId: orderId ?? "",
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        lastMessage: "", lastMessageAt: serverTimestamp(),
        participants: [currentUser._id, otherUser._id],
        participantNames: { [currentUser._id]: currentUser.username ?? "Buyer", [otherUser._id]: otherUser.username ?? "Seller" },
        participantAvatars: { [currentUser._id]: currentUser.avatar ?? "", [otherUser._id]: otherUser.avatar ?? "" },
        unreadCount: { [currentUser._id]: 0, [otherUser._id]: 0 },
        isActive: true,
        metadata: { orderId, createdFromOrder: !!orderId, initializedAt: new Date().toISOString(), platform: "marketplace" },
      });
      try {
        await setDoc(doc(collection(fs, "chats", chatId, "messages")), {
          text: `Chat started${orderId ? ` for order #${orderId.slice(-8)}` : ""}. Say hello!`,
          senderId: "system", senderName: "System", senderAvatar: "",
          timestamp: serverTimestamp(), read: true, messageType: "system",
          metadata: { isSystemMessage: true, orderId },
        });
      } catch { /* welcome message is non-critical */ }
      setChatExists(true); setChatInitialized(true); setInitError(null);
      toast.success("Chat ready!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Initialization failed";
      setInitError(msg);
      toast.error("Failed to initialize chat. Please try again.");
    }
  }, [chatId, currentUser, otherUser, orderId, chatInitialized, chatExists]);

  useEffect(() => {
    if (!chatId || !currentUser?._id || !otherUser._id) return;
    checkChatExists().then((exists) => { if (!exists) initializeChat(); });
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSystemMessages = useCallback(async () => {
    if (!orderId || !currentUser?._id) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
      const token = tokenStorage.get();
      const res = await fetch(`${base}/marketplace/chat/messages/${orderId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json() as Array<{ _id: string; message: string; createdAt: string; metadata?: { isSystemMessage?: boolean; orderId?: string } }>;
      setSystemMessages(
        data.filter(m => m.metadata?.isSystemMessage).map(m => ({
          id: m._id, content: m.message, timestamp: new Date(m.createdAt),
          messageType: "system" as const, metadata: m.metadata,
        })),
      );
    } catch { /* non-critical */ }
  }, [orderId, currentUser?._id]);

  useEffect(() => { if (orderId) fetchSystemMessages(); }, [orderId, fetchSystemMessages]);

  useEffect(() => {
    if (!loading && allMessages.length > 0) {
      const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 80);
      return () => clearTimeout(t);
    }
  }, [loading, allMessages.length]);

  useEffect(() => {
    if (chatId && allMessages.length > 0 && chatExists && currentUser?._id) {
      markAllAsRead?.(currentUser._id);
    }
  }, [chatId, allMessages.length, chatExists, currentUser?._id, markAllAsRead]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  const handleTyping = () => {
    if (!currentUser) return;
    sendTypingStatus?.(true, currentUser._id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTypingStatus?.(false, currentUser._id), 1500);
  };

  useEffect(() => () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); }, []);

  const handleSend = async (e: FormEvent | KeyboardEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !chatId || isSending || !currentUser || !chatExists) return;
    setIsSending(true);
    setInputValue("");
    try {
      const sent = await sendMessage({
        senderId: currentUser._id, senderName: currentUser.username ?? "User",
        senderAvatar: currentUser.avatar ?? "", content: text, messageType: "text",
        metadata: { orderId: orderId ?? "", timestamp: new Date().toISOString() },
      });
      if (!sent) throw new Error("Send failed");
      try {
        const fs = await getFirebaseFirestore();
        await updateDoc(doc(fs, "chats", chatId), {
          lastMessage: text, lastMessageAt: serverTimestamp(), updatedAt: serverTimestamp(),
          [`unreadCount.${otherUser._id}`]: increment(1),
        });
      } catch { /* non-critical */ }
      if (orderId) logMessage({ orderId, message: text, firebaseChatId: chatId, senderId: currentUser._id });
      onSendMessage?.(text);
    } catch {
      toast.error("Failed to send. Please try again.");
      setInputValue(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as KeyboardEvent); }
  };

  if (!currentUser) return <AuthRequired className={className} />;
  if (loading && !chatExists) return <ChatInitializing className={className} />;
  if (initError) return <ChatError message={initError} className={className} />;
  if (error && !chatExists) return <ChatError message={error} className={className} />;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-secondary)", borderRadius: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--color-divider)", flexShrink: 0, background: "var(--color-bg-elevated)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar username={otherUser.username} avatar={otherUser.avatar} size="md" />
            <span style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#34d399", border: "2px solid var(--color-bg-elevated)" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {otherUser.username || "User"}
            </h3>
            <p style={{ margin: 0, fontSize: 11, color: isOtherTyping ? "var(--color-accent-primary)" : "var(--color-text-tertiary)" }}>
              {isOtherTyping ? "Typing…" : "Online"}
            </p>
          </div>
        </div>
        {orderId && (
          <a href={`/marketplace/orders/${orderId}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--color-accent-primary)", background: "rgba(255,187,0,0.1)", padding: "4px 10px", borderRadius: 8, textDecoration: "none", flexShrink: 0 }}>
            Order <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Messages */}
      <div ref={containerRef} onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: 16, background: "var(--color-bg-tertiary)", position: "relative" }}>
        {!chatExists && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "8px 12px", marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
            <p style={{ fontSize: 12, color: "#d97706", margin: 0 }}>Setting up chat connection…</p>
          </div>
        )}
        {allMessages.length === 0 && chatExists && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,187,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Send size={22} color="var(--color-accent-primary)" style={{ transform: "rotate(-12deg)" }} />
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 6px" }}>Start the conversation</h4>
            <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", maxWidth: 200, margin: 0 }}>
              Say hello to {otherUser.username || "your partner"} and discuss the details.
            </p>
          </div>
        )}
        {allMessages.map((msg, i) => (
          <MessageBubble
            key={"id" in msg ? msg.id : i}
            message={msg}
            isOwn={!isSystemMessage(msg) && "senderId" in msg && msg.senderId === currentUser._id}
            otherUser={otherUser}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{ position: "absolute", bottom: 72, right: 16, width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--color-border-secondary)", background: "var(--color-bg-elevated)", color: "var(--color-text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}
          aria-label="Scroll to latest">
          <ChevronDown size={16} />
        </button>
      )}

      {/* Input bar */}
      <div style={{ borderTop: "1px solid var(--color-divider)", padding: "12px", background: "var(--color-bg-elevated)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder={chatExists ? "Type a message…" : "Connecting…"}
            disabled={isSending || !chatExists}
            style={{
              flex: 1, padding: "10px 16px", fontSize: 13, borderRadius: 12,
              border: "1.5px solid var(--color-border-secondary)", background: "var(--color-bg-tertiary)",
              color: "var(--color-text-primary)", outline: "none",
            }}
            aria-label="Message input"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || !chatExists}
            style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: "var(--color-accent-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: (!inputValue.trim() || isSending || !chatExists) ? 0.4 : 1 }}
            aria-label="Send message"
          >
            {isSending
              ? <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }} className="animate-spin" />
              : <Send size={16} />}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {chatExists
              ? <><Wifi size={10} color="#34d399" /><span style={{ fontSize: 10, color: "#34d399" }}>Connected</span></>
              : <><WifiOff size={10} color="#f59e0b" /><span style={{ fontSize: 10, color: "#d97706" }}>Connecting…</span></>}
          </div>
          {orderId && <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Order #{orderId.slice(-6).toUpperCase()}</span>}
        </div>
      </div>
    </div>
  );
};

export default FirebaseChatInterface;
