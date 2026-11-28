import type { ZenithIconName } from "@/components/icons/ZenithIcon";
import type { IconConcept } from "@/lib/icons";
import { NAV_GROUPS } from "@/lib/navigation";

export const NAV_ICON_TO_CONCEPT: Record<string, IconConcept> = {
  alchemy: "alchemy",
  archive: "archiveLayers",
  bell: "notifications",
  bis: "bis",
  boss: "boss",
  calculator: "calculator",
  castle: "dungeon",
  combat: "combat",
  conquest: "conquest",
  crafting: "craftingQueue",
  craftingQueue: "craftingQueue",
  dashboard: "dashboard",
  database: "database",
  economy: "gold",
  enemy: "enemy",
  forge: "forge",
  forgeCraft: "craftTool",
  forgeLessons: "forgeLessons",
  guild: "guilds",
  housing: "housing",
  items: "items",
  lore: "lore",
  map: "map",
  market: "market",
  museum: "museum",
  mythicAlchemy: "mythicAlchemy",
  patchNotes: "scroll",
  petCompare: "petCompare",
  pets: "pets",
  petsOwned: "petsOwned",
  profile: "profile",
  settings: "settings",
  shield: "slotShield",
  skill: "skillProfit",
  skillProfit: "skillProfit",
  spark: "whatsNew",
  weather: "weather",
  whatsNew: "whatsNew",
  world: "globe",
};

export function mapNavIconToConcept(iconName?: ZenithIconName | string): IconConcept {
  if (!iconName) return "globe";
  return NAV_ICON_TO_CONCEPT[iconName] || "globe";
}

export const ROUTE_SUMMARIES: Record<string, string> = {
  "/": "Dashboard overview with live bosses, weather, and top routes.",
  "/profiles": "Create, switch, or import character stats and loadouts.",
  "/whats-new": "Release notes and newly added Zenith Companion tools.",
  "/settings": "Theme, navigation layout, audio, and custom price overrides.",
  "/items": "Market prices, recipes, drop sources, and usage maps.",
  "/enemies": "Enemy health, combat drops, and weather preferences.",
  "/pets": "Base pet stats, evolutions, stamina, and battle zones.",
  "/pets/owned": "Track owned pets, quality bonuses, and upgrades.",
  "/pets/compare": "Side-by-side stat curves and pet team DPS checks.",
  "/guilds": "Guild rosters, conquest shares, and seasonal stats.",
  "/museum": "Missing donations, completion progress, and collection cost.",
  "/lore": "World timeline, regions, and IdleMMO archive notes.",
  "/patch-notes": "Official IdleMMO game updates and balance changes.",
  "/alchemy": "Potion profit margins, ingredients, and craft rates.",
  "/skill-profit": "Compare gathering and crafting gold/hr with essences.",
  "/alchemy/mythic": "Level 90+ mythic recipes and essence break-even profit.",
  "/crafting": "Batch shopping lists, craft fees, and gold profit.",
  "/forge/lessons": "Forge XP curves, mastery cost per level, and efficiency.",
  "/forge/craft": "Weapon forging profit, shard costs, and craft plans.",
  "/housing": "Room slots, Remote Conduit coverage, and active buffs.",
  "/bis": "Best-in-Slot gear comparison across all equipment slots.",
  "/map": "Interactive region explorer with enemies and zones.",
  "/weather": "Live zone forecasts, Magic Storms, and enemy bonuses.",
  "/dungeons": "Dungeon key costs, loot EV, and clear profitability.",
  "/bosses": "World boss timers, drop tables, and Magic Find EV.",
  "/conquest": "Territory ownership, guild control, and siege tiles.",
};

const ROUTE_KEYWORDS: Record<string, string[]> = {
  "/": ["home", "hub", "overview", "summary", "index"],
  "/profiles": ["character", "import", "hash", "alt", "gear", "stats", "backup"],
  "/whats-new": ["changelog", "releases", "updates", "version"],
  "/settings": ["preferences", "audio", "prices", "storage", "offline", "cache"],
  "/items": ["item", "market", "price", "prices", "recipe", "drop", "exchange", "auction"],
  "/enemies": ["mob", "mobs", "monster", "monsters", "combat", "bestiary", "drop"],
  "/pets": ["pet", "companion", "egg", "eggs", "wyrmshadow", "stats", "battle"],
  "/pets/owned": ["roster", "equipped", "evolution", "my pets"],
  "/pets/compare": ["compare", "versus", "vs", "team"],
  "/guilds": ["guild", "clan", "members", "roster", "marks"],
  "/museum": ["collection", "donate", "donations", "completion"],
  "/lore": ["story", "timeline", "solaris", "wiki", "codex"],
  "/patch-notes": ["patch", "update", "game updates", "changelog", "notes"],
  "/alchemy": ["potion", "potions", "vial", "crystal", "essence", "brewing"],
  "/skill-profit": ["skilling", "gathering", "mining", "woodcutting", "fishing", "smelting", "cooking", "gold"],
  "/alchemy/mythic": ["mythic", "lv90", "level 90", "90+"],
  "/crafting": ["cart", "queue", "shopping", "list", "batch"],
  "/forge/lessons": ["forge", "blacksmith", "blacksmithing", "lessons", "xp", "temper"],
  "/forge/craft": ["forge craft", "weapons", "armor", "shards", "smithing"],
  "/housing": ["house", "room", "conduit", "idle", "timer"],
  "/bis": ["best in slot", "equipment", "sword", "dagger", "bow", "armor", "shield", "upgrade"],
  "/map": ["atlas", "locations", "zones", "travel", "teleport", "world map"],
  "/weather": ["forecast", "magic storm", "rain", "snow", "heatwave", "fog", "windy"],
  "/dungeons": ["dungeon", "keys", "clear", "chest", "loot"],
  "/bosses": ["boss", "world boss", "spawn", "magic find", "mf"],
  "/conquest": ["territory", "siege", "assault", "rank", "control"],
};

export interface RouteRecoveryEntry {
  href: string;
  label: string;
  groupLabel: string;
  concept: IconConcept;
  summary: string;
  keywords: string[];
}

export const ROUTE_RECOVERY_ENTRIES: RouteRecoveryEntry[] = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    href: item.href,
    label: item.label,
    groupLabel: group.label,
    concept: mapNavIconToConcept(item.icon),
    summary: ROUTE_SUMMARIES[item.href] || item.label,
    keywords: ROUTE_KEYWORDS[item.href] || [],
  })),
);

function editDistanceAtMostTwo(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const cols = b.length + 1;
  let prev = Array.from({ length: cols }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr.push(val);
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > 2) return 3;
    prev = curr;
  }
  return prev[b.length];
}

function scoreEntryAgainstTokens(entry: RouteRecoveryEntry, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const hrefParts = entry.href.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const labelParts = entry.label.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const keywordParts = entry.keywords.flatMap((kw) => kw.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const summaryText = entry.summary.toLowerCase();

  let score = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.length < 2) continue;
    const weight = i === 0 ? 3 : 1;
    if (hrefParts.includes(token)) {
      score += 14 * weight;
      continue;
    }
    if (labelParts.includes(token)) {
      score += 12 * weight;
      continue;
    }
    if (keywordParts.includes(token)) {
      score += 10 * weight;
      continue;
    }
    if (
      hrefParts.some((p) => p.startsWith(token) || token.startsWith(p)) ||
      labelParts.some((p) => p.startsWith(token) || token.startsWith(p))
    ) {
      score += 8 * weight;
      continue;
    }
    if (
      keywordParts.some((p) => p.startsWith(token) || p.includes(token)) ||
      summaryText.includes(token)
    ) {
      score += 5 * weight;
      continue;
    }
    if (token.length >= 4) {
      const bestHrefDist = Math.min(...hrefParts.map((p) => editDistanceAtMostTwo(token, p)));
      const bestLabelDist = Math.min(...labelParts.map((p) => editDistanceAtMostTwo(token, p)));
      if (bestHrefDist <= 2) {
        score += (4 - bestHrefDist) * 2 * weight;
        continue;
      }
      if (bestLabelDist <= 2) {
        score += (3 - bestLabelDist) * 2 * weight;
        continue;
      }
      const bestKeywordDist = keywordParts.length
        ? Math.min(...keywordParts.map((p) => editDistanceAtMostTwo(token, p)))
        : 3;
      if (bestKeywordDist <= 2) {
        score += (3 - bestKeywordDist) * weight;
      }
    }
  }
  return score;
}

/**
 * Matches an attempted mistyped/legacy URL pathname to the closest real Zenith routes.
 */
export function suggestRoutesForPath(pathname: string, limit = 3): RouteRecoveryEntry[] {
  const cleanPath = (pathname || "/").split(/[?#]/)[0].toLowerCase();
  const tokens = cleanPath.split(/[^a-z0-9]+/).filter(Boolean);

  if (tokens.length === 0) {
    return ROUTE_RECOVERY_ENTRIES.filter((entry) =>
      ["/", "/items", "/skill-profit"].includes(entry.href),
    ).slice(0, limit);
  }

  const scored = ROUTE_RECOVERY_ENTRIES.filter((entry) => entry.href !== "/")
    .map((entry) => ({
      entry,
      score: scoreEntryAgainstTokens(entry, tokens),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit)
    .map((item) => item.entry);

  if (scored.length > 0) {
    return scored;
  }

  return ROUTE_RECOVERY_ENTRIES.filter((entry) =>
    ["/items", "/skill-profit", "/bosses", "/profiles"].includes(entry.href),
  ).slice(0, limit);
}

/**
 * Filters all 25 Zenith routes by user search text.
 */
export function filterRoutesByQuery(query: string): RouteRecoveryEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return ROUTE_RECOVERY_ENTRIES;
  const tokens = trimmed.split(/\s+/).filter(Boolean);

  return ROUTE_RECOVERY_ENTRIES.map((entry) => {
    const haystack = [
      entry.label,
      entry.href,
      entry.groupLabel,
      entry.summary,
      ...entry.keywords,
    ]
      .join(" ")
      .toLowerCase();
    const matchesAll = tokens.every((t) => haystack.includes(t));
    const score = matchesAll ? scoreEntryAgainstTokens(entry, tokens) + 1 : 0;
    return { entry, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .map((item) => item.entry);
}

const TRANSIENT_LOCAL_KEYS = ["zenith.routeVisits.v1", "zenith.profileImport.cache.v1"] as const;

/**
 * Safely clears only transient UI/SW caches without touching character profiles,
 * preferences, crafting queues, or forge planner data.
 */
export async function clearTransientUiCache(): Promise<number> {
  let clearedCount = 0;

  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage && window.sessionStorage.length > 0) {
        clearedCount += window.sessionStorage.length;
        window.sessionStorage.clear();
      }
    } catch {
      // Ignore storage restrictions
    }

    try {
      for (const key of TRANSIENT_LOCAL_KEYS) {
        if (window.localStorage.getItem(key) !== null) {
          window.localStorage.removeItem(key);
          clearedCount += 1;
        }
      }
    } catch {
      // Ignore storage restrictions
    }

    try {
      if ("caches" in window) {
        const names = await window.caches.keys();
        for (const name of names) {
          if (name.startsWith("zenith-offline-")) {
            const removed = await window.caches.delete(name);
            if (removed) clearedCount += 1;
          }
        }
      }
    } catch {
      // Ignore Cache API restrictions
    }
  }

  return clearedCount;
}
