"use client";

import { useEffect, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrg } from "@/components/dashboard/org-context";
import { WEBHOOK_EVENT_TYPES } from "@/lib/schemas-v1";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

type Webhook = {
  id: string;
  url: string;
  event_types: string[];
  is_active: boolean;
  created_at: string;
};

function CopyableSecret({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 p-2">
      <code className="flex-1 truncate text-xs">{value}</code>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="shrink-0 gap-1"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

/**
 * Self-service API keys + webhooks (ERT 12) — finishing the dormant
 * api_keys/webhooks schema from Phase 2. Raw secrets are shown exactly
 * once, at creation, then never again — only their hash is stored.
 */
export function DeveloperAccessPanel() {
  const org = useOrg();
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[] | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch(`/api/v1/organizations/${org.id}/api-keys`)
      .then((r) => r.json())
      .then((body) => setKeys(body.data ?? []));
    fetch(`/api/v1/organizations/${org.id}/webhooks`)
      .then((r) => r.json())
      .then((body) => setWebhooks(body.data ?? []));
  }

  useEffect(load, [org.id]);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setRevealedKey(null);
    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not create key");
      setRevealedKey(body.data.rawKey);
      setNewKeyName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create key");
    } finally {
      setBusy(false);
    }
  }

  async function revokeKey(id: string) {
    await fetch(`/api/v1/organizations/${org.id}/api-keys/${id}`, { method: "PATCH" });
    load();
  }

  async function createWebhook(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setRevealedSecret(null);
    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newWebhookUrl, eventTypes: [...WEBHOOK_EVENT_TYPES] }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not create webhook");
      setRevealedSecret(body.data.secret);
      setNewWebhookUrl("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create webhook");
    } finally {
      setBusy(false);
    }
  }

  async function revokeWebhookEntry(id: string) {
    await fetch(`/api/v1/organizations/${org.id}/webhooks/${id}`, { method: "PATCH" });
    load();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <h3 className="text-sm font-semibold">API keys</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Authenticate server-to-server as a{" "}
          <code className="rounded bg-muted px-1 py-0.5">Bearer</code> token against{" "}
          <code className="rounded bg-muted px-1 py-0.5">GET /api/v1/organizations/{org.id}/search</code>{" "}
          — the current showcase endpoint for key-based access.
        </p>
        <form onSubmit={createKey} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="keyName">Key name</Label>
            <Input
              id="keyName"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Reporting integration"
              className="w-56"
              required
              minLength={2}
            />
          </div>
          <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            Generate key
          </Button>
        </form>
        {revealedKey && (
          <div>
            <p className="mt-3 text-xs font-medium text-secondary">
              Copy this now — it won&apos;t be shown again.
            </p>
            <CopyableSecret value={revealedKey} />
          </div>
        )}
        <div className="mt-3 space-y-2">
          {keys === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{k.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{k.key_prefix}…</p>
                </div>
                {k.revoked_at ? (
                  <span className="shrink-0 text-xs text-muted-foreground">Revoked</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => revokeKey(k.id)}>
                    Revoke
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Webhooks</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Get an HMAC-signed POST when a project you own is approved (
          <code className="rounded bg-muted px-1 py-0.5">csr_project.approved</code> — the only event
          wired up so far).
        </p>
        <form onSubmit={createWebhook} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="webhookUrl">Endpoint URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://your-system.example.com/webhooks/niticsr"
              className="w-72"
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            Register webhook
          </Button>
        </form>
        {revealedSecret && (
          <div>
            <p className="mt-3 text-xs font-medium text-secondary">
              Signing secret — copy this now, it won&apos;t be shown again.
            </p>
            <CopyableSecret value={revealedSecret} />
          </div>
        )}
        <div className="mt-3 space-y-2">
          {webhooks === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No webhooks registered yet.</p>
          ) : (
            webhooks.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 text-sm"
              >
                <p className="min-w-0 truncate font-mono text-xs">{w.url}</p>
                {w.is_active ? (
                  <Button size="sm" variant="outline" onClick={() => revokeWebhookEntry(w.id)}>
                    Deactivate
                  </Button>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Inactive</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
