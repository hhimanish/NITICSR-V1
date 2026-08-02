"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrg } from "@/components/dashboard/org-context";

type SurveyQuestion = {
  key: string;
  label: string;
  type: "text" | "number" | "choice";
  required?: boolean;
  options?: string[];
};
type Survey = { id: string; title: string; description: string | null; questions: SurveyQuestion[] };
type Response = { id: string; answers: Record<string, unknown>; created_at: string; submitted_by_name: string | null };

export default function SurveysPage() {
  const org = useOrg();
  const [surveys, setSurveys] = useState<Survey[] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([{ key: "", label: "", type: "text" }]);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState(false);

  function load() {
    fetch(`/api/v1/organizations/${org.id}/surveys`)
      .then((r) => r.json())
      .then((body) => setSurveys(body.data ?? []));
  }

  useEffect(load, [org.id]);

  function updateQuestion(index: number, patch: Partial<SurveyQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function createSurvey(e: React.FormEvent) {
    e.preventDefault();
    const cleanQuestions = questions.filter((q) => q.key.trim() && q.label.trim());
    if (!title.trim() || cleanQuestions.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/v1/organizations/${org.id}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined, questions: cleanQuestions }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setQuestions([{ key: "", label: "", type: "text" }]);
        load();
      }
    } finally {
      setCreating(false);
    }
  }

  function loadResponses(surveyId: string) {
    fetch(`/api/v1/surveys/${surveyId}/responses`)
      .then((r) => r.json())
      .then((body) => setResponses(body.data ?? []));
  }

  function toggleExpand(survey: Survey) {
    if (expandedId === survey.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(survey.id);
    setAnswers({});
    loadResponses(survey.id);
  }

  async function submitResponse(survey: Survey) {
    setSubmittingResponse(true);
    try {
      const payload: Record<string, string | number> = {};
      for (const q of survey.questions) {
        const raw = answers[q.key];
        if (raw === undefined || raw === "") continue;
        payload[q.key] = q.type === "number" ? Number(raw) : raw;
      }
      const res = await fetch(`/api/v1/surveys/${survey.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      if (res.ok) {
        setAnswers({});
        loadResponses(survey.id);
      }
    } finally {
      setSubmittingResponse(false);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">Field surveys</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Structured questionnaires for beneficiary and project data collection.
      </p>

      <div className="mt-6 space-y-2">
        {surveys === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : surveys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No surveys yet — create one below.</p>
        ) : (
          surveys.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <button type="button" onClick={() => toggleExpand(s)} className="text-left text-sm font-medium hover:underline">
                {s.title}
              </button>
              {s.description && <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>}
              {expandedId === s.id && (
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  <div className="space-y-2">
                    {s.questions.map((q) => (
                      <div key={q.key}>
                        <label className="text-xs font-medium text-muted-foreground">{q.label}</label>
                        {q.type === "choice" ? (
                          <Select
                            value={answers[q.key] ?? ""}
                            onValueChange={(v) => v && setAnswers((prev) => ({ ...prev, [q.key]: v }))}
                          >
                            <SelectTrigger className="mt-1 w-full" aria-label={q.label}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {(q.options ?? []).map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={q.type === "number" ? "number" : "text"}
                            className="mt-1"
                            value={answers[q.key] ?? ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    <Button size="sm" variant="outline" disabled={submittingResponse} onClick={() => submitResponse(s)}>
                      {submittingResponse && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                      Submit response
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {responses.length} response(s)
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {responses.map((r) => (
                        <li key={r.id} className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-IN")}
                          {r.submitted_by_name ? ` — ${r.submitted_by_name}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Create a survey</h2>
        <form onSubmit={createSurvey} className="mt-3 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2">
                <Input
                  placeholder="Key (e.g. water_access)"
                  value={q.key}
                  onChange={(e) => updateQuestion(i, { key: e.target.value })}
                  className="w-40"
                />
                <Input
                  placeholder="Question label"
                  value={q.label}
                  onChange={(e) => updateQuestion(i, { label: e.target.value })}
                  className="flex-1"
                />
                <Select value={q.type} onValueChange={(v) => v && updateQuestion(i, { type: v as SurveyQuestion["type"] })}>
                  <SelectTrigger className="w-28" aria-label="Question type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="choice">Choice</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setQuestions((prev) => [...prev, { key: "", label: "", type: "text" }])}
            >
              <Plus className="size-3.5" />
              Add question
            </Button>
          </div>

          <Button type="submit" size="sm" disabled={creating || !title.trim()}>
            Create survey
          </Button>
        </form>
      </section>
    </div>
  );
}
