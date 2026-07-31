import type { Metadata } from "next";

import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { cn } from "@/lib/utils";
import { productUpdates } from "@/lib/product-updates";

export const metadata: Metadata = {
  title: "Product Updates",
  description: "What's shipped, improved, and fixed in NITICSR.",
};

const TAG_STYLES: Record<string, string> = {
  New: "bg-secondary/15 text-secondary",
  Improved: "bg-info/15 text-info",
  Fixed: "bg-accent/15 text-accent-foreground",
};

export default function ProductUpdatesPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Product Updates</h1>
          <p className="mt-4 text-muted-foreground">What&apos;s shipped, what&apos;s improved, what&apos;s next.</p>
        </FadeIn>

        <StaggerGroup className="mt-14 space-y-6">
          {productUpdates.map((update) => (
            <StaggerItem key={update.title}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", TAG_STYLES[update.tag])}>
                    {update.tag}
                  </span>
                  <time className="text-xs text-muted-foreground" dateTime={update.date}>
                    {new Date(update.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <h2 className="mt-3 font-heading text-lg font-semibold">{update.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{update.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
