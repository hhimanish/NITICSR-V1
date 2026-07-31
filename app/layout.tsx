import type { Metadata } from "next";
import { Geist, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsentBanner } from "@/components/site/consent-banner";
import "./globals.css";

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fontNumeric = IBM_Plex_Sans({
  variable: "--font-numeric",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://niticsr.com"),
  title: {
    default: "NITICSR — India's Enterprise CSR Operating System",
    template: "%s — NITICSR",
  },
  description:
    "Verified impact. Absolute compliance. NITICSR is the enterprise operating system for Corporate CSR in India — AI-matched NGO discovery, verification, and Schedule VII compliance in one platform.",
  openGraph: {
    title: "NITICSR — India's Enterprise CSR Operating System",
    description:
      "Verified impact. Absolute compliance. AI-matched NGO discovery, verification, and Schedule VII compliance in one platform.",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NITICSR — India's Enterprise CSR Operating System",
    description:
      "Verified impact. Absolute compliance. AI-matched NGO discovery, verification, and Schedule VII compliance in one platform.",
  },
  // Deliberately no site-wide `alternates.canonical` here — Next.js metadata
  // is shallow-merged per top-level key, so a blanket canonical at the root
  // gets inherited verbatim by every page that doesn't set its own,
  // wrongly telling crawlers every page is a duplicate of "/". Pages that
  // need one (blog posts, case studies) set it themselves.
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "NITICSR",
  url: "https://niticsr.com",
  description:
    "India's enterprise operating system for Corporate CSR — AI-matched NGO discovery, verification, and Schedule VII compliance.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NITICSR",
  url: "https://niticsr.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://niticsr.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "NITICSR",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Enterprise operating system for Corporate CSR in India — AI matchmaking, NGO verification, and Schedule VII compliance workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets .dark before paint to avoid a flash of the wrong theme —
            can't wait for React hydration since that runs after first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontMono.variable} ${fontNumeric.variable} antialiased`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
        />
        <ClerkProvider>
          <TooltipProvider delay={150}>{children}</TooltipProvider>
          <ConsentBanner />
        </ClerkProvider>
      </body>
    </html>
  );
}
