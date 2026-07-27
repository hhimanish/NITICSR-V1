/**
 * Scans an accumulating text buffer for complete top-level `{ ... }` objects
 * (e.g. the elements of a streamed JSON array) and yields each one, parsed
 * and validated, the moment its closing brace arrives — without ever
 * exposing partial/invalid JSON to the caller.
 */
export function createIncrementalObjectParser<T>(validate: (raw: unknown) => T | null) {
  let buffer = "";
  let cursor = 0;
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escapeNext = false;

  function feed(chunk: string): T[] {
    buffer += chunk;
    const emitted: T[] = [];

    for (; cursor < buffer.length; cursor++) {
      const char = buffer[cursor];

      if (inString) {
        if (escapeNext) {
          escapeNext = false;
        } else if (char === "\\") {
          escapeNext = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === "{") {
        if (depth === 0) objectStart = cursor;
        depth++;
        continue;
      }

      if (char === "}") {
        depth = Math.max(0, depth - 1);
        if (depth === 0 && objectStart >= 0) {
          const raw = buffer.slice(objectStart, cursor + 1);
          objectStart = -1;
          try {
            const validated = validate(JSON.parse(raw));
            if (validated) emitted.push(validated);
          } catch {
            // Malformed fragment — skip rather than surface broken JSON.
          }
        }
      }
    }

    return emitted;
  }

  return { feed };
}
