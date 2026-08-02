-- Field Intelligence (ERT 7), scoped to browser-native capabilities over
-- existing project data: GPS check-ins validated against a project's
-- registered location (the same Haversine expression already used in
-- app/api/v1/ngo-profiles and csr-projects), a project asset register, and
-- structured surveys. Deliberately NOT camera/photo capture (no file
-- storage vendor has ever been chosen — see docs/ARCHITECTURE.md), NOT
-- biometric identity verification, OTP, digital signatures, voice/video,
-- drone or satellite imagery, and NOT an offline-first mobile app — this
-- is a responsive web capability, not a native one. See ERT 7 section.

CREATE TABLE IF NOT EXISTS field_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  distance_km NUMERIC(8, 2),
  within_geofence BOOLEAN,
  note TEXT,
  checked_in_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_visits_project ON field_visits (csr_project_id);

-- What was actually built/installed on the ground, with a GPS position and
-- status — evidence_url is a plain link (same pattern as
-- milestones.evidence_url) not a file upload, since no storage vendor
-- exists yet.
CREATE TABLE IF NOT EXISTS project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'installed', 'verified', 'damaged')),
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets (csr_project_id);

DROP TRIGGER IF EXISTS trg_project_assets_updated_at ON project_assets;
CREATE TRIGGER trg_project_assets_updated_at BEFORE UPDATE ON project_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS survey_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_definitions_org ON survey_definitions (organization_id);

DROP TRIGGER IF EXISTS trg_survey_definitions_updated_at ON survey_definitions;
CREATE TRIGGER trg_survey_definitions_updated_at BEFORE UPDATE ON survey_definitions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_definition_id UUID NOT NULL REFERENCES survey_definitions(id) ON DELETE CASCADE,
  csr_project_id UUID REFERENCES csr_projects(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
  answers JSONB NOT NULL,
  submitted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses (survey_definition_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_project ON survey_responses (csr_project_id);
