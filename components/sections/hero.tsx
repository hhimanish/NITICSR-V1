"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const headline = ["Verified Impact.", "Absolute Compliance."];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const word: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <motion.div
          className="absolute -left-24 -top-32 size-[28rem] rounded-full bg-[#0EA5E9]/25 blur-[100px]"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 40, -20, 0], y: [0, 30, -10, 0] }
          }
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-10rem] top-10 size-[32rem] rounded-full bg-[#059669]/20 blur-[110px]"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, -30, 20, 0], y: [0, -20, 30, 0] }
          }
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-12rem] left-1/3 size-[26rem] rounded-full bg-[#F59E0B]/15 blur-[100px]"
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 20, -30, 0], y: [0, -15, 15, 0] }
          }
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--background)_75%)]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
        >
          <ShieldCheck className="size-3.5 text-secondary" aria-hidden="true" />
          Schedule VII compliant by design
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={container}
          className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
        >
          {headline.map((line) => (
            <motion.span key={line} variants={word} className="block">
              {line.split(" ").map((w, i) => (
                <span key={i} className={i === 0 ? "text-foreground" : "text-foreground"}>
                  {w}{" "}
                </span>
              ))}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-lg text-muted-foreground text-balance"
        >
          NITICSR is India&apos;s enterprise operating system for Corporate CSR —
          AI-matched NGO discovery, verified partners, and Schedule VII compliance,
          unified in one platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button size="lg" render={<Link href="/request-demo" />} className="group gap-2">
            Request enterprise demo
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/platform" />}>
            Explore platform
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
