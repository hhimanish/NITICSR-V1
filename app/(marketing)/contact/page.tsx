import type { Metadata } from "next";

import { ContactForm } from "@/components/sections/contact-form";
import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the NITICSR team about your CSR program.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — NITICSR",
    description: "Talk to the NITICSR team about your CSR program.",
    url: "/contact",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — NITICSR",
    description: "Talk to the NITICSR team about your CSR program.",
  },
};

export default function ContactPage() {
  return (
    <section className="py-20 sm:py-28">
      <Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Talk to us
          </h1>
          <p className="mt-4 text-muted-foreground">
            Tell us about your CSR program and we&apos;ll get back to you shortly.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10">
          <ContactForm />
        </FadeIn>
      </div>
    </section>
  );
}
