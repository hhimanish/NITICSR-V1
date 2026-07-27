import Link from "next/link";
import { ArrowRight, FileLock2, ShieldCheck, Stamp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";

const points = [
  { icon: ShieldCheck, text: "Registration, 12A/80G, and FCRA status checked before an NGO ever surfaces in a match." },
  { icon: FileLock2, text: "Immutable audit trail for every rupee routed, ready for statutory disclosure." },
  { icon: Stamp, text: "Independent auditor sign-off workflow — coming in a later phase of NITICSR." },
];

export function VerificationVaultTeaser() {
  return (
    <section id="verification-vault" className="scroll-mt-20 border-b border-border bg-background py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <FadeIn>
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
            Verification Vault
          </span>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Trust, engineered into every partner record
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Every NGO on NITICSR passes through a verification layer before it can be
            discovered — so your compliance team isn&apos;t doing due diligence from
            scratch on every partnership.
          </p>
          <Button className="mt-8 gap-2" render={<Link href="/platform" />}>
            Explore the platform
            <ArrowRight className="size-4" />
          </Button>
        </FadeIn>

        <FadeIn delay={0.15} className="space-y-4">
          {points.map((point) => (
            <div key={point.text} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <point.icon className="size-5" aria-hidden="true" />
              </div>
              <p className="text-sm text-foreground/90">{point.text}</p>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
