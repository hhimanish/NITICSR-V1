"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, HandCoins, Landmark, Leaf, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { useOrg } from "@/components/dashboard/org-context";

type SdgEntry = {
  sdgId: number;
  name: string;
  colorHex: string;
  projectCount: number;
  totalBudget: number;
  totalBeneficiaries: number;
};
type SocialImpactEntry = { category: string; totalCount: number; projectCount: number };
type BrsrEntry = { principleNumber: number; principleTitle: string; projectCount: number; totalBudget: number };

export default function SustainabilityPage() {
  const org = useOrg();
  const [sdgRollup, setSdgRollup] = useState<SdgEntry[] | null>(null);
  const [socialImpact, setSocialImpact] = useState<SocialImpactEntry[]>([]);
  const [brsrCoverage, setBrsrCoverage] = useState<BrsrEntry[]>([]);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [fundUtilization, setFundUtilization] = useState<number | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/v1/organizations/${org.id}/sdg-rollup`)
      .then((r) => r.json())
      .then((body) => setSdgRollup(body.data ?? []));
    fetch(`/api/v1/organizations/${org.id}/social-impact-summary`)
      .then((r) => r.json())
      .then((body) => {
        setSocialImpact(body.data?.socialImpact ?? []);
        setBrsrCoverage(body.data?.brsrCoverage ?? []);
      });
    fetch(`/api/v1/organizations/${org.id}/compliance-summary`)
      .then((r) => r.json())
      .then((body) => setComplianceScore(body.data?.averageScore ?? null))
      .catch(() => setComplianceScore(null));
    fetch(`/api/v1/organizations/${org.id}/fund-utilization`)
      .then((r) => r.json())
      .then((body) => {
        const u = body.data;
        setFundUtilization(
          u?.annualBudget ? Math.min(100, Math.round((u.disbursedInFiscalYear / u.annualBudget) * 100)) : null
        );
      })
      .catch(() => setFundUtilization(null));
    fetch(`/api/v1/organizations/${org.id}/alerts`)
      .then((r) => r.json())
      .then((body) => setActiveAlerts((body.data ?? []).length))
      .catch(() => setActiveAlerts(null));
  }, [org.id]);

  const sdgsCovered = (sdgRollup ?? []).filter((s) => s.projectCount > 0).length;
  const totalBeneficiaries = socialImpact.reduce((sum, s) => sum + s.totalCount, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Sustainability &amp; Impact</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real figures only — no fabricated ESG score or maturity index. Each number below traces
            to actual project, compliance, and risk data.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/corporate/impact-report" />}>
          Printable impact summary
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile icon={ShieldCheck} label="Compliance score" value={complianceScore === null ? "—" : `${complianceScore}%`} />
        <KpiTile icon={Landmark} label="Fund utilization (FY)" value={fundUtilization === null ? "—" : `${fundUtilization}%`} />
        <KpiTile icon={AlertTriangle} label="Active control alerts" value={activeAlerts === null ? "—" : String(activeAlerts)} />
        <KpiTile icon={Leaf} label="SDGs covered" value={`${sdgsCovered} / 17`} />
        <KpiTile icon={Users} label="Total beneficiaries" value={totalBeneficiaries.toLocaleString("en-IN")} />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">SDG coverage</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          From each project&apos;s own SDG tagging — goals with no tagged projects show as not yet covered.
        </p>
        {sdgRollup === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sdgRollup.map((s) => (
              <div
                key={s.sdgId}
                className="rounded-xl border border-border p-3 text-sm"
                style={{ opacity: s.projectCount > 0 ? 1 : 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: s.colorHex }}
                  >
                    {s.sdgId}
                  </span>
                  <span className="font-medium">{s.name}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.projectCount} project(s) · ₹{s.totalBudget.toLocaleString("en-IN")} · {s.totalBeneficiaries.toLocaleString("en-IN")}{" "}
                  beneficiaries
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Social impact by category</h2>
          {socialImpact.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No beneficiary data recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {socialImpact.map((s) => (
                <li key={s.category} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-medium">{s.category}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.totalCount.toLocaleString("en-IN")} across {s.projectCount} project(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">BRSR principle coverage</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            An indicative CSR-to-BRSR cross-reference for disclosure prep — not an official SEBI
            crosswalk, and not a substitute for a full BRSR filing.
          </p>
          <ul className="mt-3 space-y-1.5">
            {brsrCoverage.map((b) => (
              <li key={b.principleNumber} className="flex items-center justify-between text-sm">
                <span>
                  P{b.principleNumber}: {b.principleTitle}
                </span>
                <span className="text-xs text-muted-foreground">{b.projectCount} project(s)</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
        <HandCoins className="size-4 shrink-0" aria-hidden="true" />
        Carbon, water, waste, and stakeholder-sentiment metrics aren&apos;t shown here because no
        such data has ever been captured on this platform — see the roadmap docs for why those stay
        deferred rather than estimated.
      </div>
    </div>
  );
}
