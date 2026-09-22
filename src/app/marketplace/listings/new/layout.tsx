import type { Metadata } from "next";

/**
 * Private seller surface — a logged-in form, not content. It was inheriting the
 * root defaults and shipping `index, follow` with the generic site title.
 */
export const metadata: Metadata = {
  title: "Create a listing",
  robots: { index: false, follow: false },
};

export default function NewListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
