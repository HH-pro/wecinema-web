import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: { absolute: "Login to WeCinema" },
  description: "Access your WeCinema account to manage films, scripts, marketplace listings, and creator tools.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
