import { api } from "./apiClient";
import type { AuthUser } from "@/types";
import { getFirebaseAuth } from "@/lib/firebase/config";
import { toBody } from "@/lib/api/serialize";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

// ─── Types ───────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  dob: string;
}

export interface RegisterResponse {
  message: string;
  user: { email: string; username: string; requiresVerification: true };
}

export interface MeResponse {
  success: true;
  user: AuthUser;
}

// ─── Auth API ─────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return api.post<LoginResponse>("/user/login", toBody(payload));
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return api.post<RegisterResponse>("/user/register", toBody(payload));
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${BASE}/user/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {}
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await api.get<MeResponse>("/user/me");
    return res.user ?? null;
  } catch {
    return null;
  }
}

export async function verifyEmailOtp(payload: {
  email: string;
  otp: string;
}): Promise<{ success: boolean; message: string }> {
  return api.post("/user/verify-email-otp", toBody(payload));
}

export async function resendVerification(email: string): Promise<void> {
  await api.post("/user/resend-verification", { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/user/forgot-password", { email });
}

export async function resetPassword(payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<void> {
  await api.post("/user/reset-password", toBody(payload));
}

export async function loginWithGoogle(): Promise<LoginResponse> {
  const [auth, { GoogleAuthProvider, signInWithPopup }] = await Promise.all([
    getFirebaseAuth(),
    import("firebase/auth"),
  ]);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const idToken = await result.user.getIdToken();
  return api.post<LoginResponse>("/user/google-auth", { idToken });
}

export async function refreshSession(): Promise<{ token: string; user?: AuthUser } | null> {
  try {
    const res = await fetch(`${BASE}/user/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
