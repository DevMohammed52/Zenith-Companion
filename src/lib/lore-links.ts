import {
  LORE_ENTRIES,
  type LoreEntry,
  type LoreItemLink,
  getLoreForItem,
} from "@/data/lore";

type LoreConfidence = LoreItemLink["confidence"];
type LoreHintSource = "entity" | "location" | "drop" | "item";

export type LoreHint = {
  id: string;
  entry: LoreEntry;
  reason: string;
  confidence: LoreConfidence;
  source: LoreHintSource;
  matchedName: string;
};

type LoreNameInput = string | {
  name?: string | null;
  source?: LoreHintSource;
  reason?: string;
};

const confidenceRank: Record<LoreConfidence, number> = {
  canon: 3,
  inferred: 2,
  theory: 1,
};

const normalize = (value: string) => value
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const titleLookup = new Map(LORE_ENTRIES.map((entry) => [normalize(entry.title), entry]));

const aliasLinks: Array<{
  needle: string;
  entryId: string;
  confidence: LoreConfidence;
  reason: string;
}> = [
  { needle: "runemark", entryId: "artifacts-the-runemark-of-eternity", confidence: "canon", reason: "Runemark references tie directly to the Runemark of Eternity archive." },
  { needle: "rune", entryId: "artifacts-the-runemark-of-eternity", confidence: "inferred", reason: "Rune wording is treated as a high-confidence Runemark thread unless the item has a more exact source." },
  { needle: "citadel", entryId: "world-the-citadel", confidence: "canon", reason: "Citadel references connect to the official Citadel world record." },
  { needle: "solaris isle", entryId: "world-solaris-isle", confidence: "canon", reason: "Solaris Isle is an official world thread." },
  { needle: "valaron", entryId: "world-valaron", confidence: "canon", reason: "Valaron is the central world setting for the lore archive." },
  { needle: "arvendor", entryId: "civilizations-arvendor", confidence: "canon", reason: "Arvendor references connect to the official civilization entry." },
  { needle: "eldorian", entryId: "civilizations-eldorian", confidence: "canon", reason: "Eldorian references connect to the official civilization entry." },
  { needle: "mokthar", entryId: "civilizations-mokthar", confidence: "canon", reason: "Mokthar references connect to the official civilization entry." },
  { needle: "oakenra", entryId: "civilizations-oakenra", confidence: "canon", reason: "Oakenra references connect to the official civilization entry." },
  { needle: "ombric", entryId: "civilizations-ombric", confidence: "canon", reason: "Ombric references connect to the official civilization entry." },
  { needle: "ancient", entryId: "civilizations-the-ancients", confidence: "inferred", reason: "Ancient wording points at the Ancients thread when no exact entry is present." },
  { needle: "first people", entryId: "civilizations-the-first-people", confidence: "canon", reason: "First People references connect to the official civilization entry." },
  { needle: "siren", entryId: "bestiary-sirens", confidence: "canon", reason: "Siren references connect to the official bestiary record." },
  { needle: "kikimora", entryId: "bestiary-kikimoras", confidence: "canon", reason: "Kikimora references connect to the official bestiary record." },
  { needle: "serpent", entryId: "concepts-colossal-serpent", confidence: "theory", reason: "Serpent references are a thematic hook into the Colossal Serpent concept." },
  { needle: "god", entryId: "concepts-gods-and-deities", confidence: "inferred", reason: "God or deity wording is grouped under the Gods and Deities concept." },
  { needle: "deity", entryId: "concepts-gods-and-deities", confidence: "inferred", reason: "God or deity wording is grouped under the Gods and Deities concept." },
];

function addHint(hints: Map<string, LoreHint>, hint: LoreHint) {
  const current = hints.get(hint.id);
  if (!current || confidenceRank[hint.confidence] > confidenceRank[current.confidence]) {
    hints.set(hint.id, hint);
  }
}

function parseInput(input: LoreNameInput): { name: string; source: LoreHintSource; reason?: string } | null {
  if (typeof input === "string") {
    const name = input.trim();
    return name ? { name, source: "entity" } : null;
  }

  const name = input.name?.trim();
  if (!name) return null;
  return { name, source: input.source || "entity", reason: input.reason };
}

export function getLoreHintsForNames(inputs: LoreNameInput[], limit = 6): LoreHint[] {
  const hints = new Map<string, LoreHint>();

  for (const rawInput of inputs) {
    const input = parseInput(rawInput);
    if (!input) continue;

    const normalizedName = normalize(input.name);
    const exactEntry = titleLookup.get(normalizedName);

    if (exactEntry) {
      addHint(hints, {
        id: exactEntry.id,
        entry: exactEntry,
        reason: input.reason || `Exact lore record match for ${input.name}.`,
        confidence: "canon",
        source: input.source,
        matchedName: input.name,
      });
    }

    for (const itemLink of getLoreForItem(input.name)) {
      for (const entryId of itemLink.entryIds) {
        const entry = LORE_ENTRIES.find((candidate) => candidate.id === entryId);
        if (!entry) continue;
        addHint(hints, {
          id: entry.id,
          entry,
          reason: itemLink.reason,
          confidence: itemLink.confidence,
          source: input.source === "entity" ? "item" : input.source,
          matchedName: input.name,
        });
      }
    }

    for (const alias of aliasLinks) {
      if (!normalizedName.includes(alias.needle)) continue;
      const entry = LORE_ENTRIES.find((candidate) => candidate.id === alias.entryId);
      if (!entry) continue;
      addHint(hints, {
        id: entry.id,
        entry,
        reason: alias.reason,
        confidence: alias.confidence,
        source: input.source,
        matchedName: input.name,
      });
    }

    if (normalizedName.length >= 5) {
      const fuzzyEntry = LORE_ENTRIES.find((entry) => {
        const normalizedTitle = normalize(entry.title);
        return normalizedTitle.includes(normalizedName) || normalizedName.includes(normalizedTitle);
      });

      if (fuzzyEntry) {
        addHint(hints, {
          id: fuzzyEntry.id,
          entry: fuzzyEntry,
          reason: input.reason || `${input.name} appears to overlap an official lore record title.`,
          confidence: "inferred",
          source: input.source,
          matchedName: input.name,
        });
      }
    }
  }

  return Array.from(hints.values())
    .sort((a, b) => confidenceRank[b.confidence] - confidenceRank[a.confidence] || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit);
}
