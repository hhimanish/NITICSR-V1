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
  rationale: z.string().max(1000).optional(),
  isOngoingProject: z.boolean().optional(),
  programId: z.string().uuid().nullable().optional(),
});

export type UpdateCsrProjectInput = z.infer<typeof UpdateCsrProjectSchema>;

export const SetFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  isEnabled: z.boolean(),
  organizationId: z.string().uuid().nullable().optional(),
  description: z.string().max(500).optional(),
});

export type SetFeatureFlagInput = z.infer<typeof SetFeatureFlagSchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(100),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const WEBHOOK_EVENT_TYPES = ["csr_project.approved"] as const;

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  eventTypes: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1),
});

export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;

export const SetProjectSdgsSchema = z.object({
  sdgIds: z.array(z.number().int().min(1).max(17)).max(17),
});

export type SetProjectSdgsInput = z.infer<typeof SetProjectSdgsSchema>;

export const CreateProjectLocationSchema = z.object({
  state: z.string().min(1).max(100),
  district: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CreateProjectLocationInput = z.infer<typeof CreateProjectLocationSchema>;

export const CreateBeneficiarySchema = z.object({
  category: z.string().min(1).max(100),
  countEstimate: z.number().int().nonnegative().optional(),
  demographicNotes: z.string().max(1000).optional(),
});

export type CreateBeneficiaryInput = z.infer<typeof CreateBeneficiarySchema>;

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

export const CreateDelegationSchema = z.object({
  organizationId: z.string().uuid(),
  delegateUserId: z.string().uuid(),
  permissionKey: z.string().min(1),
  endsAt: z.string().datetime(),
});

export type CreateDelegationInput = z.infer<typeof CreateDelegationSchema>;

export const CreatePolicySchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(2).max(200),
  category: z.string().max(100).optional(),
  content: z.string().min(1).max(20000),
  effectiveDate: z.string().date().optional(),
  reviewDate: z.string().date().optional(),
});

export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;

export const UpdatePolicySchema = z.object({
  title: z.string().min(2).max(200).optional(),
  category: z.string().max(100).optional(),
  content: z.string().min(1).max(20000).optional(),
  status: z.enum(["draft", "active", "superseded", "retired"]).optional(),
  effectiveDate: z.string().date().optional(),
  reviewDate: z.string().date().optional(),
});

export type UpdatePolicyInput = z.infer<typeof UpdatePolicySchema>;

export const UpdateObligationSchema = z.object({
  status: z.enum(["satisfied", "waived"]),
});

export type UpdateObligationInput = z.infer<typeof UpdateObligationSchema>;

export const NGO_DOCUMENT_TYPES = ["12A", "80G", "FCRA", "CSR1", "PAN", "REGISTRATION_CERTIFICATE", "OTHER"] as const;

export const CreateNgoDocumentSchema = z.object({
  documentType: z.enum(NGO_DOCUMENT_TYPES),
  fileUrl: z.string().url().max(2000).optional(),
  issuedAt: z.string().date().optional(),
  expiresAt: z.string().date().optional(),
});

export type CreateNgoDocumentInput = z.infer<typeof CreateNgoDocumentSchema>;

export const ReviewNgoDocumentSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(["verified", "rejected"]),
});

export type ReviewNgoDocumentInput = z.infer<typeof ReviewNgoDocumentSchema>;

export const CreateProposalReviewSchema = z.object({
  recommendation: z.enum(["recommend", "recommend_with_conditions", "not_recommend"]),
  notes: z.string().max(4000).optional(),
});

export type CreateProposalReviewInput = z.infer<typeof CreateProposalReviewSchema>;

export const UpsertGrantAgreementSchema = z.object({
  terms: z.string().min(1).max(20000),
});

export type UpsertGrantAgreementInput = z.infer<typeof UpsertGrantAgreementSchema>;

export const CreateDisbursementSchema = z.object({
  milestoneId: z.string().uuid().optional(),
  amount: z.number().positive(),
  note: z.string().max(1000).optional(),
  vendorName: z.string().max(200).optional(),
  expenseCategory: z.string().max(100).optional(),
  invoiceReference: z.string().max(200).optional(),
});

export type CreateDisbursementInput = z.infer<typeof CreateDisbursementSchema>;

export const UpsertAnnualBudgetSchema = z.object({
  fiscalYear: z.string().regex(/^\d{4}-\d{2}$/, "Fiscal year must be like '2025-26'"),
  budgetAmount: z.number().nonnegative(),
});

export type UpsertAnnualBudgetInput = z.infer<typeof UpsertAnnualBudgetSchema>;

export const ReviewUnspentTransferSchema = z.object({
  transferReference: z.string().max(200).optional(),
});

export type ReviewUnspentTransferInput = z.infer<typeof ReviewUnspentTransferSchema>;

export const CreateMilestoneSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().date().optional(),
});

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;

export const UpdateMilestoneSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().date().optional(),
  status: z.enum(["pending", "in_progress", "completed", "delayed"]).optional(),
  evidenceUrl: z.string().url().max(2000).optional(),
});

export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;

export const CreateMilestoneTaskSchema = z.object({
  title: z.string().min(2).max(200),
});

export type CreateMilestoneTaskInput = z.infer<typeof CreateMilestoneTaskSchema>;

export const CreateMilestoneDependencySchema = z.object({
  dependsOnMilestoneId: z.string().uuid(),
});

export type CreateMilestoneDependencyInput = z.infer<typeof CreateMilestoneDependencySchema>;

export const CreateProjectRiskSchema = z.object({
  entryType: z.enum(["risk", "issue"]),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
});

export type CreateProjectRiskInput = z.infer<typeof CreateProjectRiskSchema>;

export const UpdateProjectRiskSchema = z.object({
  status: z.enum(["open", "mitigated", "closed"]).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
});

export type UpdateProjectRiskInput = z.infer<typeof UpdateProjectRiskSchema>;

export const CreateChangeRequestSchema = z.object({
  field: z.enum(["budget_amount", "end_date"]),
  requestedValue: z.string().min(1).max(100),
  reason: z.string().max(1000).optional(),
});

export type CreateChangeRequestInput = z.infer<typeof CreateChangeRequestSchema>;

export const ReviewChangeRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type ReviewChangeRequestInput = z.infer<typeof ReviewChangeRequestSchema>;

export const CreateProgramSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
});

export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;

export const CreateFieldVisitSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  note: z.string().max(1000).optional(),
});

export type CreateFieldVisitInput = z.infer<typeof CreateFieldVisitSchema>;

export const CreateProjectAssetSchema = z.object({
  name: z.string().min(2).max(200),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  evidenceUrl: z.string().url().max(2000).optional(),
});

export type CreateProjectAssetInput = z.infer<typeof CreateProjectAssetSchema>;

export const UpdateProjectAssetSchema = z.object({
  status: z.enum(["planned", "installed", "verified", "damaged"]).optional(),
  evidenceUrl: z.string().url().max(2000).optional(),
});

export type UpdateProjectAssetInput = z.infer<typeof UpdateProjectAssetSchema>;

const SurveyQuestionSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  type: z.enum(["text", "number", "choice"]),
  required: z.boolean().optional(),
  options: z.array(z.string().max(100)).max(20).optional(),
});

export const CreateSurveyDefinitionSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  questions: z.array(SurveyQuestionSchema).min(1).max(30),
});

export type CreateSurveyDefinitionInput = z.infer<typeof CreateSurveyDefinitionSchema>;

export const CreateSurveyResponseSchema = z.object({
  csrProjectId: z.string().uuid().optional(),
  beneficiaryId: z.string().uuid().optional(),
  answers: z.record(z.string(), z.union([z.string(), z.number()])),
});

export type CreateSurveyResponseInput = z.infer<typeof CreateSurveyResponseSchema>;

export const CreateOrgRiskSchema = z.object({
  entryType: z.enum(["risk", "issue"]),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  csrProjectId: z.string().uuid().optional(),
});

export type CreateOrgRiskInput = z.infer<typeof CreateOrgRiskSchema>;

export const CreateControlSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  controlType: z.enum(["preventive", "detective", "corrective"]),
  frequency: z.enum(["continuous", "daily", "weekly", "monthly", "quarterly", "annual"]).optional(),
  linkedRiskId: z.string().uuid().optional(),
});

export type CreateControlInput = z.infer<typeof CreateControlSchema>;

export const UpdateControlSchema = z.object({
  frequency: z.enum(["continuous", "daily", "weekly", "monthly", "quarterly", "annual"]).optional(),
});

export type UpdateControlInput = z.infer<typeof UpdateControlSchema>;

export const CreateAuditEngagementSchema = z.object({
  title: z.string().min(2).max(200),
  scope: z.string().max(2000).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export type CreateAuditEngagementInput = z.infer<typeof CreateAuditEngagementSchema>;

export const UpdateAuditEngagementSchema = z.object({
  status: z.enum(["planned", "in_progress", "completed"]).optional(),
});

export type UpdateAuditEngagementInput = z.infer<typeof UpdateAuditEngagementSchema>;

export const CreateCapaItemSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  auditEngagementId: z.string().uuid().optional(),
  projectRiskId: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
});

export type CreateCapaItemInput = z.infer<typeof CreateCapaItemSchema>;

export const UpdateCapaItemSchema = z.object({
  status: z.enum(["open", "in_progress", "done"]).optional(),
});

export type UpdateCapaItemInput = z.infer<typeof UpdateCapaItemSchema>;

export const CreateIncidentSchema = z.object({
  category: z.enum(["safety", "fraud", "data_breach", "beneficiary_complaint", "reputational", "regulatory", "other"]),
  severity: z.enum(["low", "medium", "high"]).optional(),
  description: z.string().min(2).max(4000),
  csrProjectId: z.string().uuid().optional(),
  fiveWhys: z.array(z.string().max(500)).max(5).optional(),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

export const UpdateIncidentSchema = z.object({
  status: z.enum(["open", "investigating", "resolved"]).optional(),
  fiveWhys: z.array(z.string().max(500)).max(5).optional(),
});

export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
