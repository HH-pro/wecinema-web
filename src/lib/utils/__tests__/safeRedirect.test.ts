import { describe, expect, it } from "vitest";
import { safeRedirect } from "../safeRedirect";

/**
 * Open-redirect guard. Every case below is a real payload shape an attacker would
 * put in `?redirect=` to bounce a freshly-authenticated user off-site.
 */
describe("safeRedirect", () => {
  it("passes through same-origin relative paths", () => {
    expect(safeRedirect("/marketplace")).toBe("/marketplace");
    expect(safeRedirect("/admin/dashboard?tab=users")).toBe("/admin/dashboard?tab=users");
    expect(safeRedirect("/video/123#comments")).toBe("/video/123#comments");
  });

  it("rejects absolute URLs", () => {
    expect(safeRedirect("https://evil.com")).toBe("/");
    expect(safeRedirect("http://evil.com/phish")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    // The classic bypass: the browser reads //evil.com as an absolute URL, but a
    // naive startsWith("/") check treats it as a relative path.
    expect(safeRedirect("//evil.com")).toBe("/");
    expect(safeRedirect("//evil.com/wecinema.co/login")).toBe("/");
  });

  it("rejects non-http schemes", () => {
    expect(safeRedirect("javascript:alert(1)")).toBe("/");
    expect(safeRedirect("data:text/html,<script>alert(1)</script>")).toBe("/");
  });

  it("falls back to / for empty input", () => {
    expect(safeRedirect(null)).toBe("/");
    expect(safeRedirect(undefined)).toBe("/");
    expect(safeRedirect("")).toBe("/");
  });

  it("rejects backslash and whitespace-prefixed variants browsers normalise", () => {
    expect(safeRedirect("\\\\evil.com")).toBe("/");
    expect(safeRedirect(" //evil.com")).toBe("/");
    expect(safeRedirect("\thttps://evil.com")).toBe("/");
  });
});
