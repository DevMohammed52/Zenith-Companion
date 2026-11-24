# Zenith Design Standards: Data Table Engineering

This document specifies the ARIA semantics, numeric alignment, responsive patterns, and sticky scroll behavior for data tables across Zenith Companion.

## 1. Sort Header Semantics & ARIA
* **`aria-sort` Attribute**: Put `aria-sort` on the `<th>` element only for the currently sorted column (`ascending` or `descending`). Set to `none` or omit on inactive sortable columns.
* **Accessible Sort Trigger**: Nest a native `<button>` element inside the `<th>` that spans the cell, carrying an accessible name describing the sort state.
* **Sort Indicator States**: Inactive sortable columns must display a faint neutral indicator (`ArrowUpDown`), and the active sorted column a prominent directional arrow (`ArrowUp` or `ArrowDown`), wrapped with `aria-hidden="true"`.

## 2. Alignment Parity & Tabular Numerics
* **Alignment Parity**: A column's header alignment must strictly match its cell alignment. Right-aligned numeric columns must have right-aligned headers (`justify-content: flex-end`). Left-aligned text columns have left-aligned headers.
* **Tabular Numerics**: Quantitative numbers must use `font-variant-numeric: tabular-nums` (and `font-feature-settings: "tnum" 1`) with consistent decimal places throughout the column so digits stack cleanly.
* **Unit Consolidation**: Units of measurement belong in the column header (such as `Profit (Gold/hr)` or `Margin (%)`), never repeated in every row cell.

## 3. Responsive Scrolling & Sticky Headers
* **Accessible Scroll Wrapper**: Wrap tables in `<div role="region" aria-labelledby="TableCaptionId" tabIndex={0}>` with Lea Verou pure CSS scroll-edge shadows (`background-attachment: local, local, scroll, scroll`).
* **Multivariate Responsive Strategy**: For wide tables with many columns (`/skill-profit`, `/alchemy`, `/items`, `/housing`), use horizontal scrolling with a pinned first column (`th[scope="row"]`) and fixed header row. Keep card fallbacks only for shallow lists with 4 or fewer fields per row.
* **Sticky Header & Pinned Z-Index Discipline**:
  * Intersection corner: `z-index: 3`.
  * Sticky headers: `z-index: 2`.
  * Pinned columns: `z-index: 1`.
  * All sticky cells must have an opaque background (`--bg-card` or `--bg-panel`).
