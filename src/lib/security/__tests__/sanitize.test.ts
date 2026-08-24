import { beforeAll, describe, expect, it } from "vitest";
import {
  preloadDOMPurify,
  sanitizeHtml,
  sanitizeHtmlAsync,
  sanitizeInlineAsync,
} from "../sanitize";

/**
 * Blog and script bodies are rendered with dangerouslySetInnerHTML, so this is the
 * only thing between stored HTML and script execution in the reader's browser.
 */
describe("sanitizeHtml", () => {
  beforeAll(async () => {
    // The sync entry point returns "" until DOMPurify is loaded; the app does this
    // once at startup. Without it every assertion below would trivially pass on "".
    await preloadDOMPurify();
  });

  it("strips script tags", () => {
    const out = sanitizeHtml('<p>hello</p><script>alert(1)</script>');
    expect(out).toContain("hello");
    expect(out.toLowerCase()).not.toContain("<script");
  });

  it("strips event-handler attributes", () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
  });

  it("strips javascript: URLs from links", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("keeps the formatting tags blog content actually needs", () => {
    const out = sanitizeHtml(
      '<h2>Title</h2><p><strong>bold</strong> and <em>italic</em></p><ul><li>one</li></ul>',
    );
    expect(out).toContain("<h2>");
    expect(out).toContain("<strong>");
    expect(out).toContain("<li>");
  });

  it("drops tags outside the blog allowlist", () => {
    const out = sanitizeHtml('<iframe src="https://evil.com"></iframe><form><input></form>');
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<form");
    expect(out).not.toContain("<input");
  });

  it("returns empty string for nullish input", () => {
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("sanitizeInlineAsync", () => {
  it("reduces rich content to the inline allowlist", async () => {
    const out = await sanitizeInlineAsync('<p>para</p><b>bold</b><a href="/x">link</a>');
    expect(out).toContain("<b>bold</b>");
    expect(out).not.toContain("<a ");
    expect(out).not.toContain("<p>");
  });
});

describe("sanitizeHtmlAsync", () => {
  it("sanitizes without requiring a preload", async () => {
    const out = await sanitizeHtmlAsync('<p>ok</p><script>alert(1)</script>');
    expect(out).toContain("ok");
    expect(out.toLowerCase()).not.toContain("<script");
  });
});

/**
 * KNOWN GAP (audit finding V23, deferred to W7): DOMPurify is browser-only here, so
 * the server-rendered HTML for blog and script pages contains no body at all —
 * Google indexes empty pages. This test pins the current behaviour deliberately so
 * that whoever fixes it has to come here and flip the expectation on purpose.
 */
describe("server-side behaviour (documented bug)", () => {
  it("returns empty string when window is undefined", async () => {
    const { sanitizeHtml: freshSanitize } = await import("../sanitize");
    const originalWindow = globalThis.window;

    // @ts-expect-error — simulating the SSR environment
    delete globalThis.window;
    try {
      expect(freshSanitize("<p>indexable content</p>")).toBe("");
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
