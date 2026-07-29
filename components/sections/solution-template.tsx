import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { FinalCta } from "@/components/sections/final-cta";

export type SolutionCapability = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type SolutionPageData = {
  eyebrow: string;
  title: string;
  description: string;
  audience: string[];
  capabilities: SolutionCapability[];
};

export function SolutionPage({ data }: { data: SolutionPageData }) {
  return (
    <>
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
              {data.eyebrow}
            </span>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {data.title}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">{data.description}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/contact" />} className="gap-2">
                Talk to us
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/#matchmaking" />}>
                See the AI demo
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-border bg-background py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <ul className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
              {data.audience.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground/90"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Key capabilities
            </h2>
          </FadeIn>
          <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-3">
            {data.capabilities.map((capability) => (
              <StaggerItem key={capability.title}>
                <div className="h-full rounded-2xl border border-border bg-background p-6 shadow-sm">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <capability.icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold">{capability.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{capability.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
