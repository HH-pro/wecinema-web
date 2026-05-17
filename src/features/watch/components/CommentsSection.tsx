"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/features/auth/services/apiClient";
import type { Video, VideoComment } from "@/types";
import { Avatar as AvatarUI } from "@/components/ui/Avatar";

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

function Avatar({ avatar, username, size = 32 }: { avatar?: string; username: string; size?: number }) {
  return <AvatarUI src={avatar} username={username} size={size} />;
}

function CommentItem({
  comment,
  videoId,
  onAddReply,
  authUserId,
  authUserName,
  authUserAvatar,
}: {
  comment: NormalizedComment;
  videoId: string;
  onAddReply: (commentId: string, reply: NormalizedComment) => void;
  authUserId?: string;
  authUserName?: string;
  authUserAvatar?: string;
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
      const newReply: NormalizedComment = lastRaw
        ? normalizeComment(lastRaw)
        : {
            _id: `${Date.now()}`,
            text: replyText.trim(),
            createdAt: new Date().toISOString(),
            userId: authUserId,
            username: authUserName ?? "You",
            avatar: authUserAvatar,
            replies: [],
          };
      onAddReply(comment._id, newReply);
      setReplyText("");
      setReplyOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <Avatar avatar={comment.avatar} username={comment.username} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {comment.username}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p
          style={{
            margin: "4px 0 6px",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--color-text-secondary)",
          }}
        >
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
            color: "var(--color-text-tertiary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Reply
        </button>

        {replyOpen && (
          <form
            onSubmit={submitReply}
            style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "flex-start" }}
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
                border: "1px solid var(--color-border-secondary)",
                backgroundColor: "var(--color-input-bg, var(--color-bg-elevated))",
                color: "var(--color-text-primary)",
                resize: "none",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={submitting || replyText.trim().length < 2}
              style={{
                padding: "7px 14px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                backgroundColor: "var(--color-accent-primary)",
                color: "#000",
                cursor: "pointer",
                opacity: submitting ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              {submitting ? "…" : "Reply"}
            </button>
          </form>
        )}

        {comment.replies.length > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingLeft: 12,
              borderLeft: "2px solid var(--color-divider)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {comment.replies.map((reply) => (
              <div key={reply._id} style={{ display: "flex", gap: 8 }}>
                <Avatar avatar={reply.avatar} username={reply.username} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {reply.username}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                      {timeAgo(reply.createdAt)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {reply.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentsSection({ video }: { video: Video }) {
  const { authUser } = useAuth();
  const [comments, setComments] = useState<NormalizedComment[]>(
    (video.comments ?? []).map(normalizeComment),
  );
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) { openAuthEvent(); return; }
    if (text.trim().length < 2) return;
    setSubmitting(true);
    try {
      const data = await api.post<CommentResponse>(
        `/video/${video._id}/comment`,
        { userId: authUser._id, text: text.trim() },
      );
      const rawComments = data.comments ?? [];
      setComments(rawComments.map(normalizeComment));
      setText("");
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddReply(commentId: string, reply: NormalizedComment) {
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? { ...c, replies: [...c.replies, reply] }
          : c,
      ),
    );
  }

  return (
    <div style={{ marginTop: 28 }}>
      <h2
        style={{
          margin: "0 0 18px",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--color-text-primary)",
        }}
      >
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "flex-start" }}
      >
        <Avatar
          avatar={authUser?.avatar}
          username={authUser?.username ?? "?"}
          size={34}
        />
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => { if (!authUser) openAuthEvent(); }}
            placeholder="Add a comment…"
            rows={2}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: 13,
              lineHeight: 1.5,
              border: "1px solid var(--color-border-secondary)",
              backgroundColor: "var(--color-input-bg, var(--color-bg-elevated))",
              color: "var(--color-text-primary)",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <button
              type="submit"
              disabled={submitting || text.trim().length < 2}
              style={{
                padding: "7px 18px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 700,
                border: "none",
                backgroundColor: "var(--color-accent-primary)",
                color: "#000",
                cursor: "pointer",
                opacity: submitting || text.trim().length < 2 ? 0.5 : 1,
              }}
            >
              {submitting ? "Posting…" : "Comment"}
            </button>
          </div>
        </div>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            videoId={video._id}
            onAddReply={handleAddReply}
            authUserId={authUser?._id}
            authUserName={authUser?.username}
            authUserAvatar={authUser?.avatar}
          />
        ))}
      </div>
    </div>
  );
}
