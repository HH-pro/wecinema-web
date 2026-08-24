import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  // The access token in tokenStorage is module state; localStorage holds wc_user.
  // Leaking either across tests makes auth assertions order-dependent.
  try {
    localStorage.clear();
  } catch {
    /* jsdom without storage */
  }
});
