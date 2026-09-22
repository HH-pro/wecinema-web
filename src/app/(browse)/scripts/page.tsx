import { getAllScripts } from "@/features/scripts";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_ORIGIN } from "@/lib/seo";
import { ScriptsBrowser } from "./ScriptsBrowser";

export const revalidate = 300;

const SITE = SITE_ORIGIN;

/**
 * Server component. Metadata lives in `./layout.tsx`.
 *
 * The grid is fetched here rather than in the client so every `/scripts/{id}`
 * link ships in the initial HTML — this page is the only hub that links to
 * script detail pages, and it previously rendered none of them for crawlers.
 */
export default async function ScriptsPage() {
  const scripts = await getAllScripts();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Screenplays & Scripts Marketplace",
          description:
            "Browse original scripts and screenplays from independent writers and filmmakers.",
          url: `${SITE}/scripts`,
          isPartOf: { "@type": "WebSite", name: "WeCinema", url: `${SITE}/` },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: scripts.length,
            itemListElement: scripts.slice(0, 50).map((script, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE}/scripts/${script._id}`,
              name: script.title,
            })),
          },
        }}
      />
      <ScriptsBrowser scripts={scripts} />
    </>
  );
}
