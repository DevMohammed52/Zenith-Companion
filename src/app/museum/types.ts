import type { IconConcept } from "@/lib/icons";
import {
  MUSEUM_CATEGORIES,
  type MuseumCategory,
  type MuseumCategorySummary,
  type MuseumItem,
  type MuseumSortDirection,
  type MuseumSortKey,
} from "@/lib/museum";

export { MUSEUM_CATEGORIES };
export type {
  MuseumCategory,
  MuseumCategorySummary,
  MuseumItem,
  MuseumSortDirection,
  MuseumSortKey,
};

export const CATEGORY_ICONS: Record<MuseumCategory | "ALL", IconConcept> = {
  ALL: "museum",
  SKINS: "profile",
  BACKGROUNDS: "weather",
  GUILD_ICONS: "conquest",
  PETS: "pets",
  COLLECTIBLES: "items",
  BESTIARY: "lore",
};

export const SORT_OPTIONS: Array<{ key: MuseumSortKey; label: string }> = [
  { key: "category", label: "Category" },
  { key: "name", label: "Name" },
  { key: "quantity", label: "Quantity" },
];

export const MUSEUM_PAGE_SIZE = 24;
