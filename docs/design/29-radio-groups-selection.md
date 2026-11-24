# Zenith Design Standards: RadioGroups & Mutually Exclusive Selection

This document establishes the architectural, accessibility, keyboard, and ergonomic standards for RadioGroup controls across Zenith Companion.

## 1. Architectural Scope & Selection Boundary

Radio buttons present a small set of mutually exclusive choices where players must select exactly one option.

### The Selection Boundary Decision Tree
* **Binary On/Off State**: Use `<Switch>` (`role="switch"`).
* **2 to 5 Mutually Exclusive Options**: Use `<RadioGroup>` (or `<SegmentedControl>` for horizontal toolbars). Radio groups allow players to compare all available choices at a glance without opening a dropdown.
* **More than 5 Options**: Use `<Select>` (`role="listbox"`) to conserve vertical screen space.
* **Multi-Selection (Zero, One, or Multiple choices)**: Use `<Checkbox>` (`role="checkbox"`).

---

## 2. Semantic ARIA & Native Foundation (W3C APG)

Radio groups must use semantic HTML form structures or WAI-ARIA `radiogroup` roles:

```html
<fieldset class="radio-group" aria-describedby="pricing-source-help">
  <legend class="radio-group__legend">Market Price Baseline</legend>
  
  <p id="pricing-source-help" class="radio-group__helper">
    Determines baseline values for alchemy and crafting profit calculations.
  </p>

  <div class="radio-group__options">
    <!-- Option 1 -->
    <label class="radio-option">
      <input
        type="radio"
        name="pricingSource"
        value="median"
        checked
        class="radio-option__input sr-only"
      />
      <span class="radio-option__control" aria-hidden="true">
        <span class="radio-option__dot"></span>
      </span>
      <div class="radio-option__content">
        <span class="radio-option__label">3-Day Median Price</span>
        <span class="radio-option__description">
          Filters price spikes and suppression manipulation (Recommended).
        </span>
      </div>
    </label>

    <!-- Option 2 -->
    <label class="radio-option">
      <input
        type="radio"
        name="pricingSource"
        value="recent"
        class="radio-option__input sr-only"
      />
      <span class="radio-option__control" aria-hidden="true">
        <span class="radio-option__dot"></span>
      </span>
      <div class="radio-option__content">
        <span class="radio-option__label">Lowest Active Listing</span>
        <span class="radio-option__description">
          Reflects immediate spot market conditions.
        </span>
      </div>
    </label>

    <!-- Option 3 (Disabled example) -->
    <label class="radio-option is-disabled">
      <input
        type="radio"
        name="pricingSource"
        value="custom"
        disabled
        class="radio-option__input sr-only"
      />
      <span class="radio-option__control" aria-hidden="true">
        <span class="radio-option__dot"></span>
      </span>
      <div class="radio-option__content">
        <span class="radio-option__label">Custom Valuation Matrix</span>
        <span class="radio-option__disabled-reason">
          Requires unlocked Merchant Guild license.
        </span>
      </div>
    </label>
  </div>
</fieldset>
```

### Critical Semantic Rules
1. **Shared Name Attribute**: All native inputs in a group must share an identical `name` attribute. The browser automatically enforces single-selection behavior.
2. **Accessible Grouping**: Wrap options in `<fieldset>` with `<legend>` (or `<div role="radiogroup" aria-labelledby="...">`).
3. **Card-Style Radios**: When building selectable cards, keep the real `<input type="radio">` in the DOM (accessible to screen readers and keyboard focus), styling the parent card via `:focus-within` and `:has(:checked)`. Never replace native inputs with unsemantic `div` elements.

---

## 3. Keyboard Navigation & Roving Tabindex

Radio groups implement a roving tabindex interaction model that differs fundamentally from checkboxes:

* **Tab Stop**: A RadioGroup constitutes **exactly one tab stop** in the page sequence.
  - Pressing `Tab` focuses the currently checked radio. If none is checked, focus lands on the first radio.
  - Pressing `Tab` again moves focus immediately out of the entire group to the next interactive control.
* **Arrow Navigation**:
  - `ArrowDown` / `ArrowRight`: Moves focus to the next radio, unchecks the previous radio, and immediately checks the newly focused radio.
  - `ArrowUp` / `ArrowLeft`: Moves focus to the previous radio, unchecks the previous radio, and checks the newly focused radio.
  - **Wrapping**: Pressing `ArrowDown` on the last option wraps to the first; pressing `ArrowUp` on the first wraps to the last.
* **Space**: Checks the focused radio if not already checked.

---

## 4. Non-Deselectability & Default Selection Rule

A standard radio button cannot be unchecked by clicking it a second time.

### Non-Deselectability Rules
1. **Always Preselect a Default**: Initialize every radio group with a sensible default option checked. Leaving radio groups unselected creates an ambiguous empty state.
2. **Explicit "None" Option**: If declining to pick any choice is a valid state, provide an explicit option labeled "None" or "Default", rather than leaving the group empty.

---

## 5. Non-Color Cues & Ergonomics

### Visual Indicators
* **Dual-Cue Feedback**: The selected state must never rely on color alone. Use a structural physical change: an outer ring surrounding an inner centered solid dot (`8px` diameter).
* **Hit Target Sizing**: The entire label row or card is interactive. Minimum vertical height is 24px on desktop, expanding to at least 44x44px (`--touch-target-min`) on mobile viewports.
* **Visible Focus Indicator**: Display a distinct `2px solid var(--border-focus)` ring with a 2px offset around the control or parent card on keyboard focus (`:focus-visible`).

### Disabled State Transparency
If an option is disabled, explain the reason directly in visible inline text beneath the label (e.g. "Requires Level 50"). Never hide the reason inside a mouse-only tooltip.

---

## 6. Execution Timing: Immediate vs. Deferred

* **Immediate Effect**: Apply changes instantly only for client-side display preferences (e.g. number formatting style, compact mode) whose effects are immediate and reversible.
* **Deferred Effect**: For game calculators, simulation runs, or server operations, commit the radio selection only when the user clicks a primary action button ("Calculate", "Save").

---

## 7. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Radio Circle Size | `width`, `height` | `18px`, `18px` |
| Radio Circle Border | `border` | `2px solid var(--border-strong)` (`#334155`) |
| Radio Circle Background | `background-color` | `var(--bg-base)` (`#0b0f19`) |
| Checked Circle Border | `border-color` | `var(--accent-primary)` (`#38bdf8`) |
| Inner Dot Size | `width`, `height` | `8px`, `8px` |
| Inner Dot Fill | `background-color` | `var(--accent-primary)` (`#38bdf8`) |
| Focus Ring | `outline` | `2px solid var(--border-focus)`, offset 2px |
| Label Text | `color` | `var(--text-main)` (`#f8fafc`) |
| Helper / Description | `color` | `var(--text-muted)` (`#94a3b8`) |
| Disabled Opacity | `opacity`, `cursor` | `0.45`, `not-allowed` |
