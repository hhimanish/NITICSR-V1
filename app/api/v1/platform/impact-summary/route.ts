import { apiSuccess, withApiErrors } from "@/lib/api-utils";
import { computePlatformImpactSummary } from "@/lib/platform-stats";

/** Public, unauthenticated — this is a cross-tenant aggregate with no
 * per-organization breakdown, so there's nothing here any single tenant
 * hasn't already implicitly agreed to by being on the platform. Same
 * reasoning ERT 3's computeNgoPartnershipStats already relies on. */
export const GET = withApiErrors(async () => {
  return apiSuccess(await computePlatformImpactSummary());
});
