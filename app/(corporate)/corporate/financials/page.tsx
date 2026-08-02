"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, HandCoins, Landmark, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { useOrg } from "@/components/dashboard/org-context";

type FundUtilization = {
  fiscalYear: string;
  annualBudget: number | null;
  disbursedInFiscalYear: number;
  totalAllocatedAcrossProjects: number;
  totalDisbursedAllTime: number;
  pendingUnspentTransfers: { count: number; totalAmount: number };
};

type UnspentTransfer = {
  id: string;
  unspent_amount: string;
  destination: "unspent_csr_account" | "schedule_vii_fund";
  due_date: string;
  status: "pending" | "transferred";
  project_title: string;
};

function currentFiscalYear(): string {
  const now = new Date();
  const startYear = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

const DESTINATION_LABEL: Record<UnspentTransfer["destination"], string> = {
  unspent_csr_account: "Unspent CSR Account",
  schedule_vii_fund: "Schedule VII Fund",
};

export default function FinancialsPage() {
  const org = useOrg();
  const fiscalYear = currentFiscalYear();
  const [utilization, setUtilization] = useState<FundUtilization | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [transfers, setTransfers] = useState<UnspentTransfer[] | null>(null);
  const [referenceByTransfer, setReferenceByTransfer] = useState<Record<string, string>>({});
  const [markingId, setMarkingId] = useState<string | null>(null);

  function load() {
    fetch(`/api/v1/organizations/${org.id}/fund-utilization?fiscalYear=${fiscalYear}`)
      .then((r) => r.json())
      .then((body) => {
        setUtilization(body.data ?? null);
        setBudgetInput(body.data?.annualBudget ? String(body.data.annualBudget) : "");
      });
    fetch(`/api/v1/organizations/${org.id}/unspent-fund-transfers`)
      .then((r) => r.json())
      .then((body) => setTransfers(body.data ?? []));
  }

  useEffect(load, [org.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveBudget() {
    const amount = Number(budgetInput);
    if (!amount || amount < 0) return;
    setSavingBudget(true);
    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/annual-budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiscalYear, budgetAmount: amount }),
      });
      if (res.ok) load();
    } finally {
      setSavingBudget(false);
    }
  }

  async function markTransferred(id: string) {
    setMarkingId(id);
    try {
      const res = await fetch(`/api/v1/unspent-fund-transfers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferReference: referenceByTransfer[id] || undefined }),
      });
      if (res.ok) load();
    } finally {
      setMarkingId(null);
    }
  }

  const percentUtilized =
    utilization?.annualBudget && utilization.annualBudget > 0
      ? Math.min(100, Math.round((utilization.disbursedInFiscalYear / utilization.annualBudget) * 100))
      : null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Financials</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Annual CSR budget, fund utilization, and Section 135(5)/(6) unspent-fund transfers for FY {fiscalYear}.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          icon={Landmark}
          label={`Annual budget (FY ${fiscalYear})`}
          value={utilization?.annualBudget ? `₹${utilization.annualBudget.toLocaleString("en-IN")}` : "Not set"}
        />
        <KpiTile
          icon={Wallet}
          label="Disbursed this FY"
          value={`₹${(utilization?.disbursedInFiscalYear ?? 0).toLocaleString("en-IN")}`}
          hint={percentUtilized !== null ? `${percentUtilized}% of annual budget` : undefined}
        />
        <KpiTile
          icon={HandCoins}
          label="Allocated across projects"
          value={`₹${(utilization?.totalAllocatedAcrossProjects ?? 0).toLocaleString("en-IN")}`}
        />
        <KpiTile
          icon={AlertTriangle}
          label="Pending unspent transfers"
          value={String(utilization?.pendingUnspentTransfers.count ?? 0)}
          hint={
            utilization?.pendingUnspentTransfers.totalAmount
              ? `₹${utilization.pendingUnspentTransfers.totalAmount.toLocaleString("en-IN")}`
              : undefined
          }
        />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Annual CSR budget</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The company&apos;s total CSR obligation for FY {fiscalYear} — used to compute fund utilization above.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Annual budget amount"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            className="w-56"
          />
          <Button size="sm" variant="outline" disabled={savingBudget || !budgetInput} onClick={saveBudget}>
            Save
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Unspent fund transfers</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Generated automatically when a project completes with budget left undisbursed — an ongoing
          project&apos;s unspent amount goes to the Unspent CSR Account within 30 days of FY end; any other
          project&apos;s goes to a Schedule VII fund within 6 months.
        </p>
        {transfers === null ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : transfers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No unspent-fund obligations yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {transfers.map((t) => (
              <li key={t.id} className="rounded-xl border border-border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.project_title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      ₹{Number(t.unspent_amount).toLocaleString("en-IN")} to {DESTINATION_LABEL[t.destination]} — due{" "}
                      {new Date(t.due_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={
                      t.status === "transferred"
                        ? "rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary"
                        : "rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    }
                  >
                    {t.status === "transferred" ? "Transferred" : "Pending"}
                  </span>
                </div>
                {t.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Input
                      placeholder="Transfer reference (optional)"
                      value={referenceByTransfer[t.id] ?? ""}
                      onChange={(e) => setReferenceByTransfer((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      className="w-56"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markingId === t.id}
                      onClick={() => markTransferred(t.id)}
                    >
                      Mark transferred
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
