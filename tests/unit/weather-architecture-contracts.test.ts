import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildWeatherPreferenceIndex,
  formatForecastTime,
  formatPercent,
  modifierTone,
  preferenceIncludes,
  weatherMatches,
} from "@/app/weather/types";
import { WEATHER_DATA } from "@/constants/weatherData";

describe("weather architecture and modularization contracts", () => {
  const weatherDir = path.join(process.cwd(), "src", "app", "weather");
  const pagePath = path.join(weatherDir, "page.tsx");
  const hookPath = path.join(weatherDir, "hooks", "useWeatherState.ts");
  const componentsDir = path.join(weatherDir, "components");

  it("orchestrator page.tsx is under 150 lines", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(150);
  });

  it("exports dedicated custom hook useWeatherState", () => {
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("export function useWeatherState()");
    expect(content).toContain("buildEnrichedEnemies");
    expect(content).toContain("buildEnrichedLocations");
  });

  it("contains all extracted feature components and styles", () => {
    const requiredFiles = [
      "WeatherCanvas.tsx",
      "WeatherHeader.tsx",
      "WeatherHero.tsx",
      "ForecastTimelineStrip.tsx",
      "ForecastContext.tsx",
      "CurrentEnemyContext.tsx",
      "EnemyPreferences.tsx",
      "WeatherMechanicsAside.tsx",
      "WeatherStyles.tsx",
    ];
    for (const file of requiredFiles) {
      expect(existsSync(path.join(componentsDir, file))).toBe(true);
    }
  });

  it("preserves strict percentage and modifier tone calculations", () => {
    expect(formatPercent(null)).toBe("0%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(15)).toBe("+15%");
    expect(formatPercent(-10)).toBe("-10%");

    expect(modifierTone(null)).toBe("neutral");
    expect(modifierTone(0)).toBe("neutral");
    expect(modifierTone(20)).toBe("pos");
    expect(modifierTone(-5)).toBe("neg");
  });

  it("preserves weather matching logic and normalization", () => {
    const rainWeather = WEATHER_DATA.find((w) => w.id === "rain")!;
    expect(rainWeather).toBeDefined();

    expect(weatherMatches({ name: "Rain" }, rainWeather)).toBe(true);
    expect(weatherMatches({ key: "rain" }, rainWeather)).toBe(true);
    expect(weatherMatches({ icon: "rain" }, rainWeather)).toBe(true);
    expect(weatherMatches({ name: "Clear" }, rainWeather)).toBe(false);
    expect(weatherMatches(null, rainWeather)).toBe(false);
  });

  it("preserves enemy preference index building", () => {
    const enemies = [
      {
        id: "1",
        name: "Fire Imp",
        level: 10,
        weatherPreference: {
          loves: ["Heatwave"],
          likes: ["Clear"],
          neutral: [],
          dislikes: ["Rain"],
          hates: ["Snow"],
        },
      },
    ] as any;

    const index = buildWeatherPreferenceIndex(enemies);
    const heatwave = index.get("heatwave");
    expect(heatwave).toBeDefined();
    expect(heatwave?.loves[0].name).toBe("Fire Imp");

    const snow = index.get("snow");
    expect(snow).toBeDefined();
    expect(snow?.hates[0].name).toBe("Fire Imp");

    expect(preferenceIncludes(enemies[0], "loves", "Heatwave")).toBe(true);
    expect(preferenceIncludes(enemies[0], "loves", "Rain")).toBe(false);
  });

  it("formats forecast time strings safely", () => {
    expect(formatForecastTime(null)).toBe("No window");
    expect(formatForecastTime({} as any)).toBe("Window pending");
    expect(formatForecastTime({ window: "8:00 AM - 12:00 PM" } as any)).toBe("8:00 AM - 12:00 PM");
  });
});
