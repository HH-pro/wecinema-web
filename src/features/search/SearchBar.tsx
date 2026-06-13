"use client";

import {
  useState, useRef, useEffect, useCallback, useMemo,
  type FC, type FormEvent, type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { MdMic, MdMicOff } from "react-icons/md";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { api } from "@/features/auth/services/apiClient";
import {
  getRecentSearches, addRecentSearch, removeRecentSearch,
} from "@/features/search/recentSearches";

interface SearchBarProps {
  /** Called after a search is submitted (e.g. to close the header search). */
  onClose?: () => void;
  /** Focus the input on mount. */
  autoFocus?: boolean;
  /** Visual size — header pill vs. large landing-page box. */
  variant?: "header" | "page";
  /** Pre-fill the input (e.g. the current query on the results page). */
  initialValue?: string;
}

const SUGGEST_DEBOUNCE_MS = 200;

const STYLES = `
  .wc-search-wrap { position: relative; width: 100%; }
  .wc-suggest {
    position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 300;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: 14px; overflow: hidden; padding: 6px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    animation: wcSuggestIn 0.14s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  @keyframes wcSuggestIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .wc-suggest-row {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 9px 12px; border: none; background: transparent;
    color: var(--color-text-primary); font-size: 0.875rem; font-weight: 500;
    cursor: pointer; text-align: left; border-radius: 9px;
    font-family: inherit; transition: background-color 0.1s;
  }
  .wc-suggest-row:hover, .wc-suggest-row.active { background: var(--color-bg-tertiary); }
  .wc-suggest-row .wc-suggest-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wc-suggest-remove {
    display: flex; align-items: center; justify-content: center;
    width: 22px; height: 22px; border: none; border-radius: 9999px;
    background: transparent; color: var(--color-text-tertiary);
    cursor: pointer; flex-shrink: 0; opacity: 0; transition: opacity 0.12s, background-color 0.12s;
  }
  .wc-suggest-row:hover .wc-suggest-remove, .wc-suggest-row.active .wc-suggest-remove { opacity: 1; }
  .wc-suggest-remove:hover { background: var(--color-bg-secondary); color: var(--color-text-primary); }
  .wc-suggest-label {
    padding: 6px 12px 4px; font-size: 0.66rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em; color: var(--color-text-tertiary);
  }
`;

const HighlightMatch: FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <span style={{ fontWeight: 600 }}>{text}</span>;
  return (
    <span style={{ fontWeight: 600 }}>
      {text.slice(0, idx)}
      <span style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </span>
  );
};

const SearchBar: FC<SearchBarProps> = ({ onClose, autoFocus, variant = "header", initialValue = "" }) => {
  const router = useRouter();

  const [term, setTerm] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [listening, setListening] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Debounced suggestion fetch (aborts in-flight request on each keystroke).
  // State is only updated inside the async callback (never synchronously in the
  // effect body); the empty-term case is cleared in the change handler instead.
  useEffect(() => {
    const q = term.trim();
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .get<{ suggestions?: string[] }>(`/video/suggestions?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => setSuggestions(res.suggestions ?? []))
        .catch(() => { /* aborted or failed — ignore */ });
    }, SUGGEST_DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term]);

  // The list shown in the dropdown: live suggestions while typing, else recent.
  const showingRecent = term.trim().length === 0;
  const list = useMemo(
    () => (showingRecent ? recent : suggestions),
    [showingRecent, recent, suggestions],
  );

  const dropdownOpen = open && list.length > 0;

  const focusInput = useCallback(() => {
    setRecent(getRecentSearches());
    setOpen(true);
    setActiveIndex(-1);
  }, []);

  const go = useCallback((value: string) => {
    const q = value.trim();
    if (!q) return;
    setRecent(addRecentSearch(q));
    setTerm(q);
    setOpen(false);
    setActiveIndex(-1);
    onClose?.();
    router.push(`/search/${encodeURIComponent(q)}`);
  }, [router, onClose]);

  const submit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && list[activeIndex]) go(list[activeIndex]);
    else go(term);
  }, [activeIndex, list, term, go]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }, [dropdownOpen, list.length]);

  const removeRecent = useCallback((e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    setRecent(removeRecentSearch(value));
  }, []);

  const voice = useCallback(() => {
    interface MinimalRecognition {
      lang: string;
      interimResults: boolean;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      start: () => void;
    }
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => MinimalRecognition })
      .webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (ev) => {
      const t = ev.results[0]?.[0]?.transcript;
      if (t) go(t);
    };
    r.start();
  }, [go]);

  const isPage = variant === "page";
  const boxHeight = isPage ? 52 : 40;

  return (
    <div className="wc-search-wrap" ref={wrapRef}>
      <style>{STYLES}</style>
      <form onSubmit={submit}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          height: boxHeight, padding: isPage ? "0 16px" : "0 12px",
          borderRadius: isPage ? 14 : 9999,
          border: `1.5px solid ${dropdownOpen ? "var(--color-accent-primary)" : isPage ? "var(--color-border-secondary)" : "var(--color-accent-primary)"}`,
          backgroundColor: "var(--color-input-bg)",
        }}>
          <Search size={isPage ? 18 : 16} style={{ color: "var(--color-accent-primary)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search movies, shows, actors…"
            value={term}
            onChange={(e) => {
              const v = e.target.value;
              setTerm(v);
              setOpen(true);
              setActiveIndex(-1);
              if (!v.trim()) setSuggestions([]);
            }}
            onFocus={focusInput}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-controls="wc-search-listbox"
            aria-expanded={dropdownOpen}
            aria-autocomplete="list"
            aria-label="Search"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: isPage ? "0.9375rem" : "0.875rem", color: "var(--color-text-primary)", fontFamily: "var(--font-body)" }}
          />
          {term && (
            <button type="button" onClick={() => { setTerm(""); inputRef.current?.focus(); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, border: "none", borderRadius: 9999, background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)", cursor: "pointer", flexShrink: 0 }} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
          <button type="button" onClick={voice} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0, color: listening ? "#EF4444" : "var(--color-text-tertiary)" }} aria-label="Voice search">
            {listening ? <MdMicOff size={18} /> : <MdMic size={18} />}
          </button>
        </div>
      </form>

      {dropdownOpen && (
        <div className="wc-suggest" id="wc-search-listbox" role="listbox">
          {showingRecent && <div className="wc-suggest-label">Recent searches</div>}
          {list.map((item, i) => (
            <button
              key={`${item}-${i}`}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              className={`wc-suggest-row ${i === activeIndex ? "active" : ""}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => go(item)}
            >
              {showingRecent
                ? <Clock size={16} style={{ flexShrink: 0, color: "var(--color-text-tertiary)" }} />
                : <TrendingUp size={16} style={{ flexShrink: 0, color: "var(--color-text-tertiary)" }} />}
              <span className="wc-suggest-text">
                <HighlightMatch text={item} query={term} />
              </span>
              {showingRecent && (
                <span
                  className="wc-suggest-remove"
                  onClick={(e) => removeRecent(e, item)}
                  role="button"
                  aria-label={`Remove ${item} from recent searches`}
                >
                  <X size={13} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
