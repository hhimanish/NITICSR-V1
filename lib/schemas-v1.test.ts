import { describe, expect, it } from "vitest";
import {
  CreateCsrProjectSchema,
  CreateOrganizationSchema,
  ReviewVerificationRequestSchema,
  UpdateNgoProfileSchema,
} from "@/lib/schemas-v1";

describe("CreateOrganizationSchema", () => {
  it("accepts a valid corporate organization", () => {
    const result = CreateOrganizationSchema.safeParse({
      name: "Acme Corp",
      slug: "acme-corp",
      type: "corporate",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an uppercase or spaced slug", () => {
    expect(CreateOrganizationSchema.safeParse({ name: "Acme", slug: "Acme Corp", type: "corporate" }).success).toBe(
      false
    );
  });

  it("rejects an invalid organization type", () => {
    expect(
      CreateOrganizationSchema.safeParse({ name: "Acme", slug: "acme", type: "government" }).success
    ).toBe(false);
  });
});

describe("UpdateNgoProfileSchema", () => {
  it("requires legalName but allows everything else to be omitted", () => {
    const result = UpdateNgoProfileSchema.safeParse({ legalName: "Prakash Foundation" });
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range establishedYear", () => {
    const result = UpdateNgoProfileSchema.safeParse({
      legalName: "Test NGO",
      establishedYear: 1500,
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateCsrProjectSchema", () => {
  it("requires corporateOrgId to be a UUID", () => {
    const result = CreateCsrProjectSchema.safeParse({
      corporateOrgId: "not-a-uuid",
      csrCategoryKey: "education",
      title: "Literacy drive",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative budget", () => {
    const result = CreateCsrProjectSchema.safeParse({
      corporateOrgId: "123e4567-e89b-12d3-a456-426614174000",
      csrCategoryKey: "education",
      title: "Literacy drive",
      budgetAmount: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe("ReviewVerificationRequestSchema", () => {
  it("only allows in_review/approved/rejected as a status", () => {
    const result = ReviewVerificationRequestSchema.safeParse({
      organizationId: "123e4567-e89b-12d3-a456-426614174000",
      status: "pending",
    });
    expect(result.success).toBe(false);
  });
});
