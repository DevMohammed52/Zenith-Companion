import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type {
  LoreEntry,
  LoreRelation,
} from "@/data/lore";

export type LoreView = "atlas" | "timeline" | "characters" | "artifacts" | "board" | "theories";
export type LoreFilter = "all" | LoreEntry["category"];
export type RelationFilter = "all" | LoreRelation["confidence"];

export const isLoreView = (value: string | null): value is LoreView =>
  value === "atlas" ||
  value === "timeline" ||
  value === "characters" ||
  value === "artifacts" ||
  value === "board" ||
  value === "theories";

export const VIEW_OPTIONS: Array<{ id: LoreView; label: string; icon: ReactNode }> = [
  { id: "atlas", label: "Atlas", icon: <Icon name="atlasMap" size="md" aria-hidden="true" /> },
  { id: "timeline", label: "Timeline", icon: <Icon name="timer" size="md" aria-hidden="true" /> },
  { id: "characters", label: "Characters", icon: <Icon name="guilds" size="md" aria-hidden="true" /> },
  { id: "artifacts", label: "Artifacts & Beasts", icon: <Icon name="boss" size="md" aria-hidden="true" /> },
  { id: "board", label: "Mystery Board", icon: <Icon name="relations" size="md" aria-hidden="true" /> },
  { id: "theories", label: "Theories", icon: <Icon name="theory" size="md" aria-hidden="true" /> },
];

export const CATEGORY_META: Record<LoreEntry["category"], { label: string; tone: string; icon: ReactNode }> = {
  Index: {
    label: "Archive",
    tone: "var(--text-gold, #fbbf24)",
    icon: <Icon name="archiveLayers" size="md" aria-hidden="true" />,
  },
  Overview: {
    label: "Overview",
    tone: "var(--quality-refined-text, #93c5fd)",
    icon: <Icon name="lore" size="md" aria-hidden="true" />,
  },
  Civilization: {
    label: "Civilization",
    tone: "var(--quality-premium, #4ade80)",
    icon: <Icon name="museum" size="md" aria-hidden="true" />,
  },
  World: {
    label: "World",
    tone: "var(--text-accent, #cbd5e1)",
    icon: <Icon name="map" size="md" aria-hidden="true" />,
  },
  Concept: {
    label: "Concept",
    tone: "var(--text-accent, #cbd5e1)",
    icon: <Icon name="xp" size="md" aria-hidden="true" />,
  },
  Artifact: {
    label: "Artifact",
    tone: "var(--quality-legendary, #f59e0b)",
    icon: <Icon name="items" size="md" aria-hidden="true" />,
  },
  Bestiary: {
    label: "Bestiary",
    tone: "var(--text-danger, #f87171)",
    icon: <Icon name="enemy" size="md" aria-hidden="true" />,
  },
  NPC: {
    label: "NPC",
    tone: "var(--text-accent, #cbd5e1)",
    icon: <Icon name="guilds" size="md" aria-hidden="true" />,
  },
};

export const FEATURED_ATLAS_IDS = [
  "world-valaron",
  "world-solaris-isle",
  "world-the-citadel",
  "civilizations-arvendor",
  "civilizations-eldorian",
  "civilizations-mokthar",
  "civilizations-oakenra",
  "civilizations-ombric",
  "civilizations-the-ancients",
  "civilizations-the-first-people",
  "artifacts-the-runemark-of-eternity",
  "concepts-gods-and-deities",
];

export const NPC_NETWORK_HUB_IDS = [
  "civilizations-arvendor",
  "civilizations-ombric",
  "world-the-citadel",
  "world-solaris-isle",
  "civilizations-eldorian",
  "civilizations-oakenra",
  "civilizations-mokthar",
  "concepts-gods-and-deities",
  "concepts-cults",
  "world-valaron",
];

export const normalizeLoreText = (value: string) => value
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export const cleanLoreCopy = (value: string) => value
  .replace(/\bA artifact record\b/g, "An artifact record")
  .replace(/\bA npc record\b/g, "An NPC record")
  .replace(/\bThe index frames this thread as '\.\s*/g, "The official index does not preserve a short framing note for this thread. ")
  .replace(/\bIndex signal: '\./g, "Index signal unavailable.")
  .replace(/\bThe index frames this thread as sirens Haunting creatures\b/g, "The index frames this thread as haunting creatures")
  .replace(/\bThe index frames this thread as other Civilisations Diverse peoples\b/g, "The index frames this thread as diverse peoples")
  .replace(/\bThe index frames this thread as old Gods\b/g, "The index frames this thread as old gods")
  .replace(/\s{2,}/g, " ")
  .trim();
