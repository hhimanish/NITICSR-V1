-- Adds coordinates for headquarters location, enabling real radius search
-- over NGO profiles (see /api/v1/ngo-profiles) — same plain-Haversine
-- approach used for csr_projects, no PostGIS required at this scale.

ALTER TABLE ngo_profiles
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);
