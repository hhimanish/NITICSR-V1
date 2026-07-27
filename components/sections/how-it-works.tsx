import { FileCheck2, ScanSearch, Sparkles } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";

const steps = [
  {
    icon: ScanSearch,
    title: "Discover",
    description:
      "Tell us your Schedule VII cause area, geography, and budget. Our AI ranks aligned NGO partners in seconds.",
  },
  {
    icon: FileCheck2,
    title: "Verify",
    description:
      "Every recommended partner is checked against registration, financial, and impact-reporting criteria before you engage.",
  },
  {
    icon: Sparkles,
    title: "Fund & Report",
    description:
      "Route CSR budget with audit-ready documentation, so compliance reporting is a byproduct of doing the work — not extra work.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-border bg-card py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            How NITICSR works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three steps from CSR budget to verified, compliant impact.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <StaggerItem key={step.title}>
              <div className="relative h-full rounded-2xl border border-border bg-background p-8 shadow-sm">
                <span className="font-numeric text-sm font-semibold text-info">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="mt-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <step.icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
