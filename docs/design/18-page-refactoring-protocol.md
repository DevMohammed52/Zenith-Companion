# Zenith Engineering Protocol: Page Refactoring & Migration Standard

This document is the authoritative standard operating procedure for redesigning, refactoring, and migrating routes across Zenith Companion. Every page migration must execute these stages and pass all verification gates before shipping.

## 1. Core Mandates and Invariants

* **Independent Math & Data Verification (Never Trust Legacy Math)**: Never assume 6-month-old formulas, scrapers, or cached JSON files are correct. In Stage 1 of every route refactor, audit every formula, entry cost, tax rate, cap, drop source, and API field against live `/v1/` responses, wiki docs, and patch notes; compute sanity-check examples directly and fix any verified calculation or data bug with explicit regression tests. Keep unrelated calculations invariant during pure presentation passes.
* **Deep Redesign Over Superficial Reskinning**: Never just swap component tags, re-theme CSS, or keep an overcrowded legacy layout skeleton. Rethink the information hierarchy from scratch around player scanning speed: put primary answers and interactive tables/cards **above the fold** (`1440x900`), separate high-frequency browsing filters from low-frequency character/setup configuration (`<Drawer>`, `<Popover>`, or modal sheets), eliminate walls of permanent configuration boxes, and choose the single best UI primitive (or mix of primitives) for every individual interaction rather than porting legacy divs.
* **Computed Data & Missing QoL Audit**: Audit every computed field returned by the underlying math library and hooks (`expPerHour`, `roi`, idle session totals, readiness, missing liquidity filters, URL state, pinning/compare) to surface high-value metrics and fix UX gaps proactively before designing the UI.
* **Plain-Language Gamer Copy**: Strip sophisticated, academic, or corporate wording. Ban AI vocabulary (delve, pivotal, crucial, intricate, tapestry, fosters, bolster). Write direct, human IdleMMO player copy (Drops instead of Yields, XP/hr instead of Experience throughput, Market Tax instead of Exchange levy, Vendor Price instead of Merchant liquidation value).
* **Motion and Animation Discipline**: Follow `08-motion-animation.md` and `DESIGN.md`. Use hardware-accelerated CSS properties only (`transform` and `opacity`). Apply snappy spring curves: `cubic-bezier(0.16, 1, 0.3, 1)` with durations between 100ms and 220ms. Never animate layout properties like `height`, `width`, or `margin`. For collapsible sections, animate CSS Grid row tracks (`grid-template-rows: 0fr` to `1fr`). Strictly honor `prefers-reduced-motion`.
* **Layout Stability (Zero CLS)**: Maintain Cumulative Layout Shift (CLS) <= 0.1. Dynamic cards and images must use dimension-matched skeletons or reserved min-heights.
* **Touch Ergonomics**: Every interactive element must provide a minimum tap target of 44x44px on mobile viewports.
* **Accessibility**: Meet WCAG 2.2 AA standards (>= 4.5:1 text contrast, visible focus rings with 2px offset, semantic ARIA landmarks, keyboard escape listeners, and modal focus traps).

## 2. Stage 1: Ground Truth, Architecture Impact and Safety Net

Before modifying code, understand the game reality, map architectural dependencies, and establish baseline test coverage.

### Step 1.1: Local Knowledge Search
* Search the local game knowledge repository at `.agents/knowledge/idlemmo/wiki/` for the page's domain (items, alchemy, forge, combat, pets, conquest) and read the full mechanic docs before proposing a UI.
* Record each article's `last_ingested` / last-modified date.

### Step 1.2: Patch Notes Delta Audit
* Inspect `public/idlemmo-patch-notes.json` (`patchNotes` array, checking `releasedAt`) and `.agents/knowledge/idlemmo/patch-notes-summary.md` for **all** releases dated after the wiki article's last-modified date.
* Catch recent mechanic changes, rebalances, level requirement adjustments, or recipe shifts before designing any feature or copy.

### Step 1.3: Data Schema, Math Audit, Live API Endpoint & Null Value Audit
* **Formula & Sanity Verification**: Read every calculation hook and helper used by the route line-by-line. Verify tax multipliers, entry fees, bonuses, speed/efficiency math, caps, and edge cases against the wiki, patch notes, and independent sample calculations in Node. Never blindly trust existing math—flag and fix verified formula bugs immediately.
* Inspect corresponding datasets in `public/` and `src/data/`, plus `.agents/knowledge/idlemmo/api-endpoints.md` and `scripts/`.
* Check `gh run list --limit 5` before starting heavy full-catalog scrapers (to avoid CI push collisions), then **always run lightweight read-only `/v1/` API verification probes** (pacing within the ~20 req/min spare headroom out of the 80 req/min limit and checking `x-ratelimit-remaining` even when a scheduled workflow is active) across all relevant endpoints to inspect **every raw JSON field** returned (not just fields already mapped by existing scripts). Identify:
  * Dropped or unmapped API fields (e.g. timestamps, IDs linking players to guilds, historical `season_number` parameters).
  * Related endpoints that can be joined for richer player utility (e.g. Guild info, World locations, Items DB).
  * Missing or restricted endpoints/fields to flag to the user if API docs are incomplete.
* Audit field names, optional properties, and null value behavior (items with no active market price, uncraftable items, zero drop chance entries).

### Step 1.4: Automated Route & Dependency Audit
* Run the route audit command before inspecting files manually:
  ```powershell
  npm run audit:route -- <route-path>
  ```
  (for example `npm run audit:route -- pets/compare`). This immediately inventories `<style jsx>` debt, `globals.css` selector matches, `StateBlock` / `lucide-react` bypasses, bespoke UI clones, God Node couplings (`useProfiles`, `useData`, `usePreferences`), and existing test coverage.
* Also query `graphify-local` MCP (`query_graph`, `get_node`, `god_nodes`) to verify inbound/outbound blast radius and ensure local state changes do not cascade across unrelated routes.

### Step 1.5: Route Architecture Contract Safety Net
* Locate existing test suites targeting the page in `tests/unit/*<page>*.test.ts`.
* If a dedicated architecture contract test does not exist, author `tests/unit/<route>-architecture-contracts.test.ts` calling `assertCleanMigratedRoute({ routeSubpath: "<route>" })` from `tests/unit/helpers/route-contract-audit.ts` alongside calculation invariance tests. For new migrations, keep strict defaults (`allowStateBlock: false`, `allowDirectLucide: false`).

**Exit Gate 1**: Verified game facts, mapped architecture blast radius, and a 100% passing baseline test suite.

## 3. Stage 2: Critical Audit, Decluttering and Teardown Proposal

Critically evaluate the existing page, plan relational connections, and formulate the redesign proposal.

### Step 2.1: Player Job-To-Be-Done (JTBD) Classification
Classify the page into one of three primary interaction modes:
1. **Flash Lookup** (< 10 seconds): The player alt-tabs or switches mobile apps for quick answers (item stats, drop locations, enemy weaknesses). Primary answer must sit above the fold with instant search.
2. **Route Planner** (1 to 5 minutes): The player optimizes training queues or profitability (Forge lessons, Alchemy EV). Primary recommendations sit at the top; secondary overrides and filters live in progressive disclosure containers.
3. **Ambient Tracker** (Persistent background): The player tracks respawns or events (World Boss timers, Weather forecasts). High-contrast timers, stable layout, and non-intrusive alerts.

### Step 2.2: Cross-Feature Deep Linking and Shared Entity Extraction
* Map entity relationships that bridge player navigation:
  * Items with gathering sources link directly to `/map?location=...`.
  * Enemies with item drops open `ItemModal` on click.
  * Gear items offer a direct jump to combat or simulator views.
  * Lore references deep-link to corresponding game entities.
* **Shared Domain Extraction**: When related routes share an entity (for example `/pets`, `/pets/compare`, and `/pets/owned` sharing pet images or setup controls), extract a single shared component rather than maintaining three route-local copies.

### Step 2.3: Decluttering, Frequency Separation & Visual Restraint
* **Above-the-Fold Primary Work Mandate**: On `1440x900` desktop, the primary actionable rows, cards, or calculator workspace must appear immediately inside the first viewport—never buried below 2–3 stacked rows of settings, empty slots, and toggles.
* **High-Frequency vs Low-Frequency Control Split**:
  * **Always-Visible Toolbar (Browse Controls)**: Keep only controls players adjust repeatedly in a session (Search, Category `Tabs`, key quick-filter `Tag`s / `Switch`es, Sort `Select`, `SegmentedControl` view/sell mode).
  * **On-Demand Configuration (`<Drawer side="right">`, `<Popover>`, or `<ModalSheet>`)**: Move low-frequency or profile-synced setup (Member/Class/Conquest, Pool %, Bartering Lv, Gathering Tools, Essence Crystals, Ascension Perks) out of the main flow into a clean configuration `<Drawer>` triggered by a compact summary trigger showing active modifier count/totals (`Modifiers: 3 active`).
* **Per-Interaction Component Selection**: Evaluate every control on its own and mix primitives cleanly for the best UX (`Tabs` with roving arrow keys, `Tag` pills for multi-facet filters, `Switch` for instant toggles, `Select`/`Combobox` for searchable lists, `NumberInput` for steppers, `Pagination` for bounded browsing, `Tooltip` for concise formula/caution hints) rather than preserving legacy button walls or native HTML `<select>` boxes.
* **Computed Field & Missing QoL Check**: List useful fields already computed (e.g., `expPerHour`, idle session gold, `roi`) or missing filters (e.g., hiding illiquid items, showing locked/unlocked level gating, pinning/comparing rows, URL filter sync) and propose concrete fixes.
* **Static vs Dynamic Separation**: Identify **static game reference rules** that apply identically across every location or entity (for example Conquest Territory Buffs Ranks 1–10 and Zone Shards Ranks 1–25). Render static tables **once** at page level (such as a single reference modal or top-level sheet), never duplicated inside every entity tab or card.
* **"So What?" Metric Filter**: Reject decorative summary cards, duplicated spotlights, empty slot placeholders, and vanity counters. Every number on screen must help the player decide what to do next.
* **Astral Slate Restraint & Bar Clarity**: Follow `DESIGN.md` strictly: never use saturated bright/neon borders, glows, or arbitrary rainbow accents per entity card. Keep cards monochromatic neutral (`--bg-card`, `--border-subtle`), reserve subtle low-saturation tints strictly for actionable status pills, and give every progress bar a clear quantitative label (`Control share: 78%`).
* **Inline Vertical Separators**: Separate compact metric strips (`XP | Kills | XP/Kill`) and toolbar groups cleanly using subtle `1px` vertical dividers rather than unseparated text runs or nested inner borders.

### Step 2.4: Data Volume, Incremental Archiving, and Height Discipline
* Quantify dataset size. Whenever an endpoint returns 25–75+ rows inside a detail tab or panel (such as top 50 zone contributors), enforce bounded pagination (`<Pagination pageSize={10} scrollToTop={false} />`) or clean table bounds so switching tabs never bloats page height.
* Use deferred search filtering (`useDeferredValue`) to keep keystroke typing responsive and protect Interaction to Next Paint (INP).
* **Incremental Scraper Caching**: Separate immutable historical archives from mutable live snapshots in fetcher scripts and scheduled GitHub Actions workflows — skip re-fetching completed historical data already present on disk (`--force` to rebuild), probe minimally for season rollovers, and ensure CI workflows commit all enriched/archived outputs automatically.

### Step 2.5: The 4-State Matrix Architecture
Explicitly plan all four states for the page:
1. **Ready State**: Full data loaded with active filters.
2. **Empty State**: Friendly plain-language explanation and a 1-tap "Reset Filters" button when search or filter combinations yield zero results.
3. **Loading State**: Dimension-matched skeleton screens that preserve layout dimensions and prevent shifts.
4. **Error / Offline State**: Actionable recovery message with a retry button if network or local storage data fails.

### Step 2.6: UI Primitive Inventory Check
* Map required page controls against `src/components/ui/` primitives (`Button`, `TextInput`, `SearchInput`, `SegmentedControl`, `Select`, `Card`, `Badge`, `ModalSheet`, `Drawer`, `Popover`, `Tooltip`, `Table`, `EmptyState`, `Skeleton`, `Toast`, `Pagination`, `Combobox`, `Tabs`, `Tag`, `StatCard`, `Checkbox`, `Switch`, `NumberInput`, `ProgressBar`, `Breadcrumbs`, `Slider`, `TextArea`, `RadioGroup`, `Timeline`, `BackToTop`).
* Check scroll depth: any route or tab view that can scroll past roughly 1.5x viewport height (directories, multi-group planners, tables, timelines, long guides) must include `<BackToTop />` from `@/components/ui` by default.
* Check game iconography: map every currency amount (`GoldIcon`, `TokenIcon`, `ShardIcon` from `@/components/GoldIcon`) and material/item/essence list to actual game sprites (`<GameImage>` with `allItemsDb`) rather than generic placeholder icons.
* If any required widget is missing, flag it immediately for Stage 3.

### Step 2.7: Area-by-Area Redesign & Teardown Proposal
* Never reskin the old layout. Break the redesign down area-by-area:
  1. **Top Header Area**: Kicker icon matching `src/lib/navigation.ts`, concise title/subtitle, inline status/summary pills, and high-value primary actions.
  2. **Search, Filter & Action Bar**: Unified toolbar with aligned control heights, clean progressive disclosure, and workflow-specific actions (such as multi-select compare or view mode toggles).
  3. **Main Content Area**: Purpose-built layout (spotlight, cards, sortable roster table, missing-collection/gap tabs, or calculators) tailored to the actual game mechanics.
  4. **Secondary Panels / Modals / Drawers**: Clean detail sheets, quick actions, and relational deep links.
* Compile the audit into a concise report (what gets deleted, what each area becomes, plain-language copy, relational links, and UI primitive inventory) and present it to the user.

**Exit Gate 2**: Explicit user sign-off on the teardown proposal before any code changes begin.

## 4. Stage 3: Missing Component Build and Isolated Polish (Conditional)

If Gate 2 identified a missing primitive, build and test it in isolation before touching the page.

### Step 3.1: Specification and Craft Review
* Review requirements in `docs/design/` for the component.

### Step 3.2: Full State Matrix Implementation
* Build the primitive in `src/components/ui/` supporting:
  * Core states: Default, Hover, Active/Pressed (`transform: scale(0.98)`), Focused (`:focus-visible`), Disabled.
  * Functional states: Loading (spinner), Success (checkmark), Error (actionable alert).
* Ensure hardware-accelerated CSS animations (`transform`, `opacity`, 100ms to 200ms cubic-bezier).

### Step 3.3: Accessibility and Unit Testing
* Verify visible 2px focus ring (`:focus-visible`), keyboard navigation, and ARIA roles.
* Add unit test coverage in `tests/unit/ui-primitives.test.ts`.

**Exit Gate 3**: Polished primitive approved by the user.

## 5. Stage 4: Dead Code and Clutter Elimination

Clean the foundation before building new features.

### Step 4.1: Strip Orphaned Code
* Remove obsolete metric boxes, dead helper functions, unused state hooks, and route-local bespoke controls (such as ad-hoc `NumberField`, `OptionMenu`, or custom select/modal clones) once mapped to `src/components/ui/`.
* Purge leftover route-specific classes from `src/app/globals.css` (and verify no global class like `.pet-avatar` leaks styles onto CSS Module wrappers).

### Step 4.2: Dead-Code and Compile Sanity
* Run `npx knip --include files` to confirm no orphaned component files remain on disk after removing dead widgets.
* Run `npm run typecheck` and `npm run test:unit` to verify the stripped foundation compiles cleanly with zero failing contracts.

**Exit Gate 4**: Minimal, clean code foundation with zero TypeScript or test errors.

## 6. Stage 5: High-Craft Redesign and Implementation

Implement the modern presentation layer following all design and performance standards.

### Step 6.1: Component Assembly and Tokens
* Build the interface using tested UI primitives and CSS variables from `src/app/globals.css`.
* Adhere to the Astral Slate monochromatic palette: 60% neutral surface (`--bg-base`), 30% structural elevation (`--bg-card`), reserving bright accents strictly for game drop rarities, weather buffs, and danger indicators.
* **Fewer Borders Discipline**: Avoid wrapping inner stat/metric tiles or accordions in redundant `1px solid` outlines when they already sit inside a bordered card or modal (`DESIGN.md` Section 11). Separate them with translucent fills and whitespace.
* **Icon Parity & Optical Alignment**: Every page kicker/header icon must match its exact sidebar icon in `src/lib/navigation.ts`. Use `GoldIcon`, `TokenIcon`, and `ShardIcon` (`@/components/GoldIcon`) for in-game currencies and `<GameImage>` (`allItemsDb` image URLs) for materials/items/essences; for UI concepts, pick distinct context-matched icons from `src/lib/icons.ts` (never repeat a placeholder icon across unrelated stats or cards). Enforce `display: inline-flex; align-items: center` with explicit gaps on icon+text pairs, uniform control heights across horizontal toolbars, and explicit `min-width: 0` truncation rules so icons, labels, and controls align cleanly.
* **100% JSX-to-CSS Selector Parity & No Smashed Nodes**: Whenever removing `<style jsx>` or rewriting `globals.css` rules into `*.module.css`, audit **every** `className` and adjacent `<span>`/`<strong>`/`<small>` group in TSX against the CSS module. Adjacent labels, values, and notes must have explicit flex/grid rules or gaps so text nodes never run together (`LabelValueNote`), multi-row headers must use an explicit top-row wrapper (rather than fragile `flex-wrap` + `flex-basis` tricks), and descendant rules (such as `.footer span`) must not override utility display classes (such as `.inline-gold-value`).
* **Default Scroll Recovery (`<BackToTop />`)**: Long or scrollable pages must render `<BackToTop />` from `@/components/ui` so desktop and mobile users can jump back to the top in one tap above the mobile dock. Do not re-implement custom scroll buttons per route.
* **Open Overflow Hygiene**: When CSS Grid accordions (`grid-template-rows: 0fr` to `1fr`) open, set inner overflow to `visible` and raise `:focus-within` z-index so dropdown listboxes never clip or sit behind adjacent fields.
* **Zero Middots (`·`), Readable Formatting & Balanced Toolbars**: Never join unrelated values with middot (`·`) characters (`Lv 80 · 18m` or `+10% Eff · +20% EXP`). Format every metric with crisp spacing, subtle pills/badges, structured cells, or hairline `1px` vertical dividers so data reads effortlessly. Always pass `showShortcutHint={false}` on inline `<SearchInput>` page filters (reserve `Ctrl K` strictly for global top navbar search), and compose toolbar controls across balanced rows without awkward empty horizontal gaps.
* **Strict Component & Optical Alignment**: Every icon paired with text, numbers, or badges must sit on a clean centered axis (`inline-flex; align-items: center; gap`, matching line-height and `flex-shrink: 0` on icons). Align sibling controls, filter strips, summary tiles, and action buttons on unified flex/grid tracks so adjacent heights, baselines, and right edges line up cleanly across desktop and mobile breakpoints.
* **Synced Defaults + Editable What-If Loadout Overrides**: Initialize profile-backed modifiers (Conquest rank, Class, Membership, Bartering, Ascension, Housing) from the active Profile by default AND keep every field editable inside `Loadout & Boosts` as a non-destructive What-If simulation (including temporary Class tests and a reset-to-profile button).

### Step 6.2: Plain-Language Gamer Copy Overhaul
* Replace all sophisticated, formal, or corporate vocabulary with natural player language.
* Ensure all tooltips, labels, and empty states can be understood by an everyday player in under one second.

### Step 6.3: Motion and Tactile Micro-Interactions
* Implement hardware-accelerated transitions:
  * Cards and rows: subtle hover elevation via border color change and box-shadow (150ms ease).
  * Buttons and controls: spring press down (`transform: scale(0.98)`, 100ms).
  * Collapsible sections and accordions: CSS Grid row expansion (`grid-template-rows: 0fr` to `1fr`, 200ms cubic-bezier).
  * Modals and drawers: backdrop opacity fade and panel translation (200ms cubic-bezier).
* Wire `prefers-reduced-motion` overrides across all animations.

### Step 6.4: Typography and Descender Safety Checks
* Verify line heights on interactive buttons, tags, chips, and table cells.
* Ensure `.label` classes provide `line-height >= 1.35` and balanced vertical padding so glyph descenders (p, g, y, j, q) are never cut flat along the bottom baseline.

### Step 6.5: URL State Deep-Linking, History Hygiene and Back Navigation
* Sync primary entity modal IDs and active view tabs to URL search parameters (`/items?id=123` or `/forge?tab=lessons`).
* Allows players to share direct links in Discord and guild chats.
* Use `window.history.replaceState` or `router.replace(..., { scroll: false })` when typing in search inputs or toggling filter pills so the browser history stack is not polluted with dozens of keystroke entries.
* Use `pushState` exclusively when opening distinct modal sheets or navigation views.
* Ensure the browser hardware Back button dismisses open modals or drawers instead of navigating off the page.

### Step 6.6: Mobile Ergonomics, Soft Keyboard Defensiveness and Dock Clearance
* Place primary actions within the natural thumb zone.
* Clear the fixed bottom navigation dock:
  `bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px);`
* Use `inputmode="numeric"` and `pattern="[0-9]*"` on numeric stepper inputs so the mobile numeric keypad opens immediately without alphanumeric clutter.
* Use `100dvh` for full-height views to prevent mobile browser address bar resizing bugs.
* For compact controls with small visual footprints (e.g. 28px or 32px close icons), expand the clickable area to >= 44x44px using a transparent `::before` pseudo-element with `inset: -6px` or balanced padding.

### Step 6.7: Keyboard Navigation, Focus Traps and Focus Restoration
* Wire `Escape` key listeners to close open drawers, dialogs, and popovers.
* Trap focus inside open modal sheets and dialogs so Tab navigation never escapes to background elements.
* Restore focus to the triggering element when a modal or drawer closes.
* Support arrow key roving tabindex on tabs, segmented controls, and combobox option lists (`ArrowRight`, `ArrowLeft`, `Home`, `End`).
* Maintain visible 2px focus rings (`:focus-visible`) using `--border-focus`.

### Step 6.8: Feedback and Acoustic Orchestration
* Map interactive actions to the feedback hierarchy:
  * Micro-interactions: 10ms tactile haptic tick.
  * Affirmations (copy, save, queue): 1.2s checkmark button state, toast notification at `z-index: 11000`.
* Follow all prohibitions in `docs/design/17-sound-haptics-design.md`: zero hover sounds, zero keystroke sounds, zero scroll sounds, and zero page load sounds.

### Step 6.9: Optimistic Local State with Performance Guardrails
* For user interactions (toggling filters, changing tabs, updating quantities, marking favorites), update React component state synchronously first so the interface responds in <16ms with zero perceptible latency.
* Defer persistence to `localStorage` or IndexedDB asynchronously (or debounced for rapid changes) so storage operations never thrash re-renders or block the main thread.
* Guard against redundant state re-renders by ensuring updates pass shallow equality checks. Only apply optimistic updates where state rollback is trivial and failure risk is negligible.

### Step 6.10: Timer and Listener Lifecycle Cleanup
* Ensure all countdowns, tick loops, and window event listeners registered in `useEffect` provide explicit cleanup returns (`clearInterval`, `cancelAnimationFrame`, `removeEventListener`).
* Prevents zombie timers and memory leaks when players navigate between pages.

**Exit Gate 5**: Complete, polished page implementation adhering to all design tokens and motion guidelines.

## 7. Stage 6: The 5 Verification Gates and Visual Proof

Before declaring any page complete, verify across all five gates.

### Gate 1: Strict Logic Invariance
Verify that calculation outputs, economy values, and drop rates match production formulas with zero numerical drift.

### Gate 2: Layout Stability and Ergonomics
* Verify Cumulative Layout Shift (CLS <= 0.1).
* Verify touch target bounds >= 44x44px on mobile viewports.
* Verify modal body scroll containment (`overscroll-behavior: contain`).

### Gate 3: Unit and Contract Test Suite
* Run `npm run test:unit`. All test suites must pass 100% with zero failures.
* Ensure the route architecture contract test (`tests/unit/<route>-architecture-contracts.test.ts`) passes cleanly.

### Gate 4: TypeScript Compilation and Production Build
* Run `npm run typecheck` to verify zero TypeScript errors.
* Run `npm run build` to verify the production Next.js compiler generates all static routes and catches metadata errors.

### Gate 5: Interactive Verification, Seeded States & Visual Evidence Across Breakpoints
* Author or update a route Playwright spec using `tests/a11y/fixtures/route-helpers.ts` (`seedPopulatedProfile`, `attachRuntimeMonitors`, `assertAxeClean(..., "serious")`, `assertNoHorizontalOverflow`, `openUnclippedListboxOption`).
* Test across mobile (375px), tablet/laptop (1024px), and desktop (1440px) viewports in **Populated** (seeded character/owned items/active owner/guest states), **Interactive** (every tab, active filter/calculator state, expanded accordion, and selected item card), and **Empty** states:
  * Dismiss onboarding overlays in headless captures (`Not now`) and switch out of passive/disabled defaults (e.g., activate Owner + Foundation + selected items, or active Guest buffs) so every real layout block is captured and inspected, not just empty placeholders.
  * Click numeric steppers (`+` / `-`) and confirm values update in the DOM.
  * Open `Select` / `Combobox` dropdowns inside panels/accordions and confirm zero clipping or z-index occlusion.
  * Toggle every view mode (Cards and Table) and every route tab on both desktop and 375px mobile, verifying avatars clear labels, currency/material icons align inline, table `min-width` prevents cramped numbers, `<BackToTop />` appears above the mobile dock when scrolled, and `scrollWidth <= innerWidth`.
  * Assert zero `console.error` / `pageerror`, zero failed same-origin requests, `CLS <= 0.1`, and zero `serious` or `critical` axe violations.
* Run `npx knip --include files` before declaring a page done to verify no orphaned files or dead helpers remain.
* Save screenshots to the artifacts directory and inspect **every tab, drawer footer, modal sheet, and active card** across `320px/375px`, `1024px`, and `1440px` using a harsh visual critique pass: check specifically for clipped drawer/modal buttons, awkward empty toolbar voids, stray `Ctrl K` hints in local searches, unformatted raw strings or `·` middots, smashed inline labels, layout clipping, descender truncation, nested outline clutter, **icon-to-text vertical centering, toolbar/card control alignment, header-vs-sidebar icon parity**, awkward line wraps, and touch clearance issues.

## 8. Stage 7: Release Engineering and Production Deployment Pipeline

**Deploy Gate**: Execute Stage 7 **only after the user has explicitly reviewed the local changes/screenshots and approved deployment**. Never commit or push automatically at the end of Stage 6.

### Step 8.1: Pre-flight GitHub Actions Check
* Run `gh run list --limit 5` before staging or pushing.
* If an automated workflow (such as hourly market or boss data scrapers) is actively running, wait until it completes to avoid push collisions.

### Step 8.2: Remote Fetch and Rebase Check
* Run `git fetch origin main` to confirm local `main` is up to date with `origin/main`.
* If remote changes exist, rebase cleanly before pushing.

### Step 8.3: Small, Atomic Conventional Commits
* Group changes into small, logical, atomic commits to preserve clear git history and maintain transparent contribution logs:
  1. Primitive and shared UI changes (`fix(ui): ...` or `feat(ui): ...`)
  2. Specification updates (`docs(design): ...`)
  3. Route implementation (`feat(<route>): ...`)
  4. Contract and unit tests (`test(<route>): ...`)
  5. Navigation and sitemap (`feat(nav): ...`)
  6. Generated datasets and manifests (`data(<route>): ...`)
  7. Release notes and roadmap (`docs(changelog): ...`)

### Step 8.4: Local Files Isolation Check
* Confirm local-only files remain untracked (`DESIGN.md`, `AGENTS.md`, `.agents/`, scratch scripts).
* Never force add or commit local developer notes or internal agent configuration files.

### Step 8.5: Changelog and Version Ledger Update
* Add player-facing release notes under the active release date in `CHANGELOG.md` following `31-changelog-patch-notes-spec.md`.
* Recompile the changelog dataset: `node scripts/build-zenith-changelog.mjs`.
* Update `ROADMAP.md` with explicit timestamps (`YYYY-MM-DD HH:mm`).

### Step 8.6: Push to Production
* Run `git push origin main`.
* Verify the push finishes with exit code 0.

### Step 8.7: Dual-Workspace Parity Sync
* Active agent working directory: `c:\Data\IdleMMO related stuff\02_Tools\AlchemyCalculator\Zenith Companion` (backup mirror: `C:\Data\Programming Projects\Zenith Companion`).
* Mirror committed `origin/main` updates cleanly (`git fetch origin main; git reset --hard origin/main; git status`) and mirror local-only files (`AGENTS.md`, `DESIGN.md`, `.agents/`, `graphify-out/`) so both directories match identically.
