import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata: Metadata = {
  title: "About",
  description: "Why we're building NITICSR, India's enterprise CSR operating system.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — NITICSR",
    description: "Why we're building NITICSR, India's enterprise CSR operating system.",
    url: "/about",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — NITICSR",
    description: "Why we're building NITICSR, India's enterprise CSR operating system.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "About", href: "/about" }]} />
      <section className="border-b border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              CSR compliance shouldn&apos;t be a spreadsheet exercise
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Every year, Indian companies route thousands of crores through Schedule VII CSR
              obligations — often through manual outreach, informal diligence, and reporting
              stitched together at year-end. We think that process deserves better tooling.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl space-y-8 px-4 text-foreground/90 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-heading text-2xl font-semibold">What we&apos;re building</h2>
            <p className="mt-3 text-muted-foreground">
              NITICSR is an operating system for Corporate CSR in India: AI-assisted NGO
              discovery, a verification layer that front-loads due diligence, and compliance
              workflows designed around what Section 135 and Schedule VII actually require —
              not around a generic CRM.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="font-heading text-2xl font-semibold">Where we are today</h2>
            <p className="mt-3 text-muted-foreground">
              The public platform, a live AI-matchmaking demo running on Cerebras-hosted
              open-weight models, and real Corporate, NGO, and Auditor workspaces — covering
              governance, compliance, grant management, financial operations, project
              execution, field verification, risk &amp; audit, and sustainability reporting —
              are built and running today. Real payment execution, enterprise identity (SSO),
              and multi-user team management are being built next.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Have questions about the platform or want to be an early design partner?
              </p>
              <Button className="mt-4 gap-2" render={<Link href="/contact" />}>
                Get in touch
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
