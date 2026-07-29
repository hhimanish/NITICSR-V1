import { currentUser } from "@clerk/nextjs/server";
import { HandCoins, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { KpiTile } from "@/components/dashboard/kpi-tile";

export default async function CorporateDashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here&apos;s an illustrative snapshot of your CSR program. Live data connects in Phase 2.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={Users} label="Active NGO partnerships" value="12" hint="Across 4 states" />
        <KpiTile icon={HandCoins} label="CSR budget allocated" value="₹3.4 Cr" hint="FY 2026-27" />
        <KpiTile icon={ShieldCheck} label="Verified partners" value="9 / 12" hint="75% verified" />
        <KpiTile icon={TrendingUp} label="Compliance score" value="92%" hint="Illustrative placeholder" />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Partnership activity, spend timelines, and compliance alerts will appear here as the
        platform builds out beyond Phase 1.
      </div>
    </div>
  );
}
