import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { caseStudies } from "@/lib/case-studies";

export function CaseStudyShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const study = caseStudies.find((s) => s.slug === slug);

  return (
    <article className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Case studies
          </Link>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Illustrative example — not an actual named customer
          </div>

          {study && (
            <p className="mt-3 text-sm text-muted-foreground">
              Sector: <span className="font-medium text-foreground">{study.sector}</span>
            </p>
          )}

          <div className="mt-2">{children}</div>
        </FadeIn>
      </div>
    </article>
  );
}
