# 31. Changelog, Patch Notes & Release Engineering Specification

## 1. Executive Summary & Purpose

Zenith Companion is both an analytical engine and an interactive tool suite for IdleMMO players. Maintaining accurate, user-centric release documentation is essential for player trust: when pricing algorithms, combat drop odds, or navigation patterns change, players must immediately understand what changed, why it matters, and how it impacts their gameplay.

This specification synthesizes industry standards from **Keep a Changelog 1.1.0**, **Common Changelog**, **Semantic Versioning 2.0.0**, **Calendar Versioning (CalVer)**, **Conventional Commits 1.0.0**, **Google Developer Documentation Style Guide ("What's new")**, and the **Microsoft Writing Style Guide**, alongside product examples from Linear, Vercel, GitHub, and Stripe.

---

## 2. The Dual-Domain Rule: Game Patch Notes vs. Companion Updates

A core source of confusion in third-party gaming tools is conflating changes made by the game developers with changes made to the companion tool itself. Zenith Companion strictly separates these two domains:

```
+-------------------------------------------------------------------------+
|                              ZENITH COMPANION                           |
+------------------------------------+------------------------------------+
| 1. IdleMMO Patch Notes             | 2. Zenith Companion "What's New"   |
| Route: /patch-notes                | Route: /whats-new (or /changelog)  |
| Source: public/idlemmo-patch-notes | Source: CHANGELOG.md               |
| Content: Official IdleMMO game     | Content: Tool calculators, UI      |
| updates (combat balance, new       | overhauls, new features, bug       |
| dungeons, drop rates, game events) | fixes, and algorithm enhancements  |
+------------------------------------+------------------------------------+
```

### Strict Domain Rules:
1. **Never Mix Game Notes into App Changelogs**: A game balance nerf (e.g., "-50% EXP penalty on Cursed gear") belongs in `/patch-notes`. A calculator update supporting that penalty belongs in Zenith's changelog.
2. **Clear UI Disambiguation**: The sidebar and mobile navigation drawer must explicitly label the two routes:
   - `IdleMMO Patch Notes` (with external game archive context)
   - `What's New in Zenith` (or `Zenith Changelog`)
3. **No Routine Data Scraping Logs**: Automated background scraper jobs (e.g., hourly market price updates, daily guild refreshes, pet databases) are continuous maintenance and **must never** be logged as releases. Only log changes to *how* data is collected, sanitized, or calculated (such as median-anchor spike suppression or new recipe relational linking).

---

## 3. Guiding Principles & Standards

### 3.1. Keep a Changelog (1.1.0) & Common Changelog
- **Changelogs are for humans, not machines**: A raw git commit log (`git log --oneline`) is full of noise (merge commits, build fixes, typo corrections, internal test adjustments). A changelog is a curated, human-readable narrative of meaningful differences.
- **Reverse Chronological Order**: Newest releases sit at the very top.
- **ISO 8601 Dates**: All release headings and entries must use unambiguous ISO date formatting (`YYYY-MM-DD` or explicit timestamps `YYYY-MM-DD HH:mm`). Never use ambiguous regional formats like `MM/DD/YYYY` or `DD/MM/YYYY`.
- **Linkable Versions**: Every release heading must be an anchored link to the corresponding git tag or compare diff.
- **The Unreleased Buffer**: Maintain an active `## [Unreleased]` section at the very top of `CHANGELOG.md`. As work is committed and verified, notes are added immediately to `[Unreleased]`. When a release ships, the section is promoted to a versioned release, preventing notes from ever being reconstructed from faulty memory.

### 3.2. Versioning for Web Applications (SemVer vs. CalVer)
- **Library vs. Single-Deployment Application**: SemVer (`MAJOR.MINOR.PATCH`) is designed for software dependencies with formal public APIs. For a single-deployment web app where users interact with a live interface rather than importing code, pure SemVer often leads to arbitrary major bumps.
- **Zenith Dual-Tier Strategy**:
  - `package.json` tracks the semantic milestone (e.g., `0.86.0` -> `1.0.0`).
  - Public-facing release entries combine milestone tagging with ISO calendar dates (e.g., `[v0.86.2] - 2026-11-24`).
  - **Single Source of Truth**: The active version must be read from a single constant (e.g., `package.json` or `src/lib/version.ts`), never hardcoded in multiple components.

### 3.3. Conventional Commits as an Ingestion Pipeline
Git commits must follow the Conventional Commits specification (`feat:`, `fix:`, `refactor:`, `docs:`, `perf:`, `chore:`). While conventional commits guide the author, they must be translated into human gamer prose before appearing in the public changelog:
- `feat(items): add bounded pagination` -> **Items Directory**: "Added fast bounded pagination with jump-to-page controls and item count summaries."
- `fix(modal): prevent map navigation reset` -> **Item Modal**: "Fixed gathering location cards resetting world map markers on click."

---

## 4. User-Centric Technical Writing Rules

Following the **Google Developer Documentation Style Guide** and the **Microsoft Writing Style Guide**, all changelog entries must obey strict technical writing principles:

### 4.1. Write for the Player, Not the Codebase
- **Bad (Code-focused)**: "Refactored `useItemsFilter` hook to use `useDeferredValue` and memoized the filter predicate."
- **Good (Player-focused)**: "Search typing in the Items directory is now instant with zero input stutter, even when filtering all 1,355 items."
- **Bad**: "Migrated `ItemModal.tsx` to use CSS Modules and removed inline style attributes."
- **Good**: "Item Modal now opens with smooth spring animations, separate tabs for Market, Recipes, and Sources, and an interactive Forge Tier simulator."

### 4.2. Use the Imperative Mood & Self-Describing Entries
As specified in Common Changelog, change items must start with an imperative present-tense verb (Add, Fix, Update, Remove, Redesign, Support, Optimize):
- "Add world map deep-linking to all gathering source cards."
- "Fix unchecked checkboxes showing faint tickmarks on dark backgrounds."
- "Reduce mobile tap delay on the navigation dock."

### 4.3. Anti-Slop Writing Discipline
In accordance with workspace rules:
- **No AI filler words**: Ban words like *delve, tapestry, testament, fosters, pivotal, intricate, seamlessly, boasts, features*.
- **No inflated significance**: Do not claim minor UI polishes "revolutionize the user experience" or "mark a turning point in tool efficiency". State the concrete capability directly.
- **Brevity**: Cut every unnecessary word. Use active voice over passive voice ("Fixed item sorting" instead of "An issue where item sorting was broken has been resolved").

---

## 5. Standard Category Taxonomy

Entries must be organized under standard headings in strict order of user impact:

1. **Notices / Breaking Changes (Optional Banner)**:
   Any required user action, cache wipe, or breaking change must be called out at the top of the release in an italicized or bordered notice block:
   > *Notice: Offline local storage cache was reset to support the new item relational schema. Your saved character profiles remain intact.*
2. **Added**: New tools, pages, calculators, filters, or interactive controls.
3. **Changed**: Modifications to existing functionality, redesigned layouts, improved algorithms, or upgraded performance.
4. **Fixed**: Bug fixes, broken calculations, layout shifts, or touch target corrections.
5. **Removed**: Deprecated tools, retired features, or purged duplicate options.
6. **Security**: Fixes for access control, local storage data leaks, or proxy sanitization.

---

## 6. In-App "What's New" UI Architecture

To ensure the in-app changelog never drifts from repository history, the in-app page renders directly from structured release data derived from `CHANGELOG.md`.

```
+------------------------------------------------------------------------+
|                               WHAT'S NEW                               |
|                     Zenith Companion Version History                   |
+------------------------------------------------------------------------+
| [ All ] [ New Features ] [ Improvements ] [ Bug Fixes ]                |
+------------------------------------------------------------------------+
| o November 24, 2026 - v0.86.2                             [ NEW BADGE ]|
|   Interactive World Map Deep-Linking & Centralized Pagination          |
|                                                                        |
|   * Added direct map navigation on all ItemModal gathering cards       |
|   * Adopted centralized Pagination primitive on Items and Enemies      |
|   * Upgraded Switch component with smooth Apple-style spring physics   |
|                                                                        |
| o November 22, 2026 - v0.86.0                                          |
|   Unified Shell Navigation & Vector Brand Identity                     |
|                                                                        |
|   * Modern 260px desktop sidebar with 64px collapsed icon rail         |
|   * Persistent mobile bottom dock with dynamic top-3 visited tools     |
|   * Global toast notification system replacing rotating tips           |
+------------------------------------------------------------------------+
```

### 6.1. Component Anatomy & Design Tokens
- **Root Landmark**: `<main className={styles.page} aria-labelledby="changelog-title">`.
- **Timeline Primitive**: Consume `src/components/ui/Timeline.tsx` with semantic `<time datetime="YYYY-MM-DD">` elements.
- **Category Badges**: Use `src/components/ui/Badge.tsx` with variant mapping:
  - `Added` -> `variant="accent"` (Cyan / Luminous Frost)
  - `Changed` -> `variant="neutral"` (Astral Slate)
  - `Fixed` -> `variant="neutral"` (Emerald Accent / Neutral)
  - `Breaking / Notice` -> `variant="danger"` (Ruby Alert)
- **Local Unread Tracking**: Store `last_seen_changelog_date` in `localStorage`. If `latest_release_date > last_seen_changelog_date`, display a subtle notification dot on the "What's New" sidebar navigation item and render a "NEW" badge on unread release cards.

### 6.2. Accessibility & Performance
- **Touch Ergonomics**: All expanders, filters, and external diff links must meet `>= 44x44px` touch targets.
- **Zero CLS**: Reserve layout height for timeline nodes and badges.
- **Search & Filtering**: Include client-side search by keyword or category tag with `useDeferredValue` for smooth typing.

---

## 7. AI Agent & Contributor Maintenance Protocol

Whenever modifying Zenith Companion code, agents must follow this strict verification protocol:

1. **Verify Before Logging**: Never write a changelog entry before the code is implemented, tested, and passing verification gates. An unverified change must never appear in `CHANGELOG.md`.
2. **Atomic Ingestion into `[Unreleased]`**: Every completed feature or refactor must add its user-facing bullet point to `CHANGELOG.md` under `## [Unreleased]` with an explicit `[YYYY-MM-DD HH:mm]` timestamp.
3. **Diff Verification Gate**: Before committing a release, compare the changelog entries against `git diff origin/main..HEAD` to confirm every claim matches shipped reality.
4. **Preserve Dual Sync**: When `CHANGELOG.md` or release documentation is updated, ensure both workspaces (`c:\Data\IdleMMO related stuff\...` and `c:\Data\Programming Projects\...`) remain identical.
