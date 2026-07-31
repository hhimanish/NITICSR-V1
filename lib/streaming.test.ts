import { describe, expect, it } from "vitest";
import { createIncrementalObjectParser } from "@/lib/streaming";

describe("createIncrementalObjectParser", () => {
  it("emits objects as soon as they close, across chunk boundaries", () => {
    const parser = createIncrementalObjectParser<{ id: string }>((raw) => {
      const obj = raw as { id?: unknown };
      return typeof obj.id === "string" ? { id: obj.id } : null;
    });

    const emitted: { id: string }[] = [];
    emitted.push(...parser.feed('[{"id": "a"}, {"i'));
    emitted.push(...parser.feed('d": "b"}, {"id": "c'));
    emitted.push(...parser.feed('"}]'));

    expect(emitted.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("ignores malformed fragments instead of throwing", () => {
    const parser = createIncrementalObjectParser<{ id: string }>((raw) => {
      const obj = raw as { id?: unknown };
      return typeof obj.id === "string" ? { id: obj.id } : null;
    });

    expect(() => parser.feed('[{"id": "a", "broken}, {"id": "b"}]')).not.toThrow();
  });

  it("does not miscount braces that appear inside string values", () => {
    const parser = createIncrementalObjectParser<{ note: string }>((raw) => {
      const obj = raw as { note?: unknown };
      return typeof obj.note === "string" ? { note: obj.note } : null;
    });

    const emitted = parser.feed('[{"note": "contains a { brace"}, {"note": "plain"}]');
    expect(emitted.map((e) => e.note)).toEqual(["contains a { brace", "plain"]);
  });

  it("rejects objects that fail validation", () => {
    const parser = createIncrementalObjectParser<{ id: string }>((raw) => {
      const obj = raw as { id?: unknown };
      return typeof obj.id === "string" ? { id: obj.id } : null;
    });

    const emitted = parser.feed('[{"nope": true}, {"id": "b"}]');
    expect(emitted.map((e) => e.id)).toEqual(["b"]);
  });
});
