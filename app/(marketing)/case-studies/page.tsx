import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { caseStudies } from "@/lib/case-studies";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Illustrative examples of the outcomes NITICSR is designed to produce.",
};

export default function CaseStudiesIndexPage() {
  return (
    <section className="py-20 sm:py-28">
      <Breadcrumbs items={[{ label: "Resources", href: "/resources" }, { label: "Case Studies", href: "/case-studies" }]} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Case Studies</h1>
          <p className="mt-4 text-muted-foreground">
            Illustrative examples — there are no named customers yet, so these model the kind of
            outcome the platform is designed to produce, not a real engagement.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2">
          {caseStudies.map((study) => (
            <StaggerItem key={study.slug}>
              <Link
                href={`/case-studies/${study.slug}`}
                className="block h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {study.sector} · Illustrative example
                </span>
                <h2 className="mt-2 font-heading text-xl font-semibold">{study.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{study.excerpt}</p>
                <p className="mt-4 text-sm font-semibold text-secondary">{study.metric}</p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
