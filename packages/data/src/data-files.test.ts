import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateSourcedValue, type SourcedValue } from "./schema";

const DATA_DIR = join(__dirname, "..", "data");

function jsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? jsonFiles(p) : p.endsWith(".json") ? [p] : [];
  });
}

describe("데이터 파일 형식", () => {
  const files = jsonFiles(DATA_DIR);
  it("데이터 파일이 있다", () => expect(files.length).toBeGreaterThan(0));
  for (const file of files) {
    it(file.slice(DATA_DIR.length + 1), () => {
      const doc = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
      expect(typeof doc.topic).toBe("string");
      const errors: string[] = [];
      for (const section of ["values", "rules"] as const) {
        const entries = (doc[section] ?? {}) as Record<string, SourcedValue<unknown>>;
        for (const [key, v] of Object.entries(entries)) errors.push(...validateSourcedValue(v, `${section}.${key}`));
      }
      expect(errors).toEqual([]);
    });
  }
});
