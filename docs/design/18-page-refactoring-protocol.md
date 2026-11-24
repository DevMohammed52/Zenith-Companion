# Zenith Engineering Protocol: Page Refactoring & Migration Standard

This document is the authoritative standard operating procedure for redesigning, refactoring, and migrating routes across Zenith Companion. Every page migration must execute these stages and pass all verification gates before shipping.

## 1. Core Mandates and Invariants

* **Strict Logic Invariance**: Game calculations, drop tables, economy formulas, scrapers, and data schemas remain 100% untouched. All refactoring is strictly presentation-layer (HTML, CSS modules, layout stability, accessibility, and human copy).
* **Deep Redesign Over Superficial Reskinning**: Never just swap component tags or tweak padding. Critically rethink the layout hierarchy from scratch. Remove all visual clutter, redundant metric tiles, and scattered controls. Make the page feel calm, purposeful, and focused on the player's core task.
* **Plain-Language Gamer Copy**: Strip sophisticated, academic, or corporate wording. Ban AI vocabulary (delve, pivotal, crucial, intricate, tapestry, fosters, bolster). Write direct, human IdleMMO player copy (Drops instead of Yields, XP/hr instead of Experience throughput, Market Tax instead of Exchange levy, Vendor Price instead of Merchant liquidation value).
* **Motion and Animation Discipline**: Follow `08-motion-animation.md` and `DESIGN.md`. Use hardware-accelerated CSS properties only (`transform` and `opacity`). Apply snappy spring curves: `cubic-bezier(0.16, 1, 0.3, 1)` with durations between 100ms and 220ms. Never animate layout properties like `height`, `width`, or `margin`. For collapsible sections, animate CSS Grid row tracks (`grid-template-rows: 0fr` to `1fr`). Strictly honor `prefers-reduced-motion`.
* **Layout Stability (Zero CLS)**: Maintain Cumulative Layout Shift (CLS) <= 0.1. Dynamic cards and images must use dimension-matched skeletons or reserved min-heights.
* **Touch Ergonomics**: Every interactive element must provide a minimum tap target of 44x44px on mobile viewports.
* **Accessibility**: Meet WCAG 2.2 AA standards (>= 4.5:1 text contrast, visible focus rings with 2px offset, semantic ARIA landmarks, keyboard escape listeners, and modal focus traps).

## 2. Stage 1: Ground Truth, Architecture Impact and Safety Net

Before modifying code, understand the game reality, map architectural dependencies, and establish baseline test coverage.

### Step 1.1: Local Knowledge Search
* Search the local game knowledge repository at `.agents/knowledge/idlemmo/wiki/` for the page's domain (items, alchemy, forge, combat, pets, conquest).
* Record the article's last updated date.

### Step 1.2: Patch Notes Delta Audit
* Inspect `public/idlemmo-patch-notes.json` and `.agents/knowledge/idlemmo/patch-notes-summary.md` for all releases dated after the wiki article's last update.
* Catch recent mechanic changes, rebalances, level requirement adjustments, or recipe shifts.

### Step 1.3: Data Schema and Null Value Audit
* Inspect corresponding datasets in `public/` and `src/data/`.
* Audit field names, optional properties, and null value behavior (items with no active market price, uncraftable items, zero drop chance entries).

### Step 1.4: Graphify Dependency and God Node Blast Radius Audit
* Run `graphify query "<target route>"` to map inbound and outbound relationships.
* Identify couplings to God Nodes (`useProfiles`, `DataContext`, `useData`, `useSettings`).
* Verify whether local state or global context drives the page to prevent accidental cascading re-renders or broken state across routes.

### Step 1.5: Route Architecture Contract Safety Net
* Locate existing test suites targeting the page in `tests/unit/*<page>*.test.ts`.
* If a dedicated architecture contract test does not exist, author a baseline characterization test (`tests/unit/<route>-architecture-contracts.test.ts`). This guarantees subsequent dead code removal does not silently break logic or layout contracts.

**Exit Gate 1**: Verified game facts, mapped architecture blast radius, and a 100% passing baseline test suite.

## 3. Stage 2: Critical Audit, Decluttering and Teardown Proposal

Critically evaluate the existing page, plan relational connections, and formulate the redesign proposal.

### Step 2.1: Player Job-To-Be-Done (JTBD) Classification
Classify the page into one of three primary interaction modes:
1. **Flash Lookup** (< 10 seconds): The player alt-tabs or switches mobile apps for quick answers (item stats, drop locations, enemy weaknesses). Primary answer must sit above the fold with instant search.
2. **Route Planner** (1 to 5 minutes): The player optimizes training queues or profitability (Forge lessons, Alchemy EV). Primary recommendations sit at the top; secondary overrides and filters live in progressive disclosure containers.
3. **Ambient Tracker** (Persistent background): The player tracks respawns or events (World Boss timers, Weather forecasts). High-contrast timers, stable layout, and non-intrusive alerts.

### Step 2.2: Cross-Feature Relational Deep Linking
* Map entity relationships that can bridge player navigation:
  * Items with gathering sources link directly to `/map?location=...`.
  * Enemies with item drops open `ItemModal` on click.
  * Gear items offer a direct jump to combat or simulator views.
  * Lore references deep-link to corresponding game entities.

### Step 2.3: Decluttering and Information Hierarchy
* Review every container, card, and metric box on the legacy page.
* Eliminate redundant summary numbers that repeat table headers.
* Merge scattered filter dropdowns into a unified search and filter toolbar.
* Move secondary or advanced parameters into clean disclosure sheets or collapsible filter drawers.

### Step 2.4: Data Volume and Performance Budget
* Quantify dataset size. If the page renders more than 50 complex cards simultaneously:
  * Enforce bounded pagination (e.g. 25 to 50 items per page) or virtualized windowing.
  * Use deferred search filtering (`useDeferredValue`) to keep keystroke typing responsive and protect Interaction to Next Paint (INP).

### Step 2.5: The 4-State Matrix Architecture
Explicitly plan all four states for the page:
1. **Ready State**: Full data loaded with active filters.
2. **Empty State**: Friendly plain-language explanation and a 1-tap "Reset Filters" button when search or filter combinations yield zero results.
3. **Loading State**: Dimension-matched skeleton screens that preserve layout dimensions and prevent shifts.
4. **Error / Offline State**: Actionable recovery message with a retry button if network or local storage data fails.

### Step 2.6: UI Primitive Inventory Check
* Map required page controls against `src/components/ui/` primitives (`Button`, `TextInput`, `SearchInput`, `SegmentedControl`, `Select`, `Card`, `Badge`, `ModalSheet`, `Drawer`, `Popover`, `Tooltip`, `Table`, `EmptyState`, `Skeleton`, `Toast`, `Pagination`, `Combobox`, `Tabs`, `Tag`, `StatCard`, `Checkbox`, `Switch`, `NumberInput`, `ProgressBar`, `Breadcrumbs`, `Slider`).
* If any required widget is missing, flag it immediately for Stage 3.

### Step 2.7: Teardown Proposal Presentation
* Compile the audit into a concise report:
  * Exact elements to delete (clutter, redundant metric boxes, obsolete containers).
  * Plain-language copy improvements.
  * Relational links to add.
  * Component inventory and primitive requirements.
* Present the teardown proposal to the user.

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

### Step 4.2: Compile and Test Sanity
* Run `npm run typecheck` to verify the stripped file compiles without errors.
* Run `npm run test:unit` to verify baseline tests remain green.

**Exit Gate 4**: Minimal, clean code foundation with zero TypeScript or test errors.

## 6. Stage 5: High-Craft Redesign and Implementation

Implement the modern presentation layer following all design and performance standards.

### Step 6.1: Component Assembly and Tokens
* Build the interface using tested UI primitives and CSS variables from `src/app/globals.css`.
* Adhere to the Astral Slate monochromatic palette: 60% neutral surface (`--bg-base`), 30% structural elevation (`--bg-card`), reserving bright accents strictly for game drop rarities, weather buffs, and danger indicators.
* **Fewer Borders Discipline**: Avoid wrapping inner stat/metric tiles or accordions in redundant `1px solid` outlines when they already sit inside a bordered card or modal (`DESIGN.md` Section 11). Separate them with translucent fills and whitespace.
* **Icon & Skeleton Discipline**: Consume icons via `src/lib/icons.ts` / `<Icon>` rather than direct `lucide-react` imports where concepts already exist, and prefer dimension-matched `Skeleton` loaders over generic `StateBlock` boxes.
* **Open Overflow Hygiene**: When CSS Grid accordions (`grid-template-rows: 0fr` to `1fr`) open, set inner overflow to `visible` and raise `:focus-within` z-index so dropdown listboxes never clip or sit behind adjacent fields.

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

### Gate 5: Interactive Verification and Visual Evidence Across Breakpoints
* Run interactive Playwright verification across mobile (375px), tablet/laptop (1024px), and desktop (1440px) viewports rather than passive initial-load snapshots alone:
  * Click numeric steppers (`+` / `-`) and confirm values update in the DOM.
  * Open `Select` / `Combobox` dropdowns inside panels/accordions and confirm zero clipping or z-index occlusion.
  * Toggle every view mode (Cards and Table) on both desktop and 375px mobile, verifying avatars do not collide with labels, table `min-width` prevents cramped numbers, and no unintended page-level horizontal scroll occurs (`scrollWidth <= clientWidth`).
* Save screenshots to the artifacts directory and inspect for layout clipping, descender truncation, nested outline clutter, awkward line wraps, or touch clearance issues.

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

### Step 8.7: Mirror Workspace Parity Sync
* Switch to the mirror workspace directory: `c:\Data\Programming Projects\Zenith Companion`.
* Run `git fetch origin main; git reset --hard origin/main; git status`.
* Confirm both workspaces are at identical commit hashes and have clean working trees.
