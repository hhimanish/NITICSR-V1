/** Mirrors the seed data in db/migrations/003_taxonomies.sql — kept as a
 * static constant so client components can render a picker without a
 * network round-trip for a list that changes essentially never. */
export const CSR_CATEGORIES = [
  { key: "education", label: "Education" },
  { key: "healthcare", label: "Healthcare" },
  { key: "rural_development", label: "Rural Development" },
  { key: "environment", label: "Environment & Sustainability" },
  { key: "water_sanitation", label: "Water & Sanitation" },
  { key: "skill_development", label: "Skill Development & Livelihoods" },
  { key: "gender_equality", label: "Women Empowerment & Gender Equality" },
  { key: "disaster_relief", label: "Disaster Relief" },
  { key: "arts_heritage", label: "Arts, Culture & Heritage" },
  { key: "poverty_hunger", label: "Poverty Alleviation & Hunger" },
] as const;

export const INDIAN_STATES_FOR_FILTERS = [
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
