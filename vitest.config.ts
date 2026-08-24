import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Vitest rather than `next/jest`: this project is Turbopack-based and pulls in
 * ESM-only dependencies (firebase 12, lucide-react, @stripe/stripe-js), which
 * Vitest handles natively instead of requiring a hand-maintained Jest transform
 * allowlist that breaks on every dependency bump.
 */
export default defineConfig({
  plugins: [react()],
  // Vite 8 resolves tsconfig `paths` (@/*) natively.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    // Playwright specs live under e2e/ and are run by Playwright, not Vitest.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
    },
    restoreMocks: true,
    clearMocks: true,
  },
});
