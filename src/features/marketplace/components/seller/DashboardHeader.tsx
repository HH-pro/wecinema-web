"use client";
import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  earnings: string;
  totalEarnings?: string;
  onRefresh: () => void;
  refreshing: boolean;
  stripeStatus: {
    connected: boolean;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    status: string;
    availableBalance: number;
  };
  onCheckStripe: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  earnings,
  totalEarnings,
  onRefresh,
  refreshing,
  stripeStatus,
  onCheckStripe,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Title row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)",
              fontWeight: 800,
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--color-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            borderRadius: 10,
            border: "1px solid var(--color-card-border)",
            backgroundColor: "var(--color-card-bg)",
            color: "var(--color-text-secondary)",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.6 : 1,
            transition: "all 0.15s ease",
          }}
        >
          <svg
            style={{
              width: 14,
              height: 14,
              animation: refreshing ? "mp-spin 0.7s linear infinite" : "none",
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Earnings banner */}
      <div
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
          borderRadius: 16,
          padding: "20px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #FFBB00 0%, #FF8533 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}
          >
            💰
          </div>
          <div>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--color-text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Total Earnings
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
                lineHeight: 1.1,
              }}
            >
              {totalEarnings || earnings}
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12,
                color: "var(--color-text-tertiary)",
              }}
            >
              All-time revenue
            </p>
          </div>
        </div>

        {stripeStatus.connected && (
          <div
            style={{
              textAlign: "right",
              padding: "12px 16px",
              borderRadius: 12,
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-divider)",
            }}
          >
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                fontWeight: 600,
              }}
            >
              Available Balance
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "var(--color-success)",
                fontFamily: "var(--font-heading)",
              }}
            >
              ${(stripeStatus.availableBalance / 100).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 11,
                color: "var(--color-text-tertiary)",
              }}
            >
              Ready to withdraw
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
