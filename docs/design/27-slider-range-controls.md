# Zenith Design Standards: Sliders & Range Controls

This document establishes the architectural, accessibility, interaction, and performance standards for Sliders and Multi-Thumb Range controls across Zenith Companion.

## 1. Architectural Role & Suitability

Sliders allow players to explore and adjust numeric parameters within a known bounded range.

### When to Use Sliders
* **Approximate Adjustments**: Setting level band filters (e.g. Level 1 to 100), time limits, and budget thresholds.
* **Exploratory Tuning**: Observing responsive changes as values shift (e.g. combat stat simulation).

### When Not to Use Sliders (NN/g Rules of Thumb)
* **Exact Numeric Precision**: Selecting an exact value (e.g. specific gold amount or exact item quantity) is difficult via dragging, particularly on touch screens.
* **Large Unbounded Ranges**: Sliders spanning thousands of discrete integer steps lose granularity; a single pixel movement jumps dozens of units.

---

## 2. WCAG 2.2 SC 2.5.7: Dragging Movements (Level AA)

Under WCAG 2.2, any control requiring a dragging movement must provide an alternative single-pointer or keyboard operation.

### Dual-Input Architecture Requirement
1. **Paired NumberInput**: Every slider must be paired with an adjacent `NumberInput` displaying the exact value. Users who cannot perform precise dragging can tap the number field and type their desired number.
2. **Track-Click Snapping**: Clicking or tapping anywhere along the slider track must immediately reposition the thumb to that value, satisfying single-pointer requirements.

---

## 3. Semantic ARIA Specifications (W3C APG)

### Single-Thumb Slider

```html
<div class="slider-field">
  <div class="slider-field__header">
    <label id="level-slider-label" class="slider-field__label">Target Level</label>
    <span class="slider-field__value tabular-nums">Level 45</span>
  </div>

  <div class="slider-track" style="touch-action: pan-y">
    <div class="slider-track__fill" style="width: 45%"></div>
    <div
      role="slider"
      tabindex="0"
      aria-labelledby="level-slider-label"
      aria-valuenow="45"
      aria-valuemin="1"
      aria-valuemax="100"
      aria-valuetext="Level 45"
      class="slider-thumb"
      style="left: 45%"
    ></div>
  </div>
</div>
```

### Multi-Thumb Range Slider (Min & Max Range)

When filtering by a span (e.g. Minimum and Maximum Combat Level):

```html
<fieldset class="slider-range-group">
  <legend class="slider-range-group__legend">Enemy Level Range</legend>

  <div class="slider-track" style="touch-action: pan-y">
    <div class="slider-track__fill" style="left: 20%; width: 60%"></div>
    
    <!-- Lower Bound Thumb -->
    <div
      role="slider"
      tabindex="0"
      aria-label="Minimum combat level"
      aria-valuenow="20"
      aria-valuemin="1"
      aria-valuemax="80"
      aria-valuetext="Level 20"
      class="slider-thumb slider-thumb--min"
      style="left: 20%"
    ></div>

    <!-- Upper Bound Thumb -->
    <div
      role="slider"
      tabindex="0"
      aria-label="Maximum combat level"
      aria-valuenow="80"
      aria-valuemin="20"
      aria-valuemax="100"
      aria-valuetext="Level 80"
      class="slider-thumb slider-thumb--max"
      style="left: 80%"
    ></div>
  </div>
</fieldset>
```

#### Dependent Range Boundaries
* The minimum thumb's `aria-valuemax` dynamically caps at the current value of the maximum thumb.
* The maximum thumb's `aria-valuemin` dynamically floors at the current value of the minimum thumb.
* Thumbs must never cross: `minThumb.value <= maxThumb.value`.

---

## 4. Keyboard Interaction Matrix (W3C APG)

Each slider thumb is a distinct focusable element in the tab sequence (`tabindex="0"`):

* **ArrowRight / ArrowUp**: Increments the value by one step.
* **ArrowLeft / ArrowDown**: Decrements the value by one step.
* **PageUp**: Increments the value by a larger step (default 10x step).
* **PageDown**: Decrements the value by a larger step (default 10x step).
* **Home**: Snaps to the minimum allowable value.
* **End**: Snaps to the maximum allowable value.

---

## 5. Touch Ergonomics & Label Visibility (NN/g Guidance)

### Label Placement Above the Track
Never place slider value labels below the track. On touchscreens, the player's physical thumb obscures the area directly beneath the track while dragging. Labels and live readouts must sit **above or beside** the slider track.

### Touch Action & Edge Hitboxes
* Apply `touch-action: pan-y` on the track container. This prevents horizontal thumb dragging from conflicting with vertical browser page scrolling.
* Visual thumb size can be 20px, but its interactive hit target must extend to at least 44x44px (`--touch-target-min`) on touch devices using transparent padding or pseudo-elements.

---

## 6. Performance & Event Throttling

Dragging fires rapid mousemove and touchmove events (up to 120Hz).

### Throttling Discipline
* **Instant Visual Feedback**: Update the visual thumb position, track fill, and paired NumberInput synchronously on every frame.
* **Deferred Heavy Computation**: Recalculating deep dependency trees (alchemy EV paths, combat Monte Carlo iterations, or sorting 1,355 items) on every pixel freezes the main thread.
  - Wrap expensive calculations in `useDeferredValue` or React transitions.
  - Or trigger deep computation only on release (`onPointerUp` / `onChangeEnd`).

---

## 7. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Track Height | `height` | `6px` |
| Track Background | `background-color` | `var(--bg-panel)` (`#1a2236`) |
| Track Border Radius | `border-radius` | `9999px` |
| Active Fill | `background-color` | `var(--accent-primary)` (`#38bdf8`) |
| Thumb Width & Height | `width`, `height` | `20px`, `20px` |
| Thumb Fill | `background-color` | `var(--bg-base)` (`#0b0f19`) |
| Thumb Border | `border` | `2px solid var(--text-main)` (`#f8fafc`) |
| Thumb Shadow | `box-shadow` | `0 2px 6px rgba(0, 0, 0, 0.4)` |
| Thumb Hover / Active | `transform` | `scale(1.15)` with 100ms spring |
| Focus Ring | `outline` | `2px solid var(--border-focus)`, offset 2px |
