import { AnimatedCounter } from "@/components/motion/animated-counter";
import { FadeIn } from "@/components/motion/fade-in";

const stats = [
  { value: 1240, suffix: "+", label: "NGOs verified" },
  { value: 86, suffix: "+", label: "Corporate partners" },
  { value: 22, suffix: "", label: "States covered" },
  { value: 340, suffix: "+", label: "Projects managed" },
  { value: 2.4, decimals: 1, suffix: "M+", label: "Beneficiaries reached" },
  { value: 486, prefix: "₹", suffix: " Cr", label: "Funds facilitated" },
  { value: 512, suffix: "+", label: "Audits completed" },
  { value: 87, suffix: "", label: "Average trust score" },
];

export function TrustBar() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Illustrative platform metrics — demo data, not live figures
          </p>
        </FadeIn>
        <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <FadeIn key={stat.label} className="flex flex-col items-center text-center">
              <span className="font-numeric text-2xl font-semibold text-foreground sm:text-3xl">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </span>
              <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
