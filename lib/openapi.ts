import fs from "node:fs";
import path from "node:path";
import { load } from "js-yaml";

const HTTP_METHODS = ["get", "post", "patch", "put", "delete"] as const;

type RawOperation = {
  summary?: string;
  parameters?: { name: string; in: string; required?: boolean; schema?: { type?: string } }[];
  requestBody?: { required?: boolean };
  responses?: Record<string, { description?: string }>;
};

type RawOpenApiDoc = {
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, Partial<Record<(typeof HTTP_METHODS)[number], RawOperation>>>;
};

export type ApiOperation = {
  method: string;
  summary: string;
  parameters: { name: string; in: string; required: boolean; type: string }[];
  hasRequestBody: boolean;
  responses: { status: string; description: string }[];
};

export type ApiPath = {
  path: string;
  operations: ApiOperation[];
};

export function loadOpenApiSpec(): { title: string; version: string; description: string; paths: ApiPath[] } {
  const filePath = path.join(process.cwd(), "docs", "openapi.yaml");
  const raw = fs.readFileSync(filePath, "utf8");
  const doc = load(raw) as RawOpenApiDoc;

  const paths: ApiPath[] = Object.entries(doc.paths ?? {}).map(([pathKey, methods]) => ({
    path: pathKey,
    operations: HTTP_METHODS.filter((method) => methods?.[method]).map((method) => {
      const op = methods![method]!;
      return {
        method: method.toUpperCase(),
        summary: op.summary ?? "",
        parameters: (op.parameters ?? []).map((p) => ({
          name: p.name,
          in: p.in,
          required: Boolean(p.required),
          type: p.schema?.type ?? "string",
        })),
        hasRequestBody: Boolean(op.requestBody),
        responses: Object.entries(op.responses ?? {}).map(([status, r]) => ({
          status,
          description: r.description ?? "",
        })),
      };
    }),
  }));

  return {
    title: doc.info?.title ?? "API",
    version: doc.info?.version ?? "1.0",
    description: doc.info?.description ?? "",
    paths,
  };
}
