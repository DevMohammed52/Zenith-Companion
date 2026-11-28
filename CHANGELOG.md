# Changelog

All notable changes to Zenith Companion will be documented in this file.
Updates are organized chronologically by release date.

## [2026-11-28]

### Added
- **Scenic Character Spotlight with Membership Styling (`/`)**: Rebuilt `/` around a borderless character showcase over your IdleMMO background vista with gold gradient membership names and badge icons, equipped pet sprites scaled proportionally beside your hero, Gear/Pets/Museum quick counts, and a compact aligned **Top Gold Routes** leaderboard.
- **Rotating Zone Weather & Scenic World Boss**: Paired **World Boss** countdowns with native location backgrounds and hovering boss sprites, alongside a **Current Weather** card that rotates smoothly from **Bluebell Hollow** through **The Citadel** with live weather animations, zone artwork, and active buffs.
- **Interactive 404 Route Finder & Error Recovery**: Rebuilt the Not Found, Error, and Loading pages with closest-match URL suggestions, live route and item search, a copyable error reference code, and one-click recovery options that keep saved profiles and crafting queues intact.

### Changed
- **Faster Loading & Lighter Data Usage**: Streamlined page styles and item data loading across the site so pages and item popups open quicker while using less mobile data.
- **Zero Shell Redundancy & Plain Labels**: Removed duplicate profile dropdowns, filter tabs, vague weather counts, `Idle cap` text, and the blocking first-run setup popup in favor of simpler headings (**Top Gold Routes**, **World Boss**, **Current Weather**, **Market Movers**, **Gear & Tools**, **Recent & Notes**).

### Fixed
- **Forge Planner Dashboard Count (`/`)**: Fixed the Home Dashboard showing `0 crafts` when your active character has saved craft plans in Forge Crafting.
- **Dashboard Quick-Filter Links (`/items`, `/alchemy`, `/skill-profit`)**: Fixed clicking items or recipes from **Top Gold Routes** and **Market Movers** on `/` so Items Directory, Alchemy Profit, and Skill Profit now pre-fill the search box and filter straight to your selection.
- **Stale Counts & Layout Shifts**: Replaced outdated pet species counts (`109` -> `47`) and placeholder status labels with live computed values, stopped initial loading jumps, and enlarged mobile touch targets for easier tapping.

## [2026-11-27]

### Added
- **Best-in-Slot Gear Table & Next Upgrades (`/bis`)**: Rebuilt `/bis` around a scannable 9-slot **Gear Table** (**Sword**, **Dagger**, **Bow**, **Shield**, **Helmet**, **Chestplate**, **Gauntlets**, **Greaves**, **Boots**) showing `Cost`, individual combat stats (`Agi`, `Acc`, `AP` / `Prot`, `Crit %`, and flat `Crit Dmg`), `Total`, `Gold / Stat`, quality BiS rank badges, and level requirements across **T1 Base**, **Optimal Tier**, and **Max Tier** scaling for all **306** combat items, paired with a 1-row-per-slot **Next Upgrades** planner, toggleable Equip/Unequip actions, click-to-inspect upgrade stone modal, and a What-If **Loadout Setup** drawer.
- **Direct In-Game Market Shortcut**: Added a one-click **Buy on Market** (for tradeable items) or **Inspect in Game** button inside **Item Details** opening the item's live `web.idle-mmo.com/item/inspect/...` page directly.
- **Crafting Cart Shopping List & Cost Breakdown**: Focused **Crafting Cart** (`/crafting`) on repeatable Lv 1–89 Alchemy recipes as a recipe shopping cart showing total gold needed, estimated return and net profit (synced with Membership tax and Bartering), interactive In-Bank checkboxes that subtract owned supplies, and one-click **Copy List**.
- **Mythic Lab 21-Recipe Comparison & What-If Loadout**: Added an **All 21 Recipes** view to Mythic Lab (`/alchemy/mythic`) with category tabs (**Potions**, **Essence Crystals**, **Stat Essences**), **30-Use Recipe** vs **Owned Recipe** pricing toggle, **Table** and **Cards** views, synced + temporary What-If **Loadout & Boosts** drawer, and live **EXP/hr** (Alchemy and base Speed EXP).
- **Alchemy Loadout, EXP & Cart Integration**: Added a synced **Loadout & Boosts** drawer to Alchemy Profit with What-If Class, Conquest, Bartering, Ascension, Energizing Pool, and **Distillation Rig** controls, live **EXP/hr** (Alchemy and base Speed EXP), category tabs, **Hourly** vs **Session** toggle, and one-click actions sending recipes directly to **Crafting Cart** (`/crafting`).
- **Forge Loadout & Boosts Panel**: Added a **Loadout & Boosts** drawer to Forge Lessons for Membership, Blacksmith class, Guild Conquest, Energizing Pool, Ascension perks, and Cursed or Forsaken EXP effects, alongside **Temper Shard** estimates and Strength EXP totals in Forge Crafting.

### Changed
- **Minimal Crafting Cart Layout**: Removed the session capacity bar, extra setup drawers, and queue presets on `/crafting` in favor of a single search-and-add bar, clean tabular numbers, undoable **Clear All**, and a sticky **Shopping List** once recipes are added.
- **Mythic Lab Redesign**: Rebuilt `/alchemy/mythic` with a 4-cell spotlight (**Best Profit / Hr**, **Max EXP / Hr**, **Pinned Return**, **Catalog Pulse**), Profit/hr recipe pins, item and gold coin icons across material ledgers, accessible **Uses Remaining** steppers, and cleaner mobile project cards.
- **Alchemy Profit Redesign**: Reworked Alchemy Profit (`/alchemy`) so the recipe table and top gold, EXP, and volume routes appear immediately above the fold with item and coin icons, **Table** and **Cards** views, and a tabbed **Strategy** modal (**Inputs**, **Paths & EXP**, **Batch Queue**).
- **Forge Planner Redesign**: Reworked **Forge Lessons** (`/forge`, `/forge/lessons`) and **Craft Item** (`/forge/craft`) with a top spotlight for your active plan or best material route, **Goal Planner** and **My Stock** tools, item icons, and cleaner mobile cards.

### Fixed
- **Critical Stats Clarity & Equipment Pricing (`/bis`)**: Split weapon `Crit` into clear **`Crit %`** and flat **`Crit Dmg`** columns without false `%` suffixes on flat bonus crit damage, prevented equipping the same gear piece twice, and replaced misleading `Vendor sell` labels on Mythic and unlisted gear with `No market listings`.
- **Inline Button Icon Spacing**: Added clean spacing between inline icons and labels across action buttons so text never sits flush against leading icons.
- **Best-in-Slot Missing Forge Gear & Dual Daggers**: Restored all **81** crafted metal armour/weapon and wooden bow recipes to `/bis` (bringing the catalog from 225 to all **306** combat items, including `Dreadbane Armour` and `Soulguard Armour`), read profile Combat, Strength, Dexterity, and Defence levels accurately, and added **Dual Daggers** main/offhand slot comparisons.
- **Items Directory Tradeable Filter & Initial Loading Shift**: Kept tradeable items without recent market sales (including `Bunny Ears` and 107 other tradeable items) visible under **Tradeable only** on `/items`, while stabilizing initial loading skeletons across desktop and mobile viewports.
- **Crafting Cart Purchase Pricing & Picker Alignment**: Stopped falling back to NPC sell values as market buy prices on unpriced Crafting Cart materials (while keeping NPC vial prices accurate), excluded starter guest profiles from Bartering lookup, fixed the recipe picker reopening over **Add to Cart** after selecting a recipe, and aligned picker, stepper, and button heights.
- **Mythic Craft Speed, Class Bonuses & Contrast**: Fixed Mythic Lab using a pre-reduced base duration (`1500s` / `25m` before Membership and efficiency bonuses instead of `1363.6s`), included Alchemist, Ascension, and Pool buffs, excluded starter guest profiles from synced loadouts, removed initial sync banner layout shifts, and improved active sidebar level badge contrast.
- **Alchemy Break-Even Math & Forge Dropdowns**: Fixed ingredient break-even prices using crafting return rather than raw liquidation value on "Sell inputs" routes, kept Cursed and Forsaken EXP penalties accurate, fixed Forge recipe dropdown transparency, and stopped Forge material rows from shifting during profile hydration.

## [2026-11-26]

### Added
- **Construction Material Recipes**: Added crafting recipes for all 9 Construction materials (`Weak Plank`, `Brick`, `Iron Fitting`, `Weak Beam`, `Glass`, `Robust Plank`, `Robust Beam`, `Strong Plank`, and `Strong Beam`) so you can see required materials and what each log, clay, sand, limestone, or iron bar crafts into.
- **Seasonal Event Dungeons**: Kept the 4 seasonal campaign dungeons (`Pumpkin Hollow`, `Silverleaf Enclave`, `Wickedroot Patch`, and `Stone Hollow`) visible in Dungeon Planner with event badges and bonus mastery experience.
- **Skill Profit Session & EXP View**: Added an hourly EXP column, active profile level indicators, and a switch between hourly profit and full idle-session profit based on your housing bonuses.

### Changed
- **Skill Profit Redesign**: Reworked Skill Profit so your top routes and profit table appear right away without scrolling, organized into 7 repeatable skill tabs with a cleaner filter bar, a slide-out **Loadout & Boosts** panel, and a clearer strategy calculator modal (while moving Forge gear recipes cleanly to the Forge Planner).
- **Item Details Modal Redesign & Quality Gradients**: Simplified the Item Details window to remove repeated rarity labels and duplicate tier stats, added a quick 4-stat summary strip for Vendor, Market Net, Craft Margin, and Volume, added direct links to Forge, Alchemy, and Skill Profit tools, and matched IdleMMO's exact rarity colors and Mythic/Unique vertical gradients across item names, badges, and filters.
- **Dungeons, Bosses, Profiles & Patch Notes Overhaul**: Rebuilt Dungeon Planner, World Bosses, Character Profiles, and IdleMMO Patch Notes into cleaner layouts with top recommendations above the fold, searchable character pickers, batch boss circuit selection, chronological patch accordions, and full mobile bottom-sheet support.

### Fixed
- **Dungeon Profit & Armour Recipe Valuation**: Fixed Dungeon Planner subtracting the full entry fee cleanly instead of double-counting shard value, labeled shards clearly (`No shards` on Lv 1–65 dungeons), and linked dungeon `Armour` recipes accurately.
- **Synced Recipe Experience & Uses**: Updated all 370 Forge and Alchemy recipes with accurate crafting skill/stat EXP rewards and remaining uses (`Infinite` for standard Alchemy, `30` uses for Mythic Alchemy, `1` use for Forge).
- **Skill Profit Steppers & Tool Bonuses**: Fixed the Bartering Level `+` button resetting back to zero, rounded awkward decimal crafting times, updated Fishing rod levels/bonuses (`Moonshimmer Hook` Lv 35, `Hydra's Coil` Lv 45), and matched equipped tool names regardless of capitalization.
- **Item Deep-Link Dismissal**: Fixed pressing Escape or closing Item Details on `/items?name=...` links immediately re-opening the popup.

## [2026-11-25]

### Added
- **Guilds Spotlight, Open Slots & Conquest Join**: Guild Database now highlights your active profile's guild alongside the Top 3 Season Podium, shows wiki-calibrated roster capacity and open recruitment slots, and joins live Conquest zone rankings and assault statuses directly to every guild row and detail modal.
- **World Map Travel Cost & Territory Links**: Added calibrated distance, teleport gold cost (with Banished and Cursed class discounts), and walk-time estimates from your active character's location directly in World Map, alongside live Conquest control bars, house-location badges, Weather Guide links, and Lore links.
- **Conquest Season Archive**: You can now browse past conquest seasons (**Season 3** through **Season 12**) alongside the current season in Conquest, complete with zone winners, paginated contributor rankings, and historical control shares.
- **Conquest Buffs, Shards & Live Assault Timers**: Conquest now shows live assault wave countdowns, resolves each top contributor's guild badge, displays guild levels, and provides a top-level **Buffs & Shards** guide for Territory Ruling Buffs (Ranks 1–10) and Zone Shard payouts (Ranks 1–25).
- **Equipped Pet Spotlight**: Your currently equipped pet now sits pinned at the top of Owned Pets with Power, Health, Location, best Battle EV/hr, and 1-click catalog comparison.
- **Missing Pets & Multi-Select Compare**: Owned Pets now tracks your collection progress, adds a **Missing Pets** view with drop sources and exchange floor prices, adds a sortable **Table** view, and lets you select 2–4 pets to open together in Pet Comparison.

### Changed
- **Item & Enemy Details Modals**: Rebuilt the global **Item Inspection** modal and unified the **Enemy Details** modal across Enemy Database and World Map with cleaner inline stat strips, gold coin icons beside all prices and drop values, item thumbnails in container and recipe rows, accessible keyboard buttons, slider controls for Tier Upgrades, and WCAG AA quality contrast.
- **Legacy Pages Visual & Accessibility Upgrade**: Polished **Settings**, **Items Database**, **Weather Guide**, **Enemy Database**, and **Lore Wiki** in the calm Astral Slate style—adding item thumbnails and gold coin icons to Custom Prices and Enemy loot tables, replacing nested card borders with clean inline divider strips, adopting standard pickers, search fields, filter tags, and modal sheets across all controls, bringing `Back to Top` to Lore Wiki, and expanding mobile tap targets to `>= 44px`.
- **Navigation Sidebar Hierarchy & Calm Highlight**: Separated sidebar navigation sections with subtle dividers and indent guides, toned down glaring pure-white active indicators and collapsed rail icons to Astral Slate, and standardized bottom dock short labels so tabs like **Alchemy** and **Profit** no longer truncate on mobile.
- **Control & Overlay Accessibility Polish**: Added keyboard focus rings to number steppers, combobox clear buttons, popovers, and labeled SVG icons, replaced legacy search-empty markup inside Global Search with the standard empty-state view, hid duplicate browser clear buttons inside search palettes, and honored reduced-motion settings across all interactive UI primitives.
- **Guild Database Redesign**: Rebuilt Guild Database in the Astral Slate design system with an inline registry summary strip, collapsible Season Podium banner cards, quick Open Slots and Conquest Rulers filter tags, Table and Cards view modes, bounded pagination, a Guild Rules & Offline cache modal, and a tabbed Guild Details modal (**Overview**, searchable **Roster**, and **Conquest**).
- **World Map Redesign**: Rebuilt World Map in the Astral Slate design system with an expansive panoramic map backdrop, level-sorted region pickers, `From -> To` travel estimator, in-place **Enemy Details** modal (with clickable loot drops), structured per-skill weather modifiers, and a chronological **Weather Forecast** timeline with quick filters.
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
- **Settings Shortcut Reference**: Updated the Settings keyboard shortcuts list so `Alt+4` accurately labels **Forge Lessons** alongside entries for **Lore Wiki** (`Alt+9`) and **World Map** (`Alt+M`).
- **Items Tag Guide Disclosure**: Separated the Items filter bar's Tag Guide popover button from the expandable filter summary so keyboard and screen-reader users can toggle it reliably.
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
