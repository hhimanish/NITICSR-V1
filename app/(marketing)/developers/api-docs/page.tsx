import type { Metadata } from "next";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FadeIn } from "@/components/motion/fade-in";
import { Breadcrumbs } from "@/components/design-system/breadcrumbs";
import { cn } from "@/lib/utils";
import { loadOpenApiSpec } from "@/lib/openapi";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "REST API reference for the NITICSR platform.",
};

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-info/15 text-info",
  POST: "bg-secondary/15 text-secondary",
  PATCH: "bg-accent/15 text-accent-foreground",
  PUT: "bg-accent/15 text-accent-foreground",
  DELETE: "bg-destructive/15 text-destructive",
};

export default function ApiDocsPage() {
  const spec = loadOpenApiSpec();

  return (
    <section className="py-20 sm:py-28">
      <Breadcrumbs items={[{ label: "Developers", href: "/developers" }, { label: "API Documentation", href: "/developers/api-docs" }]} />
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
        <FadeIn>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{spec.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Version {spec.version}</p>
          <p className="mt-4 max-w-2xl text-muted-foreground">{spec.description}</p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-12 space-y-6">
            {spec.paths.map((pathEntry) => (
              <div key={pathEntry.path} className="rounded-2xl border border-border bg-card p-2 shadow-sm">
                <p className="px-4 py-3 font-mono text-sm text-foreground">{pathEntry.path}</p>
                <Accordion className="px-2 pb-2">
                  {pathEntry.operations.map((op) => (
                    <AccordionItem key={`${pathEntry.path}-${op.method}`} value={`${pathEntry.path}-${op.method}`}>
                      <AccordionTrigger className="px-2">
                        <span className={cn("mr-3 rounded-md px-2 py-0.5 font-mono text-xs font-semibold", METHOD_STYLES[op.method])}>
                          {op.method}
                        </span>
                        <span className="text-sm">{op.summary}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-2">
                        {op.parameters.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Parameters
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {op.parameters.map((param) => (
                                <li key={param.name} className="flex items-center gap-2 text-sm">
                                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{param.name}</code>
                                  <span className="text-xs text-muted-foreground">
                                    {param.in} · {param.type}
                                    {param.required && " · required"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {op.hasRequestBody && (
                          <p className="mb-4 text-sm text-muted-foreground">Requires a JSON request body.</p>
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Responses
                          </p>
                          <ul className="mt-2 space-y-1">
                            {op.responses.map((res) => (
                              <li key={res.status} className="text-sm text-muted-foreground">
                                <code className="font-mono text-xs text-foreground">{res.status}</code> — {res.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
