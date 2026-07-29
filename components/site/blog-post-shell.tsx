import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FadeIn } from "@/components/motion/fade-in";
import { blogPosts } from "@/lib/blog-posts";

export function BlogPostShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const post = blogPosts.find((p) => p.slug === slug);

  return (
    <article className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Knowledge Center
          </Link>

          {post && (
            <p className="mt-6 text-sm text-muted-foreground">
              {new Date(post.date).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              &middot; {post.readTime} &middot; {post.author}
            </p>
          )}

          <div className="mt-2">{children}</div>
        </FadeIn>
      </div>
    </article>
  );
}
