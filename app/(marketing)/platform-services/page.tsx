import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Flag,
  Layers,
  ListChecks,
  Lock,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { FinalCta } from "@/components/sections/final-cta";

const TITLE = "Enterprise Platform Services";
const DESCRIPTION =
  "The shared services layer underneath every workspace — feature flags, background jobs, notifications, rate limiting, structured logging, and audited tenant isolation. Labeled by what's actually live, not what's aspirational.";
const URL = "/platform-services";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
    url: URL,
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

const live = [
  {
    icon: Flag,
    title: "Feature flags",
    description:
      "Platform-wide defaults with per-organization overrides an admin can toggle from Settings — not a migration-only switch anymore.",
  },
  {
    icon: Layers,
    title: "Background job queue",
    description:
      "A Postgres-backed queue with exponential backoff and dead-lettering, processed on a GitHub Actions cron — no Redis to operate for this workload.",
  },
  {
    icon: ScrollText,
    title: "Structured logging",
    description:
      "Every unhandled API error and boot-time check emits a structured JSON line — the foundation a real APM plugs into, not a dashboard we don't have yet.",
  },
  {
    icon: ShieldCheck,
    title: "Audited tenant isolation",
    description:
      "Every one of 67 v1 API routes was reviewed to confirm organization scoping comes from the resource or a permission-checked membership — never a client-trusted field. See Security & Trust.",
  },
  {
    icon: Lock,
    title: "Boot-time configuration validation",
    description:
      "The app refuses to serve traffic on a deploy missing its database or auth credentials, instead of failing unpredictably on the first real request.",
  },
  {
    icon: ListChecks,
    title: "Rate limiting",
    description:
      "Per-IP and per-user limits on every AI and public-form endpoint, protecting the paid Cerebras API from abuse.",
  },
];

const planned = [
  {
    title: "Observability / APM (metrics, tracing, dashboards)",
    blocker: "No monitoring vendor (Datadog, Grafana Cloud, etc.) has been chosen yet.",
  },
  {
    title: "Redis-backed caching / rate limiting",
    blocker: "Not provisioned — the current Postgres/in-memory approach hasn't hit a real ceiling.",
  },
  {
    title: "API Gateway",
    blocker: "One Next.js app serves everything; a gateway in front of itself adds a hop with nothing to route.",
  },
  {
    title: "Dedicated secrets manager (e.g. Vault)",
    blocker: "Render environment variables are the real secret store at current scale.",
  },
  {
    title: "Internationalization / localization",
    blocker: "No second-language customer requirement has been stated yet.",
  },
  {
    title: "CDN vendor selection",
    blocker: "Render and Next.js's own asset serving cover current traffic.",
  },
];

export default function PlatformServicesPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Platform Services", href: URL }]} />
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-secondary">
              <Sparkles className="size-3.5" />
              Enterprise Platform Services
            </span>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              The shared services every workspace runs on
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              Feature flags, job processing, notifications, rate limiting, structured logging, and
              audited tenant isolation — invisible infrastructure, labeled honestly by what&apos;s
              actually shipped.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/contact" />} className="gap-2">
                Talk to us
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/security" />}>
                Security &amp; Trust
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Live today</h2>
          </FadeIn>
          <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2">
            {live.map((cap) => (
              <StaggerItem key={cap.title}>
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <cap.icon className="size-5" aria-hidden="true" />
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Live
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold">{cap.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{cap.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              On the roadmap, honestly
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              Each of these is blocked on a specific, named decision — a vendor account or a real
              usage signal — not built as a placeholder in the meantime.
            </p>
          </FadeIn>
          <StaggerGroup className="mt-10 space-y-3">
            {planned.map((item) => (
              <StaggerItem key={item.title}>
                <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-background p-4">
                  <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Blocked on: {item.blocker}</p>
                  </div>
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
