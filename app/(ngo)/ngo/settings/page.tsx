"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrg } from "@/components/dashboard/org-context";
import { CSR_CATEGORIES } from "@/lib/csr-categories";

type ProfileForm = {
  legalName: string;
  headquartersState: string;
  operatingStates: string;
  description: string;
  website: string;
  causeCategoryKeys: string[];
};

const EMPTY_FORM: ProfileForm = {
  legalName: "",
  headquartersState: "",
  operatingStates: "",
  description: "",
  website: "",
  causeCategoryKeys: [],
};

export default function NgoSettingsPage() {
  const org = useOrg();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/organizations/${org.id}/ngo-profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (body?.data) {
          setForm({
            legalName: body.data.legal_name ?? "",
            headquartersState: body.data.headquarters_state ?? "",
            operatingStates: (body.data.operating_states ?? []).join(", "),
            description: body.data.description ?? "",
            website: body.data.website ?? "",
            causeCategoryKeys: body.data.cause_category_keys ?? [],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [org.id]);

  function toggleCause(key: string) {
    setForm((prev) => ({
      ...prev,
      causeCategoryKeys: prev.causeCategoryKeys.includes(key)
        ? prev.causeCategoryKeys.filter((k) => k !== key)
        : [...prev.causeCategoryKeys, key],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/ngo-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: form.legalName,
          headquartersState: form.headquartersState || undefined,
          operatingStates: form.operatingStates
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description: form.description || undefined,
          website: form.website || undefined,
          causeCategoryKeys: form.causeCategoryKeys,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not save profile");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold">Organization profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="legalName">Legal name</Label>
          <Input
            id="legalName"
            required
            minLength={2}
            value={form.legalName}
            onChange={(e) => setForm((p) => ({ ...p, legalName: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hqState">Headquarters state</Label>
            <Input
              id="hqState"
              value={form.headquartersState}
              onChange={(e) => setForm((p) => ({ ...p, headquartersState: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opStates">Operating states (comma-separated)</Label>
            <Input
              id="opStates"
              value={form.operatingStates}
              onChange={(e) => setForm((p) => ({ ...p, operatingStates: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Cause areas</Label>
          <div className="flex flex-wrap gap-2">
            {CSR_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleCause(c.key)}
                className={
                  form.causeCategoryKeys.includes(c.key)
                    ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                    : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-secondary">Saved.</p>}

        <Button type="submit" disabled={saving} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save profile
        </Button>
      </form>
    </div>
  );
}
