# Zenith Engineering Protocol: Page Refactoring & Migration Standard

This document is the authoritative standard operating procedure for redesigning, refactoring, and migrating routes across Zenith Companion. Every page migration must strictly execute these six stages and pass the five verification gates.

## 1. Core Mandate & Invariants
* **Strict Logic Invariance**: Game calculations, drop tables, economy formulas, scrapers, and data schemas remain 100% untouched. All refactoring is strictly presentation-layer (HTML, CSS modules, layout stability, accessibility, and human copy).
* **Zero UI Slop**: Strip corporate filler, vague marketing text, and redundant metric boxes. Write direct, human IdleMMO player copy.
* **Layout Stability (Zero CLS)**: Maintain Cumulative Layout Shift (CLS) <= 0.1. Dynamic cards and images must use dimension-matched skeletons or reserved min-heights.
* **Touch Ergonomics**: Every interactive element must provide a minimum tap target of 44x44px on mobile viewports.
* **Accessibility**: Meet WCAG 2.2 AA standards (>= 4.5:1 text contrast, visible focus rings, ARIA landmarks).

---

## 2. Stage 1: Ground Truth, Game Mechanics & Safety Net
Before touching code, verify the underlying game reality and establish baseline test coverage.

### Step 1.1: Local Knowledge Search
* Search the local game knowledge repository at `.agents/knowledge/idlemmo/wiki/` for the page's domain (e.g. items, alchemy, forge, combat).
* Record the article's 'Last updated' date.

### Step 1.2: Patch Notes Delta Audit
* Inspect `public/idlemmo-patch-notes.json` and `.agents/knowledge/idlemmo/patch-notes-summary.md` for all releases dated after the wiki article's last update.
* Catch any recent mechanic changes, rebalances, level requirement adjustments, or recipe shifts (e.g. mythic level requirements scaling to 96, removal of fish from forge recipes).

### Step 1.3: Data Schema & Null Value Audit
* Inspect the corresponding datasets in `public/data/*.json` and `src/data/`.
* Audit field names, optional properties, and null value behavior (e.g. items with no active market price, uncraftable items, zero drop chance entries).

### Step 1.4: Existing Test Suite Safety Net
* Locate existing test suites targeting the page in `tests/unit/*<page>*.test.ts`.
* If critical calculations, filter combinations, or edge cases lack test coverage, author a baseline characterization test first. This guarantees that subsequent dead code removal does not silently break logic.

**Exit Gate 1**: Verified game facts and a 100% passing baseline test suite.

---

## 3. Stage 2: Critical Audit, Performance Budget & Teardown Proposal
Critically evaluate the existing page, establish performance constraints, and formulate the proposal.

### Step 2.1: Player Job-To-Be-Done (JTBD) Classification
Classify the page into one of three primary interaction modes:
1. **Flash Lookup** (< 10 seconds): The player alt-tabs or switches mobile apps for quick answers (e.g. item stats, drop locations, enemy weaknesses). Primary answer must sit above the fold with instant search.
2. **Route Planner** (1 to 5 minutes): The player optimizes training queues or profitability (e.g. Forge lessons, Alchemy EV). Primary recommendations sit at the top; secondary overrides and filters live in progressive disclosure containers.
3. **Ambient Tracker** (Persistent background): The player tracks respawns or events (e.g. World Boss timers, Weather forecasts). High-contrast timers, stable layout, and non-intrusive alerts.

### Step 2.2: Data Volume & Performance Budget
* Quantify dataset size. If the page renders more than 50 complex cards simultaneously (e.g. `/items` with 1,355 items):
  * Use pagination, virtualized windowing, or deferred search filtering (`useDeferredValue`).
  * Ensure keystroke filtering does not block the main thread or degrade Interaction to Next Paint (INP).

### Step 2.3: The 4-State Matrix Architecture
Explicitly plan all four states for the page:
1. **Ready State**: Full data loaded with active filters.
2. **Empty State**: Friendly explanation and a 1-tap 'Reset Filters' button when search or filter combinations yield zero results.
3. **Loading State**: Dimension-matched skeleton screens that prevent layout shift.
4. **Error / Offline State**: Actionable recovery message with a retry button if network or local data fails.

### Step 2.4: UI Primitive Inventory Check
* Map required page controls against `src/components/ui/` (`Button`, `TextInput`, `SearchInput`, `SegmentedControl`, `Select`, `Card`, `Badge`, `ModalSheet`, `Drawer`, `Popover`, `Tooltip`, `Table`, `EmptyState`, `Skeleton`, `Toast`).
* If any required widget is missing, flag it immediately.

### Step 2.5: Teardown Proposal Presentation
* Compile the audit into a concise report:
  * Exact elements to delete (clutter, redundant metric boxes, obsolete containers).
  * Missing features or broken links to fix.
  * Component inventory and any missing primitive requirements.
* Present the teardown proposal to the user.

**Exit Gate 2**: Explicit user sign-off on the teardown proposal before any code changes begin.

---

## 4. Stage 3: Missing Component Build & Isolated Polish (Conditional)
If Gate 2 identified a missing primitive, build and test it in isolation before touching the page.

### Step 3.1: Specification & User Guidance
* Review user guidance, reference documents, and standards for the component.

### Step 3.2: Full State Matrix Implementation
* Build the primitive in `src/components/ui/` supporting:
  * Core states: Default, Hover, Active/Pressed (`transform: scale(0.98)`), Focused (`:focus-visible`), Disabled.
  * Functional states: Loading (spinner), Success (checkmark), Error (actionable alert).
* Ensure hardware-accelerated CSS animations (`transform`, `opacity`, 100-200ms cubic-bezier).

### Step 3.3: Accessibility & Unit Testing
* Verify visible 2px focus ring (`:focus-visible`), keyboard navigation, and ARIA roles.
* Add unit test coverage in `tests/unit/ui-primitives.test.ts`.

**Exit Gate 3**: Polished primitive approved by the user.

---

## 5. Stage 4: Dead Code & Clutter Elimination
Clean the foundation before building new features.

### Step 4.1: Strip Orphaned Code
* Remove obsolete metric boxes, dead helper functions, unused state hooks, and legacy CSS classes flagged in the teardown.

### Step 4.2: Compile & Test Sanity
* Run `npm run typecheck` to verify the stripped file compiles without errors.
* Run `npm run test:unit` to verify the baseline test suite remains green.

**Exit Gate 4**: Minimal, clean code foundation with zero TypeScript or test errors.

---

## 6. Stage 5: High-Craft Redesign & Implementation
Implement the modern presentation layer following all design standards.

### Step 6.1: Component Assembly & Tokens
* Build the interface using tested UI primitives and CSS variables from `src/app/globals.css`.
* Adhere to the Astral Slate monochromatic palette: 60% neutral surface (`--bg-base`), 30% structural elevation (`--bg-card`), reserving bright accents strictly for game drop rarities and danger indicators.

### Step 6.2: URL State Deep-Linking & History Navigation
* Sync primary entity modal IDs and active view tabs to URL search parameters (e.g. `/items?id=123` or `/forge?tab=lessons`).
* Allows players to share direct links in Discord and guild chats.
* Ensures the browser hardware Back button dismisses modals or drawers instead of navigating off the site.

### Step 6.3: Mobile Ergonomics & Hardware Clearances
* Ensure all primary actions sit in the mobile thumb zone.
* Offset fixed bottom elements above the navigation dock:
  `bottom: calc(var(--bottom-dock-height, 64px) + env(safe-area-inset-bottom, 0px) + 16px);`
* Verify soft-keyboard resistance: virtual keyboard opening must not cover active search inputs or lock modal scrolling.

### Step 6.4: Native Player Copy Review (Anti-Slop Audit)
* Audit all text against the Anti-Slop Writing Prompt.
* Ban generic AI vocabulary (*delve, pivotal, crucial, intricate, tapestry, fosters, bolster*).
* Use native IdleMMO player terms:
  * *Drops / Loot* (never *Yields*)
  * *Efficiency* (never *Speed*)
  * *XP/hr* (never *Experience throughput*)
  * *Market Tax* (15% standard / 12% member)
  * *Vendor Price* (never *Merchant liquidation value*)
  * *EV / Expected Value* (never *Projected profitability*)

### Step 6.5: Feedback & Acoustic Orchestration
* Map interactive actions to the feedback hierarchy:
  * Micro-interactions: 10ms tactile haptic tick.
  * Affirmations (copy, save, queue): 1.2s checkmark button state, toast notification at `z-index: 11000`, rising 120ms chime.
  * Long-running sync: In-place spinner and persistent checkmark.
* Follow all prohibitions in `docs/design/17-sound-haptics-design.md`: zero hover sounds, zero keystroke sounds, zero scroll sounds, and zero page load sounds.

**Exit Gate 5**: Complete, polished page implementation adhering to all design tokens.

---

## 7. Stage 6: The 5 Verification Gates & Visual Proof
Before marking any page complete, verify across all five gates.

### Gate 1: Strict Logic Invariance
Verify that calculation outputs, economy values, and drop rates match production formulas with zero numerical drift.

### Gate 2: Layout Stability & Ergonomics
* Verify Cumulative Layout Shift (CLS <= 0.1).
* Verify touch target bounds >= 44x44px on mobile viewports.
* Verify modal body scroll containment (`overscroll-behavior: contain`).

### Gate 3: Unit Test Suite
Run `npm run test:unit`. All test suites must pass 100% with zero failures.

### Gate 4: TypeScript Typecheck
Run `npm run typecheck`. Must compile with zero TypeScript errors.

### Gate 5: Visual Evidence Capture
* Capture high-resolution headless browser screenshots at both 375px (mobile) and 1440px (desktop) across light and dark viewports.
* Save screenshots to the artifacts directory and inspect for layout clipping, awkward line wraps, or touch clearance issues.

### Documentation Ledger Maintenance
* Update `ROADMAP.md` marking the route complete with explicit timestamp (`YYYY-MM-DD HH:mm`).
* Update `CHANGELOG.md` with a detailed entry under `### Changed` with explicit timestamp (`YYYY-MM-DD HH:mm`).
