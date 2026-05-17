"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { tokenStorage } from "@/features/auth/services/tokenStorage";
import { setUnauthorizedHandler } from "@/features/auth/services/apiClient";
import * as authService from "@/features/auth/services/authService";
import type { AuthUser } from "@/types";

// ─── Types ───────────────────────────────────────────────────

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  authUser: AuthUser | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  applyLogin: (response: authService.LoginResponse) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logout = useCallback(async () => {
    tokenStorage.clear();
    setAuthUser(null);
    setStatus("unauthenticated");
    await authService.logout();
  }, []);

  useEffect(() => {
    const cachedUser = tokenStorage.getUser<AuthUser>();
    let cancelled = false;

    const restore = async () => {
      const data = await authService.refreshSession();
      if (cancelled) return;

      // If applyLogin() was called while refreshSession was in-flight,
      // a token is already set — don't overwrite with a stale null result.
      if (!data?.token) {
        if (!tokenStorage.get()) {
          tokenStorage.clear();
          setStatus("unauthenticated");
        }
        setUnauthorizedHandler(logout);
        return;
      }

      tokenStorage.set(data.token);
      const user = data.user ?? cachedUser;
      if (user) {
        tokenStorage.setUser(user);
        setAuthUser(user);
      }
      setStatus("authenticated");
      setUnauthorizedHandler(logout);

      authService.getMe().then((fresh) => {
        if (cancelled) return;
        if (fresh) {
          tokenStorage.setUser(fresh);
          setAuthUser(fresh);
        }
      });
    };

    if (cachedUser) {
      setAuthUser(cachedUser);
      setStatus("authenticated");
    }

    restore();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyLogin = useCallback(
    (response: authService.LoginResponse) => {
      tokenStorage.set(response.token);
      tokenStorage.setUser(response.user);
      setAuthUser(response.user);
      setStatus("authenticated");
      setUnauthorizedHandler(logout);
    },
    [logout],
  );

  const refreshUser = useCallback(async () => {
    const fresh = await authService.getMe();
    if (fresh) {
      tokenStorage.setUser(fresh);
      setAuthUser(fresh);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        status,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        applyLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
