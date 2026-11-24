# Zenith Design Standards: Breadcrumbs & Hierarchical Navigation

This document establishes the architectural, accessibility, semantic, and responsive guidelines for Breadcrumb navigation across Zenith Companion.

## 1. Architectural Role & Information Architecture Fit

Breadcrumbs provide contextual awareness and an easy path to parent pages within deep hierarchies.

### Zenith IA Context
Zenith Companion uses a flat, two-tier navigation structure:
* The primary navigation is a flat sidebar/dock containing direct links to top-level feature engines (`/alchemy`, `/items`, `/bosses`, `/enemies`, `/profiles`).
* Most pages are flat, top-level views.

### Where Breadcrumbs Are Prohibited
* **Top-Level Feature Pages**: Breadcrumbs must never appear on single-level routes (e.g. a redundant "Home > Weather" or "Home > Settings"). The active state in the sidebar and page heading already communicate the location.
* **Sequential Multi-Step Processes**: Do not use breadcrumbs for linear workflows (e.g. multi-step data import or setup wizards). Use a progress stepper or timeline component instead.

### Where Breadcrumbs Are Required
Breadcrumbs are reserved strictly for deeply nested hierarchical views:
* Entity details: `/items` -> `/items/[id]` (e.g. Items > Potions > Super Combat Potion)
* Boss dossiers: `/bosses` -> `/bosses/[id]` (e.g. World Bosses > Goblin King)
* Territory details: `/conquest` -> `/conquest/[region]` (e.g. Conquest > Whispering Woods)
* Guild profiles: `/guilds` -> `/guilds/[id]`

---

## 2. Semantic ARIA Specifications (W3C APG)

A compliant breadcrumb component uses a navigation landmark wrapping an ordered list:

```html
<nav aria-label="Breadcrumb" class="breadcrumbs">
  <ol class="breadcrumbs__list">
    <li class="breadcrumbs__item">
      <a href="/items" class="breadcrumbs__link">Items</a>
      <span aria-hidden="true" class="breadcrumbs__separator">/</span>
    </li>
    
    <li class="breadcrumbs__item">
      <a href="/items?category=potions" class="breadcrumbs__link">Potions</a>
      <span aria-hidden="true" class="breadcrumbs__separator">/</span>
    </li>
    
    <li class="breadcrumbs__item">
      <span
        aria-current="page"
        class="breadcrumbs__current"
      >
        Super Combat Potion
      </span>
    </li>
  </ol>
</nav>
```

### Critical Semantic Rules
1. **Landmark Label**: Use `aria-label="Breadcrumb"` (singular). This differentiates the trail from the primary site navigation (`aria-label="Main"`).
2. **Ordered List**: Use `<ol>` and `<li>` elements. This informs assistive technologies of the total number of ancestor steps and the user's position in the sequence.
3. **Current Page Is Not a Link**: The final item represents the user's current location. It must **never** be an active anchor link (`<a>`). Making the current page clickable causes confusing self-reloads. Render it as a plain `<span>` with `aria-current="page"`.
4. **Separators Hidden from Screen Readers**: Visual separators (`/`, `>`, or chevron icons) must be created via CSS (`::after`) or marked with `aria-hidden="true"`. Screen readers must not recite "slash, slash, slash".

---

## 3. Responsive Behavior & Mobile Ergonomics

Long breadcrumb trails break layout stability on compact mobile viewports (<640px).

### Mobile Strategies (NN/g & Carbon Guidance)
1. **Short Trail (2 items)**: If the trail is simply "Items > Super Combat Potion", display both items, allowing the current item to truncate with ellipsis if necessary.
2. **Deep Trail (3+ items)**:
   - **Pattern A (Parent Back Button - Preferred for Mobile)**: On small screens, replace the full breadcrumb trail with a single parent link:
     ```html
     <a href="/items?category=potions" class="breadcrumbs__back-link">
       <svg aria-hidden="true"><!-- Chevron Left --></svg>
       <span>Potions</span>
     </a>
     ```
     This conserves vertical screen space and guarantees an unambiguous touch target (>= 44px).
   - **Pattern B (Ellipsis Menu)**: If intermediate steps are critical, collapse intermediate levels into an accessible disclosure menu (`...`), keeping the root ancestor and current page visible.

### Touch Target Minimums
* Even on desktop, breadcrumb links must have adequate hit areas (minimum 24px vertical height).
* On touch devices, hit targets must expand to at least 44x44px using invisible padding or pseudo-elements (`--touch-target-min`).

---

## 4. Text Truncation & Label Formatting

* **Maximum Width**: Constrain the current page title width (e.g. `max-width: 200px` on mobile, `320px` on desktop) using `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.
* **Full Title Preservation**: When truncation occurs, place the full unwrapped title in a native `title` attribute or tooltip so users and screen readers can access the full name.
* **Capitalization**: Maintain title case or sentence case consistent with the destination page's heading. Never force all-caps via CSS.

---

## 5. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Container Padding | `padding` | `8px 0` |
| Font Size | `font-size` | `0.875rem` (`14px`) |
| Font Weight (Ancestors) | `font-weight` | `400` (Regular) |
| Font Weight (Current) | `font-weight` | `600` (Semi-bold) |
| Link Color (Default) | `color` | `var(--text-muted)` (`#94a3b8`) |
| Link Color (Hover) | `color` | `var(--text-main)` (`#f8fafc`) |
| Current Page Text | `color` | `var(--text-main)` (`#f8fafc`) |
| Separator Color | `color` | `var(--border-strong)` (`#334155`) |
| Focus Ring | `outline` | `2px solid var(--border-focus)`, offset 2px |
| Separator Spacing | `margin` | `0 8px` |
