import { Sparkles } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";

const exchanges = [
  {
    prompt: "Recommend verified NGOs in Odisha for healthcare under ₹1 crore.",
    reply:
      "3 verified matches found in Odisha under your budget — ranked by cause alignment and district coverage, with rationale for each.",
  },
  {
    prompt: "Summarize audit risks across my active projects.",
    reply:
      "2 projects flagged for delayed milestones, 1 for an expiring FCRA renewal. No fraud indicators this cycle.",
  },
  {
    prompt: "Draft a CSR-2 report section for our education portfolio.",
    reply:
      "Draft generated covering spend, beneficiary counts, and SDG 4 alignment — ready for your compliance team to review.",
  },
];

export function AiCopilotPreview() {
  return (
    <section className="border-b border-border bg-card py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info/15 px-3 py-1 text-xs font-medium text-info">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Illustrative preview — not a live feature yet
          </span>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            An AI copilot for your CSR program
          </h2>
          <p className="mt-4 text-muted-foreground">
            The direction we&apos;re building toward: natural-language answers grounded in your
            platform&apos;s own verification, project, and audit data.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10 space-y-4 rounded-2xl border border-border bg-background p-6 shadow-sm">
          {exchanges.map((exchange) => (
            <div key={exchange.prompt} className="space-y-2">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {exchange.prompt}
              </div>
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground/90">
                {exchange.reply}
              </div>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
