"use client";

import { useOrg } from "@/components/dashboard/org-context";
import { FeatureFlagsPanel } from "@/components/dashboard/feature-flags-panel";
import { DeveloperAccessPanel } from "@/components/dashboard/developer-access-panel";

export default function CorporateSettingsPage() {
  const org = useOrg();

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-2xl font-semibold">Settings</h1>
      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Organization name
          </p>
          <p className="mt-1 text-sm">{org.name}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slug</p>
          <p className="mt-1 font-mono text-sm">{org.slug}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</p>
          <p className="mt-1 text-sm capitalize">{org.type}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Platform features</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opt your organization in or out of platform capabilities individually.
        </p>
        <div className="mt-4">
          <FeatureFlagsPanel />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">Developer access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          API keys and webhooks for programmatic, server-to-server access to your own data.
        </p>
        <div className="mt-4">
          <DeveloperAccessPanel />
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Team member management and notification preferences are on the roadmap — see
        docs/ARCHITECTURE.md.
      </p>
    </div>
  );
}
