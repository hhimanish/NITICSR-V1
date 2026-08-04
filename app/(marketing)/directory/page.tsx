import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { FinalCta } from "@/components/sections/final-cta";
import { listPublicDirectoryNgos } from "@/lib/ngo-intelligence";

// See app/(marketing)/open-data/page.tsx for why this renders on request
// rather than via ISR at build time.
export const dynamic = "force-dynamic";

const TITLE = "Verified NGO Directory";
const DESCRIPTION =
  "NGOs that have opted in to public listing after passing verification review — a small, honest directory, not a claimed-comprehensive national registry.";
const URL = "/directory";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
    url: URL,
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
  },
};

export default async function DirectoryPage() {
  const entries = await listPublicDirectoryNgos();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TITLE,
    description: DESCRIPTION,
    numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.legalName,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: "Directory", href: URL }]} />
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Verified NGO Directory
            </span>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              NGOs that chose to be found here
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              Every entry below passed verification review and explicitly opted in to public
              listing from their own NITICSR settings — nothing here is scraped, seeded, or
              claimed to cover NGOs outside this platform.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {entries.length === 0 ? (
            <FadeIn className="mx-auto max-w-md text-center">
              <p className="text-sm text-muted-foreground">
                No NGOs have opted in yet. Verified NGOs can enable this from Settings →
                Platform features.
              </p>
            </FadeIn>
          ) : (
            <StaggerGroup className="grid gap-6 sm:grid-cols-2">
              {entries.map((e) => (
                <StaggerItem key={e.organizationId}>
                  <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-heading text-lg font-semibold">{e.legalName}</h2>
                      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden="true" />
                    </div>
                    {e.description && (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.description}</p>
                    )}
                    {e.headquartersState && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {e.headquartersState}
                      </p>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Looking for a partner beyond this list?{" "}
            <Link href="/#matchmaking" className="font-medium text-secondary hover:underline">
              Try the full AI matchmaking demo
            </Link>
            .
          </p>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
