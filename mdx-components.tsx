import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="font-heading text-3xl font-semibold tracking-tight" {...props} />,
    h2: (props) => <h2 className="mt-10 font-heading text-2xl font-semibold tracking-tight" {...props} />,
    h3: (props) => <h3 className="mt-8 font-heading text-xl font-semibold" {...props} />,
    p: (props) => <p className="mt-4 leading-relaxed text-foreground/90" {...props} />,
    ul: (props) => <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground/90" {...props} />,
    ol: (props) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-foreground/90" {...props} />,
    li: (props) => <li className="leading-relaxed" {...props} />,
    a: (props) => <a className="font-medium text-secondary underline underline-offset-4" {...props} />,
    blockquote: (props) => (
      <blockquote className="mt-6 border-l-2 border-secondary pl-4 italic text-muted-foreground" {...props} />
    ),
    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
    hr: (props) => <hr className="my-10 border-border" {...props} />,
    ...components,
  };
}
