"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Cpu, ShieldCheck, Stamp } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

const pillars = [
  {
    icon: ShieldCheck,
    title: "Trust by Design",
    summary: "Every partner is verified before it's ever recommended.",
    detail:
      "Registration, financial, and statutory checks front-load due diligence into onboarding — so recommendations are backed by evidence, not just a pitch deck.",
  },
  {
    icon: Stamp,
    title: "Compliance by Default",
    summary: "Documentation is a byproduct of the workflow, not an afterthought.",
    detail:
      "Records are structured around what Schedule VII and CSR-2 disclosures actually require, so your compliance team isn't reconstructing history at year-end.",
  },
  {
    icon: Cpu,
    title: "AI-Powered Decision Intelligence",
    summary: "Matching and risk signals grounded in your platform's own data.",
    detail:
      "AI ranks partners by cause and geography fit today, with structured data (verification status, project history) feeding richer decision support as the platform matures.",
  },
];

export function WhyNiticsr() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Why NITICSR</h2>
        </FadeIn>

        <div className="mt-12 space-y-3">
          {pillars.map((pillar, index) => {
            const isOpen = openIndex === index;
            return (
              <FadeIn key={pillar.title} delay={index * 0.05}>
                <div className="rounded-2xl border border-border bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 p-5 text-left"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <pillar.icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading text-lg font-semibold">{pillar.title}</h3>
                      <p className="text-sm text-muted-foreground">{pillar.summary}</p>
                    </div>
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 pl-[4.75rem] text-sm text-foreground/80">{pillar.detail}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
