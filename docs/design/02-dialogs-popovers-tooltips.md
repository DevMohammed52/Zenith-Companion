# Zenith Design Standards: Dialogs, Popovers & Tooltips

This document defines the rules for overlay architecture, floating contextual panels, modal confirmations, and microcontent tooltips across Zenith Companion.

## 1. Modal vs. Non-Modal Dialogs (NN/g Usability Foundation)
* **Modal Dialog**: Disables the background page (`inert`), locks scroll, and demands immediate resolution.
  * *Cognitive Costs*: Interruption of flow, context loss, and blocking underlying reference data.
  * *Permitted Uses*: Destructive confirmations (e.g. clearing custom prices, resetting profile data), critical missing inputs required to continue a user-initiated task, or chunking high-complexity sequential steps.
  * *Banned Uses*: Informational announcements, routine data inspection, newsletter prompts, or research where the user needs to view background tables to make a decision.
* **Non-Modal Dialog (Popover)**: Allows concurrent interaction with the underlying page.
  * *Permitted Uses*: Contextual action menus, filtering popouts, quick item dossiers, and tool pickers where the user needs to inspect values while referencing the main screen.

## 2. Popover API & Floating UI Architecture
Floating popovers (`Popover.tsx`) provide anchored contextual content without blocking the main page flow:
* **Native Top Layer & Portals**: Floating popovers, tooltips, and contextual menus render into the browser top layer via the HTML Popover API (`popover="auto"`) or a React Portal attached to `document.body`. This eliminates `z-index` wars and stacking context entrapment across complex nested headers.
* **Declarative HTML Controls & JS Methods**:
  * Declarative triggering via `<button popovertarget="<id>" popovertargetaction="toggle|show|hide">`.
  * Programmatic triggering via `HTMLElement.showPopover()`, `hidePopover()`, and `togglePopover()`.
  * `popover="auto"` automatically enforces light dismiss (clicking outside or pressing `Escape` dismisses the popover and closes other auto popovers).
  * `popover="manual"` disables light dismiss for notifications or persistent pinned tooltips.
  * State tracking via `beforetoggle` and `toggle` events (`e.newState` is `"open"` or `"closed"`).
  * CSS targeting via `:popover-open` and full-viewport backdrop styling via `::backdrop`.
* **Floating UI Middleware Pipeline**: All dynamic anchoring must configure Floating UI (`computePosition` or `useFloating`) with four mandatory middlewares:
  1. `offset(8)`: Maintains an 8px visual clearance gap between the trigger and the popover panel.
  2. `flip({ fallbackPlacements: ["top", "bottom", "left", "right"] })`: Automatically flips placement to the opposite side if viewport boundaries would clip the panel.
  3. `shift({ padding: 12 })`: Shifts the panel along the cross-axis to keep at least 12px of clearance from viewport edges.
  4. `autoUpdate`: Automatically recalculates positioning when the reference element scrolls, resizes, or moves in the layout.
* **Light Dismiss & Focus Restoration**: `popover="auto"` or headless popover primitives automatically handle outside-click, outside-touch, and `Escape` dismissal. When dismissed, focus must return immediately to the triggering element.
* **Responsive Adaptation (Mobile Sheet)**: On compact mobile viewports (<600px), floating popovers with rich content (e.g. multi-option filters, price calculators, character switchers) must adapt from floating cards into bottom slide-up sheets (`ModalSheet`), providing ergonomic thumb reach.
* **Scroll Chaining Containment**: All scrollable dialogs and popover menus must carry `overscroll-behavior: contain` and `scrollbar-gutter: stable` so wheel or touch dragging does not scroll the background page or shift layout.

## 3. Accessible Modal Dialog Engineering (WAI-ARIA & MDN `<dialog>` Standards)
All modal components (`ModalSheet.tsx`) must implement these core accessibility and web platform standards:
1. **Native HTML `<dialog>` Implementation**:
   * Open modal dialogs strictly via `HTMLDialogElement.showModal()`, never via `show()` or manipulating the `open` attribute directly. `showModal()` automatically places the element into the browser's top layer, marks document siblings `inert`, and matches `:modal` and `::backdrop`.
   * **Never place `tabindex` on `<dialog>` itself**: MDN explicitly warns that `tabindex` must not be set on `<dialog>` as the container itself is not an interactive control.
   * **Initial Focus Placement**: Use the `autofocus` attribute on the element the player is expected to interact with first (e.g. text input or primary action button). If no interaction is immediately required, place autofocus on the close button or dialog title container (`tabindex="-1"`).
   * **Native Dialog Forms**: Submitting a form with `<form method="dialog">` or clicking a button with `formmethod="dialog"` cleanly closes the dialog without a network request and stores the activated button value in `HTMLDialogElement.returnValue`.
2. **Roles & Attributes (when using headless/custom container)**:
   * Container element: `role="dialog"` (or `role="alertdialog"` for urgent destructive prompts).
   * Property: `aria-modal="true"`.
   * Title association: `aria-labelledby="<dialog-title-id>"`.
   * Description: `aria-describedby="<dialog-desc-id>"`.
3. **Inert Background**: Sibling root DOM nodes must be marked `inert` to prevent screen reader drift and background interaction.
4. **Focus Trapping**: Keyboard `Tab` and `Shift + Tab` must circulate strictly within the focusable elements inside the modal.
5. **Focus Restoration**: When the dialog closes, DOM focus must return immediately to the triggering element.
6. **Hardware Dismissal**: The `Escape` key must close the dialog immediately. If multiple modals are stacked, `Escape` closes only the innermost active modal.

## 4. Tooltip Guidelines (NN/g, Carbon, Atlassian & WCAG 2.2 SC 1.4.13)
Tooltips are user-triggered microcontent messages providing brief supplementary explanations:
* **Never Put Vital Information in a Tooltip**: Required form syntax, password rules, and essential gameplay formulas must be permanent visible copy. Tooltips disappear and cannot be committed to working memory.
* **Never Put Interactive Controls Inside Tooltips**: Links, buttons, and form inputs are forbidden inside tooltips. If the content contains an interactive element, it is a Popover, not a tooltip.
* **Non-Redundant Copy**: Never repeat the button or link label verbatim inside a tooltip. A button labeled "Reset" must not display a tooltip saying "Reset".
* **Hover Delay (Anti-Flicker)**: Tooltips must open with a subtle 200ms to 300ms delay. Instant tooltips cause visual flicker and distraction as the cursor travels across dense icon strips.
* **Dual Mouse & Keyboard Trigger**: Tooltips must trigger on both mouse hover (`mouseenter`) and keyboard focus (`focusin`).
* **Wiring Semantics**: Wire tooltips via `aria-describedby="<tooltip-id>"`. Icon-only buttons still strictly require an `aria-label`, because a tooltip is supplementary description, not the button's accessible name.
* **Disabled Control Wrappers**: A disabled button does not receive mouse hover or keyboard focus in most browsers. If an explanation is needed for why an action is disabled, wrap the disabled button in a focusable `<span>` (`tabIndex={0}`) with the tooltip attached.
* **WCAG 2.2 SC 1.4.13 Compliance**:
  * *Dismissible*: `Escape` key dismisses the tooltip without moving focus.
  * *Hoverable*: Pointer can move across the gap to hover over the tooltip itself without disappearing.
  * *Persistent*: Tooltip remains visible until the trigger loses focus/hover or `Escape` is pressed.
* **Touchscreen Parity**: Tooltips initiated by hover do not work on touchscreens. On mobile, use explicit tap-to-open popup tips (a small `?` or `i` button that toggles an accessible popover).
* **Positional Arrows**: Use a directional indicator arrow to clearly associate the tooltip with its trigger in dense icon strips. Position tooltips so they never obscure the element they describe.
* **Radix Tooltip Primitive Architecture (`Tooltip.tsx`)**:
  * Wrap the application in a global `Tooltip.Provider` to coordinate timings across all tooltips.
  * `delayDuration={300}`: Subtle entry delay to prevent visual flicker when moving across toolbars.
  * `skipDelayDuration={300}`: Eliminates the delay when moving the pointer directly from one tooltip trigger to an adjacent trigger.
  * Compound structure: `Tooltip.Root`, `Tooltip.Trigger`, `Tooltip.Portal`, `Tooltip.Content`, `Tooltip.Arrow`.
  * Trigger activation dismiss: Clicking or tapping the trigger immediately dismisses the tooltip.
