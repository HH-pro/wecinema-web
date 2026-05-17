"use client";
// src/components/marketplace/seller/WelcomeCard.tsx
import React from 'react';

interface WelcomeCardProps {
  title: string;
  subtitle: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    visible: boolean;
  };
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryAction
}) => {
  return (
    <div
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        borderRadius: 20,
        padding: "28px 28px 28px",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* Accent gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,187,0,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
          borderRadius: 20,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* Left: text + actions */}
          <div style={{ flex: "1 1 300px" }}>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "clamp(1.2rem, 2.2vw, 1.5rem)",
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              {title}
            </h2>
            <p
              style={{
                margin: "0 0 24px",
                fontSize: 14.5,
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button
                onClick={primaryAction.onClick}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 22px",
                  backgroundColor: "var(--color-accent-primary)",
                  color: "#000",
                  border: "none",
                  borderRadius: 11,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 8px rgba(255,187,0,0.3)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(255,187,0,0.4)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(255,187,0,0.3)";
                }}
              >
                {primaryAction.label}
              </button>

              {secondaryAction?.visible && (
                <button
                  onClick={secondaryAction.onClick}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "10px 22px",
                    backgroundColor: "var(--color-bg-secondary)",
                    color: "var(--color-text-primary)",
                    border: "1px solid var(--color-card-border)",
                    borderRadius: 11,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-tertiary)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-secondary)";
                  }}
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          </div>

          {/* Right: progress panel */}
          <div
            style={{
              flex: "0 0 auto",
              width: 240,
              backgroundColor: "var(--color-bg-secondary)",
              border: "1px solid var(--color-divider)",
              borderRadius: 14,
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "rgba(255,187,0,0.12)",
                  border: "1px solid rgba(255,187,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                🎯
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Seller Progress
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 5,
                  }}
                >
                  <div
                    style={{
                      height: 6,
                      width: 100,
                      borderRadius: 9999,
                      backgroundColor: "var(--color-bg-tertiary)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "75%",
                        backgroundColor: "var(--color-accent-primary)",
                        borderRadius: 9999,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--color-accent-primary)",
                    }}
                  >
                    75%
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                { dot: "var(--color-success)", label: "Live", sub: "Dashboard active" },
                { dot: "var(--color-accent-primary)", label: "Growing", sub: "Sales increasing" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "var(--color-bg-tertiary)",
                    border: "1px solid var(--color-divider)",
                    borderRadius: 9,
                    padding: "10px 10px 8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: item.dot,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
