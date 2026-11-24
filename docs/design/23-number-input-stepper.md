# Zenith Design Standards: NumberInput & Stepper

This document establishes the architectural, accessibility, keyboard, and formatting standards for NumberInput and Stepper controls across Zenith Companion.

## 1. Architectural Role & HTML Input Pitfalls

Number inputs appear across Zenith Companion in quantity selectors, level threshold filters, market gold entry, crafting batch sliders, and combat stat simulation.

### The Pitfalls of Native `<input type="number">` (GOV.UK & MDN Research)
Native browser `<input type="number">` introduces severe usability bugs and inconsistent platform behaviors:
1. **Unintentional Scroll Wheel Mutation**: When focused, scrolling the mouse wheel alters the input value. Users scrolling down a form inadvertently change their numeric entry without noticing.
2. **Silent Character Discarding**: Browsers allow entry of characters like `e`, `+`, `-`, and `.`. If an invalid character is present, `input.value` returns an empty string `""`. React and application state cannot differentiate between a cleared input and an invalid string.
3. **Inconsistent Mobile Keyboards**: On iOS, `type="number"` shows a keyboard with punctuation. On Android, it may display a full telephone pad lacking a minus sign.
4. **Exponential Notation Formatting**: Large values (such as IdleMMO gold reserves exceeding millions) may spontaneously format into scientific notation (e.g. `1e7`).
5. **Screen Reader Inconsistencies**: Many assistive technologies misannounce or omit step increments in native number inputs.

### The Recommended Architecture
Following GOV.UK, React Aria, and Base UI standards, Zenith number fields use a controlled text input with specialized input modes:
* For integer inputs (gold, item counts, character levels):
  ```html
  <input type="text" inputmode="numeric" pattern="[0-9]*" />
  ```
* For decimal inputs (market margins, drop rates, tax percentages):
  ```html
  <input type="text" inputmode="decimal" />
  ```
* Format with `Intl.NumberFormat` on blur; display clean unformatted digits during active focus to allow straightforward editing.

---

## 2. Semantic ARIA Specifications (W3C APG Spinbutton)

A NumberInput component implements the W3C ARIA `spinbutton` pattern:

```html
<div class="number-field" role="group" aria-labelledby="quantity-label">
  <label id="quantity-label" class="number-field__label">Batch Quantity</label>
  
  <div class="number-field__controls">
    <button
      type="button"
      tabindex="-1"
      aria-hidden="true"
      class="number-field__stepper number-field__stepper--decrement"
      disabled
    >
      <svg aria-hidden="true"><!-- Minus icon --></svg>
    </button>
    
    <input
      type="text"
      role="spinbutton"
      id="batch-quantity"
      inputmode="numeric"
      aria-valuenow="1"
      aria-valuemin="1"
      aria-valuemax="99"
      aria-valuetext="1 item"
      value="1"
      autocomplete="off"
      spellcheck="false"
      class="number-field__input tabular-nums"
    />
    
    <button
      type="button"
      tabindex="-1"
      aria-hidden="true"
      class="number-field__stepper number-field__stepper--increment"
    >
      <svg aria-hidden="true"><!-- Plus icon --></svg>
    </button>
  </div>
</div>
```

### ARIA Properties
* `role="spinbutton"`: Placed directly on the text input.
* `aria-valuenow`: Current numeric value. Omit or leave unset if the field is empty or indeterminate.
* `aria-valuemin`: Minimum allowable number (e.g. 1 for crafting batches).
* `aria-valuemax`: Maximum allowable number (e.g. inventory stack cap or maximum gold).
* `aria-valuetext`: Optional human-readable description when the bare number lacks context (e.g. "1,500 Gold", "Level 45").
* `aria-labelledby` or `aria-label`: Mandatory accessible name.

---

## 3. Keyboard Navigation & Interaction Rules

The input element handles all keyboard navigation. Stepper buttons are excluded from the tab sequence (`tabindex="-1"`) to prevent double-tabbing through controls.

### Keyboard Interaction Matrix
* **ArrowUp**: Increases the value by one `step` (default `1`).
* **ArrowDown**: Decreases the value by one `step` (default `1`).
* **PageUp**: Increases the value by a larger step (typically `10 * step`).
* **PageDown**: Decreases the value by a larger step (typically `10 * step`).
* **Home**: Snaps to `min` (if defined).
* **End**: Snaps to `max` (if defined).
* **Enter**: Commits the current text, clamps to boundaries, formats the display.
* **Escape**: Reverts current input back to the last committed value.

### Mouse Wheel Prevention
Attach an explicit non-passive wheel event listener that calls `event.preventDefault()` when the input is focused, preventing accidental value modification while scrolling.

---

## 4. Input Editing & Boundary Clamping Discipline

A frequent UX flaw is eager clamping during text entry. Clamping while typing blocks users from normal edits.

### Non-Disruptive Editing Rules
1. **Never clamp during active typing**: If the minimum is 100 and the user wants to type 150, their first keystroke is "1". Immediate clamping would force "1" to "100", preventing the user from finishing the number.
2. **Allow intermediate empty state**: While the field is focused, users must be able to backspace until the input is completely empty. Never force a "0" or "1" onto an empty focused field.
3. **Clamp strictly on Blur or Enter**: When focus leaves the input (`onBlur`) or when the user presses `Enter`, parse the text string:
   - If empty and optional: leave empty or apply fallback default.
   - If below `min`: clamp to `min`.
   - If above `max`: clamp to `max`.
   - If non-numeric: revert to the prior valid value.
4. **Transparent Feedback**: If a value is clamped on blur, visually reflect the clamped value immediately and announce the adjustment if critical.

---

## 5. Stepper Ergonomics & Touch Geometry

Stepper buttons provide quick incremental adjustments for touch and pointer users.

### Stepper Button Guidelines
* **Exclusion from Tab Flow**: Stepper buttons are supplementary to the keyboard spinbutton. Give them `tabindex="-1"` and `aria-hidden="true"` so keyboard users tab directly to the input without hitting three tab stops per number field.
* **Touch Target Sizing**:
  - Desktop: Stepper buttons can be integrated into the input container with minimum 32px height.
  - Mobile: Stepper buttons must measure at least 44x44px (`--touch-target-min`). On compact screens, place steppers on opposite flanks (minus on left, plus on right) to prevent thumb misclicks.
* **Press-and-Hold Acceleration**: For high-range inputs, holding down a stepper button should trigger continuous stepping after a 400ms delay, accelerating every 50ms.
* **Disabled States**: When the value equals `min`, disable the decrement button (`disabled` attribute). When the value equals `max`, disable the increment button.

---

## 6. Formatting & Typography

Numbers must render with fixed-width glyphs to prevent layout jitter as digits change:

* **Tabular Figures**: Always apply `font-variant-numeric: tabular-nums` (Tailwind `tabular-nums`).
* **Alignment**: Numbers align to the right in data entry contexts, or align to the left when paired with an upfront currency/attribute icon.
* **Separators**: Thousands separators (commas in `en-US`, spaces in international locales) are displayed on blur using `Intl.NumberFormat`. When focused, remove commas to simplify cursor navigation.
* **Units & Adornments**: Currency labels (e.g. "g", "XP", "%") must be structural adornments placed inside the container, marked with `aria-hidden="true"`, rather than plain text typed into the input value.

---

## 7. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Container Background | `background-color` | `var(--bg-card)` (`#141b2d`) |
| Container Border | `border` | `1px solid var(--border-subtle)` |
| Hover Border | `border-color` | `var(--border-strong)` |
| Focus Ring | `outline` | `2px solid var(--border-focus)`, offset 2px |
| Text Color | `color` | `var(--text-main)` (`#f8fafc`) |
| Stepper Button Fill | `background-color` | `var(--bg-panel)` (`#1a2236`) |
| Stepper Button Hover | `background-color` | `var(--bg-card-hover)` (`#222c44`) |
| Stepper Button Active | `transform` | `scale(0.95)` |
| Disabled Stepper | `opacity`, `cursor` | `0.4`, `not-allowed` |
| Error State | `border-color` | `var(--accent-danger)` (`#f87171`) |
