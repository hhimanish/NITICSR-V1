import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, KeyRound, Webhook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";

export const metadata: Metadata = {
  title: "Developer Portal",
  description: "Build on the NITICSR platform API.",
};

const cards = [
  {
    icon: BookOpenText,
    title: "API Documentation",
    description: "Every endpoint — organizations, NGO profiles, CSR projects, verification requests.",
    href: "/developers/api-docs",
    cta: "View API docs",
  },
  {
    icon: KeyRound,
    title: "Authentication",
    description: "Session-based auth via Clerk today; scoped API keys are modeled in the schema for server-to-server use.",
    href: "/security",
    cta: "How auth works",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Subscribe to domain events like project or verification status changes as the event catalogue grows.",
    href: "/developers/api-docs",
    cta: "See event-shaped endpoints",
  },
];

export default function DevelopersPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Developer Portal</h1>
          <p className="mt-4 text-muted-foreground">
            A versioned, permission-checked REST API sits behind every NITICSR workflow. Here&apos;s how to work
            with it.
          </p>
          <div className="mt-8">
            <Button size="lg" render={<Link href="/developers/api-docs" />} className="gap-2">
              View API documentation
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </FadeIn>

        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <StaggerItem key={card.title}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <card.icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-heading text-lg font-semibold">{card.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{card.description}</p>
                <Link href={card.href} className="mt-4 text-sm font-medium text-secondary hover:underline">
                  {card.cta} →
                </Link>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
