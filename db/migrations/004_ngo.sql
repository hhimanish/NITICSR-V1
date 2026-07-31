CREATE TABLE IF NOT EXISTS ngo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  registration_number TEXT,
  registration_type TEXT CHECK (registration_type IN ('trust', 'society', 'section8')),
  pan TEXT,
  established_year SMALLINT,
  description TEXT,
  website TEXT,
  headquarters_state TEXT,
  operating_states TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ngo_cause_areas (
  ngo_profile_id UUID NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  csr_category_id UUID NOT NULL REFERENCES csr_categories(id),
  PRIMARY KEY (ngo_profile_id, csr_category_id)
);

CREATE TABLE IF NOT EXISTS ngo_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_profile_id UUID NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (
    document_type IN ('12A', '80G', 'FCRA', 'CSR1', 'PAN', 'REGISTRATION_CERTIFICATE', 'OTHER')
  ),
  file_url TEXT,
  issued_at DATE,
  expires_at DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'rejected')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ngo_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_profile_id UUID NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_body TEXT,
  issued_at DATE,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ngo_trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_profile_id UUID NOT NULL UNIQUE REFERENCES ngo_profiles(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  verification_component SMALLINT CHECK (verification_component BETWEEN 0 AND 100),
  financial_component SMALLINT CHECK (financial_component BETWEEN 0 AND 100),
  governance_component SMALLINT CHECK (governance_component BETWEEN 0 AND 100),
  audit_component SMALLINT CHECK (audit_component BETWEEN 0 AND 100),
  project_success_component SMALLINT CHECK (project_success_component BETWEEN 0 AND 100),
  notes TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ngo_documents_profile ON ngo_documents (ngo_profile_id);
CREATE INDEX IF NOT EXISTS idx_ngo_documents_status ON ngo_documents (status);
CREATE INDEX IF NOT EXISTS idx_ngo_documents_expiring ON ngo_documents (expires_at) WHERE status = 'verified';
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_states ON ngo_profiles USING GIN (operating_states);

DROP TRIGGER IF EXISTS trg_ngo_profiles_updated_at ON ngo_profiles;
CREATE TRIGGER trg_ngo_profiles_updated_at BEFORE UPDATE ON ngo_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_ngo_documents_updated_at ON ngo_documents;
CREATE TRIGGER trg_ngo_documents_updated_at BEFORE UPDATE ON ngo_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
