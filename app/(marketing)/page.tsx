import { Hero } from "@/components/sections/hero";
import { TrustBar } from "@/components/sections/trust-bar";
import { IndiaActivity } from "@/components/sections/india-activity";
import { HowItWorks } from "@/components/sections/how-it-works";
import { MatchmakingDemo } from "@/components/sections/matchmaking-demo";
import { VerificationVaultTeaser } from "@/components/sections/verification-vault-teaser";
import { SdgGrid } from "@/components/sections/sdg-grid";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <IndiaActivity />
      <HowItWorks />
      <MatchmakingDemo />
      <VerificationVaultTeaser />
      <SdgGrid />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
