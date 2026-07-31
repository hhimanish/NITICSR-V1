"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/components/dashboard/org-context";
import { CSR_CATEGORIES } from "@/lib/csr-categories";

export default function NewCsrProjectPage() {
  const org = useOrg();
  const router = useRouter();
  const [csrCategoryKey, setCsrCategoryKey] = useState<string>(CSR_CATEGORIES[0].key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const budgetAmount = formData.get("budgetAmount");

    try {
      const res = await fetch("/api/v1/csr-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporateOrgId: org.id,
          csrCategoryKey,
          title: formData.get("title"),
          description: formData.get("description") || undefined,
          budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not create project");
      router.push(`/corporate/projects/${body.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-heading text-2xl font-semibold">New CSR project</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required minLength={2} maxLength={200} />
        </div>

        <div className="space-y-1.5">
          <Label>Cause category</Label>
          <Select value={csrCategoryKey} onValueChange={(v) => v && setCsrCategoryKey(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CSR_CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="budgetAmount">Budget (₹)</Label>
          <Input id="budgetAmount" name="budgetAmount" type="number" min={0} step="0.01" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={4} maxLength={4000} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Create project
        </Button>
      </form>
    </div>
  );
}
