import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminGuard } from "@/features/admin/components/AdminGuard";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[var(--ap-bg)]">
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
