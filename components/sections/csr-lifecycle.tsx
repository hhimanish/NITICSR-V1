import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  Landmark,
  Lightbulb,
  Rocket,
  ScanSearch,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { Timeline } from "@/components/design-system/timeline";

const steps = [
  { label: "Plan", description: "Set cause, geography, budget", icon: Lightbulb },
  { label: "Verify", description: "Statutory checks up front", icon: ShieldCheck },
  { label: "Match", description: "AI-ranked NGO shortlist", icon: ScanSearch },
  { label: "Fund", description: "Route CSR budget", icon: Landmark },
  { label: "Execute", description: "Partner delivers on ground", icon: Rocket },
  { label: "Audit", description: "Independent review", icon: ClipboardCheck },
  { label: "Measure", description: "Track outcomes", icon: BarChart3 },
  { label: "Report", description: "Schedule VII disclosure", icon: FileCheck2 },
  { label: "Improve", description: "Feed learnings back", icon: TrendingUp },
];

export function CsrLifecycle() {
  return (
    <section className="border-b border-border bg-card py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            The CSR lifecycle, in one platform
          </h2>
          <p className="mt-4 text-muted-foreground">
            From first budget decision to Schedule VII disclosure — every step traceable.
          </p>
        </FadeIn>

        <div className="mt-14">
          <Timeline steps={steps} />
        </div>
      </div>
    </section>
  );
}
