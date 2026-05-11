export type WorldLocation = {
  id?: number | string;
  name?: string;
  key?: string;
  description?: string | null;
  image_url?: string | null;
  x?: number;
  y?: number;
  forecast?: unknown[];
};

export type LocationReference = {
  id?: number | string | null;
  key?: string | null;
  name?: string | null;
};

export type DropSourceWithLocation = {
  location?: unknown;
  location_id?: number | string | null;
  location_key?: string | null;
};

export type LocationOption = {
  value: string;
  label: string;
  count: number;
};

export type GatheredResourceSource = {
  name: string;
  level: number;
};

export type GatheredResourceLocation = {
  key: string;
  name: string;
  level: number;
};

export const ALL_LOCATION_OPTION: LocationOption = {
  value: "ALL",
  label: "All locations",
  count: 0,
};

export const LOCATION_NAMES: Record<string, string> = {
  "bluebell-hollow": "Bluebell Hollow",
  "whispering-woods": "Whispering Woods",
  eldoria: "Eldoria",
  "crystal-caverns": "Crystal Caverns",
  "skyreach-peak": "Skyreach Peak",
  "enchanted-oasis": "Enchanted Oasis",
  "floating-gardens-of-aetheria": "Floating Gardens of Aetheria",
  "celestial-observatory": "Celestial Observatory",
  "isle-of-whispers": "Isle of Whispers",
  "the-citadel": "The Citadel",
};

export const LOCATION_RESOURCES: Record<string, GatheredResourceSource[]> = {
  "bluebell-hollow": [
    { name: "Oak Log", level: 1 },
    { name: "Yew Log", level: 5 },
    { name: "Coal Ore", level: 1 },
    { name: "Tin Ore", level: 1 },
    { name: "Cod", level: 1 },
    { name: "Salmon", level: 3 },
    { name: "Tuna", level: 5 },
    { name: "Limestone", level: 10 },
  ],
  "whispering-woods": [
    { name: "Oak Log", level: 1 },
    { name: "Yew Log", level: 5 },
    { name: "Spruce Log", level: 10 },
    { name: "Birch Log", level: 15 },
    { name: "Copper Ore", level: 5 },
    { name: "Cod", level: 1 },
    { name: "Salmon", level: 3 },
    { name: "Tuna", level: 5 },
    { name: "Trout", level: 8 },
    { name: "Perch", level: 11 },
  ],
  eldoria: [
    { name: "Spruce Log", level: 10 },
    { name: "Iron Ore", level: 10 },
    { name: "Lead Ore", level: 15 },
    { name: "Cod", level: 1 },
    { name: "Salmon", level: 3 },
    { name: "Tuna", level: 5 },
    { name: "Trout", level: 8 },
    { name: "Perch", level: 11 },
    { name: "Herring", level: 15 },
    { name: "Limestone", level: 10 },
  ],
  "crystal-caverns": [
    { name: "Birch Log", level: 15 },
    { name: "Banyan Log", level: 25 },
    { name: "Coal Ore", level: 1 },
    { name: "Tin Ore", level: 1 },
    { name: "Lead Ore", level: 15 },
    { name: "Steel Ore", level: 25 },
    { name: "Cod", level: 1 },
    { name: "Salmon", level: 3 },
    { name: "Tuna", level: 5 },
    { name: "Perch", level: 11 },
    { name: "Herring", level: 15 },
    { name: "Sardines", level: 25 },
  ],
  "skyreach-peak": [
    { name: "Birch Log", level: 15 },
    { name: "Banyan Log", level: 25 },
    { name: "Maple Log", level: 40 },
    { name: "Iron Ore", level: 10 },
    { name: "Lead Ore", level: 15 },
    { name: "Steel Ore", level: 25 },
    { name: "Mercury Ore", level: 40 },
    { name: "Herring", level: 15 },
    { name: "Sardines", level: 25 },
    { name: "Lobster", level: 30 },
  ],
  "enchanted-oasis": [
    { name: "Yew Log", level: 5 },
    { name: "Banyan Log", level: 25 },
    { name: "Maple Log", level: 40 },
    { name: "Copper Ore", level: 5 },
    { name: "Steel Ore", level: 25 },
    { name: "Mercury Ore", level: 40 },
    { name: "Lobster", level: 30 },
    { name: "Turtle", level: 50 },
    { name: "Limestone", level: 10 },
  ],
  "floating-gardens-of-aetheria": [
    { name: "Maple Log", level: 40 },
    { name: "Willow Log", level: 60 },
    { name: "Coal Ore", level: 1 },
    { name: "Lead Ore", level: 15 },
    { name: "Mercury Ore", level: 40 },
    { name: "Chromite Ore", level: 60 },
    { name: "Perch", level: 11 },
    { name: "Crab", level: 40 },
    { name: "Turtle", level: 50 },
    { name: "Stingray", level: 60 },
  ],
  "celestial-observatory": [
    { name: "Willow Log", level: 60 },
    { name: "Mahogany Log", level: 70 },
    { name: "Tin Ore", level: 1 },
    { name: "Chromite Ore", level: 60 },
    { name: "Crab", level: 40 },
    { name: "Turtle", level: 50 },
    { name: "Stingray", level: 60 },
    { name: "Limestone", level: 10 },
  ],
  "isle-of-whispers": [
    { name: "Willow Log", level: 60 },
    { name: "Mahogany Log", level: 70 },
    { name: "Copper Ore", level: 5 },
    { name: "Chromite Ore", level: 60 },
    { name: "Uranium Ore", level: 70 },
    { name: "Cod", level: 1 },
    { name: "Trout", level: 8 },
    { name: "Sardines", level: 25 },
    { name: "Stingray", level: 60 },
    { name: "Lantern Fish", level: 80 },
    { name: "Limestone", level: 10 },
  ],
  "the-citadel": [
    { name: "Mahogany Log", level: 70 },
    { name: "Mystical Log", level: 90 },
    { name: "Iron Ore", level: 10 },
    { name: "Uranium Ore", level: 70 },
    { name: "Mystic Ore", level: 90 },
    { name: "Great White Shark", level: 90 },
  ],
};

export function getGatheredResourcesForLocation(locationKey: string) {
  return LOCATION_RESOURCES[normalizeLocationKey(locationKey)] || [];
}

export function getResourceLocationsForItem(itemName: string): GatheredResourceLocation[] {
  const normalizedName = itemName.trim().toLowerCase();
  if (!normalizedName) return [];

  return Object.entries(LOCATION_RESOURCES)
    .flatMap(([key, resources]) => resources
      .filter((resource) => resource.name.toLowerCase() === normalizedName)
      .map((resource) => ({
        key,
        name: LOCATION_NAMES[key] || key,
        level: resource.level,
      })))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export function normalizeLocationKey(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const location = value as Record<string, unknown>;
    return normalizeLocationKey(location.key ?? location.name ?? location.id);
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getLocationName(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const location = value as Record<string, unknown>;
    return String(location.name ?? location.key ?? location.id ?? "").trim();
  }
  return String(value).trim();
}

export function getDropSourceLocation(source: DropSourceWithLocation): LocationReference {
  const locationObject = source.location && typeof source.location === "object"
    ? source.location as Record<string, unknown>
    : null;
  const id = source.location_id ?? (locationObject?.id as number | string | undefined);
  const rawKey = source.location_key ?? (locationObject?.key as string | undefined);
  const rawName = getLocationName(source.location);
  const key = normalizeLocationKey(rawKey || rawName || id);

  return {
    id: id ?? null,
    key: key || null,
    name: rawName || (rawKey ? String(rawKey) : null),
  };
}

export function dropSourceMatchesLocation(source: DropSourceWithLocation, selectedLocation: string) {
  if (selectedLocation === ALL_LOCATION_OPTION.value) return true;
  const selectedKey = normalizeLocationKey(selectedLocation);
  if (!selectedKey) return true;
  const sourceLocation = getDropSourceLocation(source);
  return sourceLocation.key === selectedKey
    || normalizeLocationKey(sourceLocation.name) === selectedKey
    || normalizeLocationKey(sourceLocation.id) === selectedKey;
}

export function buildDropLocationOptions(
  usageMap: Record<string, { dropped_by?: unknown[] }>,
  includeGatheredResources = false,
) {
  const byLocation = new Map<string, LocationOption>();

  for (const entry of Object.values(usageMap)) {
    if (!Array.isArray(entry.dropped_by)) continue;
    for (const source of entry.dropped_by) {
      if (!source || typeof source !== "object") continue;
      const location = getDropSourceLocation(source as DropSourceWithLocation);
      if (!location.key || !location.name || location.name === "Unknown") continue;

      const existing = byLocation.get(location.key);
      if (existing) {
        existing.count += 1;
      } else {
        byLocation.set(location.key, {
          value: location.key,
          label: location.name,
          count: 1,
        });
      }
    }
  }

  if (includeGatheredResources) {
    for (const [key, resources] of Object.entries(LOCATION_RESOURCES)) {
      const existing = byLocation.get(key);
      if (existing) {
        existing.count += resources.length;
      } else {
        byLocation.set(key, {
          value: key,
          label: LOCATION_NAMES[key] || key,
          count: resources.length,
        });
      }
    }
  }

  return [
    { ...ALL_LOCATION_OPTION, count: Array.from(byLocation.values()).reduce((sum, option) => sum + option.count, 0) },
    ...Array.from(byLocation.values()).sort((a, b) => a.label.localeCompare(b.label)),
  ];
}
