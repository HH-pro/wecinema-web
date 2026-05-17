import { ExternalLink, BookOpen, PenSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blog Management" };

const WP_ADMIN_URL = process.env.NEXT_PUBLIC_WP_ADMIN_URL ?? "https://blog.wecinema.co/wp-admin";

export default function BlogPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--ap-text)] font-mono flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-400" />
          Blog Management
        </h1>
        <p className="text-xs text-[var(--ap-text-3)] font-mono mt-0.5">Manage blog posts via WordPress</p>
      </div>

      <div className="max-w-lg">
        <div className="bg-[var(--ap-surface)] border border-[var(--ap-border)] rounded-2xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5">
            <PenSquare className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--ap-text)] mb-2">WordPress Dashboard</h2>
          <p className="text-sm text-[var(--ap-text-2)] mb-6 max-w-xs">
            Blog posts are managed through WordPress. Click below to open the WordPress admin dashboard.
          </p>
          <a
            href={WP_ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-orange-500/25"
          >
            Open WordPress Dashboard
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs text-[var(--ap-text-3)] font-mono mt-4">{WP_ADMIN_URL}</p>
        </div>
      </div>
    </div>
  );
}
