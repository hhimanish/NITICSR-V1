import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { AnimatedCounter } from "@/components/motion/animated-counter";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

export type KpiCardProps = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: LucideIcon;
  trend?: { direction: "up" | "down"; label: string };
  className?: string;
};

export function KpiCard({ label, value, prefix, suffix, decimals, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <FadeIn className={cn("rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
      </div>
      <p className="mt-3 font-numeric text-2xl font-semibold text-foreground sm:text-3xl">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      {trend && (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" ? "text-secondary" : "text-destructive"
          )}
        >
          {trend.direction === "up" ? (
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden="true" />
          )}
          {trend.label}
        </p>
      )}
    </FadeIn>
  );
}
