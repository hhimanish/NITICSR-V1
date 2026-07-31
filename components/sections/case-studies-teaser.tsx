import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { caseStudies } from "@/lib/case-studies";

export function CaseStudiesTeaser() {
  return (
    <section className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">Case studies</span>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Illustrative outcomes
            </h2>
          </div>
          <Link href="/case-studies" className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline">
            View all case studies
            <ArrowRight className="size-4" />
          </Link>
        </FadeIn>

        <StaggerGroup className="mt-10 grid gap-6 md:grid-cols-2">
          {caseStudies.map((study) => (
            <StaggerItem key={study.slug}>
              <Link
                href={`/case-studies/${study.slug}`}
                className="block h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {study.sector} · Illustrative example
                </span>
                <h3 className="mt-2 font-heading text-lg font-semibold">{study.title}</h3>
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
