import { AlertTriangle, IndianRupee, Target, TrendingUp } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { KpiCard } from "@/components/design-system/kpi-card";
import { TrustScoreWidget } from "@/components/design-system/trust-score-widget";

export function ExecutiveAnalyticsPreview() {
  return (
    <section className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Illustrative preview — demo data
          </span>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Executive-ready analytics
          </h2>
          <p className="mt-4 text-muted-foreground">
            A standing view of spend, alignment, and risk — not a slide deck assembled once a quarter.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="CSR spend this year" value={18.4} decimals={1} prefix="₹" suffix=" Cr" icon={IndianRupee} trend={{ direction: "up", label: "+12% vs last year" }} />
          <KpiCard label="SDG alignment" value={92} suffix="%" icon={Target} trend={{ direction: "up", label: "+4pp" }} />
          <KpiCard label="Compliance health" value={97} suffix="%" icon={TrendingUp} trend={{ direction: "up", label: "On track" }} />
          <KpiCard label="Open risk flags" value={3} icon={AlertTriangle} trend={{ direction: "down", label: "-2 this month" }} />
        </div>

        <FadeIn delay={0.15} className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-foreground">Portfolio trust score</p>
          <div className="mt-4">
            <TrustScoreWidget
              score={87}
              breakdown={[
                { label: "Verification", value: 94 },
                { label: "Financial health", value: 85 },
                { label: "Governance", value: 88 },
                { label: "Audit quality", value: 82 },
                { label: "Project success", value: 86 },
              ]}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
