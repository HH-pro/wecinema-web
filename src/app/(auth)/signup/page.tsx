import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join WeCinema — watch, upload, and sell films and scripts.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
