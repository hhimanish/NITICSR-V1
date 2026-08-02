import type { Metadata } from "next";
import { Award, HandCoins, Megaphone, ShieldCheck, TrendingUp, Users2 } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

export const metadata: Metadata = {
  title: "NGOs",
  description: "Get discovered by verified corporate CSR budgets aligned to your cause.",
  alternates: { canonical: "/solutions/ngos" },
  openGraph: {
    title: "NGOs — NITICSR",
    description: "Get discovered by verified corporate CSR budgets aligned to your cause.",
    url: "/solutions/ngos",
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NGOs — NITICSR",
    description: "Get discovered by verified corporate CSR budgets aligned to your cause.",
  },
};

export default function NgoSolutionPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: "/solutions/ngos" }, { label: "NGOs", href: "/solutions/ngos" }],
        eyebrow: "Solutions / NGOs",
        title: "Get discovered by corporates who are already looking for you",
        description:
          "Verification opens the door to CSR budgets you'd otherwise never see. Build one strong profile and let matching do the outreach.",
        audience: [
          "Registered NGOs with 12A/80G or FCRA status seeking CSR partners",
          "Grassroots organizations expanding beyond word-of-mouth funding",
          "NGOs that want funding decisions based on verified track record",
          "Organizations preparing for their first corporate CSR partnership",
        ],
        capabilities: [
          { icon: ShieldCheck, title: "Verification, once", description: "Complete verification once and be discoverable across every matching corporate." },
          { icon: Megaphone, title: "Passive discovery", description: "Get surfaced to relevant CSR budgets without running your own outreach campaigns." },
          { icon: HandCoins, title: "Budget-aligned matches", description: "Only see interest from corporates whose budget band actually fits your program size." },
          { icon: TrendingUp, title: "Track record that compounds", description: "Verified engagement history strengthens your profile for future matches." },
          { icon: Award, title: "Credibility signal", description: "Verification status is a trust signal corporates can act on immediately." },
          { icon: Users2, title: "One profile, many partners", description: "Maintain a single organizational profile instead of a different pitch for every corporate." },
        ],
      }}
    />
  );
}
