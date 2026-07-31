-- Verification is a manual-review workflow for Phase 2: a human (auditor /
-- platform_admin) reviews an NGO and records outcomes per external provider.
-- verification_checks.result is intentionally a stub payload shape — there is
-- no live MCA21/DARPAN/Income-Tax/GST/FCRA integration yet (none of these
-- expose public self-serve APIs), so this models the *interface* a real
-- integration would fill in later without pretending one exists today.

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_profile_id UUID NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_review', 'approved', 'rejected')
  ),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('MCA21', 'DARPAN', 'INCOME_TAX', 'GST', 'FCRA')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'pending', 'passed', 'failed', 'manual_review')
  ),
  result JSONB,
  checked_at TIMESTAMPTZ,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (verification_request_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_ngo ON verification_requests (ngo_profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests (status);
CREATE INDEX IF NOT EXISTS idx_verification_checks_request ON verification_checks (verification_request_id);
CREATE INDEX IF NOT EXISTS idx_verification_checks_renewals ON verification_checks (expires_at)
  WHERE status = 'passed';

DROP TRIGGER IF EXISTS trg_verification_requests_updated_at ON verification_requests;
CREATE TRIGGER trg_verification_requests_updated_at BEFORE UPDATE ON verification_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_verification_checks_updated_at ON verification_checks;
CREATE TRIGGER trg_verification_checks_updated_at BEFORE UPDATE ON verification_checks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
