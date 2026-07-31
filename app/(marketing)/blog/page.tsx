import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { FadeIn } from "@/components/motion/fade-in";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-reveal";
import { blogPosts } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Knowledge Center",
  description: "Practical guides on CSR compliance, NGO due diligence, and Schedule VII in India.",
  alternates: {
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

export default function BlogIndexPage() {
  return (
    <section className="py-20 sm:py-28">
      <Breadcrumbs items={[{ label: "Resources", href: "/resources" }, { label: "Knowledge Center", href: "/blog" }]} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            Knowledge Center
          </h1>
          <p className="mt-4 text-muted-foreground">
            Practical, plain-language guides on CSR compliance in India.
          </p>
        </FadeIn>

        <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <StaggerItem key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-xs text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  &middot; {post.readTime}
                </p>
                <h2 className="mt-2 font-heading text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
