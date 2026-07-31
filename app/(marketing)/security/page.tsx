import type { Metadata } from "next";
import { Database, KeyRound, Lock, ShieldCheck, UserCog, Webhook } from "lucide-react";

import { SolutionPage } from "@/components/sections/solution-template";

export const metadata: Metadata = {
  title: "Security & Trust",
  description: "How NITICSR handles authentication, authorization, and data.",
};

export default function SecurityPage() {
  return (
    <SolutionPage
      data={{
        breadcrumbs: [{ label: "Security & Trust", href: "/security" }],
        eyebrow: "Security & Trust",
        title: "Built with permission boundaries from the ground up",
        description:
          "Authentication, authorization, and data isolation aren't bolted on — they're the foundation every workflow is built against.",
        audience: [
          "IT and security teams evaluating the platform",
          "Compliance teams assessing data handling",
          "Auditors reviewing access controls",
          "Procurement teams doing vendor due diligence",
        ],
        capabilities: [
          { icon: KeyRound, title: "Managed authentication", description: "Session and identity management via Clerk, not custom-built auth code." },
          { icon: UserCog, title: "Permission-based access", description: "Every action checks a specific capability (e.g. \"CSR.Project.Write\"), scoped to your organization — never a shared account." },
          { icon: Database, title: "Tenant isolation by construction", description: "Cross-organization data access is blocked at the query level, not just in the UI." },
          { icon: Lock, title: "Encrypted in transit", description: "All traffic is served over HTTPS; database connections use TLS in production." },
          { icon: Webhook, title: "Verified webhooks", description: "Identity events from Clerk are signature-verified (svix) before they touch our database." },
          { icon: ShieldCheck, title: "Honest about maturity", description: "We're a Phase 2/3 platform — a full security & compliance certification page is on the roadmap, not claimed today." },
        ],
      }}
    />
  );
}
