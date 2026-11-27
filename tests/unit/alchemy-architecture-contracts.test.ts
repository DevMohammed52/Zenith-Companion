import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALCHEMY_CATEGORY_TABS, ALCHEMY_SORT_KEYS } from "@/app/alchemy/types";

const ALLOWED_MYTHIC_SUBPATH = "alchemy/mythic";

describe("Gate 1: /alchemy Architecture & Design Contracts", () => {
  it("uses scoped page.module.css without <style jsx>, StateBlock, or direct lucide-react on /alchemy", async () => {
    const { readdirSync } = await import("node:fs");
    const alchemyDir = path.join(process.cwd(), "src", "app", "alchemy");
    const mythicDir = path.join(alchemyDir, "mythic");
    const pagePath = path.join(alchemyDir, "page.tsx");
    const pageContent = readFileSync(pagePath, "utf8");

    expect(pageContent.split(/\r?\n/).length).toBeLessThan(260);
    expect(pageContent).toMatch(/page\.module\.css/);
    expect(pageContent).toContain("BackToTop");

    const collectAlchemyFiles = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (full === mythicDir || full.startsWith(mythicDir + path.sep)) continue;
        if (entry.isDirectory()) out.push(...collectAlchemyFiles(full));
        else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full);
      }
      return out;
    };

    const files = collectAlchemyFiles(alchemyDir);
    const lucideHits: string[] = [];
    const stateBlockHits: string[] = [];
    const styleJsxHits: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const rel = path.relative(alchemyDir, file).replace(/\\/g, "/");
      if (/from\s+["']lucide-react["']/.test(content)) lucideHits.push(rel);
      if (/@\/components\/StateBlock/.test(content)) stateBlockHits.push(rel);
      if (/<style\s+jsx/.test(content)) styleJsxHits.push(rel);
      expect(content, `${rel} must not use middot separators`).not.toContain("·");
    }

    const toolbarContent = readFileSync(path.join(alchemyDir, "components", "AlchemyToolbar.tsx"), "utf8");
    expect(toolbarContent).toContain("showShortcutHint={false}");

    expect(lucideHits).toEqual([]);
    expect(stateBlockHits).toEqual([]);
    expect(styleJsxHits).toEqual([]);
    expect(ALLOWED_MYTHIC_SUBPATH).toBe("alchemy/mythic");
  });

  it("removes legacy .alchemy- and .mobile-alchemy-card rules from globals.css", () => {
    const globals = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    expect(globals).not.toMatch(/\.alchemy-[a-z0-9_-]+/);
    expect(globals).not.toMatch(/\.mobile-alchemy-card/);
  });

  it("defines all recipe category tabs and EXP/session sort keys", () => {
    expect(ALCHEMY_CATEGORY_TABS.map((t) => t.id)).toEqual([
      "all",
      "potion",
      "essence_crystal",
      "stat_essence",
    ]);
    expect(ALCHEMY_SORT_KEYS).toContain("expPerHour");
    expect(ALCHEMY_SORT_KEYS).toContain("sessionProfit");
    expect(ALCHEMY_SORT_KEYS).toContain("craftsPerHour");
  });
});
