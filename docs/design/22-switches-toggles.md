# Zenith Design Standards: Switches & Toggles

This document establishes the architecture, interaction models, keyboard accessibility, and visual guidelines for Switches and Toggles across Zenith Companion.

## 1. Definition & Operational Paradigm
A switch is a digital on/off mechanism that lets users choose between two mutually exclusive binary states.

### The Immediate Effect Rule (NN/g, Apple HIG, Material Design 3)
* **Immediate Result**: A switch must take **immediate physical effect** upon toggling. It represents an instantaneous system preference (e.g. Dark Mode, Audio Cues, Haptic Feedback, Auto-Refresh).
* **No Save / Submit Buttons**: A switch must **never** require a "Save", "Submit", or "Apply" button to take effect. Requiring confirmation contradicts the real-world mental model of a physical wall switch. If a setting requires deferred submission, a **Checkbox** must be used instead.
* **Destructive Actions Prohibited**: Destructive or irreversible operations (e.g. "Reset Settings", "Wipe Cache", "Delete Profile") must **never** be implemented as switches. They are action Buttons requiring a confirmation modal.

---

## 2. Semantic Implementation
Switches can be implemented using native semantic HTML or the Radix UI Switch primitive (`@radix-ui/react-switch`).

### ARIA Semantics
* Element role: `role="switch"`.
* State indication:
  * When on: `aria-checked="true"`.
  * When off: `aria-checked="false"`.
  * If constructed with `<input type="checkbox" role="switch">`, use the native `.checked` boolean property.

### Radix UI Switch Anatomy
```tsx
import * as SwitchPrimitive from "@radix-ui/react-switch";
import styles from "./Switch.module.css";

export function Switch({ id, label, description, checked, onCheckedChange, disabled }) {
  return (
    <div className={styles.row}>
      <div className={styles.labelGroup}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={styles.root}
      >
        <SwitchPrimitive.Thumb className={styles.thumb} />
      </SwitchPrimitive.Root>
    </div>
  );
}
```

---

## 3. Static Label Rule (W3C APG & NN/g Critical Standard)
A severe usability defect is dynamically changing the label of a switch when toggled.

### The Invariance Rule
* **The label text MUST remain constant regardless of state**.
  * ✅ Correct: Label is permanently "Audio cues". The switch state conveys whether it is on or off.
  * ❌ Prohibited: Label changes between "Enable audio cues" and "Disable audio cues".
* **Reasoning**: Changing the label creates state ambiguity for screen reader users (e.g. hearing "Disable audio cues: on" leaves the user unsure whether sound is active or muted).
* **Non-Neutral Wording**: Labels must be clear and direct. Frontload the keyword: "Haptic feedback", "Auto-refresh". Avoid rhetorical questions like "Do you want sound?".
* **Test Formula**: Say the label aloud followed by "on" and "off" (e.g. "Audio cues: on", "Audio cues: off"). If the sentence is grammatically natural, the label is correct.

---

## 4. Visual Signifiers & Non-Color Cues (WCAG 2.2 SC 1.4.1 & SC 1.4.11)
Relying on color alone to indicate whether a switch is active violates accessibility standards and fails for users with color vision deficiencies.

### Triad of Visual Cues
Every switch must communicate its state through three simultaneous physical signifiers:
1. **Position**: OFF positions the thumb on the left; ON translates the thumb to the right.
2. **Color Contrast (WCAG 1.4.11 Non-Text Contrast)**:
   * Both the track and the thumb must maintain at least **3:1 contrast** against the surrounding card surface in both the OFF and ON states.
   * In the OFF state, use a distinct visible border (`--border-subtle`) so the track does not blend into `--bg-card`.
   * In the ON state, use a prominent fill (e.g. frost white `#f8fafc` or theme accent) that clearly contrasts against dark surfaces.
3. **Internal Glyph / Detail (Apple HIG & Material Design 3)**:
   * Incorporate an inner state glyph or geometric differentiation:
     * When ON: The thumb displays a subtle checkmark or vertical line (`|`).
     * When OFF: The thumb is plain or displays a subtle ring/dot (`○`).

---

## 5. Keyboard Navigation & Focus Discipline
* **Focusable**: The switch receives keyboard focus via standard `Tab` order.
* **Keyboard Activation**:
  * `Space`: Toggles the switch between on and off.
  * `Enter` (optional/standard in web apps): Toggles the switch.
* **Focus Ring**: Must display the standardized 2px `--border-focus` ring with a 2px offset. Focus must never be suppressed without an explicit replacement.

---

## 6. Hardware-Accelerated Motion & Accessibility
* **CSS Transform Only**: The sliding animation of the thumb must animate strictly using `transform: translateX(...)` and `opacity`. Never animate layout properties (`left`, `margin`, `width`).
* **Snappy Spring Curves**: Duration between **100ms and 150ms** using `cubic-bezier(0.16, 1, 0.3, 1)`. Slower animations feel sluggish on rapid toggles.
* **Reduced Motion**: Honor `@media (prefers-reduced-motion: reduce)` by setting `transition: none`. State changes must occur instantaneously for users sensitive to motion.

---

## 7. Asynchronous Toggles & Failure Recovery
When toggling a switch triggers an asynchronous background network request (e.g. Cloudflare Worker sync, profile cloud backup):
1. **Pending State**: Display a subtle inline spinner inside the thumb and set `aria-busy="true"` to prevent duplicate taps.
2. **Failure Recovery**: If the network request fails or times out:
   * **Revert the switch state** back to its previous position.
   * Announce an actionable error toast at z-index 11000 ("Sync failed. Check your network connection.").
   * Never leave the switch in an optimistic "on" state when the underlying backend failed to persist the change.
