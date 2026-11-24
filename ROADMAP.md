# Zenith Companion — Refactoring & Migration Roadmap

This roadmap tracks the complete presentation-layer redesign, UI/UX modernization, and accessibility overhaul for Zenith Companion across all application routes. It is maintained locally and updated with every milestone.

---

## Architectural Principles & Scope Boundaries

1. **Strict Logic Invariance**:
   Mathematical formulas, economy calculations, scrapers, API endpoints, D1 SQLite edge databases, and data schemas remain 100% untouched. Refactoring is strictly presentation-layer (semantic HTML, CSS modules/tokens, responsiveness, accessibility, zero CLS, and clean copy).

2. **No AI Slop / Native Gamer Terminology**:
   All user-facing copy is reviewed to remove generic, pretentious AI vocabulary (*delve, tapestry, testament, fosters, pivotal, intricate*). Copy uses native IdleMMO player terminology (*Efficiency* instead of *Speed*, *Drops/Loot* instead of *Yields*, *Active Windows* instead of *Operational Intervals*).

3. **Critical Design Evaluation & Simplification**:
   Every route is evaluated critically to remove redundant metric boxes, unhelpful stats, and visual noise. The 3-to-5 Tap Rule is enforced: players must achieve their primary task immediately above the fold.

4. **Five Verification Gates**:
   Every page migration must pass:
   - Gate 1: Strict Logic Invariance (zero formula/state changes).
   - Gate 2: Layout Stability & Ergonomics (CLS <= 0.1, touch targets >= 44x44px, `overscroll-behavior: contain`).
   - Gate 3: Visual Contrast (WCAG AA >= 4.5:1 text, >= 3:1 non-text/scrollbars).
   - Gate 4: Unit Test Contracts (`npm run test:unit` passes 100%).
   - Gate 5: TypeScript Compilation (`npm run typecheck` passes with 0 errors).

---

## Architectural Tiers & Dependency Order

```
[Tier 1: Global Shell & Layout] -> [Tier 2: Independent Leaf Pages] -> [Tier 3: Reference & Entities] -> [Tier 4: Economy & Skilling Engines] -> [Tier 5: Aggregator]
```

Routes are migrated in dependency order from lowest coupling (zero blast radius) to highest coupling:

### Tier 1: Leaf & Aesthetic Routes (Lowest Coupling)
- [x] **/weather**: Modernized hero banner, real-time region cards, enemy preference chips, high-performance canvas atmosphere (Clear, Rain, Snow, Storm, Fog) with `IntersectionObserver` throttling, and responsive table layout.
- [x] **/lore**: Redesigned celestial codex canvas, inline metadata strip, segmented view controls, interactive chronology timeline with epoch dividers, dossier modal with hardware-accelerated scrolling and zero backdrop lag.

### Tier 2: Settings & Form Controls (Completed & Verified)
- [x] **/settings**: Scoped CSS module, decluttered 2-column layout, removed phantom themes and obsolete copy, removed Lo-fi background audio loop, simplified audio to single Enabled/Muted toggle, removed redundant active profile and fallback tools cards, consolidated local-first privacy notice into Data Cache & Storage, and upgraded controls to tested UI primitives (`TextInput`, `SegmentedControl`, `Button`, `Card`, `Banner`, `ModalSheet`). Verified with 707 unit tests, 0 TypeScript errors, production build, and 0 Playwright a11y/touch-target violations.

### Tier 3: Shell Chrome & Navigation Frame (Completed & Verified)
- [x] **[2026-11-24 17:15] Complete 14-Component Master Suite (All 38 Custom Primitives Built & Tested)**:
  - Built, tested, and exported all 14 remaining UI components across 5 specification batches:
    1. `Pagination` (`Pagination.tsx`, `Pagination.module.css`): W3C APG pagination landmark, double ellipsis sequence, disabled bounds, live region announcements.
    2. `Combobox` (`Combobox.tsx`, `Combobox.module.css`): `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, roving active descendant, clear button.
    3. `Tabs` (`Tabs.tsx`, `Tabs.module.css`): Underline and pill variants, badge counts, roving tabindex arrow navigation (`ArrowRight`/`ArrowLeft`/`Home`/`End`).
    4. `Tag` / `Chip` (`Tag.tsx`, `Tag.module.css`): Two-tier drop rarity styles, interactive filter toggle buttons (`aria-pressed`), and removable chips.
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
  - All 38 primitives in `docs/design/00-component-library-catalog.md` are now fully built, exported in `src/components/ui/index.ts`, tested with 92 unit tests in `tests/unit/ui-primitives.test.ts`, and showcased in `public/ui-preview.html` with real IdleMMO data.
- [x] **Complete UI Primitive Foundation (12 Primitives Built & Tested)**:
  - `BottomDock` (`BottomDock.tsx`): Mobile fixed navigation with safe-area insets (`env()`), active pill, notification badges, >=44px touch targets.
  - `Drawer` (`Drawer.tsx`): Slide-over navigation and configuration drawer with `createPortal`, backdrop blur, scroll locking, and Escape dismiss.
  - `Popover` (`Popover.tsx`): Anchored non-modal overlay with 8px offset, auto-flip collision detection, and light dismiss.
  - `Select` (`Select.tsx`): W3C ARIA Listbox pattern with arrow key roving focus, typeahead character jumping, and active checkmarks.
  - `Tooltip` (`Tooltip.tsx`): Microcontent overlay with 300ms entry delay, skip-delay on adjacent targets, and WCAG 2.2 SC 1.4.13 compliance.
  - `CommandDialog` (`CommandDialog.tsx`): Modal combobox overlay with real-time fuzzy filtering, anchored DOM focus in `<input>`, `aria-activedescendant`, and `Ctrl+K` hotkey listener.
  - `SearchInput` (`SearchInput.tsx`): Semantic `<search>` landmark, `<input type="search">`, native clear button handling, and shortcut hint.
  - `Collapsible` & `Accordion` (`Collapsible.tsx`, `Accordion.tsx`): Independent disclosure groups for navigation and heading-wrapped accordions for content chunking.
  - `Avatar` (`Avatar.tsx`): Scale (`xs` to `xl`), image fallback initials, top-right badge slot, and dual-cue rarity discipline (Common to Mythic).
  - `Kbd` (`Kbd.tsx`): Semantic hardware keystroke badges and key combination sequences.
  - `Separator` (`Separator.tsx`): Semantic horizontal `<hr>` breaks, decorative `role="none"` dividers, and interactive window splitters.
  - `Skeleton` (`Skeleton.tsx`): Shimmer placeholders matching exact component geometry (zero CLS <= 0.1) and `SkeletonContainer` `aria-busy` wrapper.
  - All 12 primitives verified in `tests/unit/ui-primitives.test.ts` (726 passed) and demoed interactively in `public/ui-preview.html`.
- [x] **[2026-11-22 18:30] Shell Architecture Specification**: Complete critical review and component audit documented in `docs/design/15-shell-chrome-architecture.md`.
- [x] **[2026-11-22 20:53] Desktop Sidebar & Navigation Frame** (`Sidebar.tsx`, `Sidebar.module.css`, `ZenithIcon.tsx`, `navigation.ts`): 260px desktop sidebar with 64px collapsed icon rail mode, unified top toggle for expand/collapse (zero vertical mouse travel), 4 collapsible groups with smooth CSS grid row transitions, semantically accurate Lucide icons across all 25 routes, removed duplicate browser title tooltips, and removed redundant profile card and engine version badge to maximise tool scanning area.
- [x] **[2026-11-22 21:03] Site Footer Chrome** (`SiteFooter.tsx`, `SiteFooter.module.css`): Monochromatic neutral Astral Slate palette, eliminated hardcoded cyan/blue highlights, distinct navigation and community links, interactive Discord handle clipboard copy button, and responsive layout with >=44px touch targets.
- [x] **[2026-11-22 21:17] Footer Simplification & Mobile Shadow Elimination** (`Sidebar.module.css`, `SiteFooter.tsx`, `SiteFooter.module.css`): Scoped 70px mobile drawer box-shadow strictly to `.sidebarOpen` to eliminate phantom shadow bleed on closed drawer, purged decorative filler (sparkles box, shield icon), simplified copy to direct human phrasing ("Market prices, crafting recipes, and skilling calculators for IdleMMO. Your data stays in your browser"), hid redundant internal navigation links on mobile to prevent excessive scrolling, and wrapped community links into a compact horizontal line. Verified visually with Playwright and unit test suite.
- [x] **[2026-11-22 23:24] Brand Identity & Logo System Overhaul** (`ZenithBrand.tsx`, `Sidebar.tsx`, `Sidebar.module.css`, `icon.svg`, `favicon.svg`): 100% vector SVG recreation of the approved identity from concept image. Standalone Zenith Mark with forward-sweeping angular Z-wings, parallel negative-space diagonal slit, 8-point celestial apex star, and tapered elliptical horizon arc. Matching wide-stance ZENITH Wordmark with floating three-bar "E" and sharp terminal angles. Replaced legacy gold hexagon and crown across all icon assets (`icon.svg`, `favicon.svg`, `apple-icon.png`, `icon-192.png`, `icon-512.png`), and replaced temporary `Activity` pulse line and text title in desktop sidebar and mobile drawer.
- [x] **[2026-11-22 21:40] Unified Shell Header & Quickbar** (`ShellHeader.tsx`, `ShellHeader.module.css`): Consolidated mobile navigation button, global command search (`Ctrl+K`), live data freshness indicator, and character profile switcher into a unified responsive header. Fully extracted layout and media queries into `ShellHeader.module.css` with sticky blur backdrop on mobile/tablet.
- [x] **[2026-11-23 01:40] Dynamic & Custom Mobile Dock Tabs, Theme Purge, and Knip Dead Code Audit** (`BottomDock.tsx`, `MobileBottomDock.tsx`, `route-history.ts`, `AppearancePanel.tsx`, `layout.tsx`): Persistent 5-item BottomDock in mobile thumb zone with dynamic top-3 visited tab ranking by default and custom 3-slot tab overrides in Settings, purged 4 legacy color themes, and deleted 5 dead components flagged by Knip, reducing Knip unused files to 0.
- [x] **[2026-11-23 10:48] Global Toast Notification System & Rotating Tips Retirement** (`Toast.tsx`, `Toast.module.css`, `layout.tsx`, `useToast.ts`): Mounted `ToastProvider` globally in `RootLayout`, raised Toast viewport to `z-index: 11000` to reliably overlay modals, capped mobile stack to 2 items via CSS, bridged legacy notification events, and migrated ad-hoc in-page toasts across `/profiles` and `/pets/owned` into global `useToast`. Permanently retired `RotatingTips` and purged its component and styles to eliminate unsolicited popups and visual noise, keeping the interface focused purely on direct user interaction feedback. Verified with dedicated test suite (`toast-system.test.ts`), 736 unit tests passing, zero TypeScript errors, and visual Playwright captures.
- [x] **[2026-11-23 11:25] UI Sound Design Specification & Acoustic Architecture** (`docs/design/17-sound-haptics-design.md`, `AGENTS.md`, `DESIGN.md`): Synthesized Material Design sound guidelines, Apple HIG audio/haptics, W3C WCAG 2.2 accessibility rules (SC 1.4.1 non-exclusivity and SC 1.4.2 audio control), and MDN Web Audio API best practices into a unified design standard. Established 5 universal semantic sound outcomes (select, copy, sync, warning, error), strict trigger bans (no hover, keystroke, scroll, or page load sounds), first-gesture `AudioContext` unlocking, mobile haptic vibration patterns (`navigator.vibrate`), and CC0/MIT licensing requirements. Fully documented in Section 17 of `DESIGN.md` and Section 8 of `AGENTS.md`. Verified with 736 unit tests and zero TypeScript errors.
- [x] **[2026-11-23 12:15] Page Refactoring & Migration Engineering Protocol** (`docs/design/18-page-refactoring-protocol.md`, `AGENTS.md`, `DESIGN.md`): Established an authoritative 6-stage engineering standard and 5 verification gates for all route migrations. Codified Stage 1 Ground Truth research (wiki docs, post-wiki patch notes delta, test baseline safety net), Stage 2 Critical Audit & Teardown Proposal with mandatory user sign-off, data volume budgets (pagination/deferred search for >50 items), the 4-state matrix, URL deep-linking, mobile soft-keyboard resistance, and anti-slop gamer copy reviews. Fully codified across Section 5 and 8 of `AGENTS.md` and Section 18 of `DESIGN.md`.
- [x] **[2026-11-24 21:05] Changelog, Patch Notes & Release Engineering Standard** (`docs/design/31-changelog-patch-notes-spec.md`, `AGENTS.md`): Established authoritative release documentation standard based on Keep a Changelog 1.1.0, Common Changelog, SemVer/CalVer, Google ("What's new") and Microsoft Style Guides. Codified strict dual-domain separation: official game patch notes live in `/patch-notes` (`public/idlemmo-patch-notes.json`); companion app releases live in `CHANGELOG.md` and the upcoming in-app `/whats-new` page. Defined player-centric technical writing rules, standard category taxonomy (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`), unreleased staging buffer, and pre-release diff verification.

### Tier 4: Global Modals, Entity Directory & Release Tracking
- [x] **[2026-11-24 21:35] In-App "What's New" / Zenith Changelog Route (`/whats-new`, `src/app/whats-new/`, `src/lib/changelog-parser.ts`, `src/lib/version.ts`)**:
  - Implemented the dedicated in-app release history route `/whats-new` providing player-focused visibility into application upgrades, calculations, and UI enhancements.
  - Built robust markdown changelog parser `src/lib/changelog-parser.ts` and build-time generator `scripts/build-zenith-changelog.mjs` exporting `public/zenith-changelog.json` for offline PWA reliability.
  - Server Component `src/app/whats-new/page.tsx` with `createRouteMetadata` for instant SSR First Contentful Paint and SEO indexing.
  - Client component `WhatsNewClient.tsx` featuring deferred keyword search (`useDeferredValue`), category filtering (`Added`, `Changed`, `Fixed`, `Removed`, `Security`), quick version jump select, expand/collapse accordions, bounded pagination (4 releases per page), unread badge tracking via `localStorage`, and floating back-to-top button with mobile bottom dock clearance.
  - Single source of truth for app version in `src/lib/version.ts` and `package.json` (`2026.11.24`).
  - Registered `/whats-new` in navigation group `General` (`src/lib/navigation.ts`) with spark icon and added to `src/app/sitemap.ts`.
  - Authored comprehensive contract test `tests/unit/whats-new-contracts.test.ts` (4 unit tests passing), updated `tests/unit/public-data-contracts.test.ts` (budget review), and verified all 783 unit tests passing.
  - Verified with 0 TypeScript compilation errors, successful Next.js 16 production build generating static `/whats-new` route, and Playwright desktop (1440px) and mobile (375px) screenshots recorded in artifacts.
- [x] **[2026-11-24 20:20] ItemModal Gathering Locations World Map Deep-Linking**: Made all gathering location cards interactive with direct navigation to `/map?location=${encodeURIComponent(targetKey)}`. Normalized location keys and added subtitle metadata indicator ("View on World Map"). Tested end-to-end with Playwright verifying Coal Ore to Bluebell Hollow navigation directly opens Bluebell Hollow's pinned dossier and forecast on the World Map. Verified with 779 unit tests, 0 TypeScript errors, clean production build, and Playwright visual proof.
- [x] **[2026-11-24 20:10] Centralized Pagination Primitive Adoption across /items and /enemies**: Eliminated bespoke duplicate pagination implementations from both routes. Refactored `ItemsPagination.tsx` and `EnemiesPagination.tsx` into thin adapters delegating to the centralized `Pagination` primitive (`@/components/ui/Pagination`). Purged ~300 lines of obsolete duplicate pagination CSS from `ItemsStyles.tsx` and `EnemiesStyles.tsx`. Enhanced `Pagination` with automatic smooth `scrollToTop` support and zero-count guard. Verified with 779 unit tests (100% pass), 0 TypeScript errors, clean Next.js 16 production build across 41 routes, and Playwright desktop/mobile visual captures.
- [x] **[2026-11-24 15:35] /enemies Search Icon Fix, Weather Cache Revalidation & Modal Craft Polish**: Wrapped search icon in `.search-icon-box` container with strict 16x16px sizing and 38px flex centering, eliminating the oversized 44px clipped icon. Added `{ cache: "no-cache" }` on public data fetches in `DataContext.tsx` so browsers revalidate `world-locations.json`, `static-data.json`, and `all-items-db.json` with `ETag`/`If-Modified-Since` instead of serving stale cached forecasts from days ago, guaranteeing live weather status (Windy, Heatwave, Fog, etc.) renders on cards. Upgraded `EnemyDetailModal.tsx` with a portrait hero avatar (56x56), Level and Location tags, overall loot roll percentage, 4-stat combat attribute grid, weather synergy forecast countdown, and enriched loot drop table displaying live safe market gold values per drop item. Verified with 752 unit tests, 0 TypeScript errors, clean production build across 41 routes, and Playwright visual proof.
- [x] **[2026-11-24 15:10] /enemies Filter Toolbar Redesign, Map Deep-Link Fix & Data Sync**: Redesigned filter controls per `DESIGN.md` Section 1, 3, and 4. Eliminated double search outline by removing redundant inner borders and routing focus to outer `.search-input-wrap:focus-within`. Fixed dropdown menu stacking context (`position: relative; z-index: 30` on `.enemy-controls` and `z-index: 150` on `.select-menu`), ensuring dropdowns render above `.enemy-card` rows. Banished permanent reset button in favor of dynamic active filter chips with 1-tap dismiss tags and "Clear all" button. Fixed mobile filter visibility by removing broken `<details>` tag and implementing dual-mode desktop listbox and native overlay `<select>` for native OS wheel picker ergonomics. Synchronized search queries with URL parameters (`?search=`). Fixed `/map?location=whispering-woods` race condition in `useMapState.ts`, immediately highlighting Whispering Woods in the map pin and dossier. Synced outdated local market, guild, weather, and world locations data from `origin/main` without affecting working copy. Verified with 752 unit tests, 0 TypeScript errors, clean production build across 41 routes, and automated Playwright headless verification proof.
- [x] **[2026-11-24 14:03] /enemies Monster Bestiary Refactoring & High-Craft Migration**: Completely overhauled the `/enemies` route under Zenith Astral Slate design system tokens. Decluttered hero section by purging 4 bulky metric cards in favor of a sleek inline metadata strip (`locations`, `favored now`, `penalized now`, `weather profiles`). Integrated `<GameImage unoptimized={true} priority={index < 8} />` for monster sprites with skull fallback, eliminating network optimization overhead. Implemented discrete bounded pagination (`EnemiesPagination.tsx`) with 12/24/48 per-page selectors and smart ellipsis navigation, capping active DOM nodes. Added floating `EnemiesBackToTop.tsx` with guaranteed zero dock collision on mobile (`bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 20px)`). Upgraded `EnemyDetailModal.tsx` to the centralized `ModalSheet` primitive with mobile bottom-sheet ergonomics, drag handle, 4-stat combat attribute grid, weather synergy cards, and interactive loot table linking directly to `ItemModal`. Added URL deep-linking (`?enemy=`, `?id=`) with seamless history synchronization. Enforced 100% mathematical invariance across EV calculations, weather preferences, and progression sorting. Authored `tests/unit/adversarial-enemies-ui.test.ts` (11 contract tests). Verified across all 5 verification gates: 752 unit tests passing (0 failures), 0 TypeScript errors, clean Next.js 16 production build across 41 routes, and Playwright 1440px/375px visual captures recorded.
- [x] **[2026-11-24 13:28] /items Continuous Table Row Outline Seams Fix**: Eliminated vertical notches and cuts along the top and bottom outline of hovered and focused table rows. Removed `border-left: 1px solid transparent; border-right: 1px solid transparent;` and `content-visibility: auto` from middle table cells, and switched from cell-level inset box shadows to native contiguous border color transitions (`border-top-color`, `border-bottom-color`, `border-left-color` on `:first-child`, and `border-right-color` on `:last-child`). Pinned item cell border right is cleared on hover to ensure a single unbroken, continuous rectangular outline with rounded 6px outer corners. Verified across all 5 verification gates: 741 unit tests passing (0 failures), 0 TypeScript errors, clean production build across 41 routes, and visual Playwright row hover capture verified.
- [x] **[2026-11-24 13:20] /items Bounded Pagination, Desktop Table Scroll De-Lagging & Floating Back To Top Button**: Replaced desktop table virtual scrolling container with discrete bounded pagination (default 50 items/page, options for 25/50/100). Eliminated continuous `requestAnimationFrame` scroll listeners, state updates on scroll, 73,000px virtual container, and tiny scrollbar thumb, restoring instantaneous 120fps scrolling. Built accessible `ItemsPagination.tsx` component with smart ellipsis page numbering (`1 ... 14 15 16 ... 28`), direct page size selector (`25 / 50 / 100`), first/prev/next/last navigation, and full keyboard navigation. Created floating `BackToTopButton.tsx` with guaranteed zero dock collision: positioned strictly above the mobile dock at `bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px); right: 16px; z-index: 45;` on mobile and `bottom: 24px; right: 24px;` on desktop. Fades in smoothly when scroll position exceeds 300px and scrolls smoothly to top on tap. Set `unoptimized = true` on `GameImage.tsx` by default, routing 32x32 CDN item icons directly from Cloudflare CDN with native browser disk caching and bypassing Next.js image optimization server queues, resolving 80+ pending HTTP requests on Slow 4G connections. Removed infinite scroll sentinel loop in favor of paginated cards and tables, preventing runaway DOM footprint and high mobile memory consumption. Verified across all 5 verification gates: 741 unit tests passing (0 failures), 0 TypeScript errors, clean Next.js 16 production build across 41 routes, and Playwright 375px/1440px visual captures recorded.
- [x] **[2026-11-24 12:55] /items & ItemModal Virtualization, Desktop Table Outline, Mobile Sort Ergonomics & Modal Polish**: Implemented windowed table virtualization in `ItemsTable.tsx` (`ROW_HEIGHT = 54`, `OVERSCAN = 8`) reducing active DOM nodes from 15,000+ to ~30 rows, completely eliminating UI lag on large catalog browsing. Restricted the infinite scroll sentinel strictly to mobile card mode with a 300ms cooldown lock and 120px root margin. Fixed table row hover and focus bottom outline cutoff in `ItemsStyles.tsx` using inset `box-shadow` (`inset 0 1px 0 var(--border-focus), inset 0 -1px 0 var(--border-focus)`), ensuring a complete 4-sided glowing outline with zero clipping from adjacent rows. Unified desktop table row height to 54px with clean type subline for consistent vertical rhythm and horizontal baseline alignment. Solved mobile sort control overlap by hiding `.sort-direction-label` and converting `.sort-direction-toggle` into a 44x44px icon button on <= 767px viewports. Strictly excluded non-upgradeable categories from the Tier Simulator, prevented `100 -> 100` notation when tier is 0, and applied `white-space: nowrap` on `tierPill`. Polished effect formatting: mapped `speed` and `wait_length` to native `Efficiency` and formatted experience buffs as `+40% Dungeoneering XP`. Enhanced market evaluation: Recent 10 Sales Range with 3 non-overlapping columns and cyan diamond marker, interactive 30-day SVG trend chart with percent badges, and volume depth cards. Verified across all 5 verification gates: 741 unit tests passing, 0 TypeScript errors, clean production build across 41 routes, and Playwright 375px/1440px visual captures recorded.
- [x] **[2026-11-24 12:10] /items & ItemModal Base Crafting Recipes, Table Outline & Infinite Scroll Polish**: Implemented 103 base crafting recipes across Smelting (9 metal bars: `1x Ore + 1x Coal Ore`), Cooking (13 cooked fish: `1x Fish + 1x Coal Ore`), Forge Bows (9 bows: `10x Log + 5x Coal Ore`), and Forge Gear (72 weapons and armours: `10x Bar + 5x Coal Ore`). Established comprehensive reverse recipe linking across all raw materials (`Coal Ore` now links to 104+ crafts; metal bars link to all forge equipment). Corrected buff terminology from `Speed` and `wait_length` to native IdleMMO player terminology `Efficiency` (e.g. `+20% Dungeon Efficiency`, `+20% Hunt Efficiency`). Removed redundant `World Gathering Node` subtitle from Gathering Locations. Fixed table row hover and focus bottom outline cutoff in `ItemsStyles.tsx` using `border-top/bottom/left/right` styling with `position: relative; z-index: 6;`, guaranteeing a complete, unbroken 4-sided glowing rectangular outline without row stacking clipping. Eliminated manual repeated "Load 48 more" clicking by implementing an automatic `IntersectionObserver` sentinel in `ItemsArchiveContent` with 400px root margin. Added `content-visibility: auto; contain-intrinsic-size: 0 53px;` to table rows to skip offscreen DOM rendering and guarantee smooth 60fps scrolling. Authored `tests/unit/items-recipes-contract.test.ts` (5/5 assertions passing). Verified across all 5 verification gates: 741 unit tests passing (0 failures), 0 TypeScript errors, clean production build across 41 routes, and Playwright 375px/1440px visual captures recorded.
- [x] **[2026-11-24 11:25] /items & ItemModal Anti-Slop, Layout Collision & Ergonomics Fixes**: Resolved mobile sort control collision by decoupling `.sort-direction-toggle` from the global 100% width override and setting `width: auto`, giving 234px to the sort dropdown and 73px to the direction toggle without text clashing. Replaced colliding absolute position labels (`LOWMEDIAN`) in the price spread track with a clean 3-column flex layout (`Low Sale`, `Median Sale`, `High Sale`). Stripped bloated station metadata (`Crafting Station: FORGE`) from reverse recipe usage cards down to just recipe name and `{rec.amount}x required`. Formatted lore codex links with valid ID `world-celestial-system` and clean title/summary. Transformed raw engine effect attributes into human copy (`+20% Dungeon Speed`, `+20% Hunt Speed`). Handled fixed stats in tier simulator (`7`, not `7 -> 7`). Simplified section titles to clean gamer language (`Overview`, `Market`, `Sources`, `30-Day Price Trend`, `Recent Sales Spread`, `Sell Advice`, `Crafting Profit`, `Crafting Recipe`, `Gathering Locations`, `Dungeon Drops`, `World Boss Drops`, `Monster Drops`, `Used in Recipes`). Verified across all 5 verification gates: 736 unit tests passing (0 failures), 0 TypeScript errors, clean production build across 41 routes, and Playwright desktop/mobile captures in artifacts directory.
- [x] **[2026-11-23 18:25] /items & ItemModal Refinement & Visual Polish**: Decluttered page header (purged 5 redundant summary boxes), removed vague `Market labels` details banner and introduced an on-demand `Tag Guide` popover banner, grouped Sort dropdown and sort direction into a single unified control with `ArrowDownNarrowWide`/`ArrowUpNarrowWide` icons, converted market button to a clean `Tradeable only` pill, eliminated table right-edge shadow smudge, left-aligned item names and copy, restricted Tier Upgrade Simulator strictly to equipment (`max_tier > 1`), enriched recipe acquisition sources to Dungeons and Dungeon Chests across all 18 dungeons and 81 chests, partitioned ItemModal sources into Dungeon Drops, World Bosses, and Monster Drops, added SVG Price Trend line chart and Recent 10-Sale Price Spread track bar with plain-English Sell Advisor, and re-engineered mobile card grid (`ItemsCardGrid.tsx`) with 4-stat metric blocks and dock padding. Verified with 736 unit tests, 0 TypeScript errors, clean production build, and Playwright visual proof.
- [x] **[2026-11-23 14:45] /items & ItemModal**: Global item modal redesign (`ModalSheet`), responsive desktop centered dialog and mobile bottom sheet with swipe dismiss, 3-tab segmented navigation (`Overview & Stats`, `Market & Valuation`, `Sources & Crafting`), interactive Equipment Tier Upgrade Simulator, Consumable restoration/buff breakdown, Chest drop pool with percentage chances, Recipe product preview, Market Valuation engine (Safe price, moving averages, 30d/7d volume, velocity, price spread, and Sell Advisor comparing Vendor, Bartering, and Market Net), Reverse Crafting Explorer, desktop pinned sticky column with right-aligned numerics, mobile high-contrast cards with rarity accent strips, URL deep-linking (`?item=`, `?id=`), and preserved 100% of domain calculations. Verified with 736 unit tests, 0 TypeScript errors, production build, and Playwright desktop/mobile visual evidence.
- [x] **/enemies**: Monster bestiary, zone filtering, combat drop tables.

### Tier 5: Reference Pages
- [x] **[2026-11-25 01:00] /pets**: Complete redesign of the companion directory with scoped CSS modules, UI primitives (`SearchInput`, `Select`, `SegmentedControl`, `NumberInput`, `Switch`, `Button`, `EmptyState`, `Pagination`, `Badge`, `ModalSheet`), zero CLS, mobile bottom-sheet ergonomics, and clean gamer copy. Stripped 10 redundant metric tiles, simplified simulator setup into a collapsible panel with CSS Grid row animations (`0fr -> 1fr`) and visible open overflow, fixed `NumberInput` stepper focus loop and `Select` open stacking order, centered summary-free `Pagination` controls, added bounded pagination (12, 24, 48 items), egg acquisition links to `ItemModal`, URL deep-linking (`?pet=`), floating back-to-top button with 20px mobile dock clearance, removed redundant nested borders/outlines, fixed mobile table min-width and avatar spacing, and purged 1,781 lines of legacy global pet styles from `globals.css`. Passed all 5 verification gates: strict logic invariance, 791 unit tests passing across 56 files (`tests/unit/pets-architecture-contracts.test.ts`), 0 TypeScript errors, clean production build across 42 routes, and Playwright 3-tier captures (375px mobile, 1024px tablet, 1440px desktop).
- [ ] **/pets/compare**: Side-by-side companion comparisons and stat diffs.
- [ ] **/pets/owned**: Owned companion roster and investment tracking.
- [ ] **/housing**: Room tiers, furniture bonuses, gold upgrade costs.
- [ ] **/conquest**: Guild conquest territories, territory buffs, time-to-conquer calculators.
- [ ] **/museum**: Character-isolated item completion tracker, donation progress.
- [ ] **/map**: Interactive world map, territory levels, resource nodes.
- [ ] **/guilds**: Guild roster, intelligence metrics, raid logs.

### Tier 6: Economy Engines & Skilling Simulators
- [ ] **/profiles**: Character overview, gear inspector, skill level progression, profile import sync indicators.
- [ ] **/bosses**: World boss schedule, non-linear routing, drop EV calculation, reminder alarms.
- [ ] **/dungeons**: Key inventory, chest reward tables, profitability rankings.
- [ ] **/skill-profit**: Multivariate skilling profit calculator, market price spike suppression, level requirement filtering.
- [ ] **/forge**: Blacksmithing station, recipe trees, lessons calculator, crafting queues.
- [ ] **/alchemy**: Potion brewing station, recursive EV engine, ingredient price overrides.
- [ ] **/combat & /bis**: Combat simulation, monster weakness analysis, Best-in-Slot gear optimizer.

### Tier 7: Central Aggregator Dashboard
- [ ] **Home Dashboard (`/`)**: Aggregated command widgets, active boss timers, weather forecast strip, quick character jump cards, profit alerts.

---

## Status Summary

| Phase | Scope | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Design System Tokens & Primitives | Completed | Created Button, TextInput, SegmentedControl, Card, Badge, EmptyState, Table, Toast, Banner |
| **Phase 2** | Tier 1: `/weather` & `/lore` | Completed | High-craft canvas backdrops, subpixel reset button alignment, zero modal lag |
| **Phase 3** | Tier 2: `/settings` | Completed | Scoped CSS Module, SegmentedControl groups, ModalSheet, 44px touch targets, zero a11y violations |
| **Phase 4** | Tier 3: Shell Chrome | Completed | Sidebar, Header, Mobile BottomDock, Toast, Sound Spec, Refactoring Protocol |
| **Phase 5** | Tier 4: `/items` & Global Modals | Completed | `/items`, `ItemModal` & `/enemies` completed |
| **Phase 6** | Tier 5: Reference Pages | Current Phase | `/pets` done; `/pets/compare` next |
| **Phase 7** | Tier 6: Economy Engines | Planned | Profiles, Bosses, Dungeons, Skill Profit, Forge, Alchemy |
| **Phase 8** | Tier 7: Home Dashboard | Planned | Final aggregator route polish |

---

## UI Primitives Master Backlog (38 Components)

Zenith strictly forbids ad-hoc button, form, or overlay implementations in page styles. All interactive elements must derive from tested primitives in `src/components/ui/` with full keyboard navigation and WCAG AA contrast.

### Completed Primitives (11 / 38)
* [x] **`Button`**: Primary, secondary, ghost, danger variants; sm, md, lg sizes; active press scale; loading spinner; optical icon/label alignment.
* [x] **`TextInput`**: Accessible form field with label, helper copy, clear error state via `aria-describedby`, dark fill, clear button, 44px mobile height.
* [x] **`SegmentedControl`**: Sliding pill switch for view modes and filters with roving tabindex (`role="tablist"` / `role="tab"`).
* [x] **`Card`**: Surface elevation container with standardized padding tokens and header/action slots.
* [x] **`Table` Family**: Semantic data tables with `aria-sort` headers, tabular figures, horizontal scroll containment, and Lea Verou scroll shadows.
* [x] **`Badge`**: Quality rarity tiers (`common` through `mythic`), status colors, and dot indicators.
* [x] **`ModalSheet`**: Responsive dialog displaying centered on desktop and sliding up as a bottom sheet on mobile, with focus trap and background inert.
* [x] **`Toast` & `ToastViewport`**: Fixed feedback overlay with word-count auto-dismiss (2.5s-10s), pause on hover/focus, polite live region.
* [x] **`Banner`**: Inline dismissible alert messages (`info`, `warning`, `error`, `success`) with action slots.
* [x] **`EmptyState`**: Zero-data placeholder with native gamer copy, clear action button, and polite screen reader announcements.
* [x] **`Icon`**: Centralized icon registry with semantic discovery in `src/lib/icons.ts`.

### High-Priority Backlog (Next to Implement as Research Finishes)
* [ ] **`Select` / `Dropdown`**: Single-value picker using listbox pattern (`role="combobox"` + `aria-haspopup="listbox"`). Native `<select>` fallback on mobile for native wheel ergonomics. Never use `role="menu"` for value pickers.
* [ ] **`Combobox` / `Autocomplete`**: Searchable input for filtering 1,355 items, recipes, and enemies. Focus strictly remains in `<input>`, active option tracked via `aria-activedescendant`. Escape once closes popup; second Escape clears text.
* [ ] **`Popover`**: Non-modal anchored rich content rendered in top layer/portal with viewport edge collision flipping and `overscroll-behavior: contain`. Adapts to a bottom sheet on narrow screens (<600px).
* [ ] **`Tooltip`**: Supplementary text only (no links, buttons, or vital info). Wired via `aria-describedby`. Must appear on keyboard focus and hover, dismiss on Escape, stay visible on pointer hover (WCAG 1.4.13), with 200ms delay.
* [ ] **`Skeleton`**: Layout-matching wireframe placeholders preventing CLS. Container marked `aria-busy="true"`; shapes hidden with `aria-hidden="true"`; single status announced via live region. Request timeout fallback to error/empty state.
* [ ] **`Tabs`**: In-page view switching with roving tabindex, arrow key navigation, URL query parameter sync, and scroll edge fade.
* [ ] **`SearchInput`**: Specialized search field with leading icon, trailing clear button, `Ctrl+K` keycap badge, and 150ms debouncing.
* [ ] **`Tag` / `Chip`**: Compact filter and attribute chips with optional leading icon, count pill, and accessible dismiss button.
* [ ] **`StatCard` / `MetricTile`**: High-prominence KPI tile with tabular number formatting and optional trend indicator.
* [ ] **`Accordion` / `Collapsible`**: Progressive disclosure container for secondary formula toggles and configuration overrides.
* [ ] **`Avatar` / `EntityIcon`**: Item, enemy, and pet icons with game rarity borders and fallback placeholders.

### Medium-Priority Backlog
* [ ] **`Checkbox`**: Multi-select filter inputs with 44px mobile touch target and indeterminate state support.
* [ ] **`Switch` / `Toggle`**: Instant preference toggles (`role="switch"`) with spring animation.
* [ ] **`NumberInput`**: Stepper input for gold amounts, batch craft counts, and level thresholds with tabular figures.
* [ ] **`ProgressBar` / `ProgressRing`**: Skill XP, stamina, and boss cooldown timers (`role="progressbar"`).
* [ ] **`Breadcrumbs`**: Route hierarchy navigation.
* [ ] **`Pagination`**: Catalog and table page navigation with accessible `aria-current="page"`.
* [ ] **`Drawer` / `SideSheet`**: Slide-out filter panel and full-height entity inspector.
* [ ] **`BottomDock`**: Fixed mobile navigation dock with 3-5 ergonomic thumb targets.
* [ ] **`Divider` / `Separator`**: Semantic boundary elements (`role="separator"`).
* [ ] **`Kbd`**: Keyboard shortcut keycap styling.

### Low-Priority / Specialized Backlog
* [ ] **`Slider` / `Range`**: Continuous level and combat stat sliders.
* [ ] **`TextArea`**: Multi-line custom notes and profile import strings.
* [ ] **`RadioGroup` / `Radio`**: Vertical mutually exclusive option sets.
* [ ] **`Timeline`**: General-purpose milestone stream primitive.
* [ ] **`Tree` / `HierarchyView`**: Multi-tier crafting recipe dependency trees.
* [ ] **`ContextMenu`**: Right-click contextual actions for items.
* [ ] **`CommandPalette` / `SearchModal`**: Global `Ctrl+K` command overlay.

