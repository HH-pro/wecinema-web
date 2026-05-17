import type { Metadata, Viewport } from "next";
import { Poppins, Roboto } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { clientEnv } from "@/config/env";
import "./globals.css";

// Preload only the most-used weight eagerly; remaining weights load on swap.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: true,
});

const poppinsExtra = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  display: "swap",
  preload: false,
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const SITE_NAME = "WeCinema";
const SITE_URL = clientEnv.NEXT_PUBLIC_SITE_URL;
const DESCRIPTION =
  "WeCinema is the home of independent film. Watch movies, upload your own, browse scripts, and sell your work to a global audience.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Watch, Create & Sell Films and Scripts Online`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "independent films",
    "film marketplace",
    "watch movies online",
    "sell scripts",
    "indie cinema",
    "film community",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Watch, Create & Sell Films`,
    description: DESCRIPTION,
    images: [{ url: "/wecinema.webp", width: 1128, height: 990, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Watch, Create & Sell Films`,
    description: DESCRIPTION,
    images: ["/wecinema.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="light"
      suppressHydrationWarning
      className={`${poppins.variable} ${poppinsExtra.variable} ${roboto.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
