import { z } from "zod";

export const causeAreas = [
  "Education",
  "Healthcare",
  "Rural Development",
  "Environment & Sustainability",
  "Water & Sanitation",
  "Skill Development & Livelihoods",
  "Women Empowerment & Gender Equality",
  "Disaster Relief",
  "Arts, Culture & Heritage",
  "Poverty Alleviation & Hunger",
] as const;

export const indianStates = [
  "Pan-India",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Delhi NCR",
  "Gujarat",
  "Uttar Pradesh",
  "West Bengal",
  "Rajasthan",
  "Telangana",
  "Kerala",
  "Bihar",
  "Madhya Pradesh",
  "Odisha",
  "Assam",
] as const;

export const budgetBands = [
  "₹10L – ₹50L",
  "₹50L – ₹2 Cr",
  "₹2 Cr – ₹10 Cr",
  "₹10 Cr+",
] as const;

export const MatchRequestSchema = z.object({
  causeArea: z.enum(causeAreas),
  state: z.enum(indianStates),
  budgetBand: z.enum(budgetBands),
});

export type MatchRequest = z.infer<typeof MatchRequestSchema>;

/** Raw shape the model is asked to produce — deliberately minimal so every
 * field it emits is verifiable against the seed dataset before it reaches a client. */
export const ModelMatchSchema = z.object({
  ngoId: z.string().min(1),
  causeAlignment: z.number().min(0).max(100),
  geographyFit: z.number().min(0).max(100),
  rationale: z.string().min(1).max(240),
});

export type ModelMatch = z.infer<typeof ModelMatchSchema>;

/** Enriched shape sent to the client: model output + trusted fields resolved
 * server-side from the local seed dataset (never taken from the model). */
export const MatchResultSchema = ModelMatchSchema.extend({
  name: z.string(),
  description: z.string(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

export const ContactFormSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(100),
  email: z.string().email("Enter a valid email address"),
  organization: z.string().max(150).optional().or(z.literal("")),
  message: z.string().min(10, "Tell us a little more (10+ characters)").max(2000),
});

export type ContactFormValues = z.infer<typeof ContactFormSchema>;
