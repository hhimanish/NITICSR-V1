"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/dashboard/org-context";

type SdgEntry = { sdgId: number; name: string; projectCount: number; totalBudget: number; totalBeneficiaries: number };
type SocialImpactEntry = { category: string; totalCount: number; projectCount: number };
type BrsrEntry = { principleNumber: number; principleTitle: string; projectCount: number; totalBudget: number };

export default function ImpactReportPage() {
  const org = useOrg();
  const [sdgRollup, setSdgRollup] = useState<SdgEntry[]>([]);
  const [socialImpact, setSocialImpact] = useState<SocialImpactEntry[]>([]);
  const [brsrCoverage, setBrsrCoverage] = useState<BrsrEntry[]>([]);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const fiscalYear = (() => {
    const now = new Date();
    const startYear = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
  })();

  useEffect(() => {
    fetch(`/api/v1/organizations/${org.id}/sdg-rollup`)
      .then((r) => r.json())
      .then((body) => setSdgRollup((body.data ?? []).filter((s: SdgEntry) => s.projectCount > 0)));
    fetch(`/api/v1/organizations/${org.id}/social-impact-summary`)
      .then((r) => r.json())
      .then((body) => {
        setSocialImpact(body.data?.socialImpact ?? []);
        setBrsrCoverage((body.data?.brsrCoverage ?? []).filter((b: BrsrEntry) => b.projectCount > 0));
      });
    fetch(`/api/v1/organizations/${org.id}/compliance-summary`)
      .then((r) => r.json())
      .then((body) => setComplianceScore(body.data?.averageScore ?? null))
      .catch(() => setComplianceScore(null));
  }, [org.id]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="font-heading text-2xl font-semibold">Impact summary</h1>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="size-3.5" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-8 print:border-none print:p-0 print:shadow-none">
        <h2 className="font-heading text-xl font-semibold">{org.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">CSR &amp; SDG Impact Summary — FY {fiscalYear}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          This is an impact summary compiled from platform records — not a GRI, BRSR, TCFD, or other
          framework-certified filing. It covers only what NITICSR actually tracks: SDG alignment,
          beneficiary reach, Schedule VII compliance status, and an indicative BRSR principle
          cross-reference.
        </p>

        {complianceScore !== null && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Compliance</h3>
            <p className="mt-1 text-sm">Average compliance score across active projects: {complianceScore}%</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">SDG alignment</h3>
          {sdgRollup.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No projects tagged to an SDG yet.</p>
          ) : (
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-1 font-medium">Goal</th>
                  <th className="py-1 font-medium">Projects</th>
                  <th className="py-1 font-medium">Budget</th>
                  <th className="py-1 font-medium">Beneficiaries</th>
                </tr>
              </thead>
              <tbody>
                {sdgRollup.map((s) => (
                  <tr key={s.sdgId} className="border-b border-border/60">
                    <td className="py-1.5">
                      SDG {s.sdgId}: {s.name}
                    </td>
                    <td className="py-1.5">{s.projectCount}</td>
                    <td className="py-1.5">₹{s.totalBudget.toLocaleString("en-IN")}</td>
                    <td className="py-1.5">{s.totalBeneficiaries.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Social impact</h3>
          {socialImpact.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No beneficiary data recorded yet.</p>
          ) : (
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-1 font-medium">Category</th>
                  <th className="py-1 font-medium">Beneficiaries</th>
                  <th className="py-1 font-medium">Projects</th>
                </tr>
              </thead>
              <tbody>
                {socialImpact.map((s) => (
                  <tr key={s.category} className="border-b border-border/60">
                    <td className="py-1.5">{s.category}</td>
                    <td className="py-1.5">{s.totalCount.toLocaleString("en-IN")}</td>
                    <td className="py-1.5">{s.projectCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            BRSR principle cross-reference (indicative)
          </h3>
          {brsrCoverage.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No active projects yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {brsrCoverage.map((b) => (
                <li key={b.principleNumber}>
                  P{b.principleNumber} ({b.principleTitle}): {b.projectCount} project(s), ₹
                  {b.totalBudget.toLocaleString("en-IN")}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
