import type { MetadataRoute } from "next";

import { blogPosts } from "@/lib/blog-posts";
import { caseStudies } from "@/lib/case-studies";

const BASE_URL = "https://niticsr.com";

const staticRoutes = [
  "",
  "/platform",
  "/solutions/corporate",
  "/solutions/ngos",
  "/solutions/auditors",
  "/esg",
  "/compliance-automation",
  "/grant-management",
  "/financial-operations",
  "/project-execution",
  "/field-intelligence",
  "/risk-assurance",
  "/ai",
  "/security",
  "/pricing",
  "/resources",
  "/resources/product-updates",
  "/case-studies",
  "/blog",
  "/developers",
  "/developers/api-docs",
  "/about",
  "/careers",
  "/contact",
  "/request-demo",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const caseStudyEntries: MetadataRoute.Sitemap = caseStudies.map((study) => ({
    url: `${BASE_URL}/case-studies/${study.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries, ...caseStudyEntries];
}
