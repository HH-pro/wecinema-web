"use client";
// src/components/marketplae/seller/ActionCard.tsx
import React from 'react';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface ActionCardProps {
  title?: string;
  description?: string;
  icon?: string;
  iconBg?: string;
  bgGradient?: string;
  borderColor?: string;
  actions?: Action[];
}

const ActionCard: React.FC<ActionCardProps> = ({
  title = 'Untitled Card',
  description = 'No description provided',
  icon = '📊',
  iconBg = 'from-blue-500 to-blue-600',
  bgGradient = 'from-blue-50 to-indigo-50',
  borderColor = 'border-blue-200',
  actions = []
}) => {
  const handleActionClick = (action: Action) => {
    if (action && typeof action.onClick === 'function') {
      action.onClick();
    }
  };

  const hasActions = Array.isArray(actions) && actions.length > 0;

  return (
    <div
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
        transition: "all 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,187,0,0.3)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-card-border)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <div
          className={`bg-gradient-to-br ${iconBg}`}
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 22 }}>{icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: "0 0 4px",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-heading)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--color-text-secondary)",
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {hasActions ? (
        <div style={{ display: "flex", gap: 8 }}>
          {actions.map((action, index) => {
            if (!action || typeof action !== 'object') return null;

            const isPrimary = action.variant === 'primary';

            return (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isPrimary
                    ? "none"
                    : "1px solid var(--color-card-border)",
                  backgroundColor: isPrimary
                    ? "var(--color-accent-primary)"
                    : "var(--color-bg-secondary)",
                  color: isPrimary ? "#000" : "var(--color-text-secondary)",
                }}
                onMouseEnter={e => {
                  if (isPrimary) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  } else {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-tertiary)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseLeave={e => {
                  if (isPrimary) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  } else {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-secondary)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                {action.label || 'Action'}
              </button>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "8px 0",
            fontSize: 12.5,
            color: "var(--color-text-tertiary)",
          }}
        >
          No actions available
        </div>
      )}
    </div>
  );
};

export default ActionCard;
