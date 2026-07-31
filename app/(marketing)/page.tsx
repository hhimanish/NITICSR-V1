import { Hero } from "@/components/sections/hero";
import { TrustBar } from "@/components/sections/trust-bar";
import { WhyNiticsr } from "@/components/sections/why-niticsr";
import { IndiaActivity } from "@/components/sections/india-activity";
import { CsrLifecycle } from "@/components/sections/csr-lifecycle";
import { MatchmakingDemo } from "@/components/sections/matchmaking-demo";
import { VerificationVaultTeaser } from "@/components/sections/verification-vault-teaser";
import { CorporateRoi } from "@/components/sections/corporate-roi";
import { NgoAcceleration } from "@/components/sections/ngo-acceleration";
import { ExecutiveAnalyticsPreview } from "@/components/sections/executive-analytics-preview";
import { AiCopilotPreview } from "@/components/sections/ai-copilot-preview";
import { SdgGrid } from "@/components/sections/sdg-grid";
import { CaseStudiesTeaser } from "@/components/sections/case-studies-teaser";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <WhyNiticsr />
      <IndiaActivity />
      <CsrLifecycle />
      <MatchmakingDemo />
      <VerificationVaultTeaser />
      <CorporateRoi />
      <NgoAcceleration />
      <ExecutiveAnalyticsPreview />
      <AiCopilotPreview />
      <SdgGrid />
      <CaseStudiesTeaser />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
