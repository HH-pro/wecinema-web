"use client";
import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div
      style={{
        marginBottom: 20,
        backgroundColor: "var(--color-card-bg)",
        borderRadius: 14,
        border: "1px solid var(--color-card-border)",
        padding: "4px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      <nav
        style={{
          display: "flex",
          gap: 2,
          minWidth: "max-content",
        }}
        aria-label="Dashboard tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                cursor: "pointer",
                border: "1px solid transparent",
                backgroundColor: isActive
                  ? "var(--color-accent-primary)"
                  : "transparent",
                color: isActive ? "#000" : "var(--color-text-tertiary)",
                boxShadow: isActive
                  ? "0 1px 4px rgba(255,187,0,0.3)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-bg-secondary)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--color-text-tertiary)";
                }
              }}
            >
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 9999,
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: isActive ? "rgba(0,0,0,0.18)" : "var(--color-accent-primary)",
                    color: isActive ? "#000" : "#000",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;
