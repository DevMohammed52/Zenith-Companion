"use client";

import type { ReactElement, SVGProps } from "react";

export type ZenithIconName =
  | "alchemy"
  | "archive"
  | "bell"
  | "boss"
  | "castle"
  | "combat"
  | "conquest"
  | "crafting"
  | "dashboard"
  | "economy"
  | "enemy"
  | "forge"
  | "guild"
  | "housing"
  | "items"
  | "map"
  | "market"
  | "museum"
  | "pets"
  | "profile"
  | "settings"
  | "shield"
  | "skill"
  | "spark"
  | "weather"
  | "world";

type ZenithIconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: ZenithIconName;
  size?: number;
};

const iconPaths: Record<ZenithIconName, ReactElement> = {
  dashboard: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5v8h11v-8" />
      <path d="M9.5 18.5v-4h5v4" />
    </>
  ),
  profile: (
    <>
      <path d="M8.2 8.2a3.8 3.8 0 1 0 7.6 0 3.8 3.8 0 0 0-7.6 0Z" />
      <path d="M5 20c1.2-3.5 3.4-5.2 7-5.2s5.8 1.7 7 5.2" />
    </>
  ),
  settings: (
    <>
      <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />
      <path d="M12 2.8v2.1M12 19.1v2.1M3.9 7.3l1.8 1M18.3 15.7l1.8 1M3.9 16.7l1.8-1M18.3 8.3l1.8-1" />
    </>
  ),
  items: (
    <>
      <path d="m12 3.5 7.2 4.1v8.8L12 20.5l-7.2-4.1V7.6L12 3.5Z" />
      <path d="M4.9 7.7 12 11.8l7.1-4.1M12 11.8v8.3" />
      <path d="m8.5 5.8 7.1 4.1" />
    </>
  ),
  enemy: (
    <>
      <path d="M8 9.4c0-3 1.7-5.1 4-5.1s4 2.1 4 5.1v2.5c0 3-1.7 5.1-4 5.1s-4-2.1-4-5.1V9.4Z" />
      <path d="M7.8 12H4.5M16.2 12h3.3M8.6 6.8 5.8 4M15.4 6.8 18.2 4M9.5 18.2 7.2 21M14.5 18.2l2.3 2.8" />
      <path d="M10.2 10.2h.1M13.7 10.2h.1" />
    </>
  ),
  pets: (
    <>
      <path d="M8.2 12.5c1.7-2.4 5.9-2.4 7.6 0l1.4 2c1.3 1.9.1 4.5-2.2 4.5H9c-2.3 0-3.5-2.6-2.2-4.5l1.4-2Z" />
      <path d="M5.5 10.2a2 2.6 0 1 0 0-5.2 2 2.6 0 0 0 0 5.2ZM10 7.1a2 2.8 0 1 0 0-5.6 2 2.8 0 0 0 0 5.6ZM14 7.1a2 2.8 0 1 0 0-5.6 2 2.8 0 0 0 0 5.6ZM18.5 10.2a2 2.6 0 1 0 0-5.2 2 2.6 0 0 0 0 5.2Z" />
    </>
  ),
  guild: (
    <>
      <path d="M5 20V5.5l7-2.5 7 2.5V20" />
      <path d="M8 9h8M8 13h8M8 17h8" />
      <path d="M12 3v17" />
    </>
  ),
  museum: (
    <>
      <path d="M4 9h16M5.5 9 12 4l6.5 5" />
      <path d="M6.5 9v9M10 9v9M14 9v9M17.5 9v9M4 20h16" />
    </>
  ),
  archive: (
    <>
      <path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v12.5H8A2 2 0 0 1 6 17.5v-13Z" />
      <path d="M8 4.5v13A2 2 0 0 0 10 19.5M10 8h5M10 11.5h5" />
    </>
  ),
  alchemy: (
    <>
      <path d="M10 3.5h4M11 3.5v5.2l-4.4 7.6A3 3 0 0 0 9.2 21h5.6a3 3 0 0 0 2.6-4.7L13 8.7V3.5" />
      <path d="M8.2 15h7.6M9.5 12.3h5" />
    </>
  ),
  skill: (
    <>
      <path d="M4 18h16" />
      <path d="M6.5 15v-4M12 15V6M17.5 15V9" />
      <path d="m12 3 2 2-2 2-2-2 2-2Z" />
    </>
  ),
  crafting: (
    <>
      <path d="M4.5 7h15l-1.4 8.5H7L5.8 4H3.5" />
      <path d="M8.5 20a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4ZM16.5 20a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" />
      <path d="M10 10h4" />
    </>
  ),
  forge: (
    <>
      <path d="m5 19 5.5-5.5M8.5 20.5 3.5 15.5l2-2 5 5-2 2Z" />
      <path d="M13 5.5c2.6.4 4.8 2.6 5.2 5.2l-4 4c-.5-2.4-2.4-4.3-4.8-4.8l3.6-4.4Z" />
      <path d="m15.7 4.3 4 4" />
    </>
  ),
  housing: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.2 10.8v9h11.6v-9" />
      <path d="M9.2 19.8v-5h5.6v5" />
      <path d="M15 7.2V5h2.5v4.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 18.5 6v5.8c0 4.1-2.4 7-6.5 8.7-4.1-1.7-6.5-4.6-6.5-8.7V6L12 3.5Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  market: (
    <>
      <path d="M4 17.5h16" />
      <path d="M6.5 15v-4.5M12 15V6.5M17.5 15V9" />
      <path d="m5.5 8.5 4-3 3.5 2.8 5.5-4" />
    </>
  ),
  economy: (
    <>
      <path d="M12 21c4.4-2.1 7-5.5 7-10V6.5L12 3 5 6.5V11c0 4.5 2.6 7.9 7 10Z" />
      <path d="M8.7 12h6.6M12 8.7v6.6" />
      <path d="M9.3 9.3c1.8-1.1 3.6-1.1 5.4 0M9.3 14.7c1.8 1.1 3.6 1.1 5.4 0" />
    </>
  ),
  map: (
    <>
      <path d="M4.5 6.5 9.5 4l5 2.5 5-2.5v13.5l-5 2.5-5-2.5-5 2.5V6.5Z" />
      <path d="M9.5 4v13.5M14.5 6.5V20" />
    </>
  ),
  weather: (
    <>
      <path d="M7.2 16.5h9.5a3.2 3.2 0 0 0 .4-6.4 5.2 5.2 0 0 0-9.9-1.4A3.9 3.9 0 0 0 7.2 16.5Z" />
      <path d="M8 20h.1M12 20h.1M16 20h.1" />
    </>
  ),
  combat: (
    <>
      <path d="M5 19 19 5M15.5 4.5l4 4M4.5 15.5l4 4" />
      <path d="m5 5 14 14M8.5 4.5l-4 4M19.5 15.5l-4 4" />
    </>
  ),
  castle: (
    <>
      <path d="M5 20V8l3 1.5L12 7l4 2.5L19 8v12" />
      <path d="M8 20v-5a4 4 0 0 1 8 0v5M8 5V3M12 5V3M16 5V3" />
    </>
  ),
  boss: (
    <>
      <path d="M7 9.5 4.5 5 9 7M17 9.5 19.5 5 15 7" />
      <path d="M6.5 12c0-3.1 2.2-5.5 5.5-5.5s5.5 2.4 5.5 5.5-2.2 7.5-5.5 7.5S6.5 15.1 6.5 12Z" />
      <path d="M10 12h.1M14 12h.1M10 16h4" />
    </>
  ),
  conquest: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2 3 2 3H6" />
      <path d="M9 14h9M9 18h6" />
    </>
  ),
  world: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M3.5 12h17M12 3c2.3 2.4 3.5 5.4 3.5 9S14.3 18.6 12 21M12 3C9.7 5.4 8.5 8.4 8.5 12s1.2 6.6 3.5 9" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.5-5.7 1.7L12 20.5l-1.8-8.3-5.7-1.7L10.2 9 12 3.5Z" />
      <path d="M18.5 3.5v3M20 5h-3M5.5 17.5v2M6.5 18.5h-2" />
    </>
  ),
  bell: (
    <>
      <path d="M7 17.5h10l-1.2-2V11a3.8 3.8 0 0 0-7.6 0v4.5L7 17.5Z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0M12 5V3.5" />
    </>
  ),
};

export default function ZenithIcon({ name, size = 18, className, ...props }: ZenithIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}
