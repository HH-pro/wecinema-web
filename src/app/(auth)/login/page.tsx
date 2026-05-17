import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your WeCinema account.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
