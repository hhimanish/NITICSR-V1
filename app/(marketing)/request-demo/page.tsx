import type { Metadata } from "next";

import { ContactForm } from "@/components/sections/contact-form";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata: Metadata = {
  title: "Request Enterprise Demo",
  description: "See NITICSR's AI matchmaking, verification, and compliance workflow for your organization.",
};

export default function RequestDemoPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Request an enterprise demo
          </h1>
          <p className="mt-4 text-muted-foreground">
            Tell us about your CSR program and team size, and we&apos;ll walk you through
            matchmaking, verification, and compliance reporting for your organization.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10">
          <ContactForm />
        </FadeIn>
      </div>
    </section>
  );
}
