"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import { toast } from "@/lib/toast";
import { Avatar } from "@/components/ui/Avatar";
import type { Video, VideoComment } from "@/types";

function openAuthEvent() {
  window.dispatchEvent(
    new CustomEvent("wecinema:open-auth", { detail: { tab: "login" } }),
  );
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / 86400);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface NormalizedComment {
  _id: string;
  text: string;
  createdAt: string;
  userId: string;
  username: string;
  avatar?: string;
  replies: NormalizedComment[];
}

function normalizeComment(c: VideoComment): NormalizedComment {
  const user =
    typeof c.userId === "object" && c.userId !== null
      ? c.userId
      : { _id: c.userId as string, username: "User", avatar: undefined };
  return {
    _id: c._id,
    text: c.text,
    createdAt: c.createdAt,
    userId: user._id,
    username: user.username,
    avatar: user.avatar,
    replies: (c.replies ?? []).map(normalizeComment),
  };
}

interface CommentResponse {
  comments?: VideoComment[];
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const sheetVariants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring" as const, damping: 30, stiffness: 300, mass: 0.9 },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
};

function ReplyRow({ reply }: { reply: NormalizedComment }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <Avatar src={reply.avatar} username={reply.username} size={24} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{reply.username}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{timeAgo(reply.createdAt)}</span>
        </div>
        <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
          {reply.text}
        </p>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  videoId,
  authUserId,
  onReplyAdded,
}: {
  comment: NormalizedComment;
  videoId: string;
  authUserId?: string;
  onReplyAdded: (commentId: string, reply: NormalizedComment) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!authUserId) { openAuthEvent(); return; }
    if (replyText.trim().length < 2) return;
    setSubmitting(true);
    try {
      const data = await api.post<CommentResponse>(
        `/video/${videoId}/comment/${comment._id}`,
        { userId: authUserId, text: replyText.trim() },
      );
      const rawReplies = data.comments ?? [];
      const lastRaw = rawReplies[rawReplies.length - 1];
      if (lastRaw) onReplyAdded(comment._id, normalizeComment(lastRaw));
      setReplyText("");
      setReplyOpen(false);
    } catch {
      toast.error("Couldn't post reply. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <Avatar src={comment.avatar} username={comment.username} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{comment.username}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{timeAgo(comment.createdAt)}</span>
        </div>
        <p style={{ margin: "4px 0 6px", fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
          {comment.text}
        </p>
        <button
          type="button"
          onClick={() => {
            if (!authUserId) { openAuthEvent(); return; }
            setReplyOpen((p) => !p);
          }}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Reply
        </button>

        {replyOpen && (
          <form onSubmit={submitReply} style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 9999,
                fontSize: 13,
                border: "1px solid rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "#fff",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={submitting || replyText.trim().length < 2}
              style={{
                padding: "8px 16px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                backgroundColor: "#FFBB00",
                color: "#000",
                cursor: "pointer",
                opacity: submitting || replyText.trim().length < 2 ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              {submitting ? "…" : "Reply"}
            </button>
          </form>
        )}

        {comment.replies.length > 0 && (
          <div style={{ marginTop: 6, paddingLeft: 10, borderLeft: "2px solid rgba(255,255,255,0.12)" }}>
            {comment.replies.map((reply) => (
              <ReplyRow key={reply._id} reply={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ShortsCommentsDrawerProps {
  video: Video | null;
  open: boolean;
  onClose: () => void;
  onCountChange: (videoId: string, count: number) => void;
}

// Caller must pass `key={video?._id}` so this remounts (resetting comments/text)
// whenever it's re-pointed at a different video, instead of syncing via effect.
export function ShortsCommentsDrawer({ video, open, onClose, onCountChange }: ShortsCommentsDrawerProps) {
  const { authUser } = useAuth();
  const [comments, setComments] = useState<NormalizedComment[]>(() =>
    (video?.comments ?? []).map(normalizeComment),
  );
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!video) return;
    if (!authUser) { openAuthEvent(); return; }
    if (text.trim().length < 2) return;
    setSubmitting(true);
    try {
      const data = await api.post<CommentResponse>(`/video/${video._id}/comment`, {
        userId: authUser._id,
        text: text.trim(),
      });
      const normalized = (data.comments ?? []).map(normalizeComment);
      setComments(normalized);
      onCountChange(video._id, normalized.length);
      setText("");
    } catch {
      toast.error("Couldn't post comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReplyAdded(commentId: string, reply: NormalizedComment) {
    setComments((prev) =>
      prev.map((c) => (c._id === commentId ? { ...c, replies: [...c.replies, reply] } : c)),
    );
  }

  return (
    <AnimatePresence>
      {open && video && (
        <>
          <motion.div
            key="shorts-comments-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 300,
              background: "rgba(0,0,0,0.6)",
            }}
          />
          <motion.div
            key="shorts-comments-sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 301,
              maxHeight: "72vh",
              display: "flex",
              flexDirection: "column",
              background: "#131313",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 9999, background: "rgba(255,255,255,0.25)" }} />
            </div>

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 16px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                {comments.length} Comment{comments.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close comments"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: 9999,
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Comment list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 18 }}>
              {comments.length === 0 ? (
                <p style={{ margin: "24px 0", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                  No comments yet. Be the first to say something.
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentRow
                    key={comment._id}
                    comment={comment}
                    videoId={video._id}
                    authUserId={authUser?._id}
                    onReplyAdded={handleReplyAdded}
                  />
                ))
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Avatar src={authUser?.avatar} username={authUser?.username ?? "?"} size={32} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => { if (!authUser) openAuthEvent(); }}
                placeholder="Add a comment…"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 9999,
                  fontSize: 13,
                  border: "1px solid rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={submitting || text.trim().length < 2}
                aria-label="Post comment"
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  border: "none",
                  backgroundColor: "#FFBB00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  opacity: submitting || text.trim().length < 2 ? 0.5 : 1,
                }}
              >
                <Send size={15} color="#000" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
