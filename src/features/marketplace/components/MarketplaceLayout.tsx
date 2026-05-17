"use client";

import React from "react";

interface MarketplaceLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-secondary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {(title || subtitle) && (
        <div
          style={{
            padding: "28px 28px 0",
            borderBottom: "1px solid var(--color-divider)",
            marginBottom: 0,
            backgroundColor: "var(--color-card-bg)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {title && (
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 13,
                color: "var(--color-text-tertiary)",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div
        style={{
          padding: title || subtitle ? "24px 28px 36px" : "28px",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MarketplaceLayout;
