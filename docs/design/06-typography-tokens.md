# Zenith Design Standards: Typography, Spacing & Design Tokens

This document details the typographic scale, token hierarchy, spacing system, and fluid scaling foundations for Zenith Companion.

## 1. Material Design 3 Type Roles & Apple HIG Hierarchy
Zenith organizes all UI copy into five structured type roles with explicit line-height and tracking tokens:

| Type Role | Usage Context | Desktop Size / Line-Height | Mobile Size / Line-Height | Weight | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | Hero banners, splash headings | 2.25rem (36px) / 1.15 | 1.85rem (29px) / 1.2 | 800 (Bold) | -0.03em |
| **Headline** | Page titles (`h1`), major sections | 1.65rem (26px) / 1.25 | 1.45rem (23px) / 1.3 | 800 (Bold) | -0.02em |
| **Title** | Card headings (`h2`), modal titles | 1.15rem (18px) / 1.35 | 1.05rem (17px) / 1.4 | 700 (Bold) | -0.01em |
| **Body** | Descriptions, calculations, paragraphs | 0.92rem (15px) / 1.55 | 0.88rem (14px) / 1.5 | 400 (Regular) | 0.00em |
| **Label** | Buttons, tabs, badges, table headers | 0.80rem (13px) / 1.25 | 0.78rem (12.5px) / 1.25 | 600 (Semibold) | +0.01em |

* **Avoid Light Weights**: Never use 100, 200, or 300 font weights on dark backgrounds (`--bg-base`). Thin glyphs suffer halation (fringe blurring) and disappear under low ambient light. Restrict weights to 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), and 800 (Extra Bold).
* **Minimum Legible Text Size**: Absolute floor for supplementary metadata, timestamps, and footnotes is 11 CSS pixels (0.6875rem). Text below 11px fails accessibility legibility standards across all mobile devices.

## 2. DTCG 3-Tier Design Token Architecture
Tokens strictly follow the Design Tokens Community Group specification:
1. **Tier 1: Global Primitives**: Raw color and scalar definitions (e.g. `--color-slate-900: #0f172a`, `--color-cyan-400: #38bdf8`).
2. **Tier 2: Semantic / System Tokens**: Functional aliases mapped to context (e.g. `--bg-base`, `--bg-card`, `--bg-panel`, `--border-subtle`, `--text-main`, `--text-muted`, `--text-accent`, `--border-focus`).
3. **Tier 3: Component Tokens**: Scoped component variables (e.g. `--button-primary-bg`, `--table-cell-padding`, `--modal-max-width`).
* **Enforcement Rule**: Page layouts and components must NEVER use raw hex values or arbitrary RGB strings. Every color, border, and background must derive from Tier 2 semantic tokens.

## 3. Spacing Scale & Fluid Scaling (Utopia Principles)
* **The 8-Pixel Grid Scale**:
  * `4px` (`0.25rem`): Micro gaps, inline badge padding.
  * `8px` (`0.50rem`): Tight control gaps, input internal padding.
  * `12px` (`0.75rem`): Card internal item clusters.
  * `16px` (`1.00rem`): Standard container and card padding.
  * `24px` (`1.50rem`): Section gaps, header spacing.
  * `32px` (`2.00rem`): Page block margins.
  * `48px` (`3.00rem`): Major viewport structural separation.
* **Fluid Interpolation**: For page paddings and hero headings, utilize CSS `clamp(min, preferred, max)` to gracefully scale between 360px mobile viewports and 1440px desktop screens without abrupt breakpoint snap.

## 4. Dividers & Separators Architecture (`Separator.tsx`)
Visual dividers and semantic content separators must follow these web standards:
* **Native `<hr>` Semantics**:
  * The native `<hr>` element represents a thematic break between paragraphs or sections.
  * `<hr>` has an implicit ARIA role of `separator`. Never add redundant `role="separator"` onto an `<hr>`.
* **Purely Decorative Dividers**:
  * If a line is purely visual without semantic thematic meaning, mark it `aria-hidden="true"` or render it using CSS borders or the Radix Separator with `decorative={true}` (which emits `role="none"`). This prevents screen readers from announcing unnecessary separator pauses.
* **Radix Separator Foundation**:
  * Build the unified `Separator.tsx` primitive using `@radix-ui/react-separator`.
  * Supports `orientation="horizontal"` (default) and `orientation="vertical"`.
  * Styled with `--border-subtle` and consistent margins derived from the 8px grid scale.
* **Navigation Group Boundaries**:
  * Between sidebar navigation groups, do NOT use visual `<hr>` separators as the primary grouping mechanism.
  * Use semantic HTML structure instead: distinct `<nav>` landmarks, separate `<ul>` lists, and explicit section headings (`<h3>` with `id` referenced by `aria-labelledby`).
* **Interactive Window Splitters (W3C APG)**:
  * If a separator is movable and interactive (e.g. resizable sidebar or split panes):
    * The element must be focusable (`tabIndex={0}`) with explicit `role="separator"`.
    * Expose `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-controls="<primary-pane-id>"`.
    * Arrow keys (`Left`/`Right` or `Up`/`Down`) adjust split position; `Enter` collapses or restores the primary pane.
