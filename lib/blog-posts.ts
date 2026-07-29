export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "what-schedule-vii-means-for-csr-spend",
    title: "What Schedule VII Really Means for Corporate CSR Spend",
    excerpt:
      "A plain-language walkthrough of Section 135 applicability, the 2% rule, and what actually counts as an eligible CSR activity.",
    date: "2026-05-12",
    readTime: "6 min read",
    author: "NITICSR Editorial",
  },
  {
    slug: "csr-compliance-checklist",
    title: "A CSR Compliance Checklist for Indian Companies",
    excerpt:
      "The recurring filings, deadlines, and documentation CSR and compliance teams need to stay on top of every year.",
    date: "2026-06-03",
    readTime: "5 min read",
    author: "NITICSR Editorial",
  },
  {
    slug: "ngo-due-diligence-guide",
    title: "How to Do NGO Due Diligence Before You Fund a Partner",
    excerpt:
      "The verification checks worth doing before committing CSR budget to a new NGO partnership — and why they matter at audit time.",
    date: "2026-06-24",
    readTime: "7 min read",
    author: "NITICSR Editorial",
  },
];
