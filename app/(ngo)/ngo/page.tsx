"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { KpiTile } from "@/components/dashboard/kpi-tile";
import { useOrg } from "@/components/dashboard/org-context";

type NgoProfile = { legal_name: string; operating_states: string[] } | null;
type VerificationRequest = { id: string; status: string };
type Project = { id: string; title: string; status: string };

export default function NgoDashboardPage() {
  const org = useOrg();
  const [profile, setProfile] = useState<NgoProfile>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch(`/api/v1/organizations/${org.id}/ngo-profile`)
      .then(async (r) => (r.ok ? setProfile(await r.json().then((b) => b.data)) : setProfileMissing(true)));

    fetch(`/api/v1/verification-requests?organizationId=${org.id}`)
      .then((r) => r.json())
      .then((body) => setVerifications(body.data ?? []));

    fetch(`/api/v1/csr-projects?organizationId=${org.id}&limit=50`)
      .then((r) => r.json())
      .then((body) => setProjects(body.data ?? []));
  }, [org.id]);

  const latestVerification = verifications[0]?.status ?? "Not submitted";

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">{org.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">NGO workspace</p>

      {profileMissing && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
          Your organization profile isn&apos;t set up yet.{" "}
          <Link href="/ngo/settings" className="font-medium text-secondary hover:underline">
            Complete it
          </Link>{" "}
          before submitting for verification.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile icon={Handshake} label="Corporate-funded projects" value={String(projects.length)} />
        <KpiTile
          icon={Sparkles}
          label="Active projects"
          value={String(projects.filter((p) => p.status === "active").length)}
        />
        <KpiTile icon={ShieldCheck} label="Verification status" value={latestVerification} />
        <KpiTile
          icon={MapPin}
          label="States covered"
          value={String(profile?.operating_states?.length ?? 0)}
        />
      </div>
    </div>
  );
}
