# Zenith Design Standards: Shell Chrome & Global Navigation Architecture (Tier 3)

This document records the exhaustive critical architecture review, component audit, and implementation blueprint for Tier 3: Shell Chrome & Navigation.

---

## 1. First-Principles Critical Review & Root-Level Questions

### A. Navigation System Fragmentation (Sidebar vs. Desktop Dock vs. Mobile Wheel)
* **Root Question**: Why does a web application for IdleMMO planning have three distinct navigation paradigms?
* **Analysis**:
  * `Sidebar.tsx`: 260px left column. Proven, stable, hierarchical. Easily hosts 25 routes organized into 4 logical groups.
  * `DesktopDock.tsx`: 257 lines of physics calculations (magnetic magnification `BASE_SIZE = 54`, `MAX_GROWTH = 17`, `MAX_LIFT = 9`). It hides textual labels behind icons, demands exploratory cursor hovering, and blocks 70px of vertical table space.
  * `MobileCommandWheel.tsx` & `MobileCommandWheelHost.tsx`: Radial pie-menu navigation with haptic audio cues. It cannot be used with a keyboard, fails screen reader semantics, and clashes with standard touch gestures.
* **Architecture Decision**:
  * **Retire `DesktopDock.tsx`**: Standardize desktop navigation on `Sidebar.tsx`. Add an optional 56px collapsed icon-rail mode for intermediate desktop viewports (1024px to 1280px).
  * **Retire `MobileCommandWheel.tsx`**: Replace mobile navigation with the standardized `BottomDock` primitive (top 4-5 thumb destinations) plus an accessible slide-out `Drawer` for the remaining routes.

### B. Header & Quickbar Markup Duplication
* **Root Question**: Why are `GlobalSearch` and `ProfileSwitcher` mounted twice on every page?
* **Analysis**:
  * In `src/app/layout.tsx`:
    * `<header className="top-navigation">` mounts `<MobileMenuBtn />`, `<GlobalSearch />`, and `<ProfileSwitcher compact />` (visible on <1180px).
    * `<div className="shell-quickbar">` mounts another `<GlobalSearch />` and another `<ProfileSwitcher />` (visible on >=1180px).
  * This doubles hook execution (`useProfiles()`, `useItemModal()`), attaches duplicate global `keydown` listeners for `Ctrl+K`, and inflates DOM node counts.
* **Architecture Decision**:
  * Consolidate into a single, unified `<ShellHeader>` component that adapts responsively via CSS rules without duplicating component instances.

### C. Hardcoded Inline Styles in `layout.tsx`
* **Root Question**: Why does `src/app/layout.tsx` contain 382 lines of raw `<style>` tags with hardcoded rgba values?
* **Analysis**:
  * Lines 203 to 585 of `layout.tsx` bypass the design token system and CSS modules, increasing page payload size on every route request.
* **Architecture Decision**:
  * Extract all layout, footer, and header rules into scoped CSS Modules (`Shell.module.css` and `SiteFooter.module.css`) binding directly to CSS variables (`--bg-base`, `--bg-panel`, `--border-subtle`).

### D. `ProfileSwitcher` Architecture: Menu vs. Listbox Decision
* **Root Question**: Should `ProfileSwitcher` be implemented as a `listbox` or as a `menu`?
* **Semantic Analysis**:
  * A pure **Listbox** (`role="listbox"`, `role="option"`) is strictly for value selection within forms. In WAI-ARIA, a listbox cannot contain interactive links or command buttons. Any non-option child triggers accessibility validation errors.
  * `ProfileSwitcher` requires two distinct capabilities:
    1. Selecting an active character from a mutually exclusive set (Main vs. Alts).
    2. Invoking an external action link: "Manage profiles" linking to `/profiles`.
  * The WAI-ARIA **Menu Button Pattern** (`aria-haspopup="menu"`) is designed specifically for this exact structure:
    * The popup container carries `role="menu"`.
    * Character choices carry `role="menuitemradio"` with `aria-checked="true|false"`.
    * The bottom link carries `role="menuitem"`.
    * Keyboard navigation: Arrow keys move through items, `Enter`/`Space` activates the option or follows the link, `Escape` dismisses the menu and restores focus to the trigger.
* **Architecture Decision**:
  * Implement `ProfileSwitcher` using the **Menu Button pattern** (`role="menu"` with `menuitemradio` items for profiles and `menuitem` for the manage link).
  * On compact mobile screens (<600px), wrap the menu in a bottom sheet (`ModalSheet`) for ergonomic thumb reach.

### E. `RotatingTips` vs. Toast & Banner Collision
* **Root Question**: Does an IdleMMO player want an unsolicited tip card popping up in the bottom-right corner every 52 seconds?
* **Analysis**:
  * Auto-popup cards disrupt user concentration, fight with toasts, and block mobile touch targets.
* **Architecture Decision**:
  * Remove the 52-second automated interval timer.
  * Move tips into an on-demand "Tips & Shortcuts" trigger in the footer or command palette (`Ctrl+K`).
  * Contextual notices remain strictly static, dismissible helper cards on their respective pages.

### F. `DataFreshnessBanner`
* **Root Question**: Why is data freshness displayed as a floating card over the bottom-left of the page?
* **Analysis**:
  * If data is older than 24 hours, the box stays permanently pinned, covering table rows and footer links.
* **Architecture Decision**:
  * Remove the fixed floating card.
  * Integrate data freshness as a subtle status dot/pill in the unified header. Clicking it opens a `Popover` with last sync details and manual refresh controls.

---

## 2. Unbuilt Components Required for Tier 3 Shell Chrome

From the 38-component catalog, the following 12 unbuilt primitives are required to complete Tier 3:

### 1. `BottomDock` [Priority: High]
* **Target Role**: Persistent mobile navigation bar resting in the bottom thumb zone (Apple HIG / Material 3).
* **Specifications**: Fixed position at viewport bottom with safe-area padding; 4 to 5 labeled icon buttons (`Home`, `Databases`, `Tools`, `World`, `More`); active pill indicator.

### 2. `Drawer` / `SideSheet` [Priority: High]
* **Target Role**: Full slide-out navigation sheet on mobile when tapping "More", housing all 25 application routes.
* **Specifications**: Full height (`100dvh`); backdrop blur overlay; body scroll lock; focus trap; `Escape` dismiss.

### 3. `Popover` [Priority: High]
* **Target Role**: Anchored floating containers for `ProfileSwitcher`, `DataFreshness` details, and desktop quick actions.
* **Specifications**: HTML Popover API / Portal; Floating UI edge collision flipping; `overscroll-behavior: contain`; mobile bottom-sheet fallback.

### 4. `Select` / `Dropdown` [Priority: High]
* **Target Role**: Accessible profile picker inside the `ProfileSwitcher`.
* **Specifications**: `role="combobox"` + `aria-haspopup="listbox"`; keyboard arrow navigation; native `<select>` fallback on mobile.

### 5. `Tooltip` [Priority: High]
* **Target Role**: Supplementary hover/focus labels for collapsed sidebar rail icons, header utility buttons, and status indicators.
* **Specifications**: `role="tooltip"`; `aria-describedby`; 200ms delay; WCAG 2.2 SC 1.4.13 hoverable compliance.

### 6. `CommandPalette` / `SearchModal` [Priority: High]
* **Target Role**: Global `Ctrl+K` search modal (`GlobalSearch.tsx`).
* **Specifications**: Searchable list across 25 routes, 1,355 items, enemies, bosses, and guilds; grouped sections; arrow key navigation; recent history.

### 7. `SearchInput` [Priority: High]
* **Target Role**: Search input field inside the Command Palette and the header trigger.
* **Specifications**: Leading search icon; trailing clear button (`✕`); `Ctrl+K` keycap pill; 150ms debouncing.

### 8. `Accordion` / `Collapsible` [Priority: High]
* **Target Role**: Collapsible sidebar navigation groups (General, Databases, Planning Tools, World & Encounters).
* **Specifications**: Accessible disclosure pattern (`aria-expanded`, `aria-controls`); animated height transition; localStorage state persistence.

### 9. `Avatar` / `EntityIcon` [Priority: High]
* **Target Role**: Profile avatar display in the header switcher and mobile drawer.
* **Specifications**: Character portrait with game rarity border glow, fallback initials, and total level badge.

### 10. `Kbd` [Priority: Medium]
* **Target Role**: Visual keycap indicator for keyboard shortcuts.
* **Specifications**: Monospace font; physical keycap border and drop-shadow styling; used for `Ctrl`, `K`, `Esc`, `1`-`9`.

### 11. `Divider` / `Separator` [Priority: Medium]
* **Target Role**: Accessible visual and structural divider between navigation groups and header utility zones.
* **Specifications**: `role="separator"`; horizontal and vertical variants; bound to `--border-subtle`.

### 12. `Skeleton` [Priority: High]
* **Target Role**: Loading placeholders for active character profile and data freshness during client hydration.
* **Specifications**: Exact dimension matching; `aria-busy="true"` on parent; `aria-hidden="true"` on shapes; single live region status announcement.
