# Zenith Design Standards: Scrollbar Styling, Containment & Performance

This document governs standard CSS scrollbar properties, accessibility contrast, scroll chaining prevention, and smooth scrolling constraints across Zenith Companion.

## 1. Modern CSS Properties & Dark Theme Alignment
* **Standard Properties First**: Use standard `scrollbar-width` and `scrollbar-color` first:
  ```css
  scrollbar-width: thin;
  scrollbar-color: var(--border-medium, rgba(255, 255, 255, 0.2)) transparent;
  ```
  Add `::-webkit-scrollbar` rules only as a fallback. Note that modern Chromium ignores webkit pseudo-elements once standard properties are set.
* **Root Color Scheme**: Set `color-scheme: dark` on the root so unstyled scrollbars, form controls, and dialog backdrops do not flash light during paint.
* **Explicit Affordance Over Hiding**: Never hide scrollbars with `scrollbar-width: none` on scrollable data tables or card lists without providing an explicit alternative visual affordance (such as scroll-edge shadows). Desktop users rely on scrollbars for discoverability.

## 2. Layout Stability & WCAG Contrast
* **Stable Layout Gutters (Zero CLS)**: Use `scrollbar-gutter: stable` on containers whose content length changes dynamically (filtered tables, search feeds, modal content) to prevent layout shifts when scrollbars appear or disappear.
* **Minimum 3:1 Contrast**: Custom scrollbar thumbs must maintain at least 3:1 contrast against their track under WCAG 2.2 SC 1.4.11 (Non-text Contrast).
* **Grab Ergonomics**: Ensure desktop scrollbar thumbs are at least 8px to 12px wide for effortless cursor grabbing. Do not restyle or shrink scrollbars on touch devices where native overlay indicators apply.

## 3. Containment & Scroll Performance
* **Keyboard-Accessible Regions**: Any scrollable container without focusable children must carry `tabIndex={0}`, an appropriate ARIA role, and an accessible name so keyboard-only users can scroll via Arrow keys and PageDown/PageUp.
* **Scroll Chaining Containment**: Apply `overscroll-behavior: contain` to all modals, drawer panels, popovers, and dropdown pickers so wheel and touch dragging does not leak into the background page.
* **Avoid Nested Scrollboxes**: Restrict scrolling hierarchy to the primary page scroll plus at most one inner scroller (e.g. a data table or modal body). Nested scrollers within scrollable containers induce scroll stutter and touch traps.
* **Dynamic Viewport Units**: Use `dvh` (dynamic viewport height) rather than static `vh` for full-height modal shells and drawers to prevent mobile browser address bars from truncating bottom actions.
* **Never Hijack Native Scroll**: Do not inject custom wheel event interceptors, momentum multiplier scripts, or smooth-scroll wrappers. Wrap any CSS `scroll-behavior: smooth` inside a `@media (prefers-reduced-motion: no-preference)` block.
