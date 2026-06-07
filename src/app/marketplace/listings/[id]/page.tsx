import type { Metadata } from "next";
import { clientEnv } from "@/config/env";
import { OG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getListingById } from "@/features/marketplace/api/listingQueries";
import ListingDetailClient from "@/features/marketplace/components/ListingDetailClient";

// Listings change (price, status) — keep metadata fresh on every request.
export const revalidate = 0;

const SITE = clientEnv.NEXT_PUBLIC_SITE_URL;

const FALLBACK_TITLE = "Marketplace Listing | WeCinema";
const FALLBACK_DESCRIPTION =
  "Buy, license, and commission original film projects on the WeCinema marketplace.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id).catch(() => null);

  if (!listing) {
    return { title: { absolute: FALLBACK_TITLE }, description: FALLBACK_DESCRIPTION };
  }

  const title = `${listing.title} | WeCinema Marketplace`;
  const description = listing.description ?? FALLBACK_DESCRIPTION;
  const image = listing.thumbnail ?? listing.mediaUrls?.[0] ?? OG.default;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/marketplace/listings/${id}` },
    openGraph: {
      type: "website",
      siteName: "WeCinema",
      title,
      description,
      url: `${SITE}/marketplace/listings/${id}`,
      images: [{ url: image, width: 1200, height: 630, alt: listing.title }],
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fetch only for structured data; the client component does its own fetch for
  // the interactive UI. A failure here just omits JSON-LD — it never blocks the
  // page (notFound is the client's responsibility, matching prior behaviour).
  const listing = await getListingById(id).catch(() => null);
  const seller = listing?.seller ?? listing?.sellerId;

  // schema.org Product + Offer so AI answer engines and Google Shopping can
  // surface "buy/license X" queries with this listing as the cited source.
  const jsonLd = listing
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: listing.title,
        description: listing.description ?? FALLBACK_DESCRIPTION,
        ...(listing.thumbnail || listing.mediaUrls?.length
          ? { image: [listing.thumbnail ?? listing.mediaUrls![0]] }
          : {}),
        ...(listing.category ? { category: listing.category } : {}),
        url: `${SITE}/marketplace/listings/${id}`,
        ...(seller?.username
          ? { brand: { "@type": "Brand", name: seller.username } }
          : {}),
        ...(typeof listing.price === "number"
          ? {
              offers: {
                "@type": "Offer",
                price: listing.price.toFixed(2),
                priceCurrency: listing.currency ?? "USD",
                availability:
                  listing.status === "sold"
                    ? "https://schema.org/SoldOut"
                    : "https://schema.org/InStock",
                url: `${SITE}/marketplace/listings/${id}`,
                ...(seller?.username
                  ? { seller: { "@type": "Person", name: seller.username } }
                  : {}),
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <ListingDetailClient />
    </>
  );
}
