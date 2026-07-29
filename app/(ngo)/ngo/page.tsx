import { currentUser } from "@clerk/nextjs/server";
import { Handshake, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { KpiTile } from "@/components/dashboard/kpi-tile";

export default async function NgoDashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Welcome back, {firstName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here&apos;s an illustrative snapshot of your organization&apos;s profile. Live data
        connects in Phase 2.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={Sparkles} label="Active matches" value="5" hint="From 3 corporates" />
        <KpiTile icon={Handshake} label="Engagements" value="2" hint="1 in discussion" />
        <KpiTile icon={ShieldCheck} label="Verification status" value="Pending" hint="Illustrative placeholder" />
        <KpiTile icon={MapPin} label="States covered" value="3" hint="Per your profile" />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Match history, corporate interest, and verification progress will appear here as the
        platform builds out beyond Phase 1.
      </div>
    </div>
  );
}
