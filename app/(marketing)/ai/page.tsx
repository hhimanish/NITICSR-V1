import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, MessageSquareText, ScanSearch, ShieldCheck, Sparkles, Waypoints } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { FinalCta } from "@/components/sections/final-cta";

export const metadata: Metadata = {
  title: "AI Capabilities",
  description: "How NITICSR uses AI for matchmaking today, and what's next.",
  alternates: { canonical: "/ai" },
  openGraph: {
    title: "AI Capabilities — NITICSR",
    description: "How NITICSR uses AI for matchmaking today, and what's next.",
    url: "/ai",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Capabilities — NITICSR",
    description: "How NITICSR uses AI for matchmaking today, and what's next.",
  },
};

const capabilities = [
  {
    icon: ScanSearch,
    title: "AI matchmaking",
    status: "Live",
    description: "Ranks NGO partners by cause alignment, geography fit, and budget band — try it on the homepage.",
  },
  {
    icon: BrainCircuit,
    title: "Trust score modeling",
    status: "In development",
    description: "Combining verification, financial, governance, and audit signals into a single 0-100 score.",
  },
  {
    icon: MessageSquareText,
    title: "Conversational copilot",
    status: "Illustrative preview",
    description: "Natural-language answers grounded in your own platform data — see the preview on the homepage.",
  },
  {
    icon: Waypoints,
    title: "Semantic search",
    status: "Roadmap",
    description: "Finding relevant NGOs, projects, and reports by meaning, not just keyword match.",
  },
];

export default function AiPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "AI Capabilities", href: "/ai" }]} />
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-secondary">
              <Sparkles className="size-3.5" />
              AI Capabilities
            </span>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              AI where it earns its place, not everywhere
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              NITICSR uses Cerebras-hosted open-weight models for matchmaking today. Here&apos;s what&apos;s
              actually live, what&apos;s in development, and what&apos;s roadmap — labeled honestly.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/#matchmaking" />} className="gap-2">
                Try the live demo
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/security" />}>
                How we handle data
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid gap-6 md:grid-cols-2">
            {capabilities.map((cap) => (
              <StaggerItem key={cap.title}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <cap.icon className="size-5" aria-hidden="true" />
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {cap.status}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold">{cap.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{cap.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <FadeIn delay={0.15} className="mt-10 flex items-start gap-3 rounded-2xl border border-border bg-card p-6">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              The matchmaking demo runs against a small, fictional seed dataset — see{" "}
              <Link href="/security" className="font-medium text-secondary hover:underline">
                Security &amp; Trust
              </Link>{" "}
              for how real data is handled once verified records are in the platform.
            </p>
          </FadeIn>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
