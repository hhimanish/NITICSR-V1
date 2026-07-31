import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "@/components/motion/fade-in";

const faqs = [
  {
    question: "Is the AI matchmaking demo using real NGO data?",
    answer:
      "No. The live demo on this site ranks a small, fictional seed dataset of demo NGOs so you can see the matching experience. Verified live records are part of the full NITICSR platform.",
  },
  {
    question: "How does NITICSR verify NGO partners?",
    answer:
      "Partners pass through a verification layer that checks registration status, statutory filings (12A/80G/FCRA where applicable), and financial disclosures before they can be discovered by a corporate.",
  },
  {
    question: "What Schedule VII cause areas are supported?",
    answer:
      "The platform is organized around the Schedule VII categories under the Companies Act, 2013 — education, healthcare, rural development, environment, and more.",
  },
  {
    question: "Does NITICSR handle fund transfers or escrow?",
    answer:
      "Not in this phase. Phase 1 focuses on discovery, verification, and compliance workflows. Escrow and fund-flow automation are planned for a later phase.",
  },
  {
    question: "Is my organization's data secure?",
    answer:
      "Authentication is handled by Clerk, and all data in transit is encrypted. As NITICSR matures, we'll publish a full security and compliance overview.",
  },
  {
    question: "Can auditors get independent access?",
    answer:
      "Yes — a dedicated auditor solution is part of our roadmap, giving independent verification access without full corporate or NGO account permissions.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export function Faq() {
  return (
    <section className="border-b border-border bg-card py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Accordion className="mt-10">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
