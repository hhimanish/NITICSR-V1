import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";

const testimonials = [
  {
    quote:
      "What used to take our compliance team three weeks of NGO due diligence now takes an afternoon of review.",
    name: "Ananya Rao",
    role: "Head of CSR, illustrative FMCG enterprise",
  },
  {
    quote:
      "The matchmaking rationale actually explains itself — our audit committee stopped asking us to justify every partner.",
    name: "Vikram Sethi",
    role: "Compliance Lead, illustrative NBFC",
  },
  {
    quote:
      "We finally have one place where CSR spend, partner verification, and reporting live together.",
    name: "Priya Nambiar",
    role: "CSR Program Manager, illustrative manufacturing group",
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            What CSR teams could expect
          </h2>
          <p className="mt-3 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Illustrative examples — not actual customer testimonials
          </p>
        </FadeIn>

        <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                <blockquote className="flex-1 text-sm text-foreground/90">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 border-t border-border pt-4">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
