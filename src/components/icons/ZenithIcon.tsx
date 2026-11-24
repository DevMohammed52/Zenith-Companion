"use client";

import type { ComponentType, SVGProps } from "react";
import {
  Anvil,
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
  Layers,
  LayoutDashboard,
  LucideProps,
  Map,
  Package,
  PawPrint,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  User,
  Users,
  Warehouse,
} from "lucide-react";

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

  // Databases & Lore
  database: Database,
  items: Package,
  enemy: Swords,
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
  skill: TrendingUp,
  skillProfit: Coins,
  spark: Sparkles,
  crafting: Layers,
  craftingQueue: Layers,
  forgeLessons: GraduationCap,
  forgeCraft: Hammer,
  forge: Anvil,
  housing: Warehouse,
  bis: Target,

  // World & Encounters
  world: Compass,
  map: Map,
  weather: CloudSun,
  castle: Castle,
  boss: Skull,
  conquest: Shield,

  // General & Utility
  combat: Swords,
  shield: Shield,
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
