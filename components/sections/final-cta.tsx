import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-primary py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-secondary/30 blur-[100px]" />
        <div className="absolute -right-20 -bottom-20 size-72 rounded-full bg-info/30 blur-[100px]" />
      </div>

      <FadeIn className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
          Ready to modernize your CSR program?
        </h2>
        <p className="mt-4 text-primary-foreground/80">
          Talk to us about rolling out verified NGO discovery and compliance workflows
          across your organization.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" variant="secondary" render={<Link href="/request-demo" />} className="gap-2">
            Request enterprise demo
            <ArrowRight className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<Link href="#matchmaking" />}
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            Try the AI demo
          </Button>
        </div>
      </FadeIn>
    </section>
  );
}
