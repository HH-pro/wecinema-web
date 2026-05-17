"use client";
import React from "react";
import MarketplaceLayout from '@/features/marketplace/components/MarketplaceLayout';

const Resources: React.FC = () => {
  return (
    <MarketplaceLayout>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Seller Resources</h1>
        <p style={{ color: "#888", fontSize: 16 }}>Coming soon — helpful resources for sellers will appear here.</p>
      </div>
    </MarketplaceLayout>
  );
};

export default Resources;
