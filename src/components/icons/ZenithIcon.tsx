"use client";

import type { ComponentType, SVGProps } from "react";
import {
  Bell,
  BookOpen,
  Calculator,
  Castle,
  CloudSun,
  Coins,
  Compass,
  Database,
  FlaskConical,
  GraduationCap,
  Hammer,
  Heart,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LucideProps,
  Map,
  Package,
  PawPrint,
  Scale,
  ScrollText,
  Settings,
  Skull,
  Swords,
  TrendingUp,
  User,
  Users,
  Warehouse,
} from "lucide-react";
import {
  BisCrestIcon,
  ConquestBannerIcon,
  CraftingQueueIcon,
  EnemyMonsterIcon,
  ForgeAnvilIcon,
  MythicFlaskIcon,
  SlotShieldIcon,
  WhatsNewIcon,
} from "./CustomIcons";

export type ZenithIconName =
  | "alchemy"
  | "archive"
  | "bell"
  | "bis"
  | "boss"
  | "calculator"
  | "castle"
  | "combat"
  | "conquest"
  | "crafting"
  | "craftingQueue"
  | "dashboard"
  | "database"
  | "economy"
  | "enemy"
  | "forge"
  | "forgeCraft"
  | "forgeLessons"
  | "guild"
  | "housing"
  | "items"
  | "lore"
  | "map"
  | "market"
  | "museum"
  | "mythicAlchemy"
  | "patchNotes"
  | "petCompare"
  | "pets"
  | "petsOwned"
  | "profile"
  | "settings"
  | "shield"
  | "skill"
  | "skillProfit"
  | "spark"
  | "weather"
  | "whatsNew"
  | "world";

type ZenithIconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: ZenithIconName;
  size?: number;
  strokeWidth?: number;
};

const iconRegistry: Record<ZenithIconName, ComponentType<LucideProps>> = {
  // Navigation & Shell
  dashboard: LayoutDashboard,
  profile: User,
  settings: Settings,
  whatsNew: WhatsNewIcon,

  // Databases & Lore
  database: Database,
  items: Package,
  enemy: EnemyMonsterIcon,
  pets: PawPrint,
  petsOwned: Heart,
  petCompare: Scale,
  guild: Users,
  museum: Landmark,
  lore: BookOpen,
  patchNotes: ScrollText,
  archive: BookOpen,

  // Planning Tools & Calculators
  calculator: Calculator,
  alchemy: FlaskConical,
  mythicAlchemy: MythicFlaskIcon,
  skill: TrendingUp,
  skillProfit: TrendingUp,
  spark: WhatsNewIcon,
  crafting: CraftingQueueIcon,
  craftingQueue: CraftingQueueIcon,
  forgeLessons: GraduationCap,
  forgeCraft: Hammer,
  forge: ForgeAnvilIcon,
  housing: Warehouse,
  bis: BisCrestIcon,

  // World & Encounters
  world: Compass,
  map: Map,
  weather: CloudSun,
  castle: Castle,
  boss: Skull,
  conquest: ConquestBannerIcon,

  // General & Utility
  combat: Swords,
  shield: SlotShieldIcon,
  bell: Bell,
  market: Coins,
  economy: TrendingUp,
};

export default function ZenithIcon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className,
  ...props
}: ZenithIconProps) {
  const IconComponent = iconRegistry[name] || HelpCircle;

  return (
    <IconComponent
      aria-hidden="true"
      className={className}
      height={size}
      size={size}
      strokeWidth={strokeWidth}
      width={size}
      {...(props as LucideProps)}
    />
  );
}
