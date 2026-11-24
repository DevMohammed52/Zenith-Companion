# Zenith Design Standards: BottomDock & Navigation Drawer (Mobile Shell)

This document defines the architectural, ergonomic, and accessibility standards for the mobile persistent navigation dock (`BottomDock.tsx`) and full-height slide-out navigation sheet (`Drawer.tsx`).

---

## 1. BottomDock Architecture (Material 3 & Apple HIG Foundations)

### Purpose & Ergonomic Boundaries
* **The Bottom Thumb Zone**: On compact mobile viewports (<768px), primary navigation must sit in the lower 40% of the screen within comfortable natural thumb reach (Fitts's Law).
* **3 to 5 Destination Rule**:
  * The dock must strictly accommodate 4 to 5 top-level destinations of equal hierarchy (e.g. `Dashboard`, `Databases`, `Tools`, `World`, `More`).
  * Fewer than 3 destinations wastes horizontal space; more than 5 causes touch target crowding (<44px) and thumb misclicks.
  * Never use horizontal carousels inside a navigation dock (NN/g: "Out of sight is out of mind").
* **Navigation, Never Actions (Apple HIG Rule)**:
  * The bottom dock is strictly for persistent section switching. Never place destructive actions, form submissions, or contextual tool triggers inside the dock.

### Safe-Area Inset Handling (CSS `env()`)
* Modern mobile devices feature hardware notches, home indicator bars, and dynamic virtual keyboards that overlap raw viewport edges.
* The dock container must apply hardware safe-area padding:
  ```css
  .bottom-dock {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding-bottom: max(var(--space-2, 8px), env(safe-area-inset-bottom));
    padding-left: max(var(--space-2, 8px), env(safe-area-inset-left));
    padding-right: max(var(--space-2, 8px), env(safe-area-inset-right));
    z-index: 1000;
  }
  ```
* Pages must apply matching bottom scroll padding to prevent content from hiding behind the dock:
  ```css
  .main-content {
    padding-bottom: calc(64px + max(var(--space-4, 16px), env(safe-area-inset-bottom)));
  }
  ```

### Visual & Motion Specs (Material 3 Expressive & Apple HIG)
* **Surface Styling**: Translucent frosted backdrop (`background: rgba(10, 13, 20, 0.85); backdrop-filter: blur(16px);`) with a subtle 1px border (`--border-subtle`).
* **Active Indicator (Dual Cue)**:
  * The active destination is wrapped in an accent pill container (`background: rgba(255, 255, 255, 0.08)` or `--text-accent` tint).
  * Uses filled icon variant for active state, outline variant for inactive state.
  * Active text label carries `font-weight: 600`.
* **Labeled Icons**: Always pair icons with brief single-word text labels (stacked vertically in portrait, side-by-side in landscape). Unlabeled icons increase interaction cost by 40% (NN/g).
* **Touch Targets**: Each dock tab must guarantee a minimum 48x48px hit area (`touch-action: manipulation`).

---

## 2. Navigation Drawer / SideSheet Architecture

### Purpose & Trigger
* When tapping the `More` tab on the `BottomDock` (or the menu trigger in the header), an accessible slide-out `Drawer` renders to grant access to the full catalog of all 25 application routes.
* Follows the W3C WAI-ARIA Modal Dialog Pattern and HTML `<dialog>` element / Radix Dialog specifications.

### Structural DOM Composition
```tsx
<Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
  <Drawer.Overlay className="drawer-overlay" />
  <Drawer.Content className="drawer-content" aria-label="Application navigation menu">
    <header className="drawer-header">
      <ZenithIcon name="dashboard" size={20} />
      <h2>Navigation</h2>
      <Drawer.Close aria-label="Close navigation menu" />
    </header>
    <nav className="drawer-body custom-scrollbar">
      {/* Grouped navigation items */}
    </nav>
  </Drawer.Content>
</Drawer.Root>
```

### Accessibility & Interaction Matrix
1. **Inert Background**: Sibling DOM nodes (including main content and the bottom dock) must be set to `inert` when the drawer is open.
2. **Focus Management**:
   * On open: Focus lands immediately on the first interactive element or the close button (`window.requestAnimationFrame`).
   * While open: Keyboard `Tab` and `Shift + Tab` circulate strictly within the drawer container (focus trap).
   * On close: Focus returns immediately to the triggering element.
3. **Dismissal Gestures**:
   * Pressing the `Escape` key dismisses the drawer instantly.
   * Tapping the backdrop overlay dismisses the drawer.
   * Swiping horizontally toward the screen edge (touch gestures) dismisses the drawer.
4. **Scroll Lock & Containment**:
   * Body scroll is locked (`overflow: hidden` on `document.body`) while the drawer is open.
   * The drawer body uses `overscroll-behavior: contain` to prevent touch-dragging from chaining to the background.
5. **Animation Curves**:
   * Hardware-accelerated CSS `transform: translateX(...)` with spring timing (`cubic-bezier(0.16, 1, 0.3, 1)`, duration 250ms).
   * Honored under `@media (prefers-reduced-motion: reduce)` by disabling transitions.
