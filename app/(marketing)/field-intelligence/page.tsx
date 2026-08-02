import type { Metadata } from "next";
import { ClipboardList, MapPin, QrCode, ShieldQuestion, Wrench } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

const TITLE = "Field Intelligence";
const DESCRIPTION =
  "GPS-verified field visits, an asset register, and structured surveys — real browser-native capabilities over your project data, not a promise of a native offline app.";
const URL = "/field-intelligence";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
    url: URL,
    siteName: "NITICSR",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} — NITICSR`,
    description: DESCRIPTION,
  },
};

export default function FieldIntelligencePage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Solutions", href: URL }, { label: "Field Intelligence", href: URL }],
        eyebrow: "Field Intelligence",
        title: "Verify the field visit actually happened at the site",
        description:
          "A GPS check-in checked against the project's own registered location, an asset register for what was actually built, and structured surveys for beneficiary data — real capabilities your browser already has, not a native app roadmap promise.",
        audience: [
          "Field officers confirming a site visit really happened",
          "CSR managers who need proof of on-ground activity, not just a status field",
          "M&E teams collecting structured beneficiary or asset data",
          "Anyone who's had to trust an unverified field report",
        ],
        capabilities: [
          {
            icon: MapPin,
            title: "GPS-verified check-ins",
            description: "A field visit is checked against the project's registered location — inside or outside the site, not just claimed.",
          },
          {
            icon: Wrench,
            title: "Asset register",
            description: "What was actually built — a borewell, a classroom — tracked with a status and a GPS position.",
          },
          {
            icon: ClipboardList,
            title: "Structured surveys",
            description: "Build a questionnaire once, collect consistent beneficiary or project data every time.",
          },
          {
            icon: QrCode,
            title: "QR codes for field reference",
            description: "Generate a QR code linking straight back to a project record — printable, generated locally.",
          },
          {
            icon: ShieldQuestion,
            title: "Honest about what it isn't",
            description: "No camera/photo capture, biometrics, or offline mode until the real infrastructure behind them exists — see our architecture notes.",
          },
        ],
      }}
    />
  );
}
