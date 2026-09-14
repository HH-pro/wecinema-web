"use client";

import { type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { TestModeBanner } from "@/components/layout/TestModeBanner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <TestModeBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-secondary)",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
