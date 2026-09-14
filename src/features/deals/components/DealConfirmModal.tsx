"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { NOTES_MAX } from "../lib/constants";

interface DealConfirmModalProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  /** Show an optional free-text reason field (decline / withdraw). */
  withReason?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function DealConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  busy = false,
  withReason = false,
  onConfirm,
  onClose,
}: DealConfirmModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="mp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-confirm-title"
      onClick={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div className="mp-modal" style={{ maxWidth: 420, marginTop: "15vh" }}>
        <div className="mp-modal-header">
          <h3 id="deal-confirm-title" className="text-base font-bold text-text-primary">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="mp-btn mp-btn-ghost mp-btn-sm !h-8 !w-8 !rounded-full !p-0"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mp-modal-body space-y-3">
          <div className="text-sm text-text-secondary">{description}</div>
          {withReason && (
            <div>
              <label htmlFor="deal-confirm-reason" className="mb-1 block text-xs font-medium text-text-secondary">
                Reason <span className="font-normal text-text-tertiary">(optional)</span>
              </label>
              <textarea
                id="deal-confirm-reason"
                className="mp-textarea"
                rows={3}
                maxLength={NOTES_MAX}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let the other party know why"
              />
            </div>
          )}
        </div>
        <div className="mp-modal-footer">
          <button type="button" onClick={onClose} disabled={busy} className="mp-btn mp-btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(withReason && reason.trim() ? reason.trim() : undefined)}
            disabled={busy}
            className={`mp-btn flex-1 ${tone === "danger" ? "mp-btn-danger" : "mp-btn-primary"}`}
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
