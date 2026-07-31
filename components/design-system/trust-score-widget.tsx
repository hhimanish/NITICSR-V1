"use client";

import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  if (score >= 80) return "var(--secondary)";
  if (score >= 50) return "var(--accent)";
  return "var(--destructive)";
}

export type TrustScoreWidgetProps = {
  score: number;
  size?: number;
  breakdown?: { label: string; value: number }[];
  className?: string;
};

export function TrustScoreWidget({ score, size = 120, breakdown, className }: TrustScoreWidgetProps) {
  const strokeWidth = size * 0.09;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - clamped / 100);
  const color = scoreColor(clamped);

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row sm:items-start", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-numeric text-2xl font-semibold text-foreground">{Math.round(clamped)}</span>
          <span className="text-[0.65rem] text-muted-foreground">Trust Score</span>
        </div>
      </div>

      {breakdown && breakdown.length > 0 && (
        <dl className="w-full space-y-2">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                  />
                </div>
                <span className="w-7 font-numeric text-xs font-medium">{item.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
