import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Layers, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";

export const metadata: Metadata = {
  title: "Careers",
  description: "We're building the team behind NITICSR.",
};

const values = [
  { icon: Compass, title: "Compliance-first, not compliance-only", description: "We build tools that make the right thing the easy thing." },
  { icon: Layers, title: "Depth over breadth", description: "We'd rather do fewer things well than everything shallowly." },
  { icon: Users, title: "Direct, not political", description: "Small team, real ownership, no layers to route decisions through." },
];

export default function CareersPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Careers at NITICSR</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            We&apos;re early — building the team that will take NITICSR from Phase 3 to a platform
            enterprises depend on for CSR compliance.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-14 grid gap-6 text-left sm:grid-cols-3">
          {values.map((value) => (
            <StaggerItem key={value.title}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <value.icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-heading text-base font-semibold">{value.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <FadeIn delay={0.15} className="mt-14 rounded-2xl border border-border bg-card p-8">
          <h2 className="font-heading text-xl font-semibold">No open roles right now</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            We don&apos;t have specific positions listed at this stage of the platform. If you want to
            build compliance-grade software for India&apos;s CSR ecosystem, reach out anyway —
            we&apos;d rather hear from you early than post a job description after the fact.
          </p>
          <Button className="mt-6 gap-2" render={<Link href="/contact" />}>
            Get in touch
            <ArrowRight className="size-4" />
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
