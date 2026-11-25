import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  enemyMatchesFilter,
  formatGold,
  formatWindow,
  levelMatches,
  matchTone,
  LEVEL_OPTIONS,
  MATCH_OPTIONS,
  SORT_OPTIONS,
} from "@/app/enemies/types";

describe("enemies architecture and modularization contracts", () => {
  const enemiesDir = path.join(process.cwd(), "src", "app", "enemies");
  const pagePath = path.join(enemiesDir, "page.tsx");
  const hookPath = path.join(enemiesDir, "hooks", "useEnemiesState.ts");
  const componentsDir = path.join(enemiesDir, "components");

  it("orchestrator page.tsx is under 150 lines", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(150);
  });

  it("exports dedicated custom hook useEnemiesState", () => {
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("export function useEnemiesState()");
    expect(content).toContain("buildEnrichedEnemies");
    expect(content).toContain("compareEnemiesByProgression");
  });

  it("contains all extracted feature components and scoped CSS module", () => {
    const requiredFiles = [
      "EnemyDetailModal.tsx",
      "EnemiesHeader.tsx",
      "EnemiesControls.tsx",
      "EnemyCard.tsx",
      "EnemiesGrid.tsx",
      "EnemiesPagination.tsx",
    ];
    for (const file of requiredFiles) {
      expect(existsSync(path.join(componentsDir, file))).toBe(true);
    }
    expect(existsSync(path.join(componentsDir, "CustomSelect.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDir, "EnemiesStyles.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDir, "PreferencePills.tsx"))).toBe(false);

    const cssPath = path.join(enemiesDir, "Enemies.module.css");
    expect(existsSync(cssPath)).toBe(true);
    const css = readFileSync(cssPath, "utf-8");
    expect(css).toContain("--border-focus");
    expect(css).toContain("44px");
    expect(css).toContain("prefers-reduced-motion");

    for (const file of requiredFiles) {
      const content = readFileSync(path.join(componentsDir, file), "utf-8");
      expect(content).not.toContain('from "lucide-react"');
      expect(content).not.toContain("<style jsx");
    }
  });

  it("preserves gold formatting invariant", () => {
    expect(formatGold(0)).toBe("-");
    expect(formatGold(-10)).toBe("-");
    expect(formatGold(Number.NaN)).toBe("-");
    expect(formatGold(1500)).toBe("1,500g");
    expect(formatGold(42.8)).toBe("43g");
  });

  it("preserves weather match filter logic", () => {
    const favorableEnemy = { currentWeatherMatch: "loves" } as any;
    const penalizedEnemy = { currentWeatherMatch: "hates" } as any;
    const neutralEnemy = { currentWeatherMatch: "neutral" } as any;

    expect(enemyMatchesFilter(favorableEnemy, "all")).toBe(true);
    expect(enemyMatchesFilter(favorableEnemy, "favorable")).toBe(true);
    expect(enemyMatchesFilter(favorableEnemy, "penalized")).toBe(false);
    expect(enemyMatchesFilter(favorableEnemy, "loves")).toBe(true);
    expect(enemyMatchesFilter(favorableEnemy, "likes")).toBe(false);

    expect(enemyMatchesFilter(penalizedEnemy, "penalized")).toBe(true);
    expect(enemyMatchesFilter(penalizedEnemy, "favorable")).toBe(false);

    expect(enemyMatchesFilter(neutralEnemy, "neutral")).toBe(true);
  });

  it("preserves level band filtering", () => {
    const lowEnemy = { level: 5 } as any;
    const midEnemy = { level: 35 } as any;
    const highEnemy = { level: 90 } as any;

    expect(levelMatches(lowEnemy, "all")).toBe(true);
    expect(levelMatches(lowEnemy, "1-10")).toBe(true);
    expect(levelMatches(lowEnemy, "11-25")).toBe(false);

    expect(levelMatches(midEnemy, "26-50")).toBe(true);
    expect(levelMatches(highEnemy, "76-100")).toBe(true);
  });

  it("preserves tone and forecast window formatting", () => {
    expect(matchTone("loves")).toBe("good");
    expect(matchTone("likes")).toBe("good");
    expect(matchTone("dislikes")).toBe("bad");
    expect(matchTone("hates")).toBe("bad");
    expect(matchTone("neutral")).toBe("neutral");
    expect(matchTone("unknown")).toBe("muted");

    const activeEnemy = {
      currentWeatherMatch: "loves",
      currentWeather: { name: "Rain" },
    } as any;
    expect(formatWindow(activeEnemy)).toBe("Rain active now");

    const noForecastEnemy = {
      currentWeatherMatch: "neutral",
      nextFavorableWeather: null,
    } as any;
    expect(formatWindow(noForecastEnemy)).toBe("No forecast match");
  });

  it("retains sort and filter option registries", () => {
    expect(SORT_OPTIONS.map((o) => o.value)).toEqual(["level", "name", "location", "lootCount", "lootEv"]);
    expect(MATCH_OPTIONS.length).toBe(9);
    expect(LEVEL_OPTIONS.length).toBe(6);
  });
});
