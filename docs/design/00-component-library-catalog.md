# Zenith UI Component Library: Master Architecture & Roadmap

This document catalogs the complete atomic UI component library for Zenith Companion. It defines all 38 enterprise primitives required across all 41 routes to ensure zero ad-hoc styling and strict presentation-layer consistency.

## Component Library Master Matrix

### Category 1: Inputs & Form Controls
1. **`Button`** [Completed]
   * *Variants*: `primary` (frost white / dark text), `secondary` (subtle border), `ghost` (transparent hover), `danger` (ruby red accent).
   * *Sizes*: `sm` (32px desktop / 44px mobile touch), `md` (40px desktop / 44px mobile touch), `lg` (48px).
   * *States*: Resting, Hover (150ms ease), Active press (`scale(0.98)`), Focused (`:focus-visible`), Disabled, Loading (inline spinner with locked pointer events).
   * *Tokens*: `--bg-card`, `--border-subtle`, `--border-focus`, `--text-main`.

2. **`TextInput`** [Completed]
   * *Features*: Permanent label, static helper copy, clear error state linked via `aria-describedby`, dark well fill, clear button (`✕`), 44px mobile height.
   * *Tokens*: `--bg-panel`, `--border-subtle`, `--border-focus`, `--border-danger`, `--text-main`, `--text-muted`.

3. **`Select` / `Dropdown`** [Priority: High]
   * *Purpose*: Accessible single-select popover with styled listbox.
   * *Semantics*: `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded="true|false"`, `aria-controls="<id>"`.
   * *Keyboard*: `Down Arrow` / `Up Arrow` navigates options, `Enter` selects and closes, `Escape` dismisses without change, `Alt + Down` opens.
   * *Features*: Chevron indicator, placeholder, option groups with headers, option dividers, checkmark on active selection, 44px option height on mobile.

4. **`Combobox` / `Autocomplete`** [Priority: High]
   * *Purpose*: Searchable text input with filtering popup listbox for 1,355 items, recipes, and enemies.
   * *Semantics*: WAI-ARIA Combobox pattern with `role="combobox"`, `aria-autocomplete="list"`, `aria-activedescendant="<option-id>"`.
   * *Keyboard*: Arrow keys move active descendant highlight without stealing text input focus; `Enter` commits choice; `Escape` clears or dismisses.
   * *Features*: Substring highlighting of typed query, recent selections group, empty search message with reset button, virtualized listbox for >50 matches.

5. **`SegmentedControl`** [Completed]
   * *Purpose*: Sliding pill selector for mutually exclusive views, filters, and binary/ternary toggles.
   * *Semantics*: `role="tablist"` or `role="radiogroup"`, `role="tab"` with `aria-selected="true|false"`.
   * *Keyboard*: Arrow keys (Left/Right) move selection with roving tabindex (`tabIndex={isActive ? 0 : -1}`).
   * *Features*: Hardware-accelerated sliding selection pill, 44px mobile touch height.

6. **`Checkbox`** [Documented - Awaiting Build Phase]
   * *Purpose*: Multi-selection filters, batch choices, and hierarchy control.
   * *Specification*: See [docs/design/21-checkboxes-selection.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/21-checkboxes-selection.md).
   * *Semantics*: Native `<input type="checkbox">` with semantic `<label>`, or Radix UI `Checkbox.Root` with `aria-checked="true|false|mixed"`.
   * *Indeterminate Property*: Set via DOM property `element.indeterminate = true`, never HTML attribute.
   * *Hitbox*: Entire label row is interactive; minimum 24x24px (WCAG 2.2 SC 2.5.8 Level AA), 44px mobile row height.

7. **`Switch` / `Toggle`** [Documented - Awaiting Build Phase]
   * *Purpose*: Instant application preferences (Audio Cues, Haptic Feedback, Auto-Refresh).
   * *Specification*: See [docs/design/22-switches-toggles.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/22-switches-toggles.md).
   * *Semantics*: `role="switch"`, `aria-checked="true|false"`, or `<input type="checkbox" role="switch">`.
   * *Immediate Effect*: Takes effect instantly; never paired with Save/Submit buttons.
   * *Static Label*: Label text never changes on toggle ("Audio cues: on/off", never "Enable audio").
   * *Non-Color Cue*: 3:1 contrast against track in both states; position + inner glyph. Transform-only CSS animation.

8. **`NumberInput`** [Documented - Awaiting Build Phase]
   * *Purpose*: Financial amounts, craft batch sizes, level thresholds, and attack speeds.
   * *Specification*: See [docs/design/23-number-input-stepper.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/23-number-input-stepper.md).
   * *Architecture*: Controlled text input with `inputmode="numeric"` or `"decimal"` to prevent native `<input type="number">` bugs (unintentional scroll-wheel changes, silent character drops, exponential notation).
   * *Semantics*: `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`.
   * *Keyboard*: ArrowUp/ArrowDown for step, PageUp/PageDown for 10x step, Home/End for limits, Enter/Blur to commit.
   * *Editing Discipline*: Never clamp while user is typing; clamp strictly on blur or Enter. Prevent mouse wheel value edits.
   * *Steppers*: Buttons set to `tabindex="-1"` and `aria-hidden="true"` (keyboard uses spinbutton). Minimum 44px mobile touch size.
   * *Formatting*: Mandatory `tabular-nums`, right-aligned, formatted with `Intl.NumberFormat` on blur.

9. **`Slider` / `Range`** [Documented - Awaiting Build Phase]
   * *Purpose*: Continuous or stepped parameter ranges (e.g. Combat level filter, time budgets, cost thresholds).
   * *Specification*: See [docs/design/27-slider-range-controls.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/27-slider-range-controls.md).
   * *WCAG 2.2 SC 2.5.7*: Must pair every slider with an adjacent `NumberInput` for direct typing without dragging; track-click snaps thumb directly to value.
   * *Semantics*: `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`. Multi-thumb range groups thumbs in `<fieldset>` with non-crossing min/max bounds.
   * *Keyboard*: ArrowLeft/Down decreases, ArrowRight/Up increases, PageDown/PageUp for 10x step, Home/End for boundaries.
   * *Ergonomics*: Value label placed above or beside track (never below where finger obscures it on touch); `touch-action: pan-y`; deferred recalculation during dragging (`useDeferredValue` or commit on release).

10. **`TextArea`** [Documented - Awaiting Build Phase]
    * *Purpose*: Multi-line inputs for custom notes, bug reports, and profile import hashes.
    * *Specification*: See [docs/design/28-textarea-multiline-inputs.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/28-textarea-multiline-inputs.md).
    * *Boundary*: Single-line inputs must use `<TextInput>`; `<TextArea>` is reserved for multiline content.
    * *Semantics*: Native `<textarea>` with permanent visible `<label>` (never placeholder alone), `aria-describedby` helper/error, `aria-invalid="true"` on failure.
    * *Data Import Hardening*: Disable corrupting helpers (`spellcheck="false"`, `autocapitalize="off"`, `autocorrect="off"`, `autocomplete="off"`, `wrap="off"`); monospace font; soft limit with character counter (avoid hard `maxlength` truncation); parse on paste/blur/action (never on every keystroke); keep user text intact on error.
    * *Sizing*: Modern CSS `field-sizing: content` (Baseline 2026) with `min-height`, `max-height`, and `resize: vertical` only (horizontal resizing prohibited); minimum 16px mobile font to prevent iOS zoom; debounced local draft saving.

11. **`RadioGroup` / `Radio`** [Documented - Awaiting Build Phase]
    * *Purpose*: Vertical lists of 2 to 5 mutually exclusive options (e.g. pricing baseline: Median / Recent / Custom).
    * *Specification*: See [docs/design/29-radio-groups-selection.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/29-radio-groups-selection.md).
    * *Semantics*: `<fieldset>` with `<legend>` wrapping native `<input type="radio">` sharing a common `name`. Card-style radios keep the real native input in the DOM for accessible focus.
    * *Keyboard & Tab*: Exactly 1 tab stop per group (Tab focuses checked radio or first radio; leaves group). Arrow keys move focus AND change selection (roving tabindex with circular wrapping).
    * *Selection Discipline*: Radio buttons cannot be deselected once chosen; always preselect a default; provide an explicit "None" option if declining is valid.
    * *Non-Color Cue*: Structural physical change (inner filled dot in outer ring). Whole label row/card is interactive (minimum 24px desktop, 44px mobile touch target). Disabled reason explained in inline text (never tooltip).

12. **`SearchInput`** [Priority: High]
    * *Purpose*: Global and in-page table search inputs.
    * *Features*: Leading `Search` icon, trailing clear button (`✕`), command hotkey pill (`Ctrl+K`), automatic 150ms debounced `onChange`, 44px mobile height.

---

### Category 2: Data Display & Layout
13. **`Card`** [Completed]
    * *Features*: Standardized paddings (`none`, `sm`, `md`, `lg`), subtle borders, header/title/action slots, hover lift variant.

14. **`Table` Family** [Completed]
    * *Components*: `TableContainer`, `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`.
    * *Features*: `aria-sort` headers with directional icons, tabular numbers, Lea Verou CSS scroll shadows, pinned first column on mobile.

15. **`Badge`** [Completed]
    * *Features*: Quality tiers (`common`, `uncommon`, `rare`, `epic`, `legendary`, `mythic`), status colors (green, amber, red, blue), dot indicator.

16. **`Tag` / `Chip`** [Priority: High]
    * *Purpose*: Filter pills, active tag lists, and enemy weakness chips.
    * *Features*: Optional leading icon, text label, count badge, optional removable "x" button with accessible `aria-label="Remove filter"`.

17. **`StatCard` / `MetricTile`** [Documented - Awaiting Build Phase]
    * *Purpose*: Primary KPI metric display across `/`, `/profiles`, `/skill-profit`, `/alchemy`.
    * *Specification*: See [docs/design/20-stat-cards-metric-tiles.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/20-stat-cards-metric-tiles.md).
    * *Semantics*: Static display (not button/input). `<dl>`, `<dt>`, `<dd>` or labelled group.
    * *Tabular Numbers*: Mandatory `font-variant-numeric: tabular-nums` to eliminate layout shift on dynamic updates.
    * *Sentiment Decoupling*: Direction (`▲`/`▼`, `+`/`-`) decoupled from sentiment (good/bad). Color only reinforces glyphs.
    * *Preattentive Rules*: 2D position and linear length only. Gauges and donut charts prohibited.
    * *Temporal Grounding*: Always declare comparison period ("vs prior 24h") and data freshness age.

18. **`Accordion` / `Collapsible`** [Priority: High]
    * *Purpose*: Progressive disclosure of secondary options, formula overrides, and boss drop mechanics.
    * *Semantics*: `<details>` and `<summary>` or `<button aria-expanded="true|false">` controlling `<div id="...">`.
    * *Keyboard*: `Enter` or `Space` toggles container.
    * *Features*: Smooth 200ms height animation, rotating chevron indicator, zero layout shift when closed.

19. **`Tabs`** [Priority: High]
    * *Purpose*: Page-level section switching on `/forge`, `/pets`, `/lore`.
    * *Semantics*: `role="tablist"`, `role="tab"` (`aria-selected="true|false"`, `aria-controls="<panel-id>"`), `role="tabpanel"`.
    * *Keyboard*: Left/Right arrow keys navigate tabs with roving tabindex; Tab jumps into active tabpanel.
    * *Features*: Underline or capsule active indicator, badge count support.

20. **`Avatar` / `EntityIcon`** [Priority: High]
    * *Purpose*: Character profiles, pets, enemies, and items.
    * *Features*: Circular or rounded square, fallback initials or question mark icon, dynamic game rarity border glow.

21. **`Divider` / `Separator`** [Priority: Medium]
    * *Purpose*: Semantic boundary between visual groups.
    * *Semantics*: `role="separator"`, `aria-orientation="horizontal|vertical"`.
    * *Tokens*: `--border-subtle`.

22. **`Kbd`** [Priority: Medium]
    * *Purpose*: Visual hotkey keycap display for keyboard navigation.
    * *Features*: Monospace typography, subtle border and box-shadow simulating physical keycap.

23. **`Timeline`** [Documented - Awaiting Build Phase]
    * *Purpose*: Chronological sequences where time and narrative progression are the primary focus (`/lore`, `/patch-notes`).
    * *Specification*: See [docs/design/30-timelines-chronology.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/30-timelines-chronology.md).
    * *Boundary*: If users need multi-column sorting, filtering, or cost calculations, use `<Table>` instead.
    * *Semantics*: `<ol>` and `<li>` structure; timestamps use semantic `<time datetime="...">`; connecting line and node dots marked `aria-hidden="true"`.
    * *Direction & Time*: Explicitly state chronological direction ("Order: Newest first"); relative time formatted via `Intl.RelativeTimeFormat` with localized absolute fallback via `Intl.DateTimeFormat`; state time zone (e.g. UTC server time).
    * *Performance*: Derive all relative durations from a single shared ticker (no per-entry intervals).
    * *Feed Discipline*: Never mark whole list with `aria-live`; offer "X new updates" button for incoming events to prevent CLS; truncate long entries with `<button aria-expanded="false">`.

24. **`Tree` / `HierarchyView`** [Priority: Low]
    * *Purpose*: Multi-tier alchemy craft recipe breakdowns and item dependency trees.
    * *Semantics*: WAI-ARIA Tree pattern (`role="tree"`, `role="treeitem"`, `aria-expanded`).
    * *Keyboard*: Right arrow expands, Left arrow collapses, Up/Down navigates nodes.

---

### Category 3: Feedback, Status & Overlays
25. **`ModalSheet`** [Completed]
    * *Features*: Centered desktop dialog, bottom slide-up sheet on mobile, WAI-ARIA focus trap, background inert, Escape dismiss, 200ms spring motion.

26. **`Popover`** [Priority: High]
    * *Purpose*: Floating contextual menus, item quick dossiers, and tool pickers.
    * *Features*: HTML Popover API (`popover="auto"`), top-layer rendering without z-index conflicts, automatic light-dismiss, scroll chaining containment (`overscroll-behavior: contain`).

27. **`Tooltip`** [Priority: High]
    * *Purpose*: Supplementary microcopy explanations on hover/focus.
    * *Semantics*: `role="tooltip"`, `aria-describedby` on trigger.
    * *Rules*: Never put vital info in tooltips; non-redundant text; dual mouse and keyboard focus support; `Escape` dismiss; directional arrow.

28. **`Drawer` / `SideSheet`** [Priority: Medium]
    * *Purpose*: Slide-out panel from left or right edge for filter sidebars and full entity inspection.
    * *Features*: Full viewport height (`100dvh`), slide transition (250ms), backdrop blur, focus trap, body scroll lock.

29. **`Toast` & `ToastViewport`** [Completed]
    * *Features*: Fixed overlay, adaptive word-count timing (2.5s to 10s), pause on hover/focus, max 3 items, collapsed duplicate triggers, polite live region.

30. **`Banner`** [Completed]
    * *Features*: Contextual alerts (`info`, `warning`, `error`, `success`), action slot, dismiss button.

31. **`Skeleton`** [Priority: High]
    * *Purpose*: Wireframe loading placeholders preventing CLS.
    * *Variants*: `Skeleton.Text` (single/multi-line), `Skeleton.Circle` (avatar/icon), `Skeleton.Rect` (card/image).
    * *Features*: Pulse shimmer animation, `@media (prefers-reduced-motion)` static fallback, exact dimension matching.

32. **`ProgressBar` / `ProgressRing` / `Meter`** [Documented - Awaiting Build Phase]
    * *Purpose*: Character skill XP progress, stamina timers, dungeon run progress, capacity gauges.
    * *Specification*: See [docs/design/24-progress-bars-rings-meters.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/24-progress-bars-rings-meters.md).
    * *Semantics*: `role="progressbar"` for ongoing tasks/goals (XP, craft queue) vs `role="meter"` / `<meter>` for scalar capacity (stamina, health, inventory bag slots). Omit `aria-valuenow` for indeterminate.
    * *Performance*: GPU compositor `transform: scaleX(...)` with `transform-origin: left` for linear bars (never animate CSS `width`). Circular rings use SVG `stroke-dashoffset` rotated `-90deg`.
    * *Screen Readers*: Do not place live regions on ticking bars; announce milestones only (100% complete, critical low health).
    * *Visuals*: 3:1 graphical contrast against track. Rarity drop colors strictly prohibited on progress fills.

---

### Category 4: Navigation & Wayfinding
33. **`Breadcrumbs`** [Documented - Awaiting Build Phase]
    * *Purpose*: Hierarchical route location indication for deeply nested views (`/items/[id]`, `/bosses/[id]`, `/conquest/[region]`).
    * *Specification*: See [docs/design/25-breadcrumbs-hierarchy.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/25-breadcrumbs-hierarchy.md).
    * *Scope*: Prohibited on single-level top-level feature pages (e.g. no "Home > Weather").
    * *Semantics*: `<nav aria-label="Breadcrumb">`, `<ol>`, `<li>`. Current page item is plain text with `aria-current="page"` (never a clickable link).
    * *Separators*: Hidden from screen readers via CSS or `aria-hidden="true"` (never vocalized as "slash").
    * *Mobile*: Collapse long trails to single parent back link (>= 44px touch target) or ellipsis disclosure menu. Full title preserved in `title` attribute on truncate.

34. **`Pagination`** [Documented - Awaiting Build Phase]
    * *Purpose*: Table and catalog navigation across large datasets (`/items`, `/enemies`).
    * *Specification*: See [docs/design/26-pagination-data-browsing.md](file:///c:/Data/Programming Projects/Zenith Companion/docs/design/26-pagination-data-browsing.md).
    * *Architecture*: Preferred over infinite scroll (preserves orientation, back-button history, and accessible page footers).
    * *Semantics*: `<nav aria-label="Pagination">`, `<ol>`, `<li>`, native button triggers with `aria-current="page"`, descriptive "Previous page" and "Next page" labels. First/last pages disable controls rather than hiding them.
    * *Truncation*: Stable-width single/double ellipsis (`1 … 4 5 6 … 28`) to eliminate layout shift across page changes.
    * *State & URL*: Deep-link to URL (`?page=3`); reset to page 1 on filter/search/sort; clamp out-of-bounds page requests; sorting/filtering must run against entire dataset in memory.
    * *Feedback & Ergonomics*: Polite live region announces range ("Showing 51–100 of 1,355 items"); focus shifts to table/list header on page change; page-size selector (25/50/100); mobile collapses to compact indicator (`[ Prev ] Page 3 of 28 [ Next ]`) with >=44px touch targets.

35. **`BottomDock`** [Priority: High]
    * *Purpose*: Persistent mobile thumb-zone navigation.
    * *Features*: Fixed bottom bar, 3 to 5 labeled icon tabs, active pill highlight, safe-area-inset padding, backdrop blur.

36. **`CommandPalette` / `SearchModal`** [Priority: High]
    * *Purpose*: Global `Ctrl+K` quick navigation and entity search.
    * *Features*: Input field, grouped results (Routes, Items, Enemies, Bosses), arrow key navigation, keyboard hotkey execution.

37. **`ContextMenu`** [Priority: Low]
    * *Purpose*: Right-click actions on items (e.g. Set Custom Price, Add to Craft Queue, View in Wiki).
    * *Semantics*: `role="menu"`, `role="menuitem"`.
    * *Features*: Pointer position anchoring, keyboard arrow navigation, Escape dismiss.

38. **`EmptyState`** [Completed]
    * *Features*: Bespoke iconography, plain gamer cause & remedy copy, single primary action limit, live region status updates.
