import type { ReactNode } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

/** Skeleton for the Deal Room / Counter Offer layouts while the deal loads. */
export function DealRoomSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading deal">
      <div className="mp-skeleton h-10 w-2/3 rounded-lg" />
      <div className="mp-skeleton h-36 rounded-2xl" />
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mp-skeleton h-14 rounded-xl" />
        ))}
      </div>
      <div className="mp-skeleton h-64 rounded-2xl" />
    </div>
  );
}

export function DealEmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { href: string; label: string } | ReactNode;
}) {
  return (
    <div className="mp-empty-state">
      <div className="mp-empty-state-icon">
        <FileText size={24} aria-hidden="true" />
      </div>
      <h3 className="mp-empty-state-title">{title}</h3>
      <p className="mp-empty-state-text">{text}</p>
      {action &&
        (typeof action === "object" && action !== null && "href" in action ? (
          <Link href={action.href} className="mp-btn mp-btn-primary mt-4">
            {action.label}
          </Link>
        ) : (
          <div className="mt-4">{action}</div>
        ))}
    </div>
  );
}

/** Mongo ObjectId shape — anything else can't be a deal, so skip the request. */
export function isValidDealId(id: string | undefined): id is string {
  return !!id && /^[a-f0-9]{24}$/i.test(id);
}
