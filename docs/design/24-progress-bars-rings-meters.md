# Zenith Design Standards: ProgressBars, ProgressRings & Meters

This document establishes the architectural, semantic, accessibility, and visual guidelines for progress indicators and scalar gauges across Zenith Companion.

## 1. Architectural Roles: ProgressBar vs. Meter vs. Spinner

Progress indicators communicate the status of an ongoing operation or the magnitude of a bounded resource. Selecting the correct semantic role is essential for accessibility.

### The Three Indicator Categories
1. **ProgressBar (`role="progressbar"`)**:
   - Represents progress toward completing an active operation, task, or goal.
   - Examples: XP earned toward the next character level, crafting queue completion, backup export progress, data refresh.
2. **Meter (`role="meter"` or `<meter>`)**:
   - Represents a scalar measurement within a known fixed range or fractional capacity.
   - It is a static gauge of current quantity, not an ongoing process.
   - Examples: Stamina capacity (e.g. 74/100), Player Health / Mana, inventory bag slots used (e.g. 42/50), guild territory influence percentage.
3. **Spinner / Activity Indicator**:
   - Indicates an indeterminate operation of unknown duration.
   - Implemented as a CSS animation inside a `<div role="status">`, rather than a progress bar with missing values.

---

## 2. Semantic ARIA Specifications

### ProgressBar Pattern (MDN & W3C APG)

```html
<div class="progress-field" id="xp-progress">
  <div class="progress-field__header">
    <span id="xp-label" class="progress-field__label">Alchemy XP</span>
    <span class="progress-field__value tabular-nums">64%</span>
  </div>
  
  <div
    role="progressbar"
    aria-labelledby="xp-label"
    aria-valuenow="64"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuetext="Level 48: 64% to Level 49"
    class="progress-bar"
  >
    <div class="progress-bar__track">
      <div class="progress-bar__fill" style="transform: scaleX(0.64)"></div>
    </div>
  </div>
</div>
```

#### Determinant Properties
* `aria-valuenow`: Decimal or integer representing current progress.
* `aria-valuemin`: Lower boundary (default `0`).
* `aria-valuemax`: Upper boundary (default `100` or target count).
* `aria-valuetext`: Expressive human-readable string when the bare percentage does not tell the full story (e.g. "64% toward Level 49", "3 of 5 batches completed").
* `aria-labelledby` or `aria-label`: Identifies what is progressing.

#### Indeterminate Progress
When progress cannot be calculated (e.g. awaiting an API response of uncertain size), omit `aria-valuenow`. The visual fill displays a continuous sliding or sweeping gradient.

---

### Meter Pattern (W3C APG & HTML5)

For capacity and resource gauges, use the native HTML5 `<meter>` element or `role="meter"`:

```html
<div class="meter-field">
  <label for="stamina-meter" class="meter-field__label">Stamina</label>
  <div class="meter-field__readout tabular-nums">85 / 100</div>
  
  <meter
    id="stamina-meter"
    min="0"
    max="100"
    low="20"
    high="80"
    optimum="100"
    value="85"
    class="zenith-meter"
  >
    85 of 100 Stamina
  </meter>
</div>
```

If custom markup is required for complex gradients or segmented ticks:
```html
<div
  role="meter"
  aria-labelledby="stamina-label"
  aria-valuenow="85"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuetext="85 of 100 Stamina"
  class="custom-meter"
>
  <div class="custom-meter__track">
    <div class="custom-meter__fill" style="transform: scaleX(0.85)"></div>
  </div>
</div>
```

---

## 3. Form Factor: Linear Bars vs. Circular Rings

### Linear Progress Bars
* **Best Used For**: Tables, list items, card footers, and widescreen dashboards.
* **Perceptual Superiority**: Linear length is perceived more accurately by the human eye than angles or arc lengths (Cleveland-McGill / NN/g).
* **Performance Rule**: Always animate `transform: scaleX(...)` with `transform-origin: left` instead of animating CSS `width`. Animating `width` triggers browser layout reflow on every frame; `transform` runs strictly on the GPU compositor thread.

### Circular ProgressRings
* **Best Used For**: Compact standalone indicators, action button cooldowns, or summary rings in avatar headers.
* **SVG Architecture**:
  - Place `role="progressbar"` or `role="meter"` and all ARIA attributes on the outer wrapper `<div>`.
  - Mark internal SVG nodes (`<svg>`, `<circle>`) with `aria-hidden="true"`.
  - Calculate stroke geometry via SVG radius: `circumference = 2 * Math.PI * radius`.
  - Set `stroke-dasharray="circumference"` and calculate `stroke-dashoffset = circumference * (1 - progress)`.
  - Rotate the SVG by `-90deg` so progress fills clockwise starting at the 12 o'clock top position.
  - Position text readouts centered over the ring using CSS flex or absolute positioning.

---

## 4. Screen Reader Announcements & Cognitive Noise

A common accessibility mistake is placing `aria-live="polite"` on rapidly updating progress bars or boss timers.

### The Announcement Rule
* **Do NOT announce intermediate ticks**: Never place `aria-live` on a progress bar that updates continuously (e.g. countdown timers, stamina regeneration, combat ticks). Flooding the screen reader queue crashes synthesizers and destroys usability.
* **Announce Milestones Only**: Announce state changes through a dedicated off-screen live region only when:
  1. An operation completes (100% or finished).
  2. A critical threshold is reached (e.g. "Stamina fully restored", "Health below 20%").
  3. An operation encounters an error or cancellation.

---

## 5. Color Discipline & Contrast Standards

### Graphical Object Contrast (WCAG 2.2 SC 1.4.11)
* The active progress fill must maintain at least a **3:1 contrast ratio** against the unfilled track background.
* The unfilled track background must maintain a distinct visible border or at least 3:1 contrast against the parent container card (`--bg-card`).

### Color Assignment Discipline
Zenith reserves drop rarity colors strictly for items and equipment. Never apply item rarity colors (common, uncommon, rare, epic, legendary) to progress bars or meters.

* **Neutral / Level / XP Progress**: Frost slate or primary cyan tint (`--accent-primary` / `--text-main`).
* **Stamina / Energy**: Emerald green (`--accent-success`).
* **Health / Danger / Low Resource**: Crimson rose (`--accent-danger`).
* **Mana / Arcane Power**: Sapphire blue (`--accent-focus`).

---

## 6. Motion & Accessibility

* **Duration**: Progress fill transitions should be between `150ms` and `200ms` using an `ease-out` timing function. Slower animations lag behind real-time data; instantaneous jumps feel harsh.
* **Indeterminate Animation**: Indeterminate bars use an asymmetric sweeping pulse (e.g. 1.5s loop).
* **Reduced Motion (`prefers-reduced-motion: reduce`)**:
  - Disable transition animations. Progress fills immediately snap to their target value.
  - For indeterminate states, replace the sweeping motion with a subtle, non-distracting opacity pulse.

---

## 7. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Track Background | `background-color` | `rgba(255, 255, 255, 0.08)` or `var(--bg-panel)` |
| Track Height (Standard) | `height` | `6px` |
| Track Height (Compact) | `height` | `4px` |
| Track Height (Large/Primary) | `height` | `10px` |
| Track Border Radius | `border-radius` | `9999px` (fully rounded pill) |
| Standard Fill Color | `background-color` | `var(--accent-primary)` (`#38bdf8`) |
| Success / Stamina Fill | `background-color` | `var(--accent-success)` (`#4ade80`) |
| Danger / Health Fill | `background-color` | `var(--accent-danger)` (`#f87171`) |
| Label Text | `color` | `var(--text-muted)` (`#94a3b8`) |
| Value Text | `color` | `var(--text-main)` (`#f8fafc`) with `tabular-nums` |
