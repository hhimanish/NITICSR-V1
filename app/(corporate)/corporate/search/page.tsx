"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, FolderKanban, ScrollText, Siren } from "lucide-react";

import { useOrg } from "@/components/dashboard/org-context";

type SearchResult = {
  entityType: "project" | "policy" | "risk" | "incident";
  id: string;
  title: string;
  snippet: string;
  url: string;
};

const ENTITY_ICON = {
  project: FolderKanban,
  policy: ScrollText,
  risk: AlertTriangle,
  incident: Siren,
} as const;

const ENTITY_LABEL: Record<SearchResult["entityType"], string> = {
  project: "Project",
  policy: "Policy",
  risk: "Risk / issue",
  incident: "Incident",
};

export default function SearchPage() {
  const org = useOrg();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[] | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    setResults(null);
    fetch(`/api/v1/organizations/${org.id}/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((body) => setResults(body.data ?? []));
  }, [org.id, query]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold">Search</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {query ? (
          <>
            Results for <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span> — Postgres
            full-text search across your projects, policies, risks, and incidents.
          </>
        ) : (
          "Enter a search term in the header to get started."
        )}
      </p>

      <div className="mt-6 space-y-2">
        {results === null ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">{query ? "No matches found." : null}</p>
        ) : (
          results.map((r) => {
            const Icon = ENTITY_ICON[r.entityType];
            return (
              <Link
                key={`${r.entityType}-${r.id}`}
                href={r.url}
                className="block rounded-xl border border-border bg-card p-4 text-sm transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium">{r.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{ENTITY_LABEL[r.entityType]}</span>
                </div>
                {r.snippet && <p className="mt-1.5 text-xs text-muted-foreground">{r.snippet}</p>}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
