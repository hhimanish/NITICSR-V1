"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/fade-in";

type StateActivity = {
  name: string;
  row: number;
  col: number;
  ngos: number;
  crRouted: number;
  districts: number;
  topCause: string;
};

const states: StateActivity[] = [
  { name: "Jammu & Kashmir", row: 1, col: 4, ngos: 18, crRouted: 6, districts: 8, topCause: "Healthcare" },
  { name: "Punjab", row: 2, col: 3, ngos: 34, crRouted: 12, districts: 14, topCause: "Rural Development" },
  { name: "Uttarakhand", row: 2, col: 5, ngos: 22, crRouted: 8, districts: 10, topCause: "Environment" },
  { name: "Delhi NCR", row: 2, col: 4, ngos: 61, crRouted: 28, districts: 11, topCause: "Education" },
  { name: "Rajasthan", row: 3, col: 2, ngos: 45, crRouted: 19, districts: 24, topCause: "Water & Sanitation" },
  { name: "Uttar Pradesh", row: 3, col: 5, ngos: 88, crRouted: 41, districts: 62, topCause: "Education" },
  { name: "Assam", row: 2, col: 7, ngos: 27, crRouted: 9, districts: 21, topCause: "Healthcare" },
  { name: "Bihar", row: 3, col: 6, ngos: 52, crRouted: 22, districts: 34, topCause: "Education" },
  { name: "West Bengal", row: 4, col: 7, ngos: 58, crRouted: 25, districts: 20, topCause: "Livelihoods" },
  { name: "Gujarat", row: 4, col: 1, ngos: 63, crRouted: 34, districts: 26, topCause: "Skill Development" },
  { name: "Madhya Pradesh", row: 4, col: 3, ngos: 47, crRouted: 21, districts: 42, topCause: "Rural Development" },
  { name: "Jharkhand", row: 4, col: 6, ngos: 31, crRouted: 14, districts: 22, topCause: "Healthcare" },
  { name: "Maharashtra", row: 5, col: 2, ngos: 112, crRouted: 58, districts: 34, topCause: "Skill Development" },
  { name: "Chhattisgarh", row: 5, col: 4, ngos: 26, crRouted: 11, districts: 27, topCause: "Environment" },
  { name: "Odisha", row: 5, col: 6, ngos: 39, crRouted: 17, districts: 30, topCause: "Water & Sanitation" },
  { name: "Karnataka", row: 6, col: 2, ngos: 74, crRouted: 39, districts: 30, topCause: "Education" },
  { name: "Telangana", row: 6, col: 4, ngos: 41, crRouted: 20, districts: 28, topCause: "Healthcare" },
  { name: "Andhra Pradesh", row: 6, col: 5, ngos: 44, crRouted: 21, districts: 26, topCause: "Livelihoods" },
  { name: "Tamil Nadu", row: 7, col: 3, ngos: 81, crRouted: 43, districts: 32, topCause: "Education" },
  { name: "Kerala", row: 7, col: 2, ngos: 36, crRouted: 16, districts: 14, topCause: "Healthcare" },
];

export function IndiaActivity() {
  const [selected, setSelected] = useState<StateActivity>(
    states.find((s) => s.name === "Maharashtra") ?? states[0]
  );

  return (
    <section className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            CSR activity across India
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hover or focus a state to see illustrative platform activity. Grid layout is
            stylized for clarity and is not to scale.
          </p>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem]">
          <FadeIn delay={0.1}>
            <div
              className="grid aspect-[7/7] w-full grid-cols-7 grid-rows-7 gap-2"
              role="group"
              aria-label="Indian states, illustrative CSR activity grid"
            >
              {states.map((state) => (
                <button
                  key={state.name}
                  type="button"
                  onMouseEnter={() => setSelected(state)}
                  onFocus={() => setSelected(state)}
                  onClick={() => setSelected(state)}
                  style={{ gridRowStart: state.row, gridColumnStart: state.col }}
                  className={cn(
                    "flex items-center justify-center rounded-md border px-1 text-center text-[0.6rem] font-medium leading-tight transition-all sm:text-xs",
                    selected.name === state.name
                      ? "border-info bg-info/15 text-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-info/50 hover:text-foreground"
                  )}
                >
                  {state.name}
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Selected state
              </p>
              <h3 className="mt-1 font-heading text-2xl font-semibold">{selected.name}</h3>

              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-sm text-muted-foreground">NGOs verified</dt>
                  <dd className="font-numeric text-lg font-semibold">{selected.ngos}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-sm text-muted-foreground">CSR routed</dt>
                  <dd className="font-numeric text-lg font-semibold">₹{selected.crRouted} Cr</dd>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <dt className="text-sm text-muted-foreground">Districts active</dt>
                  <dd className="font-numeric text-lg font-semibold">{selected.districts}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Top cause area</dt>
                  <dd className="text-sm font-semibold">{selected.topCause}</dd>
                </div>
              </dl>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
