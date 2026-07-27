"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";

const goals = [
  { n: 1, title: "No Poverty", color: "#E5243B", description: "End poverty in all its forms everywhere." },
  { n: 2, title: "Zero Hunger", color: "#DDA63A", description: "End hunger, achieve food security and improved nutrition." },
  { n: 3, title: "Good Health and Well-being", color: "#4C9F38", description: "Ensure healthy lives and promote well-being for all ages." },
  { n: 4, title: "Quality Education", color: "#C5192D", description: "Ensure inclusive and equitable quality education for all." },
  { n: 5, title: "Gender Equality", color: "#FF3A21", description: "Achieve gender equality and empower all women and girls." },
  { n: 6, title: "Clean Water and Sanitation", color: "#26BDE2", description: "Ensure availability of water and sanitation for all." },
  { n: 7, title: "Affordable and Clean Energy", color: "#FCC30B", description: "Ensure access to affordable, reliable, sustainable energy." },
  { n: 8, title: "Decent Work and Economic Growth", color: "#A21942", description: "Promote sustained, inclusive economic growth and decent work." },
  { n: 9, title: "Industry, Innovation and Infrastructure", color: "#FD6925", description: "Build resilient infrastructure and foster innovation." },
  { n: 10, title: "Reduced Inequalities", color: "#DD1367", description: "Reduce inequality within and among countries." },
  { n: 11, title: "Sustainable Cities and Communities", color: "#FD9D24", description: "Make cities inclusive, safe, resilient and sustainable." },
  { n: 12, title: "Responsible Consumption and Production", color: "#BF8B2E", description: "Ensure sustainable consumption and production patterns." },
  { n: 13, title: "Climate Action", color: "#3F7E44", description: "Take urgent action to combat climate change and its impacts." },
  { n: 14, title: "Life Below Water", color: "#0A97D9", description: "Conserve and sustainably use oceans, seas and marine resources." },
  { n: 15, title: "Life on Land", color: "#56C02B", description: "Protect, restore and promote sustainable use of ecosystems." },
  { n: 16, title: "Peace, Justice and Strong Institutions", color: "#00689D", description: "Promote peaceful, inclusive societies and strong institutions." },
  { n: 17, title: "Partnerships for the Goals", color: "#19486A", description: "Strengthen the means of implementation and global partnership." },
];

export function SdgGrid() {
  const [active, setActive] = useState(goals[12]);

  return (
    <section className="border-b border-border bg-card py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Aligned to the UN Sustainable Development Goals
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every matched NGO and every rupee routed maps back to one or more of the 17 SDGs.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-12 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-9">
            {goals.map((goal) => (
              <button
                key={goal.n}
                type="button"
                onMouseEnter={() => setActive(goal)}
                onFocus={() => setActive(goal)}
                onClick={() => setActive(goal)}
                style={{ backgroundColor: goal.color }}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg p-1 text-center text-white transition-transform",
                  active.n === goal.n ? "scale-105 ring-2 ring-foreground ring-offset-2 ring-offset-card" : "hover:scale-105"
                )}
                aria-pressed={active.n === goal.n}
              >
                <span className="font-numeric text-lg font-bold leading-none sm:text-xl">{goal.n}</span>
              </button>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-background p-6 text-center shadow-sm">
            <div className="flex items-center justify-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-md font-numeric text-sm font-bold text-white"
                style={{ backgroundColor: active.color }}
              >
                {active.n}
              </span>
              <h3 className="font-heading text-lg font-semibold">{active.title}</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{active.description}</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
