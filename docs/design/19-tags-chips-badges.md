# Zenith Design Standards: Tags, Chips & Badges

This document establishes the architecture, interaction models, keyboard accessibility, and visual guidelines for tags, chips, and badges across Zenith Companion.

## 1. Architectural Taxonomy: Badges vs. Filter Chips vs. Input Chips
A critical usability defect identified in design system research (Material Design 3, Carbon Design System, React Aria) is collapsing badges, filter pills, and removable tokens into a single generic component. Zenith strictly distinguishes three distinct functional classes:

### A. Status Badges (Read-Only)
* **Purpose**: Pure metadata display for item rarity, equipment tier, combat danger, or status effects.
* **Interactivity**: Non-interactive. Non-focusable (`tabindex` omitted).
* **Affordance**: Must NOT look clickable (no hover lift, no pointer cursor, no button styling).
* **Semantics**: Rendered as semantic `<span>` with text content.

### B. Filter Chips (Selectable / Toggleable)
* **Purpose**: Toggleable pills that turn a single filter attribute on or off (e.g. rarity filter, weather preference, level band).
* **Interactivity**: Fully interactive button or listbox option.
* **Affordance**: Capsule or rounded rectangle with clear resting, hover, and pressed states.
* **Semantics**:
  * Standalone toggle: `<button type="button" aria-pressed="true|false">`.
  * Within a multi-choice group: `role="option"` with `aria-selected="true|false"` inside a container with `role="listbox"`.
* **Selection Cue (Non-Color Rule)**: Active selection MUST NEVER rely on color alone. For rarity chips (e.g. Standard, Refined, Premium, Epic, Legendary), the rarity color is semantic metadata, NOT selection state. Selected filter chips must feature a physical checkmark icon (`Check` size 13), distinct filled background, and bold text weight.

### C. Input Chips (Dismissible / Removable)
* **Purpose**: Represents an active applied parameter or keyword that the player can dismiss (e.g. active filter chips strip in `/enemies` or `/items`).
* **Interactivity**: Dismissible via an explicit remove action.
* **Keyboard Removal**: Pressing `Backspace` or `Delete` when focused removes the chip.
* **Focus Retention**: Upon chip removal, focus MUST shift immediately to the next sibling chip, previous sibling chip, or the search input. Focus must NEVER jump to the top of the DOM window.

---

## 2. Carbon Design System & Material 3 Guidelines

### Formatting & Visual Structure
* **Geometry**: Capsule (border-radius: 9999px) or rounded rectangle (border-radius: 6px).
* **Borders & Elevation**: Resting chips use elevation 0 with a subtle border stroke (`--border-subtle`).
* **Content Sequence**: Leading icon/avatar -> Text label -> Numerical count badge -> Trailing dismiss button.

### Prohibitions
* Never use chips as external navigation links that launch new tabs or navigate away from the page.
* Never place multiple competing interactive actions inside a single chip (e.g. clicking the chip does action A while clicking an inner badge does action B).

---

## 3. Keyboard Navigation Matrix (React Aria TagGroup Pattern)

Tag groups and filter rails must implement roving focus or linear arrow navigation:
* `Left Arrow` / `Right Arrow`: Moves focus to previous or next chip within the group.
* `Home` / `End`: Moves focus to first or last chip.
* `Space`: Toggles selection state (`aria-pressed`).
* `Delete` or `Backspace`: Removes the focused input chip. Focus shifts to adjacent item.
* `Tab`: Moves focus out of the chip group to the next interactive page element.

---

## 4. Numerical Counts & Typography
* **Monospace Tabular Figures**: When chips display item counts (e.g. `Epic (24)`), numbers must use `font-variant-numeric: tabular-nums` or `var(--font-mono)` to prevent chip width jitter as counts fluctuate.
* **Accessible Announcement**: Screen readers must perceive both label and count as a unified accessible name (e.g. `aria-label="Epic rarity, 24 items"`).

---

## 5. Touch Target Sizing (WCAG 2.2 SC 2.5.8 & SC 2.5.5)
* **Dismiss Button Hitbox**: The trailing dismiss button ("x") must have a clickable target of at least 24x24 CSS pixels per WCAG 2.2 SC 2.5.8, even when rendering a compact 12px or 14px icon.
* **Mobile Touch Ergonomics**: On touch viewports (< 768px), interactive filter chips must achieve at least 44x44px target boundaries or maintain 8px spacing clearance to eliminate mistaps.
* **Dismiss Labeling**: The dismiss button requires an explicit accessible name e.g. `aria-label="Remove Epic filter"`, never a generic "Close".
* **Responsive Wrapping**: Chip groups must wrap onto multiple rows on small screens (`flex-wrap: wrap`) with an 8px grid gap. Only deliberate filter toolbars may use horizontal scrolling, in which case edge fade gradients are required.
