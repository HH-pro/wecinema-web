"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/AuthContext";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { authUser, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !authUser?.isAdmin) {
      router.replace("/admin/login");
    }
  }, [status, authUser, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--ap-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--ap-text-2)] text-sm font-mono">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!authUser?.isAdmin) return null;

  return <>{children}</>;
}
