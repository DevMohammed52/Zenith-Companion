import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SOURCE_FILE = path.join(ROOT, "game_info", "01_research", "enemy_weather_preferences_collected.json");
const STATIC_DATA_FILE = path.join(ROOT, "public", "static-data.json");
const OUTPUT_FILE = path.join(ROOT, "src", "data", "enemy-weather-preferences.json");

const VALID_WEATHER = new Map([
  ["clear", "Clear"],
  ["overcast", "Overcast"],
  ["rain", "Rain"],
  ["fog", "Fog"],
  ["storm", "Storm"],
  ["magic-storm", "Magic Storm"],
  ["windy", "Windy"],
  ["snow", "Snow"],
  ["heatwave", "Heatwave"],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeWeatherList(values, entry, field, errors) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => {
    const key = slug(value);
    const weather = VALID_WEATHER.get(key);
    if (!weather) errors.push(`${entry.enemy_name}: invalid ${field} weather "${value}"`);
    return weather || String(value);
  });
}

function validateNormalizedDataset(output) {
  const errors = [];
  const entries = Array.isArray(output?.entries) ? output.entries : [];
  const locationCount = new Set(entries.map((entry) => entry.location_key).filter(Boolean)).size;
  const matchedCount = entries.filter((entry) => entry.enemy_id !== null && entry.enemy_id !== undefined).length;
  const normalizedWeather = new Set([...VALID_WEATHER.values()].map(slug));

  for (const entry of entries) {
    for (const field of ["loves", "likes", "neutral", "dislikes", "hates"]) {
      const values = Array.isArray(entry[field]) ? entry[field] : [];
      for (const value of values) {
        if (!normalizedWeather.has(slug(value))) {
          errors.push(`${entry.enemy_name || "Unknown enemy"}: invalid normalized ${field} weather "${value}"`);
        }
      }
    }
  }

  if (entries.length !== 47) {
    errors.push(`expected 47 weather entries, found ${entries.length}`);
  }
  if (matchedCount !== entries.length) {
    errors.push(`matched ${matchedCount}/${entries.length} weather entries`);
  }
  if (locationCount !== 10) {
    errors.push(`expected 10 locations, found ${locationCount}`);
  }
  return { errors, entries, locationCount };
}

function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    if (!fs.existsSync(OUTPUT_FILE)) {
      throw new Error(`Missing source file and generated fallback: ${SOURCE_FILE}`);
    }

    const existingOutput = readJson(OUTPUT_FILE);
    const { errors, entries, locationCount } = validateNormalizedDataset(existingOutput);
    if (errors.length > 0) {
      console.error("Committed enemy weather preference data is invalid:");
      for (const error of errors) console.error(`- ${error}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Enemy weather preferences validated from committed data: ${entries.length} entries, ${locationCount} locations.`);
    return;
  }

  const source = readJson(SOURCE_FILE);
  const staticData = readJson(STATIC_DATA_FILE);
  const enemies = Array.isArray(staticData.enemies) ? staticData.enemies : [];
  const errors = [];

  const enemyLookup = new Map();
  for (const enemy of enemies) {
    const key = `${slug(enemy.name)}:${slug(enemy.location?.name)}`;
    enemyLookup.set(key, enemy);
  }

  const entries = (source.entries || []).map((entry) => {
    const locations = Array.isArray(entry.locations) ? entry.locations : [];
    if (locations.length !== 1) {
      errors.push(`${entry.enemy_name}: expected exactly one location, found ${locations.length}`);
    }
    const locationName = locations[0] || "";
    const matchKey = `${slug(entry.enemy_name)}:${slug(locationName)}`;
    const enemy = enemyLookup.get(matchKey);

    if (!enemy) {
      errors.push(`${entry.enemy_name}: no static-data enemy match at "${locationName}"`);
    }

    return {
      enemy_id: enemy?.id ?? null,
      enemy_name: entry.enemy_name,
      enemy_key: slug(entry.enemy_name),
      enemy_level: Number(entry.enemy_level ?? enemy?.level ?? 0),
      location_name: locationName || enemy?.location?.name || null,
      location_key: slug(locationName || enemy?.location?.name),
      confidence: entry.confidence || "unverified",
      loves: normalizeWeatherList(entry.loves, entry, "loves", errors),
      likes: normalizeWeatherList(entry.likes, entry, "likes", errors),
      neutral: normalizeWeatherList(entry.neutral, entry, "neutral", errors),
      dislikes: normalizeWeatherList(entry.dislikes, entry, "dislikes", errors),
      hates: normalizeWeatherList(entry.hates, entry, "hates", errors),
      notes: entry.notes || null,
    };
  }).sort((a, b) => a.enemy_level - b.enemy_level || a.enemy_name.localeCompare(b.enemy_name));

  const locationCount = new Set(entries.map((entry) => entry.location_key).filter(Boolean)).size;
  const matchedCount = entries.filter((entry) => entry.enemy_id !== null).length;
  const confirmedCount = entries.filter((entry) => entry.confidence === "confirmed").length;

  if (entries.length !== 47) {
    errors.push(`expected 47 weather entries, found ${entries.length}`);
  }
  if (matchedCount !== entries.length) {
    errors.push(`matched ${matchedCount}/${entries.length} weather entries`);
  }
  if (locationCount !== 10) {
    errors.push(`expected 10 locations, found ${locationCount}`);
  }

  if (errors.length > 0) {
    console.error("Enemy weather preference validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  const output = {
    meta: {
      generated_at: source.updated_at || null,
      source: "game_info/01_research/enemy_weather_preferences_collected.json",
      source_updated_at: source.updated_at || null,
      schema_version: source.schema_version || null,
      entry_count: entries.length,
      matched_count: matchedCount,
      confirmed_count: confirmedCount,
      location_count: locationCount,
      weather_names: [...VALID_WEATHER.values()],
    },
    entries,
  };

  const normalizedValidation = validateNormalizedDataset(output);
  if (normalizedValidation.errors.length > 0) {
    console.error("Generated enemy weather preference data is invalid:");
    for (const error of normalizedValidation.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Enemy weather preferences generated: ${entries.length} entries, ${locationCount} locations.`);
}

main();
