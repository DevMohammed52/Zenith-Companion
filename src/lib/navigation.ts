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
      { href: "/whats-new", label: "What's New", icon: "whatsNew" },
      { href: "/settings", label: "Settings", icon: "settings" },
    ],
  },
  {
    label: "Databases",
    eyebrow: "Reference",
    icon: "database",
    items: [
      { href: "/items", label: "Items Database", icon: "items", matchPrefix: true },
      { href: "/enemies", label: "Enemy Database", icon: "enemy" },
      { href: "/pets", label: "Pet Database", icon: "pets" },
      { href: "/pets/owned", label: "Owned Pets", icon: "petsOwned" },
      { href: "/pets/compare", label: "Pet Comparison", icon: "petCompare" },
      { href: "/guilds", label: "Guild Database", icon: "guild" },
      { href: "/museum", label: "Museum", icon: "museum" },
      { href: "/lore", label: "Lore Wiki", icon: "lore", matchPrefix: true },
      { href: "/patch-notes", label: "IdleMMO Patch Notes", icon: "patchNotes" },
    ],
  },
  {
    label: "Planning Tools",
    eyebrow: "Calculators",
    icon: "calculator",
    items: [
      { href: "/alchemy", label: "Alchemy Profit", icon: "alchemy" },
      { href: "/skill-profit", label: "Skill Profit Finder", icon: "skillProfit" },
      { href: "/alchemy/mythic", label: "Mythic Lab", icon: "mythicAlchemy", badge: "LVL 90" },
      { href: "/crafting", label: "Crafting Queue", icon: "craftingQueue" },
      { href: "/forge/lessons", label: "Forge Lessons", icon: "forgeLessons" },
      { href: "/forge/craft", label: "Forge Crafting", icon: "forgeCraft" },
      { href: "/housing", label: "Housing", icon: "housing" },
      { href: "/bis", label: "BiS Recommender", icon: "bis" },
    ],
  },
  {
    label: "World & Encounters",
    eyebrow: "Live route",
    icon: "world",
    items: [
      { href: "/map", label: "World Map", icon: "map" },
      { href: "/weather", label: "Weather Guide", icon: "weather" },
      { href: "/dungeons", label: "Dungeons", icon: "castle" },
      { href: "/bosses", label: "World Bosses", icon: "boss" },
      { href: "/conquest", label: "Conquest", icon: "conquest" },
    ],
  },
];

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.href === "/forge/lessons") {
    return pathname === "/forge" || pathname === "/forge/lessons" || pathname.startsWith("/forge/lessons/");
  }
  if (item.href === "/forge/craft") {
    return pathname === "/forge/craft" || pathname.startsWith("/forge/craft/");
  }
  if (item.matchPrefix) return pathname === item.href || pathname.startsWith(item.href + "/");
  return pathname === item.href;
}

export function getActiveNavGroup(pathname: string) {
  return NAV_GROUPS.find((group) => group.items.some((item) => isNavItemActive(pathname, item)));
}

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const DOCKABLE_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter(
  (item) => item.href !== "/" && item.href !== "/settings",
);

export function findNavItemByHref(href: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((item) => item.href === href);
}
