"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useOrg } from "@/components/dashboard/org-context";

type Message = { role: "user" | "assistant"; text: string; groundedInProjectCount?: number; model?: string };

export function CopilotPanel() {
  const org = useOrg();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    const asked = question;
    setMessages((prev) => [...prev, { role: "user", text: asked }]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: org.id, question: asked }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Copilot is unavailable right now.");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: body.data.answer,
          groundedInProjectCount: body.data.groundedInProjectCount,
          model: body.data.model,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" />}>
        <Sparkles className="size-4" />
        <span className="sr-only">Open AI Copilot</span>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-secondary" />
            AI Copilot
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent-foreground">
            AI-generated — not independently verified. Cross-check anything before acting on it.
          </p>
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask about your own CSR projects and organization data — answers are grounded only in{" "}
              {org.name}&apos;s records.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  : "mr-auto max-w-[85%] space-y-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground/90"
              }
            >
              {m.text}
              {m.role === "assistant" && (
                <p className="text-xs text-muted-foreground">
                  Grounded in {m.groundedInProjectCount ?? 0} of your CSR projects
                  {m.model && ` · ${m.model}`}
                </p>
              )}
            </div>
          ))}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <form onSubmit={handleAsk} className="flex gap-2 border-t border-border p-4">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your projects…"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
