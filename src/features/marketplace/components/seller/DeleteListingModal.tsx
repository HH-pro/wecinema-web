"use client";

import React from 'react';
import { FiAlertTriangle, FiLoader, FiX } from 'react-icons/fi';

interface Listing {
  _id: string;
  title: string;
  price: number;
  status: string;
}

interface DeleteListingModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const fmtPrice = (p: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p || 0);

const DeleteListingModal: React.FC<DeleteListingModalProps> = ({
  listing,
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="mp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="mp-modal" style={{ maxWidth: '440px' }}>

        {/* Header */}
        <div className="mp-modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)' }}>
              <FiAlertTriangle size={17} style={{ color: 'var(--color-danger)' }} />
            </div>
            <h3 id="delete-modal-title" className="text-base font-bold"
              style={{ color: 'var(--color-text-primary)' }}>
              Delete Listing
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mp-btn mp-btn-ghost mp-btn-sm !rounded-full !p-0 w-8 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="mp-modal-body space-y-4">
          {/* Warning */}
          <div className="mp-alert mp-alert-danger">
            <FiAlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">This action cannot be undone</p>
              <p className="text-xs mt-0.5 opacity-80">
                The listing and all associated data will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Listing preview */}
          <div className="rounded-xl p-4"
            style={{ border: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {listing.title}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-medium mb-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Status</p>
                <p className="capitalize font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {listing.status.replace(/[_-]/g, ' ')}
                </p>
              </div>
              <div>
                <p className="font-medium mb-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Price</p>
                <p className="font-bold" style={{ color: 'var(--color-success)' }}>
                  {fmtPrice(listing.price)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{listing.title}</strong>?
            This cannot be reversed.
          </p>
        </div>

        {/* Footer */}
        <div className="mp-modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="mp-btn mp-btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="mp-btn mp-btn-danger flex-1"
          >
            {loading ? (
              <>
                <FiLoader size={14} className="animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <FiAlertTriangle size={14} />
                Delete Listing
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DeleteListingModal;
