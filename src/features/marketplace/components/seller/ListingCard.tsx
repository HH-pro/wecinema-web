"use client";
/**
 * ListingCard — marketplace listing card component
 */

import React, { useState } from 'react';
import {
  FiCreditCard, FiPlay, FiVideo,
  FiImage, FiDollarSign, FiClock,
} from 'react-icons/fi';
import type { Listing } from '@/types/marketplace.types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface ListingCardProps {
  listing:         Listing;
  thumbnailUrl:    string;
  videoUrl:        string;
  mediaType:       'image' | 'video' | 'none';
  onImageError:    () => void;
  onMakeOffer:     () => void;
  onVideoClick:    () => void;
  onDirectPayment: () => void;
  isVideoUrl:      (url: string) => boolean;
}

const AvatarFallback: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-full h-full text-text-tertiary p-1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const MEDIA_BADGE: Record<'video' | 'image' | 'none', { bg: string; icon: React.ReactElement; label: string }> = {
  video: { bg: 'bg-red-500/80',  icon: <FiVideo size={10} />,  label: 'VIDEO' },
  image: { bg: 'bg-blue-500/80', icon: <FiImage size={10} />,  label: 'IMAGE' },
  none:  { bg: 'bg-gray-500/80', icon: <FiImage size={10} />,  label: 'MEDIA' },
};

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  thumbnailUrl,
  videoUrl,
  mediaType,
  onImageError,
  onMakeOffer,
  onVideoClick,
  onDirectPayment,
}) => {
  const [imgLoaded, setImgLoaded]     = useState(false);
  const [imgError, setImgError]       = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [hovered, setHovered]         = useState(false);

  const handleImgError = () => {
    setImgError(true);
    setImgLoaded(true);
    onImageError();
  };

  const badge = MEDIA_BADGE[mediaType];

  return (
    <div
      className="mp-card"
      style={{
        overflow: "hidden",
        transition: "all 0.15s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)"
          : "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        borderColor: hovered ? "rgba(255,187,0,0.35)" : "var(--color-card-border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Media preview */}
      <div
        style={{
          position: "relative",
          height: 192,
          backgroundColor: "var(--color-bg-tertiary)",
          cursor: mediaType === "video" && videoUrl ? "pointer" : "default",
          overflow: "hidden",
        }}
        onClick={() => mediaType === 'video' && videoUrl && onVideoClick()}
      >
        {!imgLoaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              backgroundColor: "var(--color-bg-tertiary)",
              animation: "mp-shimmer 1.5s infinite",
              backgroundImage:
                "linear-gradient(90deg, var(--color-skeleton-base, #E5E5E5) 25%, var(--color-skeleton-shimmer, #F2F2ED) 50%, var(--color-skeleton-base, #E5E5E5) 75%)",
              backgroundSize: "200% 100%",
            }}
          />
        )}

        {!imgError ? (
          <img
            src={thumbnailUrl}
            alt={listing.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
              opacity: imgLoaded ? 1 : 0,
              transform: hovered ? "scale(1.04)" : "scale(1)",
            }}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={handleImgError}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-tertiary)",
            }}
          >
            <FiImage size={32} />
            <span style={{ fontSize: 11, marginTop: 8 }}>No preview</span>
          </div>
        )}

        {/* Play overlay for video */}
        {mediaType === 'video' && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.32)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,0.4)",
                transition: "transform 0.2s ease",
                transform: hovered ? "scale(1.05)" : "scale(0.9)",
              }}
            >
              <FiPlay style={{ color: "#fff", marginLeft: 3 }} size={26} />
            </div>
          </div>
        )}

        {/* Media type badge */}
        <div
          className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm ${badge.bg}`}
          style={{ zIndex: 12 }}
        >
          {badge.icon}
          {badge.label}
        </div>

        {/* Category badge */}
        {listing.category && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              zIndex: 12,
            }}
          >
            <span
              style={{
                backgroundColor: "var(--color-accent-primary)",
                color: "#000",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              {listing.category}
            </span>
          </div>
        )}

        {/* Duration badge */}
        {(listing as any).duration && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              zIndex: 12,
            }}
          >
            <span
              style={{
                backgroundColor: "rgba(0,0,0,0.72)",
                color: "#fff",
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiClock size={9} />
              {(listing as any).duration}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {/* Title row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
            gap: 8,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            {listing.title}
          </h3>
        </div>

        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12.5,
            color: "var(--color-text-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {listing.description}
        </p>

        {/* Seller + price row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-card-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {(listing.sellerId as any)?.avatar && !avatarError ? (
                <img
                  src={(listing.sellerId as any).avatar}
                  alt={(listing.sellerId as any).username ?? 'Seller'}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <AvatarFallback />
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                maxWidth: 80,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {(listing.sellerId as any)?.username ?? 'Seller'}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              color: "var(--color-accent-primary)",
              fontWeight: 800,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {formatCurrency(listing.price)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onMakeOffer}
            style={{
              flex: 1,
              backgroundColor: "var(--color-accent-primary)",
              color: "#000",
              border: "none",
              borderRadius: 9,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <FiCreditCard size={13} />
            Make Offer
          </button>

          {mediaType === 'video' && videoUrl && (
            <button
              onClick={e => { e.stopPropagation(); onVideoClick(); }}
              style={{
                padding: "8px 12px",
                backgroundColor: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-card-border)",
                borderRadius: 9,
                color: "var(--color-text-primary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <FiPlay size={13} />
              Play
            </button>
          )}

          <button
            onClick={onDirectPayment}
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-card-border)",
              borderRadius: 9,
              color: "var(--color-text-primary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-accent-primary)";
              (e.currentTarget as HTMLButtonElement).style.color = "#000";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent-primary)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-tertiary)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-card-border)";
            }}
          >
            <FiDollarSign size={13} />
            Buy
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ListingCard);
