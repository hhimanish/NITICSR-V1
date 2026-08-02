import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileBarChart, Megaphone } from "lucide-react";

import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides, case studies, and product updates from NITICSR.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Resources — NITICSR",
    description: "Guides, case studies, and product updates from NITICSR.",
    url: "/resources",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources — NITICSR",
    description: "Guides, case studies, and product updates from NITICSR.",
  },
};

const resources = [
  {
    icon: BookOpen,
    title: "Knowledge Center",
    description: "Practical, plain-language guides on CSR compliance in India.",
    href: "/blog",
  },
  {
    icon: FileBarChart,
    title: "Case Studies",
    description: "Illustrative examples of the outcomes NITICSR is designed to produce.",
    href: "/case-studies",
  },
  {
    icon: Megaphone,
    title: "Product Updates",
    description: "What's shipped, what's improved, and what's next.",
    href: "/resources/product-updates",
  },
];

export default function ResourcesPage() {
  return (
    <section className="py-20 sm:py-28">
      <Breadcrumbs items={[{ label: "Resources", href: "/resources" }]} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Resources</h1>
          <p className="mt-4 text-muted-foreground">
            Everything to understand CSR compliance in India and what NITICSR is building.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {resources.map((resource) => (
            <StaggerItem key={resource.href}>
              <Link
                href={resource.href}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <resource.icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-heading text-lg font-semibold">{resource.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{resource.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-secondary">
                  Browse
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
