"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type OrgType = "corporate" | "ngo" | "auditor";

export type Org = { id: string; name: string; slug: string; type: OrgType };

const OrgContext = createContext<Org | null>(null);

/** Returns the current workspace's organization. Always non-null inside an
 * OrgProvider, since OrgProvider only renders children once one exists. */
export function useOrg(): Org {
  const org = useContext(OrgContext);
  if (!org) throw new Error("useOrg() must be used inside an OrgProvider");
  return org;
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "org"}-${suffix}`;
}

/**
 * Resolves (or creates) the signed-in user's organization of a given type
 * and provides it via context to everything underneath. Centralizes the
 * "does this user have an org yet" onboarding step in one place instead of
 * repeating it on every workspace page.
 */
export function OrgProvider({
  type,
  typeLabel,
  children,
}: {
  type: OrgType;
  typeLabel: string;
  children: React.ReactNode;
}) {
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/organizations")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        const match = (body.data ?? []).find((o: Org) => o.type === type);
        setOrg(match ?? null);
      })
      .catch(() => !cancelled && setError("Could not load your organization."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [type]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const name = new FormData(e.currentTarget).get("name") as string;

    try {
      const res = await fetch("/api/v1/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slugify(name), type }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not create organization");
      setOrg(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create organization");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading your workspace…</div>;
  }

  if (!org) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <form
          onSubmit={handleCreate}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm"
        >
          <div>
            <h1 className="font-heading text-lg font-semibold">Set up your {typeLabel} workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Give your organization a name to get started — you can refine details later.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" name="name" required minLength={2} maxLength={200} autoFocus />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={creating} className="w-full">
            {creating ? "Creating…" : "Create workspace"}
          </Button>
        </form>
      </div>
    );
  }

  return <OrgContext.Provider value={org}>{children}</OrgContext.Provider>;
}
