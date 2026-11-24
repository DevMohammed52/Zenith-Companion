# Zenith Design Standards: Pagination & Data Browsing

This document establishes the architectural, accessibility, state synchronization, and ergonomic standards for Pagination controls across Zenith Companion.

## 1. Architectural Role: Pagination vs. Virtualization vs. Infinite Scroll

Zenith Companion manages large entity databases, including the 1,355-item catalog on `/items` and monsters on `/enemies`. Choosing the right browsing pattern directly impacts usability, orientation, and navigation stability.

### The Problem with Infinite Scrolling (NN/g Findings)
* **Loss of Orientation**: Infinite scroll destroys the player's mental model of "where was I".
* **Unreachable Page Footers**: Loading new rows when approaching the bottom makes the footer, legal notices, and global controls impossible to reach.
* **Broken Back Navigation**: Navigating away from an infinite scroll list and pressing browser Back resets the list to row 1, forcing players to scroll repeatedly to regain their position.

### When to Use Pagination
* **Large Multi-Attribute Catalogs**: Use pagination when users compare rows, reference item locations, jump to specific alphabetical or numerical segments, or need stable page footers.
* **Deep-Linkable State**: Allows sharing exact catalog positions via URLs (e.g. `?page=3`).
* **Controlled DOM Footprint**: Limits the active DOM to 25, 50, or 100 rows, preventing memory bloat and scroll jank.

---

## 2. Semantic ARIA Specifications (Carbon & Atlassian Standards)

Pagination does not have a dedicated W3C APG role; instead, it is built on the semantic `<nav>` landmark wrapping an ordered list:

```html
<nav aria-label="Pagination" class="pagination">
  <div class="pagination__summary" aria-live="polite" aria-atomic="true">
    Showing <span class="tabular-nums">51–100</span> of <span class="tabular-nums">1,355</span> items
  </div>

  <div class="pagination__controls">
    <button
      type="button"
      class="pagination__button pagination__button--prev"
      aria-label="Previous page"
      disabled
    >
      <svg aria-hidden="true"><!-- Chevron Left --></svg>
      <span class="pagination__button-text">Prev</span>
    </button>

    <ol class="pagination__pages">
      <li>
        <button
          type="button"
          class="pagination__page-button"
          aria-label="Page 1"
        >
          1
        </button>
      </li>
      
      <li class="pagination__ellipsis" aria-hidden="true">&hellip;</li>

      <li>
        <button
          type="button"
          class="pagination__page-button is-current"
          aria-current="page"
          aria-label="Page 5"
        >
          5
        </button>
      </li>

      <li>
        <button
          type="button"
          class="pagination__page-button"
          aria-label="Page 6"
        >
          6
        </button>
      </li>

      <li class="pagination__ellipsis" aria-hidden="true">&hellip;</li>

      <li>
        <button
          type="button"
          class="pagination__page-button"
          aria-label="Page 28"
        >
          28
        </button>
      </li>
    </ol>

    <button
      type="button"
      class="pagination__button pagination__button--next"
      aria-label="Next page"
    >
      <span class="pagination__button-text">Next</span>
      <svg aria-hidden="true"><!-- Chevron Right --></svg>
    </button>
  </div>
</nav>
```

### Semantic Checklist
1. **Landmark**: Must use `<nav aria-label="Pagination">`.
2. **Current Page**: Mark the active page with `aria-current="page"` (MDN standard).
3. **Previous & Next Labels**: Provide explicit names ("Previous page", "Next page"), not ambiguous symbols.
4. **Disabled Boundaries**:
   - On page 1: The Previous button is disabled (`disabled` or `aria-disabled="true"`).
   - On the last page: The Next button is disabled.
   - Retain disabled buttons in the layout to prevent visual shifting.

---

## 3. Ellipsis Truncation & Number Algorithms

To keep pagination controls stable in width and prevent erratic layout shifts as page counts change, implement predictable truncation.

### Truncation Rules
* **Under 7 total pages**: Render all page numbers without an ellipsis (e.g. `1 2 3 4 5 6`).
* **Single Truncation (Near Start)**: When `currentPage <= 4`, show first 5 pages, ellipsis, and last page: `1 2 3 4 5 … 28`.
* **Single Truncation (Near End)**: When `currentPage >= totalPages - 3`, show first page, ellipsis, and last 5 pages: `1 … 24 25 26 27 28`.
* **Double Truncation (Middle)**: When in between, show first page, ellipsis, current page with 1 neighbor on each flank, ellipsis, and last page: `1 … 4 5 6 … 28`.
* **Ellipsis Presentation**: Render the ellipsis as a decorative list item (`<li aria-hidden="true">&hellip;</li>`). For screen readers, provide an optional visually hidden text: `Skipped pages`.

---

## 4. State Management, URL Synchronization & Filtering Discipline

### Complete Dataset Processing Rule
Sorting and filtering must always execute against the **entire dataset** (e.g. all 1,355 items), never merely the currently visible page of rows. Sorting only the visible page is a critical data-integrity bug.

### URL Deep-Linking
* Store the active page in URL search params: `?page=3`.
* Ensure browser Back and Forward buttons navigate through pagination history.
* **Automatic Reset to Page 1**: Any change to search text, category filter, or sort order must automatically reset `page` to `1`.
* **URL Validation & Clamping**: If an out-of-range page is requested (e.g. `?page=999` or `?page=-1`), parse and clamp to `[1, totalPages]`, rather than rendering a blank empty screen.

---

## 5. Focus Management & Screen Reader Announcements

When a user triggers a page change, two assistive operations must execute:

1. **Focus Repositioning**: In single-page applications, changing pages leaves keyboard focus on the now-relocated pagination button. Shift keyboard focus to the table container, the table caption, or the top of the data list.
2. **Polite Live Region**: Announce the range change through a polite live region:
   ```html
   <div aria-live="polite" class="sr-only">
     Showing items 51 through 100 of 1,355
   </div>
   ```

---

## 6. Page-Size Selection & Mobile Ergonomics

### Page-Size Selector
* Offer standard increments: 25, 50, and 100 items per page.
* Persist the player's preference in `localStorage` under `zenith_pagination_page_size`.
* When changing page size, calculate the new page index so the first visible item remains in view:
  `newPage = Math.floor(((oldPage - 1) * oldSize) / newSize) + 1`.

### Mobile Ergonomics (<640px Viewport)
A row of 7 page buttons exceeds horizontal screen width on mobile devices.
* On mobile, collapse page number buttons into a compact indicator:
  `[ Prev ] Page 5 of 28 [ Next ]`
* Touch targets for Previous and Next buttons must measure at least 44x44px (`--touch-target-min`).

---

## 7. Design Tokens & Styling Specifications

| Element | Property | Token / Value |
| :--- | :--- | :--- |
| Container Background | `background-color` | `var(--bg-card)` (`#141b2d`) |
| Container Border | `border-top` | `1px solid var(--border-subtle)` |
| Page Button Size | `min-width`, `height` | `36px`, `36px` (desktop), `44px` (mobile touch) |
| Page Button Border Radius | `border-radius` | `6px` |
| Page Button Text | `color` | `var(--text-muted)` (`#94a3b8`) |
| Page Button Hover | `background`, `color` | `var(--bg-card-hover)`, `var(--text-main)` |
| Current Page Button | `background`, `color` | `var(--accent-primary)`, `#0f172a` (Bold slate) |
| Disabled Button | `opacity`, `cursor` | `0.4`, `not-allowed` |
| Focus Indicator | `outline` | `2px solid var(--border-focus)`, offset 2px |
