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
