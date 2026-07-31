export type ProductUpdate = {
  date: string;
  title: string;
  tag: "New" | "Improved" | "Fixed";
  description: string;
};

export const productUpdates: ProductUpdate[] = [
  {
    date: "2026-07-29",
    title: "Enterprise backend foundation",
    tag: "New",
    description:
      "Multi-tenant Postgres schema, permission-based RBAC, and versioned REST APIs for organizations, NGO profiles, CSR projects, and verification requests.",
  },
  {
    date: "2026-07-27",
    title: "AI matchmaking demo",
    tag: "New",
    description: "Live NGO matchmaking demo powered by Cerebras gpt-oss-20b, streaming ranked results in real time.",
  },
  {
    date: "2026-07-24",
    title: "Public platform launch",
    tag: "New",
    description: "Marketing site, Knowledge Center, and auth-gated Corporate/NGO workspace skeletons.",
  },
];
