# Zenith Design Standards: Tabs & In-Page View Switching

This document defines the architecture, keyboard navigation, URL synchronization, and accessibility requirements for tabs and view switchers across Zenith Companion.

## 1. When to Use Tabs vs. Navigation Links (NN/g & Material 3)
* **In-Page View Switching Only**: Tabs switch views within the same page context without a full page refresh. If switching an option alters the core URL path or represents a distinct top-level destination, use semantic navigation links (`<nav>`, `<a>`) instead of tabs.
* **NN/g Tab Distinction Matrix**:
  * In-Page Tabs: Narrow scope, related views of the same data, embedded within layout, instantaneous switching, default tab always selected upon initialization.
  * Navigation Tabs: Broad scope, navigating to different routes, distinct URLs, slight loading delay expected.
  * Never mix navigation links and in-page tabs in the same control. Doing so disorients users and destroys spatial predictability.
* **Mutual Exclusivity**: Only one tab panel is visible at a time. The active tab represents the currently active view of that dataset.
* **Parallel Content Types**: Tabs must represent parallel, alternate views of the same scope (e.g. Atlas vs. Timeline vs. Characters in `/lore`, or Recipes vs. Lessons in `/forge`). Never use tabs to guide users through sequential, multi-step processes (use a Stepper / Wizard).
* **Single Row Positioned Above Panel**: Stacking multiple rows of tabs is strictly prohibited because it breaks spatial memory and destroys proximity when tabs shift positions. The tab list must always be positioned directly above its associated panel.
* **Flat Structure (No Nested Tabs)**: Never nest a tab set inside another tab set. Hierarchical navigation must use sidebars, drawers, or secondary filter chips.

## 2. WAI-ARIA Tabs Pattern & Keyboard Matrix
All tab implementations (`src/components/ui/Tabs.tsx`) must strictly adhere to the W3C WAI-ARIA Tabs Pattern:

### Roles & Structural Relationships
* **Container**: `role="tablist"` with `aria-label` or `aria-labelledby` describing the collection (e.g. `aria-label="Lore archive views"`).
* **Triggers**: Each tab item must carry `role="tab"`, `id="<tab-id>"`, `aria-controls="<panel-id>"`, and `aria-selected="true|false"`.
* **Panels**: Each tab content pane must carry `role="tabpanel"`, `id="<panel-id>"`, `aria-labelledby="<tab-id>"`, and `tabIndex={0}` if it contains no initial focusable elements.

### Roving Tabindex & Keyboard Navigation
* The active tab has `tabIndex={0}`; all inactive tabs have `tabIndex={-1}`.
* Keyboard focus moves through the tabs using Arrow keys:
  * `Left Arrow` / `Right Arrow`: Moves focus to previous or next tab. Wraps around at ends.
  * `Home`: Jumps focus to first tab.
  * `End`: Jumps focus to last tab.
  * `Tab`: Moves focus out of the tablist and into the active tabpanel (or first focusable control inside the panel).
* **Automatic vs. Manual Activation**:
  * *Automatic Activation* (selection follows focus immediately): Used only when switching panels is instant, lightweight, and causes zero network latency.
  * *Manual Activation* (focus moves with arrows, `Enter` or `Space` commits activation): Required if switching panels triggers expensive calculations, fetches data, or unmounts heavy DOM subtrees.

## 3. URL Synchronization & Linkability (Next.js App Router)
* **Query Parameter Synchronization**: The active tab must synchronize with a URL query parameter (e.g. `?tab=overview`).
* **Deep Linking**: A player sharing or bookmarking a URL must land directly on the intended tab view.
* **History State Management**: Use `router.replace` with `scroll: false` for in-page view switches to avoid flooding the browser history stack with dozens of back-button entries. Use `router.push` only if the user specifically expects back-button history navigation between major analytical modes.
* **Initial State Fallback**: On first render, inspect `searchParams.get("tab")`. If present and valid, activate it; otherwise fall back cleanly to `defaultValue`.
* **Deferred / Lazy Panel Mounting**: To conserve memory and DOM node budget, render the active panel and keep inactive panels unmounted (or marked with the HTML `hidden` attribute).

## 4. Visual Ergonomics & Active State Indicators (NN/g 2-Indicator Rule)
* **At Least Two Visual Selection Indicators**: Never communicate the active tab using color alone. Combine at least two distinct indicators:
  1. Visual boundary: Horizontal underline indicator (minimum 2px height) or filled capsule pill.
  2. Distinct font styling: Bold font weight (`font-weight: 700` vs `500`).
  3. High contrast: Minimum 4.5:1 text contrast against background.
* **Unselected Tab Legibility**: Unselected tab labels must remain clearly visible (at least 4.5:1 contrast against surface). Faded, low-contrast unselected tabs prevent users from discovering alternative views.
* **Scrollable Tab Rails**: When tab counts exceed viewport width on mobile devices:
  * Enable horizontal scrolling (`overflow-x: auto`) with `scrollbar-width: none`.
  * Display a subtle edge fade gradient on the overflowing edge to indicate hidden content.
  * Auto-scroll the active tab into view upon selection (`scrollIntoView({ inline: "nearest" })`).

## 5. Disclosure vs. Accordion Architecture (W3C APG & Radix Primitives)

### Sidebar Navigation: Disclosures, NOT Accordions
* **Independent Open States**: Sidebar navigation groups (e.g. Tools, World, Databases) must open and close independently. A player exploring Market tools while referencing Lore should not have their tools menu forcibly collapsed.
* **Why Accordion is Banned for Sidebar Nav**: An Accordion typically enforces single-panel mutual exclusivity (opening section B automatically collapses section A). In shell navigation chrome, auto-collapsing disrupts spatial orientation and causes unwanted layout shift.
* **Radix Collapsible Implementation (`Collapsible.tsx`)**:
  * Build sidebar groups using Radix Collapsible (`Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Content`) following the W3C Disclosure Navigation pattern.
  * Structure: Group trigger is a native `<button aria-expanded="true|false" aria-controls="<group-content-id>">`.
  * Content is a semantic `<ul>` containing navigation links (`<a>`).
  * Active page link carries `aria-current="page"`.
  * Tabbing flows naturally into the list of links without requiring complex roving tabindex.
  * If focus is inside an expanded group, pressing `Escape` closes the group and returns focus to the disclosure trigger button.
* **Smooth Animation**: Use CSS variable `--radix-collapsible-content-height` with hardware-accelerated CSS `height` transitions and `overflow: hidden`.

### In-Page Content Chunking: Accordion (`Accordion.tsx`)
* **Permitted Uses**: For dividing long, dense documentation or multi-part settings on a single page (e.g. FAQ items, calculation formula breakdowns, detailed patch note entries).
* **Radix Accordion Implementation**:
  * Compound parts: `Accordion.Root`, `Accordion.Item`, `Accordion.Header`, `Accordion.Trigger`, `Accordion.Content`.
  * Heading wrapping: Header buttons must be wrapped in semantic heading elements (`<h3><Accordion.Trigger>...</Accordion.Trigger></h3>`).
  * Panel role: Content panels expose `role="region"` and `aria-labelledby="<header-button-id>"`. Avoid landmark proliferation by limiting regions to fewer than 6 per page.
  * Mode control: Supports `type="single"` with `collapsible={true}` (one section open at a time, or all closed), or `type="multiple"` when cross-section comparisons are required.
