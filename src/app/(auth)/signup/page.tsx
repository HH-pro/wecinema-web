import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = {
  title: { absolute: "Sign Up for WeCinema" },
  description: "Join WeCinema and start uploading films, selling scripts, and building your filmmaking career.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
