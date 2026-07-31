import { Award, BadgeCheck, Eye, HandCoins, Megaphone, UserPlus } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { Timeline } from "@/components/design-system/timeline";

const steps = [
  { label: "Register", description: "Create one org profile", icon: UserPlus },
  { label: "Verify", description: "Submit statutory documents", icon: BadgeCheck },
  { label: "Get discovered", description: "Surface to matching budgets", icon: Eye },
  { label: "Match", description: "Connect with a corporate", icon: Megaphone },
  { label: "Deliver & fund", description: "Execute, report, get paid", icon: HandCoins },
  { label: "Build track record", description: "Verified history compounds", icon: Award },
];

export function NgoAcceleration() {
  return (
    <section className="border-b border-border bg-card py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            From registration to funded, audited impact
          </h2>
          <p className="mt-4 text-muted-foreground">
            One verified profile — discoverable by every matching corporate budget.
          </p>
        </FadeIn>

        <div className="mt-14">
          <Timeline steps={steps} />
        </div>
      </div>
    </section>
  );
}
