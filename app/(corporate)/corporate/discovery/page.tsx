"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CSR_CATEGORIES, INDIAN_STATES_FOR_FILTERS } from "@/lib/csr-categories";

type NgoResult = {
  id: string;
  legal_name: string;
  headquarters_state: string | null;
  operating_states: string[];
  description: string | null;
};

export default function CorporateDiscoveryPage() {
  const [state, setState] = useState<string>("");
  const [causeCategoryKey, setCauseCategoryKey] = useState<string>("");
  const [results, setResults] = useState<NgoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (causeCategoryKey) params.set("causeCategoryKey", causeCategoryKey);

    try {
      const res = await fetch(`/api/v1/ngo-profiles?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Search failed");
      setResults(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">NGO Discovery</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search the real NGO directory by state and cause area.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
        <Select value={state} onValueChange={(v) => setState(v ?? "")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Any state" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_STATES_FOR_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={causeCategoryKey} onValueChange={(v) => setCauseCategoryKey(v ?? "")}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Any cause area" />
          </SelectTrigger>
          <SelectContent>
            {CSR_CATEGORIES.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSearch} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {results !== null && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No verified NGO profiles match yet — the directory grows as NGOs onboard.
            </p>
          ) : (
            results.map((ngo) => (
              <div key={ngo.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="font-heading text-base font-semibold">{ngo.legal_name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ngo.headquarters_state ?? "State not set"} · Operates in{" "}
                  {ngo.operating_states.length || "0"} state(s)
                </p>
                {ngo.description && (
                  <p className="mt-2 text-sm text-foreground/80">{ngo.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
