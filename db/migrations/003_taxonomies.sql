-- Reference taxonomies: Schedule VII cause categories and the 17 UN SDGs.
-- These are lookup tables other domain tables reference by FK.

CREATE TABLE IF NOT EXISTS csr_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  schedule_vii_clause TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sdgs (
  id SMALLINT PRIMARY KEY, -- 1-17
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL
);

INSERT INTO csr_categories (key, name, schedule_vii_clause) VALUES
  ('education', 'Education', 'Clause (ii)'),
  ('healthcare', 'Healthcare', 'Clause (i)'),
  ('rural_development', 'Rural Development', 'Clause (x)'),
  ('environment', 'Environment & Sustainability', 'Clause (iv)'),
  ('water_sanitation', 'Water & Sanitation', 'Clause (i)'),
  ('skill_development', 'Skill Development & Livelihoods', 'Clause (ii)'),
  ('gender_equality', 'Women Empowerment & Gender Equality', 'Clause (iii)'),
  ('disaster_relief', 'Disaster Relief', 'Clause (xii)'),
  ('arts_heritage', 'Arts, Culture & Heritage', 'Clause (v)'),
  ('poverty_hunger', 'Poverty Alleviation & Hunger', 'Clause (i)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO sdgs (id, name, color_hex) VALUES
  (1, 'No Poverty', '#E5243B'),
  (2, 'Zero Hunger', '#DDA63A'),
  (3, 'Good Health and Well-being', '#4C9F38'),
  (4, 'Quality Education', '#C5192D'),
  (5, 'Gender Equality', '#FF3A21'),
  (6, 'Clean Water and Sanitation', '#26BDE2'),
  (7, 'Affordable and Clean Energy', '#FCC30B'),
  (8, 'Decent Work and Economic Growth', '#A21942'),
  (9, 'Industry, Innovation and Infrastructure', '#FD6925'),
  (10, 'Reduced Inequalities', '#DD1367'),
  (11, 'Sustainable Cities and Communities', '#FD9D24'),
  (12, 'Responsible Consumption and Production', '#BF8B2E'),
  (13, 'Climate Action', '#3F7E44'),
  (14, 'Life Below Water', '#0A97D9'),
  (15, 'Life on Land', '#56C02B'),
  (16, 'Peace, Justice and Strong Institutions', '#00689D'),
  (17, 'Partnerships for the Goals', '#19486A')
ON CONFLICT (id) DO NOTHING;
