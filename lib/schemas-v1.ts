import { z } from "zod";

export const OrganizationTypeSchema = z.enum(["corporate", "ngo", "auditor"]);

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  type: OrganizationTypeSchema,
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const UpdateNgoProfileSchema = z.object({
  legalName: z.string().min(2).max(200),
  registrationNumber: z.string().max(100).optional(),
  registrationType: z.enum(["trust", "society", "section8"]).optional(),
  pan: z.string().max(20).optional(),
  establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  headquartersState: z.string().max(100).optional(),
  operatingStates: z.array(z.string()).max(40).optional(),
  causeCategoryKeys: z.array(z.string()).max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type UpdateNgoProfileInput = z.infer<typeof UpdateNgoProfileSchema>;

export const CreateCsrProjectSchema = z.object({
  corporateOrgId: z.string().uuid(),
  ngoProfileId: z.string().uuid().optional(),
  csrCategoryKey: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().max(4000).optional(),
  budgetAmount: z.number().nonnegative().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export type CreateCsrProjectInput = z.infer<typeof CreateCsrProjectSchema>;

export const UpdateCsrProjectSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(4000).optional(),
  budgetAmount: z.number().nonnegative().optional(),
  status: z.enum(["draft", "proposed", "approved", "active", "completed", "cancelled"]).optional(),
  ngoProfileId: z.string().uuid().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export type UpdateCsrProjectInput = z.infer<typeof UpdateCsrProjectSchema>;

export const CreateVerificationRequestSchema = z.object({
  ngoProfileId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export type CreateVerificationRequestInput = z.infer<typeof CreateVerificationRequestSchema>;

export const ReviewVerificationRequestSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(["in_review", "approved", "rejected"]),
  reviewNotes: z.string().max(2000).optional(),
});

export type ReviewVerificationRequestInput = z.infer<typeof ReviewVerificationRequestSchema>;
