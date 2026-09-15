"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  acceptAll as storeAcceptAll,
  getConsentSnapshot,
  getServerConsentSnapshot,
  purgeDisallowedTrackers,
  rejectAll as storeRejectAll,
  saveConsent,
  subscribeConsent,
  type ConsentState,
} from "./consentStore";
import type { ConsentChoices } from "./consentTypes";

/**
 * The visitor's current consent. Works without ConsentProvider, so trackers can gate on it
 * anywhere. The server (and hydration) always sees "undecided", so nothing optional is ever
 * in the server-rendered HTML.
 */
export function useConsentState(): ConsentState {
  return useSyncExternalStore(subscribeConsent, getConsentSnapshot, getServerConsentSnapshot);
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true once running in the browser. */
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

interface ConsentCtx extends ConsentState {
  /** Consent can be read (client-side). Hide consent UI until then so it never flashes. */
  ready: boolean;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choices: ConsentChoices) => void;
}

const Ctx = createContext<ConsentCtx | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const state = useConsentState();
  const ready = useHydrated();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    purgeDisallowedTrackers();
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const acceptAll = useCallback(() => {
    storeAcceptAll();
    setSettingsOpen(false);
  }, []);
  const rejectAll = useCallback(() => {
    storeRejectAll();
    setSettingsOpen(false);
  }, []);
  const save = useCallback((choices: ConsentChoices) => {
    saveConsent(choices);
    setSettingsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ ...state, ready, settingsOpen, openSettings, closeSettings, acceptAll, rejectAll, save }),
    [state, ready, settingsOpen, openSettings, closeSettings, acceptAll, rejectAll, save],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsent(): ConsentCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
