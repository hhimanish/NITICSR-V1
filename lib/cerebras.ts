import OpenAI from "openai";
import type { MatchRequest } from "@/lib/schemas";
import demoNgos from "@/lib/seed/demo-ngos.json";

export const CEREBRAS_MODEL = "gpt-oss-20b";

let client: OpenAI | null = null;

export function getCerebrasClient() {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.CEREBRAS_API_KEY,
      baseURL: "https://api.cerebras.ai/v1",
    });
  }
  return client;
}

export function buildMatchMessages(request: MatchRequest) {
  const candidates = demoNgos.map((ngo) => ({
    id: ngo.id,
    name: ngo.name,
    causeAreas: ngo.causeAreas,
    states: ngo.states,
    description: ngo.description,
  }));

  const system = `You are NITICSR's NGO-matching engine for a Corporate CSR platform in India.
You will receive a corporate's Schedule VII cause area, target state, and CSR budget band,
plus a JSON list of candidate NGOs (id, name, causeAreas, states, description).

Rules:
- Select 3 to 5 NGOs from the candidate list ONLY. Never invent an NGO or an id that is not in the list.
- causeAlignment (0-100): how well the NGO's causeAreas overlap the requested cause area.
- geographyFit (0-100): how well the NGO's states overlap the requested state. An NGO listing
  "Pan-India" should score 65-85 for geography unless the request itself is "Pan-India" (then 90-100).
  An exact state match should score 85-100.
- rationale: one specific sentence (max 160 characters) citing the actual overlap — no generic filler.
- Respond with ONLY a raw JSON array, no markdown fences, no prose, no wrapper object. Each element
  must have exactly these keys: ngoId (string), causeAlignment (integer), geographyFit (integer),
  rationale (string).`;

  const user = `Request:\n${JSON.stringify(request, null, 2)}\n\nCandidate NGOs:\n${JSON.stringify(
    candidates,
    null,
    2
  )}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

export function findDemoNgo(ngoId: string) {
  return demoNgos.find((ngo) => ngo.id === ngoId) ?? null;
}

export type CopilotContext = {
  organizationName: string;
  organizationType: string;
  projects: { id: string; title: string; status: string; budgetAmount: number | null; category: string }[];
  ngoProfile?: { legalName: string; operatingStates: string[]; causeAreas: string[] } | null;
  policies?: { title: string; category: string; effectiveDate: string | null }[];
  compliance?: {
    averageScore: number;
    totalProjects: number;
    projectsWithGaps: number;
    overdueObligations: number;
  } | null;
  ngoPartnerDocumentAlerts?: { ngoName: string; documentType: string; expiresAt: string }[];
  assurance?: { openRisks: number; overdueCapaItems: number; activeAlerts: number } | null;
  sustainability?: { sdgsCovered: number; totalBeneficiaries: number } | null;
};

/** ERT 10 consolidates this into one grounded assistant spanning every
 * domain that's been wired into it since ERT 1 (governance, compliance,
 * assurance, sustainability) rather than forking into per-role personas —
 * see docs/ARCHITECTURE.md's ERT 10 section for why. Grounds every answer
 * in the caller's own org data only — no cross-tenant context is ever
 * included, and the model is told not to answer beyond it. */
export function buildCopilotMessages(question: string, context: CopilotContext) {
  const system = `You are the NITICSR AI Copilot — one assistant grounded across every domain
wired into this platform for a single organization: CSR projects, governance policies,
compliance, risk & assurance, and sustainability. You are given that organization's own
records only.

Grounding rules:
- Answer ONLY using the provided data. If the data doesn't contain the answer, say so plainly —
  never guess or invent figures, NGO names, project details, or policy contents.
- Be concise: 2-4 sentences, or a short list for multi-item answers.
- Do not discuss other organizations' data — you were not given any.
- When asked about policy, cite the policy title you're drawing from.
- When asked about compliance, ground your answer in the compliance summary figures given —
  never estimate or invent a score, obligation count, or gap count.
- When asked about NGO partners, only cite the document-expiry alerts given — never invent or
  estimate an NGO's trust, risk, financial, or governance standing; that data isn't provided.
- When asked about risk or assurance, cite only the counts given (open risks, overdue corrective
  actions, active control alerts) — never invent a risk score, a fraud likelihood, or a prediction.
- When asked about ESG or sustainability, cite only the SDG-coverage and beneficiary counts given
  — never invent a Sustainability Score, ESG Maturity Index, carbon/water figure, or any composite
  index; none of that data is captured on this platform.`;

  const sections = [
    `Organization: ${context.organizationName} (${context.organizationType})`,
    context.ngoProfile && `NGO profile: ${JSON.stringify(context.ngoProfile)}`,
    context.compliance && `Compliance summary: ${JSON.stringify(context.compliance)}`,
    context.assurance && `Assurance summary: ${JSON.stringify(context.assurance)}`,
    context.sustainability && `Sustainability summary: ${JSON.stringify(context.sustainability)}`,
    context.ngoPartnerDocumentAlerts &&
      context.ngoPartnerDocumentAlerts.length > 0 &&
      `NGO partner documents expiring within 60 days: ${JSON.stringify(context.ngoPartnerDocumentAlerts)}`,
    `Active governance policies (${context.policies?.length ?? 0}):\n${JSON.stringify(context.policies ?? [], null, 2)}`,
    `CSR projects (${context.projects.length}):\n${JSON.stringify(context.projects, null, 2)}`,
    `Question: ${question}`,
  ].filter((section): section is string => Boolean(section));

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: sections.join("\n\n") },
  ];
}
