# Zenith Design Standards: Keyboard, Focus & Touch Targets

This document establishes the accessibility requirements for keyboard navigation, focus management, visible focus indicators, and touch ergonomics across Zenith Companion.

## 1. Focus Visible Standards (WCAG 2.2 SC 2.4.7 & SC 1.4.11)
* **Never Suppress Outlines Without Replacement**: Stripping focus rings with `outline: none` or `outline: 0` without an explicit replacement breaks keyboard access for sighted users and is an immediate verification failure.
* **The `:focus-visible` Standard**: Style focus indicators using the `:focus-visible` pseudo-class rather than generic `:focus`. This displays prominent rings during keyboard navigation (Tab/Arrows) while avoiding intrusive rings during mouse clicks.
* **3:1 Non-Text Contrast**: Under WCAG 2.2 SC 1.4.11, custom focus rings must maintain at least a 3:1 contrast ratio against the element's background and adjacent surfaces.
  * In Zenith: Use `outline: 2px solid var(--border-focus, #38bdf8); outline-offset: 2px; border-radius: inherit;`.
* **Focus Not Obscured (WCAG 2.2 SC 2.4.11)**: When an item receives focus, it must not be hidden behind sticky headers, floating banners, or bottom docks. Ensure `scroll-padding-top` and `scroll-padding-bottom` account for all fixed chrome elements.

## 2. Touch Target Ergonomics (WCAG 2.2 SC 2.5.8 & SC 2.5.5)
* **Mobile Absolute Minimum**: Every interactive element (buttons, links, icon toggles, combobox items, segmented pills, form inputs, modal close buttons) must have a touch target of at least **44x44 CSS pixels** on mobile viewports (<768px).
* **Pointer Baseline**: On desktop viewports, small buttons must meet WCAG 2.2 SC 2.5.8 minimums of 24x24px, with non-overlapping spacing bounding circles.
* **Touch Target Padding Technique**: For visually compact icons (e.g. 16px or 18px glyphs), expand the interactive target using transparent padding or negative pseudo-element margins:
  ```css
  .iconButton {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  ```
* **Separation of Destructive Controls**: Destructive actions (Reset, Clear, Delete) must have at least 12px of spatial separation from primary submit actions to prevent fat-finger misclicks.

## 3. Keyboard Navigation Conventions (WAI-ARIA APG)
* **Tab Sequence vs. Arrow Key Sequence**:
  * `Tab` and `Shift + Tab` move focus between independent components on the page (from search bar, to filter toolbar, to table, to pagination).
  * `Arrow Keys` (Left/Right or Up/Down) move focus **inside** composite widgets that contain multiple related options (Radio Groups, Segmented Controls, Tab Lists, Menus, Toolbars, and Combobox listboxes).
* **Roving Tabindex Architecture**:
  Composite widgets must implement roving tabindex so only one child option resides in the global page Tab ring:
  * Selected or active option: `tabIndex={0}`.
  * Unselected sibling options: `tabIndex={-1}`.
  * When arrow keys are pressed, focus shifts to the sibling, updating its `tabIndex` to `0` and returning the previous item to `-1`.
* **Standard Key Bindings**:
  * `Enter`: Commits selections, activates buttons, and submits form fields.
  * `Space`: Toggles checkboxes, radio options, and expands disclosure accordions.
  * `Escape`: Dismisses open modals, drawers, popovers, tooltips, and combobox dropdowns.
  * `Home` / `End`: Jumps to the first or last item in a composite list.

## 4. Keyboard Shortcut Badges (`Kbd.tsx`) & Character Key Compliance (WCAG 2.2 SC 2.1.4)
Keyboard shortcut indicators and accelerator bindings must implement these web standards:
* **Native HTML Semantic Element (`<kbd>`)**:
  * Always use the native `<kbd>` element, styled with monospace font, `--bg-panel` fill, `--border-subtle` border, and rounded corners.
  * Nest `<kbd>` elements to denote key combinations: `<kbd><kbd>Ctrl</kbd>+<kbd>K</kbd></kbd>` or `<kbd><kbd>⌘</kbd><kbd>K</kbd></kbd>`.
* **Shortcut Attribution (`aria-keyshortcuts`)**:
  * Put `aria-keyshortcuts` on the actual interactive control that responds to the shortcut (the search trigger button, input, or command item), NOT on the visual `<kbd>` badge itself.
  * Attribute format is space-separated with modifier keys first: `aria-keyshortcuts="Control+K Meta+K"`.
* **Character Key Shortcuts (WCAG 2.2 SC 2.1.4 Level A)**:
  * Shortcuts implemented using single printable characters (such as `1` through `9` for profile switching, or single letters `M`, `B`, `D` for page navigation) can be accidentally triggered by voice input software (dictation) or typing slip-ups.
  * Under WCAG 2.2 SC 2.1.4, any single-character shortcut must satisfy at least one of these criteria:
    1. **Turn off**: The player can disable character-only shortcuts via a toggle in `/settings`.
    2. **Remap**: The shortcut requires a non-printable modifier key (e.g. `Alt+1` or `Ctrl+1`).
    3. **Active only on focus**: The shortcut only triggers when that specific component or container has focus, never globally across the page.
