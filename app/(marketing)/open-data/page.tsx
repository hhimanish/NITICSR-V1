import type { Metadata } from "next";
import {
  Banknote,
  Building2,
  Database,
  Goal,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { FinalCta } from "@/components/sections/final-cta";
import { computePlatformImpactSummary } from "@/lib/platform-stats";

// Rendered on request, not at build time — Render's build step runs before
// migrations, so a DB-backed page can't safely assume DATABASE_URL is
// reachable and migrated during `next build` (see render.yaml). No other
// marketing page in this codebase queries the DB directly for the same
// reason; this and /directory are the first, so they render dynamically
// instead of via ISR.
export const dynamic = "force-dynamic";

const TITLE = "Open Data";
const DESCRIPTION =
  "Platform-wide CSR activity totals, computed live on every request — verified NGOs, projects, funds disbursed, beneficiaries reached, and SDG coverage. Aggregate only, never a per-organization breakdown, and never presented as a national index.";
const URL = "/open-data";

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

export default async function OpenDataPage() {
  const summary = await computePlatformImpactSummary();

  const stats = [
    { icon: Building2, label: "Corporate organizations", value: summary.totalCorporateOrganizations.toLocaleString("en-IN") },
    { icon: ShieldCheck, label: "Verified NGOs", value: summary.totalVerifiedNgos.toLocaleString("en-IN") },
    { icon: Database, label: "CSR projects tracked", value: summary.totalCsrProjects.toLocaleString("en-IN") },
    { icon: Banknote, label: "Funds disbursed (₹)", value: `₹${summary.totalFundsDisbursed.toLocaleString("en-IN")}` },
    { icon: Users, label: "Beneficiaries reached", value: summary.totalBeneficiariesReached.toLocaleString("en-IN") },
    { icon: Goal, label: "SDG goals covered", value: `${summary.sdgGoalsCovered} / 17` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "NITICSR Platform Impact Data",
    description: DESCRIPTION,
    url: "https://niticsr.com/open-data",
    license: "https://niticsr.com/open-data",
    creator: { "@type": "Organization", name: "NITICSR" },
    temporalCoverage: summary.generatedAt,
    variableMeasured: stats.map((s) => s.label),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: "Open Data", href: URL }]} />
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
              Open Data
            </span>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              What&apos;s actually moving through the platform
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              Real totals across every organization on NITICSR, computed live on every request. Aggregate only —
              no organization&apos;s individual numbers are ever exposed here — and scoped honestly
              to this platform&apos;s own activity, not framed as a national index it can&apos;t back.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <stat.icon className="size-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 font-heading text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Last generated {new Date(summary.generatedAt).toLocaleString("en-IN")} · also available as
            JSON at{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">GET /api/v1/platform/impact-summary</code>
          </p>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
