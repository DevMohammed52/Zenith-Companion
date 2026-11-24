import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect } from "vitest";

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

export interface RouteContractOptions {
  /** Path relative to src/app, e.g. "pets" or "pets/compare" */
  routeSubpath: string;
  /** Maximum lines allowed in page.tsx orchestrator (default 150) */
  maxPageLines?: number;
  /** Allow legacy StateBlock imports while transitioning (default false for new migrations) */
  allowStateBlock?: boolean;
  /** Allow direct lucide-react imports while transitioning (default false for new migrations) */
  allowDirectLucide?: boolean;
}

/**
 * Shared architectural verification helper for migrated Zenith Companion routes.
 */
export function assertCleanMigratedRoute({
  routeSubpath,
  maxPageLines = 150,
  allowStateBlock = false,
  allowDirectLucide = false,
}: RouteContractOptions) {
  const routeDir = path.join(process.cwd(), "src", "app", ...routeSubpath.split("/"));
  const pagePath = path.join(routeDir, "page.tsx");

  expect(existsSync(pagePath), `Missing page.tsx at ${pagePath}`).toBe(true);
  const pageContent = readFileSync(pagePath, "utf8");
  const pageLines = pageContent.split(/\r?\n/).length;
  expect(pageLines, `page.tsx should stay under ${maxPageLines} lines`).toBeLessThan(maxPageLines);
  expect(pageContent, "page.tsx must consume a scoped CSS module").toMatch(/module\.css/);

  const files = collectSourceFiles(routeDir);
  const styleJsxHits: string[] = [];
  const stateBlockHits: string[] = [];
  const lucideHits: string[] = [];

  for (const file of files) {
    const rel = path.relative(routeDir, file).replace(/\\/g, "/");
    const content = readFileSync(file, "utf8");
    if (/<style\s+jsx/.test(content)) styleJsxHits.push(rel);
    if (!allowStateBlock && /@\/components\/StateBlock/.test(content)) stateBlockHits.push(rel);
    if (!allowDirectLucide && /from\s+["']lucide-react["']/.test(content)) lucideHits.push(rel);
  }

  expect(styleJsxHits, "Legacy <style jsx> blocks are prohibited on migrated routes").toEqual([]);
  if (!allowStateBlock) {
    expect(stateBlockHits, "Use Skeleton/EmptyState/Banner from @/components/ui instead of StateBlock").toEqual([]);
  }
  if (!allowDirectLucide) {
    expect(lucideHits, "Route icons through src/lib/icons.ts (<Icon>) instead of direct lucide-react imports").toEqual([]);
  }
}
