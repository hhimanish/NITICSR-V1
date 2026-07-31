import type { LucideIcon } from "lucide-react";

import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";

export type TimelineStep = {
  label: string;
  description?: string;
  icon?: LucideIcon;
};

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <StaggerGroup
      className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0 lg:overflow-x-auto lg:pb-2"
      role="list"
      aria-label="Process timeline"
    >
      {steps.map((step, index) => (
        <StaggerItem
          key={step.label}
          role="listitem"
          className="flex flex-1 items-center gap-3 lg:min-w-[9.5rem] lg:flex-col lg:items-start lg:gap-2"
        >
          <div className="flex items-center gap-3 lg:w-full">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card font-numeric text-sm font-semibold text-foreground">
              {step.icon ? <step.icon className="size-4" aria-hidden="true" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className="h-px flex-1 bg-border lg:mt-0 lg:ml-2 lg:h-px lg:w-full lg:flex-1" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{step.label}</p>
            {step.description && (
              <p className="mt-0.5 max-w-[10rem] text-xs text-muted-foreground">{step.description}</p>
            )}
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
