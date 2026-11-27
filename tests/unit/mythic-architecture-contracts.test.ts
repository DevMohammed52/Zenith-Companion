import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";

describe("Gate 1: /alchemy/mythic Architecture & Design Contracts", () => {
  it("uses scoped page.module.css without <style jsx>, StateBlock, direct lucide-react, or middots", async () => {
    assertCleanMigratedRoute({
      routeSubpath: "alchemy/mythic",
      maxPageLines: 150,
    });

    const { readdirSync } = await import("node:fs");
    const mythicDir = path.join(process.cwd(), "src", "app", "alchemy", "mythic");
    const pageContent = readFileSync(path.join(mythicDir, "page.tsx"), "utf8");
    expect(pageContent).toContain("BackToTop");

    const collectFiles = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...collectFiles(full));
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full);
      }
      return out;
    };

    for (const file of collectFiles(mythicDir)) {
      const content = readFileSync(file, "utf8");
      const rel = path.relative(mythicDir, file).replace(/\\/g, "/");
      expect(content, `${rel} must not use middot separators`).not.toContain("·");
    }

    const catalogContent = readFileSync(
      path.join(mythicDir, "components", "MythicCatalogPanel.tsx"),
      "utf8",
    );
    expect(catalogContent).toContain("showShortcutHint={false}");
  });
});
