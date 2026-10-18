import {
  ITEM_LORE_DESCRIPTION_SIGNALS,
  type ItemLoreDescriptionSignal,
} from './item-lore-signals';

export type { ItemLoreDescriptionSignal };

export type LoreCategory = 'Index' | 'Overview' | 'Civilization' | 'World' | 'Concept' | 'Artifact' | 'Bestiary' | 'NPC';

export type LoreSection = { title: string; body: string };

export type LoreEntry = {
  id: string;
  title: string;
  category: LoreCategory;
  summary: string;
  sourceUrl: string;
  sourcePath: string;
  tags: string[];
  relatedIds: string[];
  sections: LoreSection[];
  keyFacts: string[];
  timelineMarkers: string[];
};

export type LoreRelation = {
  source: string;
  target: string;
  type: string;
  confidence: 'canon' | 'inferred' | 'theory';
  evidence: string;
};

export type LoreTheory = {
  id: string;
  title: string;
  premise: string;
  evidenceIds: string[];
  counterpoints: string[];
  speculationLevel: 'Low' | 'Medium' | 'High';
};

export type LoreTimelineEvent = {
  id: string;
  era: string;
  title: string;
  summary: string;
  entryIds: string[];
};

export type LoreItemLink = {
  itemName: string;
  entryIds: string[];
  reason: string;
  confidence: 'canon' | 'inferred' | 'theory';
};

export type LoreDataset = {
  entries: LoreEntry[];
  relations: LoreRelation[];
  theories: LoreTheory[];
  timeline: LoreTimelineEvent[];
  itemLinks: LoreItemLink[];
};

export let LORE_ENTRIES: readonly LoreEntry[] = [];
export let LORE_RELATIONS: readonly LoreRelation[] = [];
export let LORE_THEORIES: readonly LoreTheory[] = [];
export let LORE_TIMELINE: readonly LoreTimelineEvent[] = [];
export let LORE_ITEM_LINKS: readonly LoreItemLink[] = [];
export let LORE_ENTRY_BY_ID: Record<string, LoreEntry> = {};

let cachedDataset: LoreDataset | null = null;
let loreDataPromise: Promise<LoreDataset> | null = null;

export function getCachedLoreDataset(): LoreDataset | null {
  return cachedDataset;
}

export function setLoreDataset(data: LoreDataset): void {
  cachedDataset = data;
  LORE_ENTRIES = data.entries;
  LORE_RELATIONS = data.relations;
  LORE_THEORIES = data.theories;
  LORE_TIMELINE = data.timeline;
  LORE_ITEM_LINKS = data.itemLinks;
  LORE_ENTRY_BY_ID = Object.fromEntries(data.entries.map((entry) => [entry.id, entry]));
}

export async function loadLoreData(): Promise<LoreDataset> {
  if (cachedDataset) return cachedDataset;
  if (!loreDataPromise) {
    loreDataPromise = (async () => {
      if (typeof window === "undefined") {
        try {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const filePath = path.join(process.cwd(), "public", "data", "lore.json");
          const raw = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(raw) as LoreDataset;
          setLoreDataset(data);
          return data;
        } catch {
          // fallback to fetch if fs reading is not available
        }
      }

      const res = await fetch("/data/lore.json");
      if (!res.ok) throw new Error(`Failed to load lore data: ${res.status}`);
      const data = (await res.json()) as LoreDataset;
      setLoreDataset(data);
      return data;
    })().catch((err) => {
      loreDataPromise = null;
      throw err;
    });
  }
  return loreDataPromise;
}

const normalizeLoreItemName = (itemName: string) => itemName.trim().toLowerCase();

export function getLoreForItem(itemName: string, dataset?: LoreDataset | null) {
  const currentLinks = dataset ? dataset.itemLinks : (cachedDataset?.itemLinks || LORE_ITEM_LINKS);
  const normalizedName = normalizeLoreItemName(itemName);
  return currentLinks.filter((link) => normalizeLoreItemName(link.itemName) === normalizedName);
}

export function getDescriptionLoreForItem(itemName: string) {
  const normalizedName = normalizeLoreItemName(itemName);
  return ITEM_LORE_DESCRIPTION_SIGNALS.filter((link) => normalizeLoreItemName(link.itemName) === normalizedName);
}

export function getAllLoreForItem(itemName: string, dataset?: LoreDataset | null) {
  const explicitLinks = getLoreForItem(itemName, dataset);
  const explicitEntryIds = new Set<string>(explicitLinks.flatMap((link) => [...link.entryIds]));
  const descriptionLinks = getDescriptionLoreForItem(itemName)
    .map((link) => ({
      ...link,
      entryIds: link.entryIds.filter((entryId) => !explicitEntryIds.has(entryId)),
    }))
    .filter((link) => link.entryIds.length > 0);

  return [...explicitLinks, ...descriptionLinks];
}

export function getDescriptionLoreForEntry(entryId: string, limit = 12) {
  return ITEM_LORE_DESCRIPTION_SIGNALS
    .filter((link) => (link.entryIds as readonly string[]).includes(entryId))
    .slice(0, limit);
}

export function getLoreEntry(id: string, dataset?: LoreDataset | null): LoreEntry | undefined {
  if (dataset) {
    return dataset.entries.find((entry) => entry.id === id);
  }
  return LORE_ENTRY_BY_ID[id] || cachedDataset?.entries.find((entry) => entry.id === id);
}
