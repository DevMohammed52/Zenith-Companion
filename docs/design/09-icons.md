# Zenith Design Standards: Iconography & Semantic Constraints

This document governs icon selection, semantic registry bindings, and accessible icon buttons across Zenith Companion.

## 1. Core Principles
* **One Icon, One Meaning**: Never reuse an icon for a different function. Never use different icons for the same function across different routes.
* **Centralized Registry (`src/lib/icons.ts`)**: All icon usage must consume the central registry and the `Icon` primitive (`src/components/ui/Icon.tsx`). Direct imports of arbitrary Lucide icons in page or widget components are banned during refactoring.
* **Tag-Based Semantic Discovery**: Select icons by querying Lucide's functional category tags (navigation, gaming, finance, security, tools), never by visual whimsy or aesthetic novelty.

## 2. Functional & Gaming Metaphor Rules
* **No Decorative Sparkles on Controls**: Sparkle, glitter, star, or flame icons must not be placed on functional buttons or action controls. If an action lacks a clear physical metaphor, use a plain text label alone.
  * The `Sparkles` icon is strictly reserved for character XP and magical essences.
  * The `Zap` icon is strictly reserved for combat attack speed.

## 3. Accessibility & Ergonomics
* **Accessible Names for Icon Controls**: Every icon-only button or link must carry an explicit accessible name using `aria-label` or an inner `<span className="sr-only">Label</span>` on the interactive element. The internal SVG retains `aria-hidden="true"`.
* **Label Redundancy**: Do not place an icon alongside a text label if the label already explains the action completely, unless the icon specifically aids visual scanning in a dense data table or navigation drawer.
* **Mobile Touch Clearance**: All interactive icon buttons must meet the minimum 44x44px touch target requirement on mobile devices.

## 4. Avatar & EntityIcon Architecture (`Avatar.tsx`, `EntityIcon.tsx`)
Entity icons, character portraits, item thumbnails, and enemy avatars must follow these standards:
* **Radix Avatar Primitive Foundation**:
  * Compound parts: `Avatar.Root`, `Avatar.Image`, `Avatar.Fallback`.
  * Fallback handling: Render text initials (e.g. character initials) or an entity category icon while loading or if image asset fails.
  * Anti-flicker delay: Use `delayMs={600}` on `Avatar.Fallback` so fast connections render the image cleanly without flashing the fallback.
* **Badge Placement (Material Design 3 Badges)**:
  * Notification pips and level badges anchor inside the icon bounding box at the upper trailing edge (top-right in LTR).
  * Numeric badges must be capped at 4 characters (e.g. `99+`) to prevent overflowing avatar bounds.
* **Accessible Image Semantics (W3C Alt Decision Tree)**:
  * **Redundant Images**: When an avatar is rendered adjacent to visible character or item name copy (e.g. in character cards, profile switchers, or table rows), the image is redundant: use `alt=""`.
  * **Standalone Informational Avatars**: When an avatar or entity icon stands alone without nearby text, provide an explicit, concise text alternative (e.g. `alt="Level 42 Battlemage portrait"` or `alt="Ancient Dragon thumbnail"`).
* **Dual-Cue Rarity Discipline (WCAG 2.2 SC 1.4.1 Use of Color)**:
  * Rarity rings and glow effects (Common, Uncommon, Rare, Epic, Legendary, Mythic) convey meaning through color.
  * Under WCAG 2.2 SC 1.4.1, color must never be the sole visual cue. Rarity glows must ALWAYS be accompanied by a second non-color indicator: a visible text badge ("Epic"), an explicit tooltip, or accessible descriptive text within the label.
