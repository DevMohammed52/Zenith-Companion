# Changelog

All notable changes to Zenith Companion will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to strict logic invariance across all updates.

## [Unreleased]

### Changed
- **[2026-11-24 20:20] Interactive Gathering Location Navigation to /map (`src/components/ItemModal.tsx`)**:
  - Wired all gathering location cards in `ItemModal` to navigate directly to `/map?location=${encodeURIComponent(targetKey)}`.
  - Added subtitle metadata ("View on World Map") with map pin icon and keyboard accessibility (`role="button"`, `tabIndex={0}`, Enter/Space keydown handlers).
  - Verified with Playwright end-to-end test confirming Coal Ore to Bluebell Hollow transition successfully activates the Bluebell Hollow map marker, forecast, and dossier.
  - Verified with 779 unit tests (100% pass), 0 TypeScript errors, clean Next.js 16 production build across 41 routes, and visual screenshots saved to artifacts directory.
- **[2026-11-24 20:10] Centralized Pagination Primitive Migration on `/items` and `/enemies` (`src/components/ui/Pagination.tsx`, `Pagination.module.css`, `src/app/items/`, `src/app/enemies/`)**:
  - Removed duplicate bespoke pagination code from `/items` and `/enemies` in favor of the centralized `Pagination` primitive from `src/components/ui/`.
  - Refactored `ItemsPagination.tsx` and `EnemiesPagination.tsx` to act as thin adapters delegating to `Pagination`, ensuring complete architecture contract preservation in `tests/unit/items-architecture-contracts.test.ts`.
  - Purged ~300 lines of obsolete, duplicated pagination CSS across `ItemsStyles.tsx` and `EnemiesStyles.tsx`.
  - Upgraded `Pagination.tsx` with smooth window `scrollToTop` support on page transitions and zero-item guards.
  - Verified component polish from visual critiques: Combobox z-index and overflow container visibility, Checkbox unchecked tickmark opacity fix, Switch Apple-style spring physics with width elongation, NumberInput non-digit sanitization, and Tag luminous frost glass contrast.
  - Verified across all 5 verification gates: 779 unit tests passing (0 failures), 0 TypeScript errors, clean Next.js 16 production build across all 41 routes, and Playwright desktop/mobile visual evidence recorded.

### Added
- **[2026-11-24 17:15] Completed Implementation & Testing of the 14 Remaining UI Primitives (`src/components/ui/`, `tests/unit/ui-primitives.test.ts`, `public/ui-preview.html`)**:
  - Implemented all 14 remaining UI component primitives from the master 38 catalog:
    1. `Pagination` (`Pagination.tsx`, `Pagination.module.css`): W3C APG `<nav aria-label="...">` landmark, ellipsis sequence jumping, disabled boundary buttons, live region range updates.
    2. `Combobox` (`Combobox.tsx`, `Combobox.module.css`): `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, roving active descendant, clear button.
    3. `Tabs` (`Tabs.tsx`, `Tabs.module.css`): Underline and pill variants, badge counts, roving tabindex keyboard navigation (`ArrowRight`/`ArrowLeft`/`Home`/`End`).
    4. `Tag` / `Chip` (`Tag.tsx`, `Tag.module.css`): Two-tier drop rarity styles (Refined to Unique), interactive filter toggle buttons (`aria-pressed`), and removable chips.
    5. `StatCard` / `MetricTile` (`StatCard.tsx`, `StatCard.module.css`): Semantic `<dl>` structure, tabular numbers, decoupled direction and sentiment.
    6. `Checkbox` (`Checkbox.tsx`, `Checkbox.module.css`): Semantic label containment, accessible helper descriptions, and DOM `indeterminate` tri-state binding.
    7. `Switch` (`Switch.tsx`, `Switch.module.css`): W3C APG `role="switch"`, `aria-checked`, static accessible labels, and hardware-accelerated transitions.
    8. `NumberInput` (`NumberInput.tsx`, `NumberInput.module.css`): Spinbutton pattern, `inputmode="numeric"`, non-clamping typing, mouse-wheel prevention, and steppers.
    9. `ProgressBar` & `ProgressRing` & `Meter` (`ProgressBar.tsx`, `ProgressBar.module.css`): Linear GPU `scaleX` transform, SVG circular ring with `stroke-dashoffset`, and scalar capacity meter.
    10. `Breadcrumbs` (`Breadcrumbs.tsx`, `Breadcrumbs.module.css`): `<nav aria-label="Breadcrumb">`, `<ol>` and `<li>`, plain text current page with `aria-current="page"`, hidden visual separators.
    11. `Slider` (`Slider.tsx`, `Slider.module.css`): Single and dual-thumb range sliders with WCAG 2.2 SC 2.5.7 dragging alternatives, `touch-action: pan-y`, and 44x44px touch boundaries.
    12. `TextArea` (`TextArea.tsx`, `TextArea.module.css`): Baseline 2026 `field-sizing: content` auto-grow, 16px mobile font to prevent iOS zoom, and data-import hardening (`spellcheck="false"`, `autocapitalize="off"`, `wrap="off"`).
    13. `RadioGroup` (`RadioGroup.tsx`, `RadioGroup.module.css`): `<fieldset>` and `<legend>` structure, single tab stop with roving arrow navigation, and card-style radio option variants.
    14. `Timeline` (`Timeline.tsx`, `Timeline.module.css`): Semantic `<ol>` with `<time datetime="...">` timestamps, status tags, decorative spine, and explicit direction declaration.
  - Added full export suite in `src/components/ui/index.ts`.
  - Comprehensive unit test suite in `tests/unit/ui-primitives.test.ts` (92 unit tests passing, 779 in full repository suite).
  - Standalone interactive showcase in `public/ui-preview.html` with sections 24 through 37 rendered strictly with real IdleMMO game data (real potions, items, monsters, bosses, levels, weather windows).
  - Visual verification with Playwright headless screenshots on desktop (1440px) and mobile (375px) saved to artifacts directory.
  - Dual workspace synchronization: 100% parity verified between `c:\Data\Programming Projects\Zenith Companion` and `c:\Data\IdleMMO related stuff\02_Tools\AlchemyCalculator\Zenith Companion`.
- Comprehensive design specification and architectural standards for UI Primitives Batch 5 in `docs/design/`:
  - `docs/design/29-radio-groups-selection.md`: Selection boundary rules for 2 to 5 mutually exclusive choices (versus Switch for binary, Select for >5, Checkbox for multi-select). W3C APG semantics using native `<input type="radio">` in `<fieldset>` with `<legend>` or `role="radiogroup"`. Card-style radios retaining native hidden inputs for full focusability. Keyboard roving tabindex (exactly 1 tab stop per group; arrow keys move focus AND change selection with circular wrapping). Non-deselectability discipline: mandatory default preselection and explicit "None" options. Dual-cue physical indicators (inner dot in outer ring) meeting non-color requirements, whole-row interactive hit targets (minimum 44px mobile touch size), and inline disabled explanations.
  - `docs/design/30-timelines-chronology.md`: Architectural distinction between sequential narratives (Timeline) and multi-attribute comparisons (Table). Semantic `<ol>` and `<li>` structure with `<time datetime="...">` elements; decorative spine line and marker dots hidden from screen readers. Explicitly declared chronological direction ("Order: Newest first"). Dual-format time display with relative durations (`Intl.RelativeTimeFormat`) and localized absolute time (`Intl.DateTimeFormat`). Single shared ticker loop eliminating individual per-entry timers. Feed stability rules: prohibiting blanket live regions, providing "X new updates" buttons to prevent layout shift (CLS), expandable descriptions via `<button aria-expanded="false">`, and dimension-matched skeleton states.
- Updated `AGENTS.md` Section 8 with comprehensive routing pointers for all 30 modular design documents (`01` through `30`).
- Comprehensive design specification and architectural standards for UI Primitives Batch 4 in `docs/design/`:
  - `docs/design/26-pagination-data-browsing.md`: Architectural superiority over infinite scroll (preserves spatial orientation, browser back-button history, and footer accessibility). W3C ARIA `<nav aria-label="Pagination">`, `<ol>`, and `<li>` structure with `aria-current="page"`. Explicit "Previous page" and "Next page" labels with disabled boundary states. Stable-width single and double ellipsis truncation algorithm (`1 … 4 5 6 … 28`). State management discipline requiring sorting and filtering to execute across the entire dataset in memory rather than the active page. URL synchronization (`?page=3`) with automatic page 1 reset on search/filter/sort changes and boundary clamping. Polite live region range announcements ("Showing 51–100 of 1,355 items") and table header focus relocation. Page-size selector (25/50/100) and mobile compact indicator (`[ Prev ] Page 3 of 28 [ Next ]`) with >=44px touch targets.
  - `docs/design/27-slider-range-controls.md`: When to use sliders (approximate range tuning) versus exact inputs (NN/g guidance). WCAG 2.2 SC 2.5.7 (Dragging Movements Level AA) compliance requiring every slider to be paired with an adjacent `NumberInput` for typing without dragging, plus track-click thumb snapping. W3C APG single-thumb and dual-thumb range semantics (`role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`). Keyboard interactions (Arrow keys for 1 step, PageUp/PageDown for 10x step, Home/End for limits). NN/g thumb label placement above or beside track to prevent physical finger occlusion on touchscreens. CSS `touch-action: pan-y` preventing vertical scroll interference. Main-thread protection through deferred calculations (`useDeferredValue` or commit on pointer release).
  - `docs/design/28-textarea-multiline-inputs.md`: Boundary rule requiring `<TextInput>` for single-line entry and `<TextArea>` strictly for multiline text. Permanent visible `<label>` (never placeholder alone), `aria-describedby` helper/error linking, and `aria-invalid="true"`. Data import hardening for base64 and JSON profile strings: disabling autocorrect, autocapitalize, autocomplete, and spellcheck, with `wrap="off"` and monospace typography. Soft character limit with visual counter instead of hard `maxlength` truncation. Non-blocking validation on paste, blur, or action (never on keystroke), with user text preserved on error. Modern CSS `field-sizing: content` (Baseline 2026) with `min-height`, `max-height`, and vertical-only resizing. Mobile 16px minimum font size preventing iOS Safari viewport zoom, and debounced draft auto-saving.
- Comprehensive design specification and architectural standards for UI Primitives Batch 3 in `docs/design/`:
  - `docs/design/23-number-input-stepper.md`: Architectural guidance on avoiding native `<input type="number">` bugs (unintentional mouse wheel changes, character drops, exponent formatting). W3C ARIA spinbutton pattern (`role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`). ArrowUp/ArrowDown/PageUp/PageDown/Home/End keyboard handling. Non-disruptive editing discipline (never clamp during typing; validate and clamp on blur or Enter). Stepper buttons excluded from tab flow (`tabindex="-1"`, `aria-hidden="true"`), minimum 44px mobile touch ergonomics, tabular numbers (`tabular-nums`), and non-passive wheel event cancellation.
  - `docs/design/24-progress-bars-rings-meters.md`: Semantic distinction between task/process progress (`role="progressbar"`) and scalar capacity gauges (`role="meter"` / `<meter>`). Indeterminate vs determinant handling. Linear progress optimization using GPU compositor `transform: scaleX(...)` with `transform-origin: left` instead of animating CSS `width`. Circular ProgressRing SVG implementation with `stroke-dasharray`, `stroke-dashoffset`, and `-90deg` top rotation. Accessibility rule prohibiting continuous live region chatter on ticking bars. 3:1 graphical contrast against track. Rarity drop colors strictly prohibited on progress fills.
  - `docs/design/25-breadcrumbs-hierarchy.md`: Architectural role for deep entity trees (`/items/[id]`, `/bosses/[id]`, `/conquest/[region]`, `/guilds/[id]`). Prohibited on single-level top routes. Semantic `<nav aria-label="Breadcrumb">`, `<ol>`, and `<li>`. APG rule requiring current page to be plain text with `aria-current="page"` (never a clickable link). Visual separators hidden from screen readers via CSS or `aria-hidden="true"`. Mobile collapsing into single parent back link (>= 44px touch target) or ellipsis disclosure menu. Label truncation with full title preserved in `title` attribute.
- Local `ROADMAP.md` tracking the 7-tier migration sequence, architectural coupling boundaries, and page status.
- UI component primitives in `src/components/ui/`: `Button`, `TextInput`, `SegmentedControl`, `Card`, `Badge`, `EmptyState`, `Table`, `Toast`, and `Banner`.
- Comprehensive suite of 12 Tier 3 UI primitives in `src/components/ui/`: `BottomDock`, `Drawer`, `Popover`, `Select`, `Tooltip`, `CommandDialog`, `SearchInput`, `Collapsible`, `Accordion`, `Avatar`, `Kbd`, `Separator`, and `Skeleton`.
- Centralized icon registry and wrapper primitive in `src/lib/icons.ts` and `src/components/ui/Icon.tsx`.
- Comprehensive scrollbar and containment specifications in `DESIGN.md` (Section 18) and `AGENTS.md` (Section 12), derived from MDN, Chrome Devs, NN/g (130k fixation study), Adrian Roselli keyboard regions, and WCAG 2.2 SC 1.4.11.
- Interactive showcase for all 12 primitives in `public/ui-preview.html` with working bottom dock simulation, slide-out drawer sheets, anchored popover, custom select listbox, tooltips, Ctrl+K command palette, search clearing, accordions, avatars, and skeleton wireframe hydration toggles.

### Changed
- **[2026-11-24 15:35] Search Icon Fix, Weather Cache Revalidation & Enemy Detail Modal Craft Polish (`EnemiesControls.tsx`, `EnemiesStyles.tsx`, `EnemyDetailModal.tsx`, `DataContext.tsx`, `useEnemiesState.ts`, `page.tsx`)**:
  - Fixed Search Box Icon Geometry:
    - Wrapped Lucide `<Search>` SVG inside a dedicated `.search-icon-box` container with strict 16x16px sizing and 38px flex centering, eliminating the inflated 44x44px clipped magnifying glass.
  - Revalidated Public Data Caches (`DataContext.tsx`):
    - Added `{ cache: "no-cache" }` to `world-locations.json`, `static-data.json`, and `all-items-db.json` fetches. Prevents browser HTTP and disk caches from serving stale 4-day-old forecasts when local data files are updated, guaranteeing live weather windows (Windy, Heatwave, Fog, etc.) appear immediately on all cards and the World Map.
  - Polished Monster Detail Modal (`EnemyDetailModal.tsx`, `EnemiesStyles.tsx`):
    - Added monster profile hero card with 56x56 portrait sprite, level badge, location badge, and overall loot drop chance.
    - Upgraded 4-stat combat attribute grid (Level, Health, Combat EXP, Loot EV per kill) with clear contrast and typography.
    - Refined weather synergy section with live window forecast countdown, active weather name, and color-coded preference pills.
    - Enriched loot drop table with item thumbnail sprites, drop rates (%), quantities, and live safe market gold values from `marketData`.
    - Maintained accessible mobile bottom-sheet ergonomics with touch targets >= 44px, zero CLS, and full keyboard navigation.
  - Verified across all 5 verification gates: 752 unit tests passing, 0 TypeScript errors, clean production build across 41 routes, and Playwright visual proof recorded.
- **[2026-11-24 15:10] Enemies Filter Toolbar Redesign, Map Deep-Link Fix & Data Cache Sync (`EnemiesControls.tsx`, `CustomSelect.tsx`, `EnemiesStyles.tsx`, `useEnemiesState.ts`, `useMapState.ts`)**:
  - Redesigned `/enemies` filter toolbar strictly per `DESIGN.md` Section 1, 3, and 4:
    - Banish double outline: Eliminated conflicting inner input focus outline by stripping redundant input borders and routing focus to outer `.search-input-wrap:focus-within`.
    - Dropdown stacking context: Removed `contain: layout` on `.enemy-controls` and set `position: relative; z-index: 30`, raising select menus (`z-index: 150`) cleanly above `.enemy-card` elements (`z-index: 1`).
    - Banish useless reset button: Removed permanent large reset button from controls header. Implemented dynamic active filter chips strip that surfaces only when filters are active, with 1-tap dismiss tags and a compact "Clear all" button.
    - Mobile filters visibility: Removed broken `<details>` container and hidden `<summary>`. Filters are now 100% visible and accessible on mobile with dual-mode custom desktop listbox and native overlay `<select>` for native OS picker wheel ergonomics.
    - Search deep-linking: Synchronized `searchParams.get("search")` on initialization and updated URL parameters via `window.history.replaceState`.
  - Fixed Map Location Deep Link (`useMapState.ts`):
    - Resolved React race condition where `locations[0].key` (Bluebell Hollow) would overwrite `searchParams.get("location")` during initial data load.
    - Initialized `selectedKey` directly from `locationParam` and guarded fallback assignment, ensuring `/map?location=whispering-woods` immediately highlights Whispering Woods on both the canvas pin and location dossier.
  - Synchronized Local Data Cache:
    - Cleaned up outdated local data from `origin/main` without affecting git history: refreshed `market-data.json`, `conquest-data.json`, `guild-database.json`, `guild-details.json`, `idlemmo-patch-notes.json`, `pet-database.json`, `scraper-status.json`, `static-data.json`, and `world-locations.json`.
  - Verified across all 5 verification gates: 752 unit tests passing, 0 TypeScript errors, clean production build across 41 routes, and automated Playwright headless verification tests passing with visual proof.
- **[2026-11-24 14:03] Enemies Bestiary Refactoring & High-Craft Migration (`EnemiesHeader.tsx`, `EnemiesControls.tsx`, `EnemyCard.tsx`, `EnemiesGrid.tsx`, `EnemiesPagination.tsx`, `EnemyDetailModal.tsx`, `EnemiesBackToTop.tsx`, `EnemiesStyles.tsx`, `useEnemiesState.ts`, `page.tsx`)**:
  - Completely overhauled the `/enemies` route under Zenith Astral Slate design tokens from `globals.css`.
  - Purged 4 bulky summary boxes in `EnemiesHeader.tsx` in favor of a clean, responsive inline metadata strip (`locations`, `favored now`, `penalized now`, and `weather profiles`), establishing immediate visual hierarchy without vertical bloat.
  - Upgraded monster card image rendering in `EnemyCard.tsx` to `<GameImage unoptimized={true} priority={index < 8} />` with skull icon fallback, pulling 48x48 sprites directly from CDN and eliminating image optimization queue delays.
  - Implemented discrete bounded pagination (`EnemiesPagination.tsx`) with 12/24/48 per-page selectors and smart ellipsis navigation, capping active DOM nodes.
  - Created floating `EnemiesBackToTop.tsx` button positioned safely at `bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 20px)` on mobile and `bottom: 24px` on desktop, guaranteeing zero dock collision.
  - Upgraded `EnemyDetailModal.tsx` to the centralized `ModalSheet` primitive with mobile bottom-sheet ergonomics, top drag handle, desktop centered dialog, 4-stat combat attribute grid (Level, HP, EXP, Loot EV), weather synergy cards, and interactive loot table linking directly to `ItemModal`.
  - Added URL deep-linking (`?enemy=`, `?id=`) with seamless history synchronization in `useEnemiesState.ts`.
  - Preserved strict mathematical invariance across EV calculations, weather preferences, and progression sorting.
  - Enforced test coverage with new `tests/unit/adversarial-enemies-ui.test.ts` (11 contract assertions passing).
  - Verified across all 5 verification gates: 752 unit tests passing (0 failures), 0 TypeScript errors, clean production build across 41 routes, and Playwright 1440px/375px visual captures recorded.
- **[2026-11-24 13:28] Items Table Continuous Row Outline Seams Fix (`ItemsStyles.tsx`)**:
  - Eliminated vertical notches and cuts along the top and bottom outline of hovered and focused table rows. Removed `border-left: 1px solid transparent; border-right: 1px solid transparent;` and `content-visibility: auto` from middle table cells, and switched from cell-level inset box shadows to native contiguous border color transitions (`border-top-color`, `border-bottom-color`, `border-left-color` on `:first-child`, and `border-right-color` on `:last-child`). Pinned item cell border right is cleared on hover to ensure a single unbroken, continuous rectangular outline with rounded 6px outer corners.
  - Verified across all 5 verification gates: 741 unit tests passing (0 failures), 0 TypeScript errors, clean production build across 41 routes, and visual Playwright row hover capture verified.
- **[2026-11-24 13:20] Items Directory Bounded Pagination, Desktop Table Scroll De-Lagging & Floating Back To Top Button (`ItemsTable.tsx`, `ItemsPagination.tsx`, `BackToTopButton.tsx`, `useItemsFilter.ts`, `useItemsState.ts`, `ItemsStyles.tsx`, `GameImage.tsx`, `page.tsx`)**:
  - Replaced desktop table virtual scrolling container with discrete bounded pagination (default 50 items/page, options for 25/50/100). Eliminated continuous `requestAnimationFrame` scroll listeners, state updates on scroll, 73,000px virtual container, and tiny scrollbar thumb, restoring instantaneous 120fps scrolling.
  - Built accessible `ItemsPagination.tsx` component with smart ellipsis page numbering (`1 ... 14 15 16 ... 28`), direct page size selector (`25 / 50 / 100`), first/prev/next/last navigation, and full keyboard navigation.
  - Created floating `BackToTopButton.tsx` with guaranteed zero dock collision: positioned strictly above the mobile dock at `bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px); right: 16px; z-index: 45;` on mobile and `bottom: 24px; right: 24px;` on desktop. Fades in smoothly when scroll position exceeds 300px and scrolls smoothly to top on tap.
  - Set `unoptimized = true` on `GameImage.tsx` by default, routing 32x32 CDN item icons directly from Cloudflare CDN with native browser disk caching and bypassing Next.js image optimization server queues, resolving 80+ pending HTTP requests on Slow 4G connections.
  - Removed infinite scroll sentinel loop in favor of paginated cards and tables, preventing runaway DOM footprint and high mobile memory consumption.
  - Verified across all 5 verification gates: 741 unit tests passing (0 failures), 0 TypeScript errors, clean Next.js 16 production build across 41 routes, and Playwright 375px/1440px visual captures recorded.
- **[2026-11-24 12:55] Items Directory Virtualization, Desktop Table Outline, Mobile Sort Ergonomics & Modal Polish (`ItemsTable.tsx`, `ItemsStyles.tsx`, `page.tsx`, `ItemModal.tsx`, `ItemModal.module.css`, `ItemsFilterBar.tsx`)**:
  - Implemented windowed table virtualization in `ItemsTable.tsx` using dynamic `scrollTop` tracking via `window.requestAnimationFrame`, `ROW_HEIGHT = 54`, `OVERSCAN = 8`, and top/bottom spacer rows. Replaced 15,000+ reconciled DOM nodes with ~30 active rows, completely eliminating UI lag on large catalog browsing.
  - Restricted the infinite scroll `IntersectionObserver` sentinel strictly to mobile card mode (`state.showCardLayout`) with a 300ms cooldown lock and 120px root margin, permanently preventing runaway loop re-triggers. Desktop table layout directly consumes `state.filteredItems` in the virtual window without requiring scroll sentinels.
  - Fixed table row hover and focus bottom outline cutoff in `ItemsStyles.tsx`: replaced cell border-color overrides with inset `box-shadow` (`inset 0 1px 0 var(--border-focus), inset 0 -1px 0 var(--border-focus)` on middle cells, `inset 1px 1px 0` on `:first-child`, and `inset -1px 1px 0` on `:last-child`), ensuring the complete 4-sided glowing outline is 100% visible and never clipped by sibling rows.
  - Refined desktop table alignment: unified row height to 54px with `item-copy` displaying bold name and clean type subline, ensuring every row across all 1,355 items has consistent vertical rhythm and horizontal baseline alignment.
  - Solved mobile sort control overlap: on viewports <= 767px, hid `.sort-direction-label` and converted `.sort-direction-toggle` into a 44x44px icon button, giving the sort picker full width to display labels without wrapping or clashing.
  - Enhanced `ItemModal` Tier Simulator: strictly excluded non-upgradeable categories (bars, ores, food, potions, materials, recipes) from the simulator, prevented redundant `100 -> 100` notation when tier is 0, and applied `white-space: nowrap` on `tierPill` to eliminate line wrapping.
  - Polished effect formatting: mapped `speed` and `wait_length` to native `Efficiency` (e.g. `+20% Dungeon Efficiency`, `+20% Hunt Efficiency`) and cleanly formatted experience buffs (`+40% Dungeoneering XP`).
  - Enhanced market evaluation: formatted Recent 10 Sales Range with 3 non-overlapping columns (Low, Median, High) and cyan diamond marker, interactive 30-day SVG trend chart with percent badges, and volume depth cards.
  - Verified across all 5 verification gates: 741 unit tests passing (0 failures), 0 TypeScript errors, clean Next.js 16 production build across 41 routes, and Playwright 375px/1440px visual captures recorded.
- **[2026-11-24 12:10] Items Directory & ItemModal Base Crafting Recipes, Table Outline & Infinite Scroll Polish (`default-base-recipes.mjs`, `rebuild-usage-map.mjs`, `ItemModal.tsx`, `ItemsStyles.tsx`, `page.tsx`, `route.ts`, `items-recipes-contract.test.ts`)**:
  - Implemented 103 base crafting recipes in `src/lib/default-base-recipes.mjs` and linked into `public/usage-map.json`:
    - 9 Smelting bars (Tin to Mystic): `1x [Metal] Ore + 1x Coal Ore` under `SMELTING`.
    - 13 Cooking dishes (Cooked Cod to Great White Shark): `1x [Fish] + 1x Coal Ore` under `COOKING`.
    - 9 Forge bows (Oak Bow to Mystical Bow): `10x [Wood] Log + 5x Coal Ore` under `FORGE`.
    - 72 Forge weapons and gear items (9 metals x 8 slots: Sword, Dagger, Shield, Helmet, Chestplate, Greaves, Boots, Gauntlets): `10x [Metal] Bar + 5x Coal Ore` under `FORGE`.
    - Linked reverse recipe relationships so `Coal Ore` now has 104+ uses and metal bars link to all matching forge gear.
  - Corrected buff terminology in `ItemModal.tsx`: changed `Speed` and `wait_length` to native IdleMMO player terminology `Efficiency` (e.g. `+20% Dungeon Efficiency`, `+20% Hunt Efficiency`).
  - Removed redundant `World Gathering Node` subtitle from Gathering Locations in `ItemModal.tsx`.
  - Fixed table row hover and focus bottom outline cutoff in `ItemsStyles.tsx`: applied `border-top: 1px solid transparent; border-bottom: 1px solid rgba(255, 255, 255, 0.05); border-left/right: 1px solid transparent;` with `position: relative; z-index: 6;` on `tr:hover` and `tr:focus-visible`, ensuring a complete 4-sided glowing border with zero clipping from adjacent rows.
  - Eliminated manual repeated "Load 48 more" button clicking: added an automatic `IntersectionObserver` sentinel in `ItemsArchiveContent` (`page.tsx`) with 400px root margin for seamless infinite scrolling.
  - Optimized large-catalog table rendering performance: added `content-visibility: auto; contain-intrinsic-size: 0 53px;` to `ItemsStyles.tsx` table rows to skip offscreen DOM rendering and maintain 60fps scrolling.
  - Enforced test coverage with new `tests/unit/items-recipes-contract.test.ts` (5 contract assertions passing).
  - Verified across all 5 verification gates: 741 unit tests passing (0 failures), 0 TypeScript errors, production build succeeding across 41 routes, and Playwright 375px/1440px visual captures recorded.
- **[2026-11-24 11:25] Items Directory & ItemModal Anti-Slop, Layout Collision & Ergonomics Fixes (`ItemModal.tsx`, `ItemModal.module.css`, `ItemsFilterBar.tsx`, `ItemsStyles.tsx`, `build-item-lore-signals.mjs`, `capture-items-visual-proof.mjs`)**:
  - Fixed mobile sort control collision: eliminated `.control-input` width override on `.sort-direction-toggle` in `ItemsFilterBar.tsx` and bound `.sort-direction-toggle` to `width: auto`, allocating 234px for the sort property picker (`Stable Volume`) and 73px for the direction toggle (`Desc`) without clashing.
  - Eliminated text collisions in the Recent Sales Price Spread visualizer: replaced absolute positioned overlapping labels with a structured 3-column flex layout (`Low Sale`, `Median Sale`, `High Sale`) under the track, while retaining the cyan glowing diamond indicator at the exact median percentage coordinate.
  - De-bloated crafting recipe usage copy in `ItemModal` Sources tab: removed `Crafting Station: FORGE` metadata, displaying exclusively the recipe name on the left and required amount on the right (`{rec.amount}x required`).
  - Fixed lore codex links formatting: resolved invalid lore ID in `scripts/build-item-lore-signals.mjs` (`world-the-celestial-system-of-valaron` -> `world-celestial-system`), rendering clean titles, summaries, and wiki links.
  - Reformatted consumable buffs and restoration effects: transformed raw engine attributes into clear player-facing copy (`+20% Dungeon Speed`, `+20% Hunt Speed`, `+X% Speed/XP`).
  - Corrected Equipment Tier Simulator fixed stats: when stat modifier is 0 (e.g. Critical Chance = 7), simulator displays static base value (`7`) without redundant arrow notation (`7 -> 7`).
  - De-bloated headers and section titles across `ItemModal` to clean gamer terminology (`Overview`, `Market`, `Sources`, `30-Day Price Trend`, `Recent Sales Spread`, `Sell Advice`, `Crafting Profit`, `Crafting Recipe`, `Gathering Locations`, `Dungeon Drops`, `World Boss Drops`, `Monster Drops`, `Used in Recipes`).
  - Verified across all 5 verification gates: 736 unit tests passing (0 failures), 0 TypeScript errors, production build succeeding across 41 routes, and Playwright 375px/1440px visual captures recorded in artifacts directory.
- **[2026-11-23 18:25] Items Directory & Global ItemModal Refinement & Visual Polish (`ItemModal.tsx`, `ItemModal.module.css`, `ItemsHeader.tsx`, `ItemsFilterBar.tsx`, `ItemsTable.tsx`, `ItemsCardGrid.tsx`, `ItemsStyles.tsx`, `route.ts`)**:
  - Removed clutter from page header: eliminated the 5 redundant summary boxes and catalog tag, streamlining down to a single clean `Item Directory` title with active item count badge and plain subtitle.
  - Eliminated the confusing `Market labels` details banner, replacing it with an integrated, on-demand `Tag Guide` popover banner.
  - Re-engineered filter and search controls: grouped Sort dropdown and sort direction arrow into one cohesive control cluster with `ArrowDownNarrowWide`/`ArrowUpNarrowWide` icons, and converted the market button into a distinct `Tradeable only` pill.
  - Fixed desktop table alignment and rendering: removed the Lea Verou radial side shadow smudge on the table right edge, strictly left-aligned item names and descriptions directly adjacent to item icons, and pinned the item column width to 280px with `<colgroup>`.
  - Upgraded table tag signals with distinct, padded badge pills (`Likely market`, `Farmable`, `Craft`, `Lore`) with colored borders and text instead of unstyled running text.
  - Corrected game logic in `ItemModal`: restricted the Tier Upgrade Simulator strictly to upgradeable equipment (`max_tier > 1` with `tier_modifiers` or `upgrade_requirements`), eliminating the simulator for bars, ores, materials, fish, and potions.
  - Fixed recipe acquisition sources: IdleMMO recipes drop from Dungeons and Dungeon Chests, never standard mobs; updated `src/app/api/items/[id]/route.ts` to enrich recipe dungeon sources from all 18 dungeons and 81 chests, and partitioned the Sources tab in `ItemModal` into Dungeon Drops (`Castle` icon), World Boss Drops (`Crown` icon), and Monster Drops (`Swords` icon).
  - Built comprehensive visual charts in `ItemModal` Market & Valuation tab: interactive SVG Price Trend Chart (30d -> 14d -> 7d -> Safe Trajectory, spike line, trend percentage badge), Recent 10-Sale Price Spread Visualizer (low, median, high track bar), 4-metric volume depth breakdown, and direct gamer wording for the Sell Advisor.
  - Re-engineered mobile card grid (`ItemsCardGrid.tsx`): semantic cards matching Astral Slate tokens, 44px thumbnail, 4-stat metric blocks, gathered source preview with map pins, and safe-area dock clearance.
  - Verified across all 5 verification gates: 736 unit tests passing (0 failures), 0 TypeScript errors, production build succeeding, and Playwright desktop/mobile visual captures in artifacts directory.
- **[2026-11-23 14:45] Items Directory & Global ItemModal Comprehensive Overhaul (`ItemModal.tsx`, `ItemModal.module.css`, `ItemsTable.tsx`, `ItemsCardGrid.tsx`, `ItemsHeader.tsx`, `ItemsStyles.tsx`, `route.ts`)**:
  - Fixed market price resolution bug in `src/app/api/items/[id]/route.ts` where raw market data lacked a direct `market_price` property, mapping `getSafeMarketValue` and `price` so all market listings populate accurately.
  - Rebuilt `ItemModal` on top of `ModalSheet` with 3 segmented tabs: Overview & Stats, Market & Valuation, and Sources & Crafting.
  - Built interactive Equipment Tier Upgrade Simulator with real-time stat scaling (`base + tier * modifier`) and required upgrade stone/material calculations.
  - Built Consumable Restoration and Active Buffs display showing health/hunger restore, duration, and target stats.
  - Built Container Loot Drop table for chests and crates with itemized percentage drop chances and 1-tap navigation to item drops.
  - Built Recipe Blueprint link for recipes to inspect craftable products directly.
  - Built Market Valuation Engine displaying Safe Market Price (with 3-day outlier suppression badge), 7d/30d moving averages, 30d/7d volume, daily transaction velocity, recent 10-sale price spread (low, median, high), and an automated Sell Advisor comparing Vendor, Boosted Vendor (with Bartering skill), and Net Market returns after 15%/12% tax.
  - Built Reverse Crafting Explorer ("Used to Craft") mapping materials to all Forge and Alchemy recipes with station badges and required quantities.
  - Modernized desktop table (`ItemsTable.tsx`, `ItemsStyles.tsx`): pinned sticky item column with right border and opaque background, sticky headers, Lea Verou pure CSS scrolling shadows, and right-aligned numeric data columns.
  - Overhauled mobile view (`ItemsCardGrid.tsx`): high-contrast cards with rarity accent strips, 44px thumbnails, 4-stat metric blocks, source previews, and active press scale feedback.
  - Upgraded header (`ItemsHeader.tsx`): executive KPI summary cards with dedicated Lucide icons, elevated surfaces, and tabular numbers.
  - Verified across all 5 verification gates: 736 unit tests passing (0 failures), 0 TypeScript errors, production build succeeding across 41 routes in 1.78s, and Playwright desktop/mobile visual captures in artifacts directory.
- **[2026-11-23 12:15] Authoritative Page Refactoring & Migration Standard (`docs/design/18-page-refactoring-protocol.md`, `AGENTS.md`, `DESIGN.md`)**:
  - Established a 6-stage engineering protocol for all future route migrations synthesized from 3 rounds of deep failure-mode analysis, player ergonomics, and operational rigor.
  - Mandated Stage 1 Ground Truth verification (IdleMMO wiki docs, post-wiki patch notes delta, null price audits, and baseline characterization test safety net).
  - Codified Stage 2 Teardown Proposal gate requiring explicit user sign-off on deleted clutter, missing items, and primitive gaps before code changes begin.
  - Implemented data volume budgets (pagination/deferred search for >50 items), the 4-state matrix (Ready, Empty, Loading, Error), URL deep-linking (`?id=`, `?tab=`), and mobile soft-keyboard resistance.
  - Enforced the 5 Verification Gates: Logic Invariance, Layout Stability (zero CLS <= 0.1, >=44px touch targets), 100% Unit Tests, 0 TypeScript errors, and Playwright 375px/1440px visual evidence.
  - Codified across `docs/design/18-page-refactoring-protocol.md`, `AGENTS.md` (Section 5), and `DESIGN.md` (Section 18).
- **[2026-11-23 11:25] UI Sound Design Specification & Acoustic Architecture (`docs/design/17-sound-haptics-design.md`, `AGENTS.md`, `DESIGN.md`)**:
  - Authored comprehensive sound and tactile haptics design specification synthesized from Material Design sound guidelines, Apple HIG audio and haptics, W3C WCAG 2.2 accessibility standards (SC 1.4.1 non-exclusivity and SC 1.4.2 audio control), and MDN Web Audio API best practices.
  - Established 5 universal semantic sound outcomes (select, copy, sync, warning, error) with strict prohibitions against hover, keystroke, scroll, and page load sounds.
  - Specified Web Audio API `AudioBuffer` and audio sprite integration pattern with first-gesture `AudioContext` unlocking to prevent browser autoplay blocks.
  - Documented mobile tactile vibration patterns (`navigator.vibrate`) for Android/PWA users bound to user preferences.
  - Established CC0 / MIT licensing catalog requirements in `public/audio/LICENSE.md`.
  - Updated `AGENTS.md` and `DESIGN.md` (Section 17). Verified with 736 unit tests and zero TypeScript errors.
- **[2026-11-23 10:48] Global Toast Notification System & Rotating Tips Retirement (`Toast.tsx`, `Toast.module.css`, `layout.tsx`, `CraftingContext.tsx`, `SiteFooter.tsx`)**:
  - Mounted `ToastProvider` globally in `src/app/layout.tsx` so all components and contexts across the entire application can trigger `useToast()`.
  - Raised Toast viewport to `z-index: 11000` in `Toast.module.css` to guarantee notifications float strictly above modals (`z-index: 9999`), drawers, and sheets without being hidden behind backdrops.
  - Added pure CSS mobile stack limitation (`.toast:nth-child(n+3) { display: none; }`) to cap mobile viewports to 2 visible toasts, preventing screen clutter above the dock.
  - Implemented decoupled `zenith:toast` custom event emission for future audio engine subscriptions, and bridged legacy `zenith-notify` event listener into `ToastProvider`.
  - Retired ad-hoc local toast components in `/profiles` and `/pets/owned`, migrating actions (pet removal Undo, profile backup copies) to use global `useToast()`.
  - Added real feedback toasts for previously silent actions (e.g. adding recipes to crafting queue with a "View Queue" action button, copying Discord handles, and exporting backups).
  - Permanently retired and purged `RotatingTips` (`RotatingTips.tsx`, `RotatingTips.module.css`) to eliminate unprompted popups, audible chimes, and redundant messaging, keeping the UI completely silent and focused on user-driven action feedback.
  - Added dedicated test suite `tests/unit/toast-system.test.ts` (6 tests passed). Total unit tests: 736 tests across 52 test files with 0 TypeScript errors. Verified visually with Playwright.
- **[2026-11-23 01:40] Dynamic & Custom Mobile Dock Tabs, Theme Purge, and Knip Dead Code Cleanup (`MobileBottomDock.tsx`, `route-history.ts`, `AppearancePanel.tsx`, `navigation.ts`, `preferences.ts`)**:
  - Implemented client-side route visit tracking (`src/lib/route-history.ts`) to automatically rank and surface the user's top 3 most visited tools on the mobile dock by default.
  - Added customization preference (`mobileDockTabs`) in `AppearancePanel.tsx` allowing users to toggle between "Top 3 Visited (Dynamic)" and "Custom 3 Tabs" with 3 slot dropdowns for any tool or database.
  - Purged the 4 legacy color themes (Ember, Forest, Arcane, Frost) from Settings and `Settings.module.css`, adhering to the monochromatic Astral Slate design system.
  - Ran Knip dead code audit (`npm run audit:deadcode`) and deleted 5 orphaned files (`DataFreshnessBanner.tsx`, `DataFreshnessBanner.module.css`, `DesktopDock.tsx`, `MobileCommandWheel.tsx`, `MobileCommandWheelHost.tsx`), bringing Knip unused files down to 0.
  - Added unit test suite in `tests/unit/route-history.test.ts` (5 tests passed). Total unit tests increased to 730 tests across 51 test files with 0 TypeScript errors.
- **[2026-11-23 00:55] Mobile BottomDock Integration & Settings Dead Code Purge (`MobileBottomDock.tsx`, `layout.tsx`, `AppearancePanel.tsx`, `Shell.module.css`, `Settings.module.css`)**:
  - Integrated `MobileBottomDock` into the root application shell, providing thumb-zone 1-tap navigation across Home, Items, Alchemy, Bosses, and Menu on mobile viewports (<768px).
  - Retired runtime execution of legacy `MobileCommandWheelHost` and `DesktopDock` from `RootLayout`.
  - Added mobile content wrapper bottom clearance (`padding-bottom: calc(64px + max(12px, env(safe-area-inset-bottom, 12px)))`) in `Shell.module.css` to prevent fixed dock overlap.
  - Purged 4 dead settings components (`ActiveProfilePanel.tsx`, `FallbackToolsPanel.tsx`, `PrivacyPanel.tsx`, `ToolPicker.tsx`) and 193 lines of unused CSS from `Settings.module.css`.
  - Removed dead `openToolPicker` state from `useSettingsState.ts` and `types.ts`.
  - Replaced obsolete navigation style toggles (desktop dock / radial menu) in `AppearancePanel.tsx` with a clean color theme selector (Ember, Forest, Arcane, Frost) using accessible radio cards with color swatches.
  - Removed deprecated `legacyBehavior` on `<Link>` in `settings/page.tsx`, eliminating Next.js console warnings.
  - Verified with 726 passing unit tests, zero TypeScript errors, and Playwright mobile rendering proofs.
- **[2026-11-22 23:24] Brand Identity & Logo System Overhaul (`ZenithBrand.tsx`, `Sidebar.tsx`, `Sidebar.module.css`, `icon.svg`, `favicon.svg`)**:
  - Reconstructed the brand identity from the approved design reference into 100% pure, resolution-independent vector SVG with zero external font dependencies.
  - Implemented the standalone Zenith Mark: forward-sweeping angular Z-wings with a parallel negative-space diagonal slit, an eight-point celestial apex star, and a tapered mathematical elliptical horizon arc.
  - Implemented the matching wide-stance ZENITH Wordmark: custom tech-geometric letterforms featuring the stylized three-bar floating "E" and sharp terminal angles.
  - Integrated `ZenithMark` and `ZenithWordmark` components (`src/components/brand/ZenithBrand.tsx`) into the desktop sidebar header (`Sidebar.tsx`) and mobile navigation drawer, permanently replacing the temporary `Activity` pulse line and generic text title.
  - Replaced the legacy gold hexagon and crown icon in `src/app/icon.svg`, `public/favicon.svg`, `public/apple-icon.png`, `public/icon-192.png`, and `public/icon-512.png` with the new Astral Slate mark and squircle container, fully optimized down to 16px tab resolution.
- **[2026-11-22 21:17] Mobile Left Shadow Elimination & Compact Footer Polish (`Sidebar.module.css`, `SiteFooter.tsx`, `SiteFooter.module.css`)**:
  - Eliminated rogue mobile viewport shadow bleed by scoping `box-shadow: 20px 0 70px rgba(0, 0, 0, 0.7)` strictly to `.sidebarOpen` in `Sidebar.module.css`, removing the 70px projection blur that bled past the screen's left edge when the mobile drawer was closed (`translateX(-100%)`).
  - Purged decorative icon filler from the footer brand bar: eliminated the sparkles box and shield icon, keeping clean typography (`Zenith Companion` with an understated `Local-first` pill).
  - Simplified user-facing copy: replaced inflated technical jargon ("recursive alchemy expected value, player-crafted market valuation") with plain, human wording: "Market prices, crafting recipes, and skilling calculators for IdleMMO. Your data stays in your browser."
  - Fixed mobile vertical stretching: hid redundant internal navigation links on mobile (which duplicate the bottom dock and drawer navigation), formatted community links (Play IdleMMO, Creator Profile, Discord copy button) as a compact horizontal wrap row, and tightened container padding (`1.25rem 1rem`), reducing mobile footer height by over 60%.
- **[2026-11-22 21:03] Site Footer Redesign (`SiteFooter.tsx`, `SiteFooter.module.css`)**:
  - Replaced hardcoded cyan (`rgb(125, 211, 252)`) and blue hover states (`rgba(59, 130, 246, ...)`) with monochromatic neutral Astral Slate design tokens (`--bg-panel`, `--border-subtle`, `--text-main`, `--text-muted`).
  - Replaced confusing non-clickable pill badges with distinct, accessible action links (Play IdleMMO, Creator Profile) and an interactive Discord handle button (`d3v_gh0st`) with one-click clipboard copying and tactile feedback.
  - Replaced security shield branding with a clean, gamer-focused identity block highlighting Zenith's local-first browser storage and progression calculators.
  - Formatted responsive layout: balanced 2-column grid on desktop, cleanly stacked single-column layout on mobile with minimum 44px touch targets and `env(safe-area-inset-bottom)` clearance.
- **[2026-11-22 20:53] Desktop Sidebar Navigation Overhaul (`Sidebar.tsx`, `Sidebar.module.css`, `ZenithIcon.tsx`, `navigation.ts`)**:
  - Replaced crude custom hand-drawn SVG icons with official Lucide SVGs with standard 1.75 stroke width across all 25 application routes, eliminating duplicate icons and inappropriate metaphors (e.g. replaced supermarket shopping cart with `Layers` on Crafting Queue and `Hammer` on Forge Crafting; replaced 6-legged insect with `Swords` on Enemy Database; replaced financial trend line with `Scale` on Pet Comparison; replaced duplicate file icon with `BookOpen` on Lore and `ScrollText` on Patch Notes; added `Heart` on Owned Pets; mapped `Database`, `Calculator`, and `Compass` to group headers).
  - Fixed sidebar open/close ergonomics: moved the expand button from the bottom footer to the top header in 64px rail mode (`y: 28px`), perfectly aligning with the collapse button in expanded mode to completely eliminate vertical mouse travel.
  - Permanently fixed duplicate native browser tooltip collision by stripping native `title` attributes on buttons wrapped in `<Tooltip>`.
  - Removed redundant active profile card and "v0.86.1" engine version badge from the sidebar footer, freeing 52px of vertical real estate so all tools and databases breathe naturally with minimal scrolling.
  - Replaced snap-collapse panels with butter-smooth CSS grid row animations (`grid-template-rows: 1fr` to `0fr` with spring curves and opacity transitions).
  - Added `:active { transform: scale(0.985); }` tactile pressed feedback on all links and header controls.
  - Verified 100% with 726 passing unit tests, zero TypeScript errors, and Playwright visual screenshots.
- **Tier 3 UI Primitives Overhaul & Verification (12 Components Verified in 6 Pairs)**:
  - **Pair 1 (`BottomDock` & `Drawer`)**: Reset raw native button styling; added 390px mobile viewport simulation frame; implemented frosted glassmorphism, active indicator capsule pill with spring transitions, monospace notification badges, tactile press feedback (`scale(0.92)`), and roving arrow keys; upgraded drawer with Astraea character dossier, categorized route groups, live D1 Edge sync green pulse pip, and 240ms/180ms cubic-bezier spring curves.
  - **Pair 2 (`Popover` & `Select`)**: Dynamically computed horizontal arrow pointing to trigger center regardless of collision shifts, card `overflow: visible` fix, placement toggle with collision flip, rich loot card with drop percentage tracks and expected value breakdown; implemented full W3C ARIA Combobox Listbox pattern on trigger button (`ArrowDown`, `ArrowUp`, `Home`, `End`, `Enter`, `Space`, `Escape`), 500ms debounced typeahead buffering, authentic IdleMMO glowing rarity dots, and 44px min-height touch targets.
  - **Pair 3 (`Tooltip` & `CommandDialog`)**: Implemented centered directional arrows for all 4 placements, WCAG 2.2 SC 1.4.13 Hoverable compliance via 150ms mouseleave grace period allowing cursor travel into tooltip content, and Escape dismiss; resolved command dialog arrow navigation freeze by attaching keydown listeners directly to the input, added fuzzy category grouping, single custom clear button, and polite live region result announcements.
  - **Pair 4 (`SearchInput` & `Collapsible`/`Accordion`)**: Suppressed native WebKit `-webkit-search-cancel-button` pseudo-elements to permanently eliminate duplicate X icons; wired single accessible clear button, Escape shortcut, and live item catalog filtering with match highlighting; upgraded collapsible to an independent sidebar navigation disclosure with rich route links and badges; implemented W3C APG Accordion with `<h3>` semantic headers, single-expansion state, and arrow key roving focus.
  - **Pair 5 (`Avatar` & `Kbd`)**: Implemented size scale (xs to xl), image error handling with graceful fallback to initials, dual-cue rarity discipline (accessible text badges + authentic IdleMMO rarity glow rings matching game tokens), online pulse pip, and level badges; implemented semantic `<kbd>` keycaps, `<kbd-group>` wrapper resolving nested border bugs, interactive hardware key tester with tactile press state, and WCAG 2.1.4 single-key safeguards.
  - **Pair 6 (`Separator` & `Skeleton`)**: Implemented semantic `<hr>` vs decorative divider, inline vertical stat separators for toolbars, and interactive W3C ARIA window splitter with arrow key resizing and drag support; implemented skeleton wireframe with `SkeletonContainer` polite live region announcement (`aria-busy="true"`, `aria-live="polite"`) and exact 1:1 pixel geometry matching (188px) to loaded Void Behemoth card to guarantee Zero Cumulative Layout Shift (CLS &le; 0.1).
- **Settings Page (`/settings`) Modernization & Decluttering**:
  - Encapsulated presentation layer in scoped `Settings.module.css` with strict CSS custom properties (`--bg-base`, `--bg-card`, `--bg-panel`, `--text-accent`, `--border-subtle`).
  - Replaced bulky 2x2 stat boxes with an elegant, compact horizontal summary ribbon displaying market tax (with member badge), active character profile, market cache age, and custom price overrides count.
  - Decluttered layout into a balanced two-column desktop grid: Interface & Navigation in column 1, Account & Membership in column 2, followed by full-width Custom Item Prices, Data Cache & Storage, and bottom utilities.
  - Stripped 4 non-functional theme buttons (Ember, Forest, Arcane, Frost) which possessed zero attached styles or tokens.
  - Stripped obsolete and dead copy ("Web push notifications are managed separately within Market Watch").
  - Removed looping Lo-fi background audio loop (`ZenithAudio.tsx`) and volume sliders; replaced with a single clean toggle (`Sound Effects: Enabled / Muted`).
  - Removed redundant Active Character Profile and Fallback Gathering Tools cards from `/settings` (profiles belong on `/profiles`, and calculators read equipped tools directly).
  - Consolidated standalone privacy card into a clean local-first privacy footnote inside Data Cache & Storage.
  - Replaced legacy radio buttons and custom toggle buttons with accessible `SegmentedControl` components for Membership tier (12% vs 15% tax), Desktop navigation layout (Sidebar vs Dock), Dock position (Bottom, Left, Right), Mobile navigation (Standard Dock vs Radial Menu), Touch feedback (Subtle Haptics vs Off), and Tips & Notices.
  - Modernized Custom Item Prices panel: autocomplete combobox, gold input, add/clear buttons, outlier `<Banner>` alert, and accessible `<ModalSheet>` confirmation dialog with focus trap.
  - Upgraded Data Cache & Offline Storage panel with `Button` primitives, storage metrics, and informational recovery `<Banner>`.
  - Upgraded `InstallAppHelper` to consume `Card` and `Button` primitives directly, eliminating nested container padding.
- **Lore Page (`/lore`) Modernization**:
  - Replaced bulky stats cards with a compact, scannable inline metadata strip (`88 Records · 192 Relations · 15 Theories`).
  - Upgraded view switcher and filters to `SegmentedControl` and responsive category rail with badge counts.
  - Redesigned canvas backdrop from a basic 2D particle web to an illuminated celestial codex canvas with starlight motes, constellation leylines, and autonomic camera breathing.
  - Portaled `LoreEntryModal` to `document.body` to resolve stacking context collisions with navigation shell.
  - Optimized modal scrolling performance: removed `backdrop-filter: blur(4px)` and permanent `will-change: transform`, added `transform: translateZ(0)` and `contain: content` to enable GPU-accelerated scrolling.
  - Added MutationObserver in `LoreCanvas.tsx` to automatically halt `requestAnimationFrame` and mouse movement processing when a modal is open, freeing 100% of the main thread and GPU for smooth scrolling.
  - Corrected button optical centering in `Button.module.css` (`.icon` and `.iconTrailing` line-height resets) and `.lore-reset-btn`, reducing icon-text vertical alignment delta to exactly 0.000000px.
- **Weather Page (`/weather`) Modernization**:
  - Upgraded hero layout with high-contrast active weather conditions, additive modifier tables, and regional forecasts.
  - Implemented GPU-accelerated atmospheric weather canvas with automatic `IntersectionObserver` viewport throttling and reduced-motion fallback.

### Fixed
- Fixed mobile touch target violation on `DataFreshnessBanner.module.css` close button (adjusted to min-width: 44px, min-height: 44px to satisfy WCAG 2.2 SC 2.5.8).
- Fixed desktop/mobile control leaking on `/settings`: scoped `.settings-desktop-only` and `.settings-mobile-only` to ensure mobile navigation and haptics never display on desktop, and desktop dock options never display on mobile.
- Fixed theme button overlapping bug on `/settings` by overriding legacy 12-column grid inheritance from `globals.css` with a responsive 2-column to 4-column layout.
- Fixed Mystery Board category picker button squishing and text overflow (`flex: 0 0 auto; white-space: nowrap;`).
- Fixed Reset button vertical centering in `src/components/ui/Button.module.css` where unstyled icon span caused the SVG to sit 1.5px above text baseline.
- Fixed modal scrolling lag by eliminating competing canvas RAF cycles and backdrop blur recalculation.
- Fixed stacking context entrapment on `LoreEntryModal` preventing sidebar navigation occlusion.
- Fixed timeline chronology spine trailing line overrun: dynamically anchored rail from first node capsule center to last node capsule center, eliminating the dangling line below the final milestone.

### Verified
- Mobile target size audit: 100% compliant across `/settings` interactive controls (>= 44x44px minimum touch targets).
- Accessibility smoke audit: 0 critical/serious Axe violations on `/settings` across both desktop and mobile viewports.
- Product flow regression: `settings persist theme changes and expose install/offline controls` passed in 1.8s.
- Theme geometry verification: Ember (`101.36x59px`), Forest (`101.36x59px`), Arcane (`101.36x59px`), Frost (`101.38x59px`) with zero subpixel overlap.
- Subpixel Playwright geometry verification: Button Center Y `465.859375`, Icon Center Y `465.859375`, Label Center Y `465.859375` (delta: `0.000000px`).
- Timeline spine termination verification: Rail Bottom Y `350.6875`, Last Capsule Center Y `350.6875` (delta: `0.000000px`, line extends below capsule bottom: `false`).
- Modal scroll testing: 6-cycle rapid wheel oscillation completed in 954ms with zero frame dropping.
- Unit testing: 50 test files passed, 707 tests passed (0 failures).
- TypeScript: Typecheck passed with 0 errors.
