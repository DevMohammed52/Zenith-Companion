# Zenith Design Standards: Checkboxes & Selection

This document establishes the architecture, interaction models, keyboard accessibility, and visual guidelines for Checkboxes across Zenith Companion.

## 1. Core Principles & Widget Boundaries
Checkboxes allow users to select multiple options from a set of choices, toggle a single binary setting that requires explicit confirmation, or control multi-tier nested selections.

### Checkbox vs. Radio Button vs. Switch (NN/g Jakob Nielsen)
* **Checkbox**:
  * Used when choices are independent: users may select zero, one, or several options.
  * Used for single opt-in / opt-out choices that apply on form submit or batch filter execution.
  * Changes do not need to take immediate permanent effect (can await a filter submit or dialog confirm).
* **Radio Button**:
  * Used when two or more choices are mutually exclusive: selecting one option automatically deselects all others.
  * Always requires a default selection.
* **Switch / Toggle**:
  * Used exclusively for preferences that take **immediate physical effect** (e.g. Dark Mode, Audio Cues).

---

## 2. Semantic HTML & Headless Architecture
To prevent accessibility and focus defects, custom checkboxes must either restyle the native HTML `<input type="checkbox">` or consume Radix UI's accessible Checkbox primitive (`@radix-ui/react-checkbox`).

### Standard HTML Anatomy
```html
<div class="checkbox-field">
  <input
    type="checkbox"
    id="filter-epic"
    name="rarity"
    value="epic"
    class="checkbox-input"
  />
  <label for="filter-epic" class="checkbox-label">
    <span class="checkbox-box" aria-hidden="true">
      <svg class="checkbox-check" viewBox="0 0 16 16">...</svg>
    </span>
    <span class="checkbox-text">Epic Rarity</span>
  </label>
</div>
```

### Radix UI Primitive Pattern
When building custom interactive surfaces requiring cross-browser styling:
```tsx
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

export function Checkbox({ checked, onCheckedChange, id, label, disabled, ...props }) {
  return (
    <div className={styles.container}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={styles.root}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={styles.indicator}>
          {checked === "indeterminate" ? (
            <Minus className={styles.icon} size={12} strokeWidth={3} />
          ) : (
            <Check className={styles.icon} size={12} strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
    </div>
  );
}
```

---

## 3. Tri-State / Mixed-State Architecture (W3C WAI-ARIA)
WAI-ARIA supports tri-state checkboxes to manage hierarchical groups (e.g. select all item qualities, select all enemy locations).

### The Three States
1. **Unchecked (`false`)**: No child options in the group are selected.
2. **Mixed / Indeterminate (`"indeterminate"` or `mixed`)**: A subset (some, but not all) of child options are selected.
3. **Checked (`true`)**: All child options in the group are selected.

### Critical DOM Distinction: Property vs. Attribute
* In standard HTML, `indeterminate` is an **IDL DOM property** set via JavaScript (`element.indeterminate = true`), **never an HTML markup attribute**. Writing `<input type="checkbox" indeterminate />` in HTML has no effect.
* In ARIA semantics, the mixed state is communicated via `aria-checked="mixed"`.
* Visual representation: An indeterminate checkbox must display a centered horizontal dash/minus glyph (`Minus` icon), distinctly different from a checkmark.

### Parent-Child Interaction Cycle
1. Activating a mixed / indeterminate parent checkbox immediately transitions it to **checked** (`true`) and sets **all children to checked**.
2. Activating a checked parent checkbox transitions it to **unchecked** (`false`) and unchecks **all children**.
3. Individual child checkbox toggles immediately recalculate the parent's state based on child counts.

---

## 4. Keyboard Navigation & Focus Discipline
All checkboxes must adhere to the standard W3C APG Checkbox keyboard contract:

* **Tab / Shift+Tab**: Moves keyboard focus onto and off the checkbox. Each individual checkbox in a list receives its own tab stop (unlike radio groups which use roving tabindex).
* **Space**: When focused, pressing `Space` toggles the checkbox between checked and unchecked (or cycles through mixed state).
* **Focus Indicator**: Focus must be indicated with a high-contrast 2px ring (`--border-focus`) with a 2px offset.
* **Operating System High Contrast Mode (Forced Colors)**:
  * Do not use transparent borders to indicate unfocused states; transparent borders become visible solid boxes in Windows High Contrast mode.
  * Use zero border width (`border: 0 solid currentColor`) adjusting to `2px` on focus, or use `outline`.
  * Inline SVG checkmarks must use `currentColor` and `forced-color-adjust: auto` to inherit the high-contrast text color.

---

## 5. Hitbox, Target Size & Mobile Ergonomics (WCAG 2.2 SC 2.5.8)
Small hit targets cause misclicks and user frustration on mobile devices.

### Rules
* **Clickable Label Row (Fitts's Law)**: The entire horizontal row—the checkbox box, the text label, and the padding between them—must be clickable. Users should never have to precisely pinpoint the small 16px square.
* **Minimum Target Size (WCAG 2.2 SC 2.5.8 Level AA)**: Every interactive target must provide at least a **24x24px bounding box**.
* **Zenith Mobile Target Standard**: On mobile touch viewports (`<768px`), the row must provide a minimum touch height of **44px** (`min-height: 44px; display: flex; align-items: center;`).

---

## 6. Grouping & Live Region Announcement
### Semantic Fieldset Grouping
When presenting a logical list of checkboxes (e.g. Level Bands, Weather filters, Equipment slots):
* Enclose the group in a `<fieldset>` element with a `<legend>` header.
* On custom wrapper elements, assign `role="group"` with `aria-labelledby="<header-id>"`.

### Result Count Announcements
When filter checkboxes apply immediately to an in-page catalog or data table (such as `/items` or `/enemies`):
* Do **not** move DOM focus away from the checkbox that the user just clicked.
* Announce the filtered outcome politely to assistive technologies via an offscreen live region:
  ```html
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    Filtered to 47 items matching selected qualities.
  </div>
  ```

---

## 7. Disabled States & Helper Copy
* **Inline Reason Requirement**: When a checkbox is disabled, always render inline helper copy directly below the label explaining the requirement (e.g. "Requires Combat Level 70").
* **Never Hide Reasons in Tooltips**: Disabled elements cannot receive pointer or keyboard focus reliably across browsers; hover tooltips on disabled controls are inaccessible to keyboard and mobile users.
* **Disabled Styling**: Reduce container opacity to 50% (`opacity: 0.5; cursor: not-allowed;`). Maintain at least 3:1 contrast for the label text against the card background.
