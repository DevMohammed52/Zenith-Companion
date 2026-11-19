import type { Sparkles } from "lucide-react";
import {
  MUSEUM_CATEGORIES,
  type MuseumCategory,
  type MuseumCategorySummary,
  type MuseumItem,
  type MuseumSortDirection,
  type MuseumSortKey,
} from "@/lib/museum";
import {
  BookOpen,
  Database,
  Image as ImageIcon,
  Package,
  PawPrint,
  Shield,
  UserRound,
} from "lucide-react";

export { MUSEUM_CATEGORIES };
export type {
  MuseumCategory,
  MuseumCategorySummary,
  MuseumItem,
  MuseumSortDirection,
  MuseumSortKey,
};

export const CATEGORY_ICONS: Record<MuseumCategory | "ALL", typeof Sparkles> = {
  ALL: Database,
  SKINS: UserRound,
  BACKGROUNDS: ImageIcon,
  GUILD_ICONS: Shield,
  PETS: PawPrint,
  COLLECTIBLES: Package,
  BESTIARY: BookOpen,
};

export const SORT_OPTIONS: Array<{ key: MuseumSortKey; label: string }> = [
  { key: "category", label: "Category" },
  { key: "name", label: "Name" },
  { key: "quantity", label: "Quantity" },
];

export const MUSEUM_RESULT_BATCH_SIZE = 120;
