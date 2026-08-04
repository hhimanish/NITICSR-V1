"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrg } from "@/components/dashboard/org-context";

type FeatureFlagView = {
  key: string;
  description: string | null;
  globalDefault: boolean;
  organizationOverride: boolean | null;
  effective: boolean;
};

/**
 * Org-scoped feature flag overrides only — global defaults stay
 * API/migration-managed (Platform.FeatureFlag.Manage), since there's no
 * dedicated platform-admin console in this product yet. A corporate/NGO
 * admin can flip their own organization off the platform default; they
 * can't change what every other tenant inherits.
 */
export function FeatureFlagsPanel() {
  const org = useOrg();
  const [flags, setFlags] = useState<FeatureFlagView[] | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`/api/v1/feature-flags?organizationId=${org.id}`)
      .then((r) => r.json())
      .then((body) => setFlags(body.data ?? []));
  }

  useEffect(load, [org.id]);

  async function toggle(flag: FeatureFlagView) {
    setPendingKey(flag.key);
    setError(null);
    try {
      const res = await fetch("/api/v1/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, isEnabled: !flag.effective, organizationId: org.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not update flag");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update flag");
    } finally {
      setPendingKey(null);
    }
  }

  if (flags === null) {
    return <p className="text-sm text-muted-foreground">Loading feature flags…</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No feature flags are configured yet.</p>
      ) : (
        flags.map((flag) => (
          <div
            key={flag.key}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-medium">{flag.key}</p>
              {flag.description && <p className="mt-0.5 text-xs text-muted-foreground">{flag.description}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Platform default: {flag.globalDefault ? "on" : "off"}
                {flag.organizationOverride !== null && " · overridden for your organization"}
              </p>
            </div>
            <Button
              size="sm"
              variant={flag.effective ? "default" : "outline"}
              disabled={pendingKey === flag.key}
              onClick={() => toggle(flag)}
              className="shrink-0 gap-1.5"
            >
              {pendingKey === flag.key && <Loader2 className="size-3.5 animate-spin" />}
              {flag.effective ? "Enabled" : "Disabled"}
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
