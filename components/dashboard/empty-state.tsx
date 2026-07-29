import type { LucideIcon } from "lucide-react";

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
        Coming in Phase 2
      </span>
    </div>
  );
}
