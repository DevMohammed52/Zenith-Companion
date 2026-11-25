# Changelog

All notable changes to Zenith Companion will be documented in this file.
Updates are organized chronologically by release date.

## [Unreleased]

## [2026-11-25]

### Added
- **Conquest Season Archive**: You can now browse past conquest seasons (**Season 3** through **Season 12**) alongside the current season in Conquest, complete with zone winners, paginated contributor rankings, and historical control shares.
- **Conquest Buffs, Shards & Live Assault Timers**: Conquest now shows live assault wave countdowns, resolves each top contributor's guild badge, displays guild levels, and provides a top-level **Buffs & Shards** guide for Territory Ruling Buffs (Ranks 1–10) and Zone Shard payouts (Ranks 1–25).
- **Equipped Pet Spotlight**: Your currently equipped pet now sits pinned at the top of Owned Pets with Power, Health, Location, best Battle EV/hr, and 1-click catalog comparison.
- **Missing Pets & Multi-Select Compare**: Owned Pets now tracks your collection progress, adds a **Missing Pets** view with drop sources and exchange floor prices, adds a sortable **Table** view, and lets you select 2–4 pets to open together in Pet Comparison.

### Changed
- **What's New Timeline Redesign**: Upgraded What's New to a chronological release timeline with semantic date nodes, calm slate filter tabs, quick release jump counts, and smooth accordion drawers synced to the latest release date.
- **Museum Collection Redesign**: Merged duplicate museum category filters into one toolbar, added a compact Snapshot Info modal, direct collectible inspection and Pet/Enemy Database links, paginated browsing (24, 48, or 96 entries per page), shareable filter links, and a floating Back to Top button.
- **Calmer Dark-Mode Contrast**: Toned down stark bright-white active tabs, filter pills, pagination buttons, and primary buttons to calmer slate tones so dark screens feel more relaxed on the eyes.
- **Conquest Redesign**: Rebuilt Conquest in the monochromatic Astral Slate palette with clearly labeled control-share bars, inline vertical metric dividers, paginated contributor lists, world map deep links, shareable URL filters, and a floating Back to Top button.
- **Smooth Back to Top**: Standardized a single floating **Back to Top** button across Conquest, House Planner, Items Database, Enemy Database, Pet Database, Owned Pets, and What's New with smooth fade and slide transitions above the mobile dock.
- **House Planner Redesign**: Rebuilt House Planner with scoped styling, an inline profile/mode/cost summary strip, in-game gold and construction material icons, unified skill icons across all 5 tabs, and responsive mobile controls.
- **Pet Comparison Overhaul**: Redesigned Pet Comparison with a collapsible shared setup panel, searchable pet picker modal, cleaner comparison cards, distinct stat icons across the metrics table, and shareable comparison links.
- **Owned Pets Redesign**: Rebuilt Owned Pets with **Your Pets** and **Missing Pets** tabs, **Cards** and **Table** views, a full Pet Details modal, page navigation, and a floating back-to-top button.
- **Pet Directory Redesign**: Redesigned the companion catalog with responsive cards, clean stat comparisons, and direct egg acquisition links.
- **Pet Setup Simulator**: Consolidated level, mastery, and evolution stat controls into a collapsible simulator panel with instant calculation updates.
- **Bounded Page Navigation**: Switched from infinite scrolling to fast page navigation (12, 24, or 48 companions per page) for smoother browsing.
- **Mobile Sheet Ergonomics**: Companion and combat details now open in an edge-to-edge mobile bottom sheet with swipe-to-dismiss and floating back-to-top button.

### Fixed
- **Alt Museum Live Import Sync**: Redeployed the profile import worker so visible alt characters fetch their own museums directly instead of leaving alt museums empty on import.
- **What's New Release Date Sync**: Fixed the top summary tag displaying the previous date (`24 Nov 2026`) instead of matching the newest release (`25 Nov 2026`).
- **House Planner Readability & Currency Icons**: Fixed smashed header/card labels on Profit, Built Components, and Guest Buffs tabs, aligned gold coin and material item icons cleanly beside values, and fixed condition readout ordering.
- **Pet Picker Search Focus**: Fixed the search input in the Choose Pet modal losing focus back to the close button after typing each character.
- **Pet Setup Controls**: Fixed the +/- buttons on level, mastery, and evolution inputs, renamed "Beastmaster Context" to "Beastmaster Class", and stopped simulator dropdowns from clipping or sitting behind nearby fields.
- **Pet Table & Modal Layout**: Added spacing between pet icons and names in table view, stopped mobile table columns from squishing numbers, cleaned up duplicate card and modal borders, and centered page navigation controls.

## [2026-11-24]

### Added
- **What's New in Zenith**: Added a dedicated in-app update log so you can easily track companion features, improvements, and fixes.
- **Table & Catalog Pagination**: Switched to fast page browsing across the Items and Enemies databases, eliminating scrolling lag on large catalogs.
- **Base Crafting Recipes**: Added full recipe tracking for Smelting, Cooking, and Forge equipment directly into item details.

### Fixed
- **Dropdown Menu Clipping**: Fixed search and filter dropdowns occasionally clipping inside card containers.
- **Table Row Hover Highlights**: Smoothed item table rows so selection borders remain continuous without notches.
- **Settings Toggles**: Fixed duplicate checkmark icon on unchecked settings options and smoothed switch toggle animations.

## [2026-11-23]

### Added
- **Item Valuation & Market Trends**: Clear sell advice comparing vendor, bartering, and market profit, with 30-day price trend graphs.
- **Equipment Tier Simulator**: Test weapon and armour tier upgrades with exact stat multipliers before investing materials.
- **Enemy Bestiary & Live Weather**: Enemy details now display live weather synergies and drop tables with current market gold values.

### Changed
- **Settings Overhaul**: Reorganized settings into an uncluttered layout with quick toggles for audio and appearance preferences.

## [2026-11-22]

### Added
- **Mobile Navigation Dock**: A responsive bottom dock on mobile devices that keeps your most-used tools one tap away.
- **Navigation Sidebar**: Streamlined desktop navigation into cleaner categories with an optional collapsed icon rail mode.
- **Toast Notifications**: Interactive feedback toasts for profile saves and export operations.

## [2026-11-18]

### Added
- **Forge Lessons Calculator**: Plan offline smithing training with exact burn times, EXP per hour, and gold costs.
- **Progression Goal Planner**: Pick any target level and find the most efficient training route.
- **Burn vs. Sell Inventory Tool**: Compares 91 materials against live market values to decide whether to smelt or sell.

### Changed
- **Multi-Character Sync**: Forge setups, queues, and inventories now save per character and switch instantly with your profile.
- **Class Modifiers**: Added Cursed and Forsaken character EXP penalties (-50%) to all training calculations.
