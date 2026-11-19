import type { ReactNode } from "react";
import {
  BookOpen,
  Brain,
  Clock,
  Compass,
  GitBranch,
  Landmark,
  Layers,
  Map,
  Package,
  Skull,
  Sparkles,
  Users,
} from "lucide-react";
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
  { id: "atlas", label: "Atlas", icon: <Map size={16} /> },
  { id: "timeline", label: "Timeline", icon: <Clock size={16} /> },
  { id: "characters", label: "Characters", icon: <Users size={16} /> },
  { id: "artifacts", label: "Artifacts & Beasts", icon: <Skull size={16} /> },
  { id: "board", label: "Mystery Board", icon: <GitBranch size={16} /> },
  { id: "theories", label: "Theories", icon: <Brain size={16} /> },
];

export const CATEGORY_META: Record<LoreEntry["category"], { label: string; tone: string; icon: ReactNode }> = {
  Index: { label: "Archive", tone: "#f5b041", icon: <Layers size={16} /> },
  Overview: { label: "Overview", tone: "#38bdf8", icon: <BookOpen size={16} /> },
  Civilization: { label: "Civilization", tone: "#4ade80", icon: <Landmark size={16} /> },
  World: { label: "World", tone: "#60a5fa", icon: <Compass size={16} /> },
  Concept: { label: "Concept", tone: "#a78bfa", icon: <Sparkles size={16} /> },
  Artifact: { label: "Artifact", tone: "#f59e0b", icon: <Package size={16} /> },
  Bestiary: { label: "Bestiary", tone: "#f87171", icon: <Skull size={16} /> },
  NPC: { label: "NPC", tone: "#f472b6", icon: <Users size={16} /> },
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
