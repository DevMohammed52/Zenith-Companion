import type { ZenithIconName } from "@/components/icons/ZenithIcon";

export interface NavItem {
  href: string;
  label: string;
  icon: ZenithIconName;
  matchPrefix?: boolean;
  badge?: string;
}

export interface NavGroup {
  label: string;
  eyebrow: string;
  icon: ZenithIconName;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    eyebrow: "Home base",
    icon: "dashboard",
    items: [
      { href: "/", label: "Dashboard", icon: "dashboard" },
      { href: "/profiles", label: "Profiles", icon: "profile" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ],
  },
  {
    label: "Databases",
    eyebrow: "Reference",
    icon: "items",
    items: [
      { href: "/items", label: "Items Database", icon: "items", matchPrefix: true },
      { href: "/enemies", label: "Enemy Database", icon: "enemy" },
      { href: "/pets", label: "Pet Database", icon: "pets" },
      { href: "/pets/owned", label: "Owned Pets", icon: "pets" },
      { href: "/pets/compare", label: "Pet Comparison", icon: "skill" },
      { href: "/guilds", label: "Guild Database", icon: "guild" },
      { href: "/museum", label: "Museum", icon: "museum" },
      { href: "/lore", label: "Lore Wiki", icon: "archive", matchPrefix: true },
    ],
  },
  {
    label: "Planning Tools",
    eyebrow: "Calculators",
    icon: "alchemy",
    items: [
      { href: "/alchemy", label: "Alchemy Profit", icon: "alchemy" },
      { href: "/skill-profit", label: "Skill Profit Finder", icon: "skill" },
      { href: "/alchemy/mythic", label: "Mythic Lab", icon: "spark", badge: "LVL 90" },
      { href: "/crafting", label: "Crafting Queue", icon: "crafting" },
      { href: "/forge", label: "Forge Planner", icon: "forge" },
      { href: "/housing", label: "Housing", icon: "housing" },
      { href: "/bis", label: "BiS Recommender", icon: "shield" },
      { href: "/market-alerts", label: "Market Watch", icon: "bell" },
    ],
  },
  {
    label: "World & Combat",
    eyebrow: "Live route",
    icon: "combat",
    items: [
      { href: "/map", label: "World Map", icon: "map" },
      { href: "/weather", label: "Weather Guide", icon: "weather" },
      { href: "/combat", label: "Combat", icon: "combat" },
      { href: "/dungeons", label: "Dungeons", icon: "castle" },
      { href: "/bosses", label: "World Bosses", icon: "boss" },
      { href: "/conquest", label: "Conquest", icon: "conquest" },
    ],
  },
];

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(item.href + "/");
  return pathname === item.href;
}

export function getActiveNavGroup(pathname: string) {
  return NAV_GROUPS.find((group) => group.items.some((item) => isNavItemActive(pathname, item)));
}
