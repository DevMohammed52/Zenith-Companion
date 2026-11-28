import type { SVGProps } from "react";

export type CustomSvgIconProps = SVGProps<SVGSVGElement> & {
  size?: string | number;
  strokeWidth?: string | number;
  color?: string;
};

function renderIconSvg(
  { size = 16, width, height, strokeWidth = 1.75, color = "currentColor", ...props }: CustomSvgIconProps,
  children: React.ReactNode,
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width ?? size}
      height={height ?? size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ============================================================================
 * Equipment Slots (BiS / Profile Gear / Item Modal)
 * ========================================================================== */

/** Visored medieval knight helmet silhouette. */
export function SlotHelmetIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M6 12V9a6 6 0 0 1 12 0v3c0 3.6-1.5 6.4-3.5 8H9.5C7.5 18.4 6 15.6 6 12Z" />
      <path d="M12 3v6.5" />
      <path d="M8.5 11.5h7" />
      <path d="M12 11.5v5" />
    </>,
  );
}

/** Plate armor cuirass with shoulder pauldrons and chest ridge. */
export function SlotChestplateIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M8.5 4 5 6.5 3.5 10.5 6.5 12v8h11v-8l3-1.5L19 6.5 15.5 4c-1 1.7-2.2 2.5-3.5 2.5S9.5 5.7 8.5 4Z" />
      <path d="M12 6.5V20" />
      <path d="M7.5 10.5Q12 13 16.5 10.5" />
    </>,
  );
}

/** Paired armored leg greaves with knee poleyn plates. */
export function SlotGreavesIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M6.5 4h11l1 16H14l-2-8.5L10 20H5.5l1-16Z" />
      <path d="M6.3 7.5h11.4" />
      <path d="M6 13.5h4.5" />
      <path d="M13.5 13.5H18" />
    </>,
  );
}

/** Side-profile cuffed combat boot with heel block. */
export function SlotBootsIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M7 4h6v7.5l4.8 1.9c1.4.6 2.2 1.8 2.2 3.3V20H6.5L7 4Z" />
      <path d="M6.8 7.5h6.2" />
      <path d="M6.6 17.2H20" />
      <path d="M7 12.5 10.5 14" />
    </>,
  );
}

/** Plated combat gauntlet with knuckle ridge and thumb guard. */
export function SlotGauntletsIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M8 14V5.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V14l1.5 6.5h-11L8 14Z" />
      <path d="M8 10.5 5.5 9.2a1.4 1.4 0 0 0-1.6 2.2L7.2 15" />
      <path d="M8 8.5h8" />
      <path d="M12 3.5v5" />
      <path d="M8 14h8" />
    </>,
  );
}

/** Broad-bladed arming sword with crossguard and fuller. */
export function SlotSwordIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M14.5 12.5 20 4l-8.5 5.5" />
      <path d="M12 12 17 7" />
      <path d="M7.5 10.5 13.5 16.5" />
      <path d="M10.5 13.5 5 19" />
      <circle cx="4.5" cy="19.5" r="1.25" />
    </>,
  );
}

/** Slim dirk / dagger with compact curved guard. */
export function SlotDaggerIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M12.5 13.5 18.5 5.5 10.5 11.5" />
      <path d="M8.5 10.5q3 1.8 5 5" />
      <path d="M11 13 6 18" />
      <circle cx="5.2" cy="18.8" r="1.15" />
    </>,
  );
}

/** Recurve bow with taught string and nocked arrow. */
export function SlotBowIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M4.5 9c6-2.5 13 4.5 10.5 10.5" />
      <path d="M4.5 9 15 19.5" />
      <path d="M7.5 16.5 20 4" />
      <path d="M16 4h4v4" />
      <path d="M6.5 15.5H9V18" />
    </>,
  );
}

/** Heraldic kite shield strictly for Shield equipment slots. */
export function SlotShieldIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M12 21s7-3.5 7-10V5.5L12 3 5 5.5V11c0 6.5 7 10 7 10Z" />
      <path d="M8.5 10.5 12 13l3.5-2.5" />
      <path d="M12 13v4.5" />
    </>,
  );
}

/** Signet ring / relic charm for Special equipment slots. */
export function SlotSpecialIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <circle cx="12" cy="14" r="5.5" />
      <path d="M9.5 8.5 12 4.5l2.5 4L12 10.5 9.5 8.5Z" />
    </>,
  );
}

/* ============================================================================
 * IdleMMO Skills & Gathering Tools
 * ========================================================================== */

/** Classic blacksmith anvil with pointed horn, flat face, and sturdy foot. */
export function ForgeAnvilIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M3 9h17v3.5h-3.5v4h2v3h-13v-3h3v-4C6.5 12.5 4 12 3 9Z" />
      <path d="M8.5 16.5h8" />
    </>,
  );
}

/** Single-bit felling axe for Woodcutting & Felling Axe slots. */
export function SkillWoodcuttingIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M4.5 19.5 16 8" />
      <path d="M12.5 5.5 18.5 11.5c2-2.6 1.8-6.4-1.2-7.8-1.8-.8-3.4 0-4.8 1.8Z" />
    </>,
  );
}

/** Curved miner's pickaxe for Mining & Pickaxe slots. */
export function SkillMiningIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M4.5 19.5 16.5 7.5" />
      <path d="M7.5 6.2q6.5-2.2 9.5 1t.5 9.3" />
      <path d="M14.5 6.5 17.5 9.5" />
    </>,
  );
}

/** Angler's rod and barbed hook for Fishing & Fishing Rod slots. */
export function SkillFishingIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M4 20Q7 7 15 4" />
      <path d="M15 4v11.5" />
      <path d="M15 15.5a2.5 2.5 0 1 1-5 0V14" />
      <path d="M10 14l1.5 1.5" />
    </>,
  );
}

/** Covered cauldron / simmering pot for Cooking skill. */
export function SkillCookingIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M7 9h10" />
      <path d="M10.5 7h3" />
      <path d="M6 9v7a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
      <path d="M4 11h2" />
      <path d="M18 11h2" />
      <path d="M9.5 4.5V3" />
      <path d="M14.5 4.5V3" />
    </>,
  );
}

/** Stacked cast metal ingots for Smelting skill. */
export function SkillSmeltingIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M8 5h8l1.5 5H6.5L8 5Z" />
      <path d="M4.5 13.5h15l1.5 5H3l1.5-5Z" />
      <path d="M12 13.5v5" />
    </>,
  );
}

/** Carpenter's framing square with measurement ticks for Construction skill. */
export function SkillConstructionIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M4 4h15v5H9v10H4V4Z" />
      <path d="M11 4v2" />
      <path d="M15 4v2" />
      <path d="M4 12h2" />
      <path d="M4 16h2" />
    </>,
  );
}

/** Three-petal lotus emblem for Meditation mastery. */
export function SkillMeditationIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M12 4c-2.5 3.5-2.5 8 0 11 2.5-3 2.5-7.5 0-11Z" />
      <path d="M12 15c-4-1-6.5-3.5-7-6.5 2.5 0 5 2 7 6.5Z" />
      <path d="M12 15c4-1 6.5-3.5 7-6.5-2.5 0-5 2-7 6.5Z" />
      <path d="M6.5 18.5q5.5 2 11 0" />
    </>,
  );
}

/* ============================================================================
 * Domain & Navigation Emblems
 * ========================================================================== */

/** Broadcast megaphone with sound arc for What's New / Releases. */
export function WhatsNewIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M4 10.5v3L16 18V6L4 10.5Z" />
      <path d="M7.5 14.5v3.8a1.5 1.5 0 0 0 3 0v-2.7" />
      <path d="M19 9a4.5 4.5 0 0 1 0 6" />
    </>,
  );
}

/** Round-bottomed arcane elixir phial with floating crystal seal for Mythic Lab. */
export function MythicFlaskIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M12 2l1.4 1.8L12 5.6 10.6 3.8 12 2Z" />
      <path d="M10 8h4" />
      <path d="M10.5 8v2.6a5.5 5.5 0 1 0 3 0V8" />
      <path d="M7.5 15.5Q12 13.8 16.5 15.5" />
    </>,
  );
}

/** Citadel siege pennant / territory banner for Guild Conquest. */
export function ConquestBannerIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M6 21V3.5" />
      <path d="M6 4.5h13l-3 3.75L19 12H6" />
      <path d="M3.5 21h7" />
    </>,
  );
}

/** Storm cloud emitting an arcane four-point vortex star for Magic Storm weather. */
export function MagicStormIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M17.5 15H19a3.8 3.8 0 0 0 .4-7.5A5.3 5.3 0 0 0 9 5.8 4.2 4.2 0 0 0 5.5 10a3.4 3.4 0 0 0 .5 5h1.5" />
      <path d="M12 12l1.4 3.1L16.5 16.5l-3.1 1.4L12 21l-1.4-3.1-3.1-1.4 3.1-1.4L12 12Z" />
    </>,
  );
}

/** Clipboard batch queue with check rows for Crafting Queue (/crafting). */
export function CraftingQueueIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <rect x="4" y="4.5" width="16" height="16" rx="2.5" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M8 10h1.5" />
      <path d="M12 10h4.5" />
      <path d="M8 14.5h1.5" />
      <path d="M12 14.5h4.5" />
    </>,
  );
}

/** Heavy warlord crown crest for Best-in-Slot (/bis). */
export function BisCrestIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M4.5 16.5 6.5 7l5.5 5 5.5-5 2 9.5h-15Z" />
      <path d="M4.5 20h15" />
      <path d="M12 4.5 13 6l-1 1.5L11 6l1-1.5Z" />
    </>,
  );
}

/** Horned beast silhouette for Enemy Database (/enemies), distinct from Skull & Swords. */
export function EnemyMonsterIcon(props: CustomSvgIconProps) {
  return renderIconSvg(
    props,
    <>
      <path d="M5 4.5c0 3 1.8 4.8 3.5 5.4" />
      <path d="M19 4.5c0 3-1.8 4.8-3.5 5.4" />
      <path d="M7.5 10.5V15c0 3 2 5 4.5 5s4.5-2 4.5-5v-4.5Q12 9 7.5 10.5Z" />
      <path d="M9.5 13.5 11 14.5" />
      <path d="M14.5 13.5 13 14.5" />
    </>,
  );
}
