# Zenith Design Standards: Number Formatting & UX Copy

This document specifies the localization and numeric precision rules, tabular layout conventions, and user-facing copy standards across Zenith Companion.

## 1. Number Formatting Standards (`Intl.NumberFormat`)
Calculations, market pricing, combat formulas, and player levels must format numbers using standard browser `Intl.NumberFormat` utilities:
* **Standard Integer Formatting**:
  Use `new Intl.NumberFormat("en-US").format(value)` for integer counts (e.g. `1,355 items`, `450 kills`).
* **Compact Notation for Large Gold Amounts**:
  When screen space is bounded (cards, mobile tables, ribbon counters), format gold and large numbers with compact notation:
  ```typescript
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  }).format(1520000); // "1.5M"
  ```
* **Tabular Figures for Columns**:
  All numeric values in tables, stat ribbons, and financial calculations must enable tabular figures:
  ```css
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  ```
  This ensures numbers of equal digit lengths occupy identical horizontal widths, preventing column numbers from jittering during live re-renders.
* **Unit Consolidation**: Units of measure (e.g. `Gold/hr`, `XP/hr`, `% Margin`, `Seconds`) belong in the table column header or card label, never repeated after every individual number in the column.

## 2. Scanning Patterns & Information Chunking (NN/g Research)
* **First 2 Words Rule**: Eyetracking research proves users scan the first 11 characters (roughly the first 2 words) of headings, list items, and buttons before deciding to read further. Always front-load critical nouns:
  * Good: "Alchemy Profit (Hourly)"
  * Bad: "Comprehensive Calculator for Alchemy Profit"
* **Layer-Cake Scanning**: Structure complex pages with bold section titles, concise bullet points, and scannable visual anchors rather than dense multi-paragraph essays.

## 3. Native Gamer Terminology vs. Anti-Slop Writing
All user-facing copy, labels, tooltips, and documentation must sound like a thoughtful, experienced human gamer, not an AI marketing assistant.
* **Banned AI Vocabulary**: Strictly ban inflated filler words: *delve, tapestry, testament, fosters, pivotal, intricate, ensure, robust, landscape, seamless, empower*.
* **Native IdleMMO Terminology**:
  * Use **Efficiency** instead of *Speed* or *Velocity*.
  * Use **Drops / Loot** instead of *Yields* or *Output*.
  * Use **Tasks / Actions** instead of *Operations* or *Jobs*.
  * Use **Gold / hr** instead of *Revenue* or *Income*.
  * Use **Active Profile** instead of *User Account Entity*.
* **Direct Cause & Remedy Copy**:
  When explaining errors or empty states, state the exact cause and the remedy in plain gamer terms:
  * Good: "No items match 'glimmer'. Clear the search to see all items."
  * Bad: "Oops! We couldn't find anything here. Please try again later."
