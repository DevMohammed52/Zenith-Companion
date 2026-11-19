import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getLocationLevel,
  getLocationPosition,
  getWeatherTimeline,
  MAP_HEIGHT,
  MAP_WIDTH,
  LOCATION_FACILITIES,
  WEATHER_COLORS,
} from "@/app/map/types";

describe("map architecture and modularization contracts", () => {
  const mapDir = path.join(process.cwd(), "src", "app", "map");
  const pagePath = path.join(mapDir, "page.tsx");
  const hookPath = path.join(mapDir, "hooks", "useMapState.ts");
  const componentsDir = path.join(mapDir, "components");

  it("orchestrator page.tsx is under 150 lines", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(150);
  });

  it("exports dedicated custom hook useMapState", () => {
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("export function useMapState()");
    expect(content).toContain("buildEnrichedEnemies");
    expect(content).toContain("buildDropSummaries");
  });

  it("contains all extracted feature components and styles", () => {
    const requiredFiles = [
      "MapStage.tsx",
      "LocationDossier.tsx",
      "IntelGrid.tsx",
      "MapStyles.tsx",
    ];
    for (const file of requiredFiles) {
      expect(existsSync(path.join(componentsDir, file))).toBe(true);
    }
  });

  it("preserves strict game math and coordinate boundaries", () => {
    expect(MAP_WIDTH).toBe(1000);
    expect(MAP_HEIGHT).toBe(1000);

    const clampedLow = getLocationPosition({ id: "1", name: "Edge", x: -50, y: -50 } as any);
    expect(clampedLow.x).toBe(4);
    expect(clampedLow.y).toBe(4);

    const clampedHigh = getLocationPosition({ id: "2", name: "Far", x: 1200, y: 1500 } as any);
    expect(clampedHigh.x).toBe(96);
    expect(clampedHigh.y).toBe(96);

    const normal = getLocationPosition({ id: "3", name: "Mid", x: 500, y: 250 } as any);
    expect(normal.x).toBe(50);
    expect(normal.y).toBe(25);
  });

  it("preserves location level resolution order (enemies first, then requirements)", () => {
    const enemies = [{ level: 25 }, { level: 40 }];
    const dungeons = [{ required_level: 15 }];
    const bosses = [{ required_level: 10 }];

    expect(getLocationLevel(enemies, dungeons, bosses)).toBe(25);
    expect(getLocationLevel([], dungeons, bosses)).toBe(10);
    expect(getLocationLevel([], [], [])).toBeNull();
  });

  it("preserves weather forecast deduplication and chronological ordering", () => {
    const location = {
      forecast: [
        {
          day_name: "Tomorrow",
          date: "2026-11-20",
          weathers: [
            {
              key: "RAIN",
              starts_at: "2026-11-20T12:00:00Z",
              ends_at: "2026-11-20T16:00:00Z",
            },
            {
              key: "CLEAR",
              starts_at: "2026-11-20T08:00:00Z",
              ends_at: "2026-11-20T12:00:00Z",
            },
            {
              key: "RAIN",
              starts_at: "2026-11-20T12:00:00Z",
              ends_at: "2026-11-20T16:00:00Z",
            },
          ],
        },
      ],
    };

    const timeline = getWeatherTimeline(location);
    expect(timeline.length).toBe(2);
    expect(timeline[0].key).toBe("CLEAR");
    expect(timeline[1].key).toBe("RAIN");
  });

  it("retains facilities and weather palette invariant", () => {
    expect(LOCATION_FACILITIES["the-citadel"]).toEqual(["shrine", "bank"]);
    expect(WEATHER_COLORS.RAIN).toBe("#38bdf8");
    expect(WEATHER_COLORS.HEATWAVE).toBe("#fb923c");
  });
});
