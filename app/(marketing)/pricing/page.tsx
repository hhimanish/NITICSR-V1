import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent tiers for CSR discovery, verification, and compliance.",
};

const tiers = [
  {
    name: "Starter",
    description: "For companies just crossing the Section 135 threshold.",
    price: "Custom",
    highlighted: false,
    features: [
      "AI-matched NGO discovery",
      "Verified partner profiles",
      "Up to 10 active partnerships",
      "Email support",
    ],
  },
  {
    name: "Growth",
    description: "For established CSR programs managing multiple causes and states.",
    price: "Custom",
    highlighted: true,
    features: [
      "Everything in Starter",
      "Unlimited active partnerships",
      "Multi-state portfolio dashboard",
      "Priority verification review",
      "Dedicated onboarding",
    ],
  },
  {
    name: "Enterprise",
    description: "For conglomerates and CSR foundations with complex reporting needs.",
    price: "Custom",
    highlighted: false,
    features: [
      "Everything in Growth",
      "Multi-entity / multi-brand support",
      "Auditor access included",
      "Custom compliance workflows",
      "Dedicated success manager",
    ],
  },
];

export default function PricingPage() {
  return (
    <section className="py-20 sm:py-28">
      <Breadcrumbs items={[{ label: "Pricing", href: "/pricing" }]} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Pricing built around your CSR footprint
          </h1>
          <p className="mt-4 text-muted-foreground">
            No self-serve billing yet — every plan starts with a conversation so we can scope
            it to your budget band and partner count.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-16 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <StaggerItem key={tier.name}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-2xl border p-8 shadow-sm",
                  tier.highlighted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card"
                )}
              >
                <h2 className="font-heading text-xl font-semibold">{tier.name}</h2>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    tier.highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {tier.description}
                </p>
                <p className="mt-6 font-numeric text-3xl font-semibold">{tier.price}</p>

                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-8"
                  variant={tier.highlighted ? "secondary" : "default"}
                  render={<Link href="/contact" />}
                >
                  Talk to us
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
