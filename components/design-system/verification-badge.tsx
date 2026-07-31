import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type VerificationStatus = "verified" | "pending" | "expired";

const STATUS_STYLES: Record<VerificationStatus, string> = {
  verified: "border-secondary/30 bg-secondary/10 text-secondary",
  pending: "border-accent/30 bg-accent/10 text-accent-foreground",
  expired: "border-destructive/30 bg-destructive/10 text-destructive",
};

const STATUS_ICONS: Record<VerificationStatus, typeof CheckCircle2> = {
  verified: CheckCircle2,
  pending: Clock,
  expired: XCircle,
};

export function VerificationBadge({
  label,
  status,
  className,
}: {
  label: string;
  status: VerificationStatus;
  className?: string;
}) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
