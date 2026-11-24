# Zenith Design Standards: Search, Filters & Forms

This document governs the engineering and interaction design of all search inputs, filter toolbars, facets, form fields, and combobox dropdowns across Zenith Companion.

## 1. Search Usability (Nielsen Norman Group Research)
* **Search Must Be a Visible Box**: Research shows users scan for "the little box where I can type." Replacing a search link with an explicit input box increased search engine utilization by 91%. In dense tool pages (`/items`, `/bosses`, `/dungeons`, `/lore`), the search input must always be rendered as a prominent text box, never hidden behind an icon click.
* **First Query is Golden**: User success on query reformulation drops precipitously (Query 1: 51%, Query 2: 32%, Query 3: 18%). Nearly half of users abandon search entirely after one failed attempt. Search matching must be forgiving:
  * Mean user query length is 2.0 words. Never require Boolean syntax (`AND`, `OR`, `+`).
  * Implement case-insensitive, trimmed substring matching and token prefix matching across item names, enemy names, and locations.
* **Scope Discipline**: Default search scope must always be "all". If a scoped search returns zero results, immediately surface a one-click affordance to enlarge or clear the search scope.

## 2. Filters vs. Facets (Progressive Disclosure)
* **Distinction**: A *filter* analyzes content along a single dimension to exclude items. *Faceted navigation* describes items along multiple orthogonal dimensions simultaneously (e.g. Item Type, Rarity Tier, Level Range, Market Value).
* **Interaction Cost**: Exposing 30 facet controls at once overwhelms working memory and creates visual fatigue. Zenith implements progressive disclosure:
  * Expose 1 to 3 high-frequency primary filters directly above tables or feeds (Search, Rarity, Category).
  * Enclose secondary attributes and fine-grained range sliders within accessible drawers, filter chips, or collapsible popovers.
* **Query Echoing & Reset**: When filters yield zero matches, echo the active parameters back to the player and provide a single primary button: "Clear all filters".

## 3. Web Form Design (CHI Empirical Usability Standards)
Forms compliant with structured usability guidelines achieve a 78% first-try completion rate compared to 42% on non-compliant forms (Seckler et al., CHI).
1. **Single Column Flow**: Always arrange form fields in a single vertical column. Multiple columns disrupt downward momentum and force visual reorientation.
2. **Label Proximity**: Labels must be placed directly above input fields on mobile and desktop card forms. Ambiguous spacing where a label is equidistant from two inputs is banned.
3. **Never Substitute Placeholders for Labels**: Placeholder text disappears on focus, strains short-term memory, and fails WCAG contrast requirements. Always use permanent, semantic `<label>` elements.
4. **Input Size Parity**: Width of an input should reflect expected content length (e.g. 8-10ch for item counts or prices, full width for names).
5. **Input Requirements Up Front**: State format rules (e.g. "Numbers only", "Paste character hashed ID") in static helper copy before user input, never as an ambush error after submission.
6. **Multi-Cue Error Feedback**: Never indicate invalid state through color alone. Combine border highlight (`--border-danger`), alert icon (`AlertCircle`), and clear error copy linked via `aria-describedby`.
7. **Banish Clear and Reset Buttons**: Clear form buttons risk catastrophic data loss and provide zero value to users.

## 4. WAI-ARIA Combobox & Dropdown Architecture
Custom select controls and searchable item comboboxes must strictly follow the W3C WAI-ARIA Combobox Pattern and headless component best practices (Radix UI, React Aria, Base UI):

### Select vs. Combobox vs. Menu Button Distinctions
* **Select (`role="combobox"` + `aria-haspopup="listbox"`)**:
  * Used to choose a single discrete value from a closed list without arbitrary text input.
  * Use a native `<select>` for short lists and on mobile screens where the mobile operating system's native wheel picker provides superior thumb ergonomics.
  * For custom desktop selects, consume Radix UI Select (`@radix-ui/react-select`) or React Aria Select. Structure: `Root`, `Trigger`, `Value`, `Icon`, `Portal`, `Content`, `Viewport`, `Item`, `ItemText`, `ItemIndicator`, and `ScrollUpButton` / `ScrollDownButton`.
  * Positioning: Supports Popper (anchored below/above trigger) or item-aligned modes.
  * Never use `role="menu"` for pure value pickers.
* **Combobox (`role="combobox"` + `aria-autocomplete="list"`)**:
  * Used when the dataset is large or requires real-time substring filtering (e.g. Zenith's 1,355 items, recipes, or enemies).
  * Two distinct operational paradigms:
    1. Free-text search suggestion: User may submit any arbitrary query, popup offers completions or history. `aria-autocomplete="list"`. On blur, typed text remains in the field.
    2. Strict picker: Field value must strictly be an item from the pre-defined list. On blur, any uncommitted arbitrary text resets or reverts to the previously selected valid item.
  * DOM focus strictly stays inside the `<input>` element. Visual active option is tracked via `aria-activedescendant="<option-id>"`.
  * Trigger exposes `aria-expanded="true|false"` and `aria-controls="<listbox-id>"`.
  * Escape key behavior: First `Escape` press closes the dropdown listbox; second `Escape` press clears the typed text query.
  * Match count announcement: Match count is announced politely via an offscreen live region (`aria-live="polite"`). Show an explicit "No matching records found" row rather than collapsing to an empty box.
  * Scrolling requirement: Browsers do not automatically scroll elements referenced by `aria-activedescendant`. JavaScript must invoke `element.scrollIntoView({ block: "nearest" })` whenever the active descendant updates.
  * Forced colors / High Contrast: Set `forced-color-adjust: auto` and use `currentColor` for SVG indicator arrows so icons remain legible in Windows High Contrast / Forced Colors modes.
* **Menu Button (`role="button"` + `aria-haspopup="menu"`)**:
  * Exclusively for triggering actions, commands, or navigation options (e.g. "Export Data", "Clear Overrides", "Manage Profiles", character switcher).
  * Trigger: `aria-haspopup="menu"`, `aria-expanded="true|false"`, `aria-controls="<menu-id>"`.
  * Keyboard: `Enter`, `Space`, or `Down Arrow` opens menu and focuses first item; `Up Arrow` opens menu and focuses last item.
  * Item Roles: Standard commands use `role="menuitem"`. Mutually exclusive selectable choices (such as active profile selection) use `role="menuitemradio"` with `aria-checked="true|false"`. Navigation links within the menu use `role="menuitem"` wrapping an anchor.

### Baymard 9 UX Best Practice Design Patterns for Autocomplete Suggestions
Derived from Baymard Institute's 200,000+ hour usability benchmark (where only 19% of sites implement autocomplete correctly):
1. **Manageable Suggestion Count**: Cap suggestions to at most 10 items on desktop and 4 to 8 on mobile. Exceeding 10 choices creates choice paralysis and visual noise.
2. **Distinct Category Scopes**: When offering scoped suggestions (e.g. "Iron Ore in Gathering"), style the scope label with italics, indentation, or a secondary badge to prevent confusion with raw query terms.
3. **Highlight Predictive Text (Not Typed Text)**: Highlight what is novel or predictive in bold, leaving the user's typed prefix in regular weight. Bolding the characters the user already typed creates repetitive visual noise.
4. **Avoid Inline Scrollbars**: Keep suggestion counts bounded so the popup expands to natural height without forcing an internal scroll container.
5. **Reduce Visual Noise**: Keep autocomplete dedicated strictly to queries, without distracting ads, promotions, or excessive borders.
6. **Active Suggestion Feedback**: Highlight active suggestions with background shading and a pointer cursor on mouse hover and keyboard navigation.
7. **Visual Depth & Elevation**: Dim or darken background content slightly or provide clear card elevation and borders so the dropdown stands out against busy page content.
8. **Mobile External Competition**: Do not sandwich mobile autocomplete between sticky headers, app banners, and soft keyboards. Fit suggestions cleanly into the mobile viewport.
9. **Touch Target Sizing & Spacing**: Provide at least 44x44px touch targets on mobile with clear line separation to eliminate mistaps.

### Headless Foundation Rule
Never hand-roll custom state machines for Comboboxes or Selects from scratch. Hand-rolled implementations consistently fail edge-case keyboard focus traps, screen reader announcement trees, and mobile virtual keyboard interactions. All custom select and combobox components in `src/components/ui/` must build on tested headless primitives (Radix UI, React Aria, Base UI) or strictly match the W3C APG state chart using Floating UI for anchor positioning and viewport collision flipping.

### W3C ARIA Listbox Specifications
* **Listbox Container**:
  * Role: `role="listbox"`, `id="<listbox-id>"`.
  * Accessible Name: Mandatory via `aria-labelledby` or `aria-label`.
  * Orientation: `aria-orientation="vertical"` (default).
  * Multi-select: `aria-multiselectable="true|false"`.
  * Padding, elevation, and backdrop matching `--bg-panel` and `--border-strong`.
  * Scroll containment: `overscroll-behavior: contain` and `scrollbar-gutter: stable`.
* **Option Items**:
  * Role: `role="option"`, `id="<option-id>"`.
  * Selection state: `aria-selected="true|false"`. Never mix `aria-selected` and `aria-checked` within the same listbox.
  * Minimum touch target: 44px on mobile devices.
  * Active selection cue: Checkmark icon or distinct text weight (never color alone).
  * Flat string semantics: Screen readers compute a flat text name from option content; child HTML formatting (headings, badges) loses semantic structure. Keep option labels concise and front-loaded with unique terms (avoid identical prefixes).
  * Prohibition on interactive children: An `option` MUST NOT contain links, buttons, or checkboxes. If options require child actions, use the Grid or Menu pattern.
* **Keyboard Navigation in Listbox**:
  * `Down Arrow` / `Up Arrow`: Move focus to next/previous option.
  * `Home` / `End`: Move focus to first/last option (mandatory for lists >5 items).
  * Typeahead: Typing characters moves focus to matching option prefix immediately.
  * In single-select listboxes, selection may follow focus automatically, or require `Space` / `Enter` to commit when selection triggers high-cost recalculations.

### Keyboard Navigation Matrix
* `Down Arrow`: Opens popup if collapsed, moves active descendant to next option.
* `Up Arrow`: Moves active descendant to previous option.
* `Enter`: Commits the active option, closes popup, and updates input value.
* `Escape`: First press dismisses popup without altering previous value; second press clears input.
* `Home` / `End`: Jumps to first or last item in the listbox.
* `Alt + Down Arrow`: Opens popup without shifting selection.

## 5. Form Validation & Native Web Standards
* Leverage HTML5 Constraint Validation (`required`, `type="number"`, `min`, `max`, `step`).
* Use `:user-invalid` CSS pseudo-class to ensure error styles only appear after the user has interacted with the field, preventing red error states on pristine page loads.

## 6. SearchInput & Landmark Architecture (`SearchInput.tsx`)
The primary search input on table pages (`/items`, `/bosses`, `/dungeons`, `/lore`) must implement these web standards:
* **Semantic Search Landmark**:
  * Wrap the search control in a semantic `<search>` element (or `<form role="search">`). This exposes a dedicated Search Landmark to screen readers for instant navigation.
  * If multiple search inputs exist on the same page, differentiate them using `aria-label` (e.g. `aria-label="Filter items catalog"` vs `aria-label="Global search"`).
* **Native Input Semantics (`<input type="search">`)**:
  * Use `type="search"` rather than `type="text"`.
  * Provides native clear button support across browsers and triggers `search` events on clear.
  * Pressing `Escape` while focused clears typed query text.
* **Keyboard Shortcut Binding (`aria-keyshortcuts`)**:
  * Annotate the input with `aria-keyshortcuts="Control+K Meta+K"` so assistive technology announces the shortcut.
  * Render a visible `<kbd>` badge inside or adjacent to the input (e.g. `Ctrl K` on Windows, `⌘K` on macOS) to educate keyboard users.
* **Proactive Box Width (NN/g)**:
  * Minimum width of 25ch to 30ch on desktop to prevent typed queries from scrolling horizontally out of view.
  * On mobile viewports, expand to full width (`100%`) within the filter card or toolbar.

## 7. CommandPalette / SearchModal Architecture (`CommandDialog.tsx`)
The global command palette is an accessible Modal Combobox built on `cmdk` and wrapped in an accessible dialog:
* **Modal Combobox Pattern**:
  * Built using `cmdk` (`Command.Dialog`, `Command.Input`, `Command.List`, `Command.Empty`, `Command.Group`, `Command.Item`).
  * Never hand-roll custom state machines for command menus. `cmdk` handles fuzzy filtering, rank sorting, and keyboard routing out of the box.
* **Strict Focus Management**:
  * DOM focus strictly stays anchored in `<Command.Input>`.
  * Visual highlight and assistive technology cursor move through items using `aria-activedescendant="<item-id>"`. Focus is never stolen from the input field.
* **Results Announcement**:
  * Result counts and empty state changes are announced politely to screen readers via an offscreen live region (`aria-live="polite"`).
* **Keyboard Matrix**:
  * Global shortcut: `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS) opens or closes the palette from anywhere on the site.
  * `Down Arrow` / `Up Arrow`: Navigates between results across groups.
  * `Enter`: Commits the selected command or navigates to the target page.
  * `Escape`: Dismisses the palette and restores DOM focus to the previously active element.
* **Item Aliasing & Keywords**:
  * Every command item can provide search keywords (e.g. "settings", "options", "preferences", "config" for `/settings`) so players find destinations regardless of phrasing.
