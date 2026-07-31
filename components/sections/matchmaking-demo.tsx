"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn } from "@/components/motion/fade-in";
import { trackEvent } from "@/lib/analytics";
import { budgetBands, causeAreas, indianStates, type MatchResult } from "@/lib/schemas";

type Status = "idle" | "loading" | "error";

export function MatchmakingDemo() {
  const [causeArea, setCauseArea] = useState<string>(causeAreas[0]);
  const [state, setState] = useState<string>(indianStates[0]);
  const [budgetBand, setBudgetBand] = useState<string>(budgetBands[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMatches([]);
    setErrorMessage(null);
    trackEvent("matchmaking_demo_submitted", { causeArea, state, budgetBand });

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ causeArea, state, budgetBand }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "AI matchmaking is temporarily unavailable.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let separatorIndex;
        while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);

          const eventName = /^event: (.+)$/m.exec(rawEvent)?.[1];
          const rawData = /^data: (.+)$/m.exec(rawEvent)?.[1];
          if (!eventName || !rawData) continue;

          const data = JSON.parse(rawData);
          if (eventName === "match") {
            setMatches((prev) => [...prev, data as MatchResult]);
          } else if (eventName === "error") {
            setErrorMessage(data.message);
          }
        }
      }

      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  const isLoading = status === "loading";

  return (
    <section id="matchmaking" className="scroll-mt-20 border-b border-border bg-card py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Illustrative demo — placeholder NGO data, not live verified records
          </span>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            See AI matchmaking in action
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pick a cause area, state, and budget band. NITICSR&apos;s AI ranks the best-fit
            NGOs from a demo dataset in real time.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="mt-10 grid gap-4 rounded-2xl border border-border bg-background p-6 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cause area</label>
              <Select value={causeArea} onValueChange={(v) => v && setCauseArea(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a cause" />
                </SelectTrigger>
                <SelectContent>
                  {causeAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">State</label>
              <Select value={state} onValueChange={(v) => v && setState(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Budget band</label>
              <Select value={budgetBand} onValueChange={(v) => v && setBudgetBand(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgetBands.map((band) => (
                    <SelectItem key={band} value={band}>
                      {band}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isLoading ? "Matching…" : "Find matches"}
            </Button>
          </form>
        </FadeIn>

        {errorMessage && (
          <p role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {isLoading && matches.length === 0 && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-background p-6">
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="mt-3 h-3 w-full rounded bg-muted" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-6 w-20 rounded-full bg-muted" />
                    <div className="h-6 w-20 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </>
          )}

          <AnimatePresence mode="popLayout">
            {matches.map((match) => (
              <motion.div
                key={match.ngoId}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-border bg-background p-6 shadow-sm"
              >
                <h3 className="font-heading text-lg font-semibold">{match.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{match.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary">
                    Cause fit {match.causeAlignment}%
                  </span>
                  <span className="rounded-full bg-info/15 px-2.5 py-1 text-xs font-medium text-info">
                    Geography fit {match.geographyFit}%
                  </span>
                </div>
                <p className="mt-4 text-sm italic text-foreground/80">&ldquo;{match.rationale}&rdquo;</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
