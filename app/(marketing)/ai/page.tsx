import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, MessageSquareText, ScanSearch, SearchCode, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { FinalCta } from "@/components/sections/final-cta";

const TITLE = "AI Capabilities";
const DESCRIPTION = "What's actually live today — matchmaking, an honest trust score, a grounded Copilot, real search, and honest forecasts — labeled accurately, not aspirationally.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ai" },
  openGraph: {
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
    url: "/ai",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
  },
};

// Corrected against actual shipped state — this page previously understated
// what was live (the Copilot and trust score were both marked as
// unfinished well after they shipped for real in ERT 1 and ERT 3).
const capabilities = [
  {
    icon: ScanSearch,
    title: "AI matchmaking",
    status: "Live",
    description: "Ranks NGO partners by cause alignment, geography fit, and budget band — try it on the homepage.",
  },
  {
    icon: BrainCircuit,
    title: "Honest NGO trust score",
    status: "Live",
    description: "Blends only the components with real data behind them — verification and project track record. No fabricated financial or governance score.",
  },
  {
    icon: MessageSquareText,
    title: "Grounded AI Copilot",
    status: "Live",
    description: "One assistant grounded across governance, compliance, risk & assurance, and sustainability data — for your organization only, never invented.",
  },
  {
    icon: SearchCode,
    title: "Enterprise search",
    status: "Live",
    description: "Real full-text search across your projects, policies, risks, and incidents — keyword/stem-based, not a semantic claim we can't back yet.",
  },
  {
    icon: TrendingUp,
    title: "Honest disbursement forecast",
    status: "Live",
    description: "A linear projection from a project's real disbursement history — returns nothing rather than guessing with too little data.",
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
              NITICSR uses Cerebras-hosted open-weight models for matchmaking and a grounded Copilot,
              plus deterministic scoring and search built directly on Postgres. Every capability below
              is labeled by what&apos;s actually shipped — not what&apos;s aspirational.
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
