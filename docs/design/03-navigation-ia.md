# Zenith Design Standards: Navigation & Information Architecture

This document governs the navigation hierarchy, responsive viewport transitions, mobile dock ergonomics, and semantic landmark structure of Zenith Companion.

## 1. Hierarchy & Responsive Viewport Adaptations
* **Desktop Structure**: Persistent navigation drawer or sidebar along the left-hand edge. Primary web applications position global navigation on the left, utility tools in the header, and content in the main pane. Never hide desktop navigation behind a hamburger menu when viewport width allows visible options.
* **Mobile Structure (The 3 to 5 Rule)**: On viewports below 768px, navigation shifts to a persistent bottom dock (`DesktopDock.tsx` or `BottomDock.tsx`) resting in the ergonomic thumb zone.
  * Bottom dock accommodates 3 to 5 primary destinations maximum (Home/Dashboard, Database, Skilling, Economy, Profiles).
  * Exceeding 5 items causes crowding, touch target overlap, or horizontal carousels that destroy discoverability.
  * Secondary routes are accessed via an accessible command drawer or search modal (`Ctrl+K`).
* **Content Over Chrome**: Keep navigation chrome compact and clean. Do not let logos, utility badges, and breadcrumbs monopolize vertical viewport space above the fold.

## 2. Menu Engineering & Interaction Design (NN/g 17 Rules)
* **Orient the Player ("Where Am I?")**: The active route must always be visually prominent in both desktop sidebars and mobile tab bars using a contrasting background pill and filled icon indicator.
* **Front-Load Scanning Terms**: The first two words of any navigation label carry the highest cognitive signal. Front-load action and category nouns (e.g. "Alchemy Profit", "World Bosses", "Item Directory").
* **Click-Activated Submenus Only**: Never use hover-activated dropdown menus. Hover fails on touch devices, causes frustrating accidental dismissals, and excludes keyboard users. All submenus and disclosure containers must be click-activated.
* **Banish Multi-Level Cascading Flyouts**: Nested multi-tier dropdown menus violate the Steering Law and lead to mouse fall-off errors. Use flat mega menus, popovers, or dedicated routing landing pages instead.
* **Sticky Navigation Clearance**: On long scrolling pages, sticky headers must configure `scroll-padding-top` equal to header height so keyboard focus and hash anchor links never jump behind the header.

## 3. Apple HIG & Material 3 Mobile Navigation Principles
* **Navigation, Not Actions**: Bottom tab bars and docks exist exclusively for top-level navigation, not in-page actions. Use contextual toolbars or floating action buttons for operations.
* **Labeled Icons**: Always pair icons with brief single-word text labels beneath or beside the icon. Unlabeled navigation icons create ambiguity and increase interaction cost.
* **State Icon Differentiation**: Use filled icon variants for active states and outline variants for inactive states (Material Design 3 & Apple HIG convention).
* **Badge Discipline**: Badges (e.g. red circular count pills) must be strictly reserved for critical system events (e.g. data desync, failed import, critical alert). Diluting navigation tabs with decorative or marketing badges causes alert fatigue.

## 4. Semantic WAI-ARIA Landmark Regions
All pages must structure their DOM using HTML5 semantic landmark elements with appropriate accessible names:
* `<header>` (`role="banner"`): Page branding and top-level utility controls.
* `<nav aria-label="Main">`: Primary desktop sidebar or drawer.
* `<nav aria-label="Mobile Navigation">`: Mobile bottom dock.
* `<nav aria-label="Breadcrumb">`: Secondary hierarchy trail.
* `<main id="main-content">`: Central route content container.
* `<aside aria-labelledby="...">` (`role="complementary"`): Contextual side panels or stat sidebars.
* `<footer>` (`role="contentinfo"`): Legal, versioning, and community links.
* `<search>` or `<div role="search">`: Search input container.
* **Multiple Landmark Rule**: When multiple `<nav>` landmarks exist on the same page, each must carry a unique `aria-label`. Never include the word "navigation" inside the label itself (e.g. use `aria-label="Main"`, not `aria-label="Main Navigation"`).
