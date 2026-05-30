# Zenith Companion

<p align="center">
  <img src="public/icon-192.png" alt="Zenith Companion app icon" width="92" height="92" />
</p>

<h1 align="center">Zenith Companion</h1>

<p align="center">
  <strong>An unofficial IdleMMO companion suite for market intelligence, profile-aware planning, combat routing, world data, and searchable game knowledge.</strong>
</p>

<p align="center">
  <a href="https://zenith-companion.vercel.app"><strong>Open the live companion</strong></a>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs" />
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-optimized-black?style=for-the-badge&logo=vercel" />
  <img alt="IdleMMO fan project" src="https://img.shields.io/badge/IdleMMO-unofficial-f5b041?style=for-the-badge" />
</p>

<p align="center">
  <img src="public/readme/zenith-demo.gif" alt="Animated walkthrough of Zenith Companion showing the dashboard, profiles, settings, skill profit, item database, and world boss planner" width="100%" />
</p>

## Overview

Zenith Companion is a fan-made decision layer for IdleMMO. It brings together market snapshots, item metadata, recipes, enemies, drops, dungeons, world bosses, pets, guild data, weather windows, museum progress, and local character profiles into one fast interface.

The project started as an alchemy profit finder and grew into a full companion suite: part calculator, part database, part route planner, part character workspace.

## What Makes It Different

- **Profile-aware tools:** calculators read from the active local profile, including class, levels, bartering, conquest rank, tools, pets, housing, timers, magic find, and imported public character data.
- **Generated-data architecture:** expensive relationships are prebuilt into static JSON instead of recalculated on every page load.
- **Market caution built in:** thin markets, unknown prices, vendor fallbacks, stale snapshots, custom prices, and missing data are surfaced instead of hidden.
- **Connected reference pages:** items link to recipes, sources, drops, lore signals, bosses, dungeons, market labels, and usage maps.
- **Responsive product UI:** desktop has dense planning surfaces; mobile has compact navigation and a radial command option.
- **Free-tier minded:** the deployed app favors cached data, static assets, preprocessing, and minimal runtime work.

## Try These Workflows

| Goal | Where to start | What Zenith helps check |
| --- | --- | --- |
| Find a profitable skilling route | Skill Profit Finder | Active profile, class bonus, tools, market price, vendor floor, essence cost, and missing-price warnings. |
| Decide whether a boss route is worth it | World Bosses | Spawn timing, route order, travel cost, boss value, and magic-find assumptions. |
| Inspect an item before buying in bulk | Item Database | Market confidence, volume, source mapping, recipe usage, vendor value, and relationship links. |
| Plan a high-value craft | Mythic Lab or Alchemy Profit | Material ledger, custom prices, owned inputs, sell strategy, ROI, and thin-market risk. |
| Compare character assumptions | Profiles and Settings | Bartering, timers, tools, housing buffs, pets, magic find, and profile-scoped preferences. |

## Privacy And Local Data

Zenith Companion is designed so player-specific data stays local by default. Profiles, settings, custom prices, active navigation preferences, and imported visible character snapshots live in browser storage unless the user exports or clears them.

The public app does not ask users to paste an IdleMMO API key into the browser. Import flows are built around visible character information and keep the final save step under user control.

## Product Surfaces

| Area | What it does |
| --- | --- |
| Dashboard | Active profile summary, market cache status, quick access to economy, combat, world, guild, and archive tools. |
| Profiles | Local character workspaces for levels, combat stats, pets, gear, tools, housing, imports, and profile backups. |
| Settings | App-wide preferences, theme, navigation style, fallback tools, market tax mode, active profile values, and custom prices. |
| Item Database | Searchable item index with market labels, source links, vendor values, recipes, usage relationships, and lore connections. |
| Skill Profit Finder | Profile-aware skilling route estimates with tool, class, market, essence, vendor, and missing-price safeguards. |
| Alchemy Profit | Recipe cost, revenue, ROI, market confidence, volume, vendor fallback, and owned-material planning. |
| Mythic Lab | High-level recipe project planning with material ledger, uses remaining, price overrides, and thin-market warnings. |
| Crafting Queue | Batch planning for materials, profit, and queued craft sessions. |
| Forge Planner | Forge route and material planning tied to market and profile assumptions. |
| Housing | Home and guest-buff planning that feeds other profile-aware tools. |
| Market Watch | Vendor-value and near-vendor watchlists based on current profile assumptions. |
| Combat | Enemy EV and session planning without pretending uncertain combat formulas are exact. |
| Dungeons | Expected value, entry cost, rare-result expectations, and profile-sensitive dungeon planning. |
| World Bosses | Spawn schedule, boss value, route planning, travel cost, and magic-find assumptions. |
| Weather Guide | Weather windows and location/event timing in a mobile-friendly layout. |
| Pets | Pet database, owned-pet snapshots, comparison tools, battle stats, and collection context. |
| Guilds, Museum, Lore | Guild reference data, collection tracking, and lore/item relationship exploration. |

## Profile And Settings

Zenith is built around the idea that a calculator is only useful when it understands the character behind the calculation. Profiles are local, browser-scoped workspaces. They can hold manual values, imported visible IdleMMO data, and calculated fields side by side.

<table>
  <tr>
    <td width="50%">
      <img src="public/readme/profiles-showcase.jpg" alt="Profile page showing multiple local profiles, character art, class, total level, location, guild, and profile notes" />
    </td>
    <td width="50%">
      <img src="public/readme/settings-showcase.jpg" alt="Settings page showing app preferences, theme selection, radial mobile navigation, fallback tools, active profile values, and custom prices" />
    </td>
  </tr>
</table>

Profile values can influence:

- alchemy and mythic vendor value through bartering
- skill-profit routes through class, tools, timers, and conquest rank
- combat and dungeon assumptions through levels, stats, pet, magic find, and efficiency
- housing bonuses and guest buffs
- market-watch thresholds and custom item prices
- world boss planning through magic find and route assumptions

## Interface Preview

<table>
  <tr>
    <td width="50%">
      <img src="public/readme/items-database.jpg" alt="Item Database table with market labels, sorting, filters, and item tags" />
    </td>
    <td width="50%">
      <img src="public/readme/skill-profit.jpg" alt="Skill Profit Finder with route assumptions, profile-aware controls, and generated route data" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="public/readme/world-bosses.jpg" alt="World Bosses page with spawn schedule, boss value, and route planning tools" />
    </td>
    <td width="50%">
      <img src="public/readme/mobile-dashboard.jpg" alt="Mobile dashboard layout with compact cards and radial navigation trigger" />
    </td>
  </tr>
</table>

## Data Snapshot

Zenith Companion is driven by generated and cached data. Current public coverage includes:

| Dataset | Current indexed coverage |
| --- | ---: |
| Items | 1,353 |
| Market-tracked items | 833 |
| Search entries | 1,439 |
| Enemies | 47 |
| Dungeons | 18 |
| World bosses | 11 |
| Pets | 46 |

These numbers change as the data pipeline discovers, normalizes, and refreshes more game data.

## Architecture

```mermaid
flowchart LR
  A["IdleMMO public/API data"] --> B["Refresh and normalization scripts"]
  B --> C["Generated JSON snapshots"]
  B --> D["Search, usage, lore, weather, and route indexes"]
  C --> E["Next.js App Router"]
  D --> E
  F["Local browser profiles"] --> E
  G["Settings and custom prices"] --> E
  E --> H["Static, responsive companion UI"]
```

The app is intentionally preprocessing-first:

- route, search, usage, lore, weather, and relationship data are prepared before the user opens the page
- public JSON snapshots keep runtime API usage low
- profile state stays in the browser unless the user exports it
- custom prices and assumptions are explicit
- heavy pages are designed around filtering and memoized derived views rather than repeated work

### Performance Audits

Run Lighthouse budgets against a built app when route-level performance changes:

```powershell
npm run build
npm run start -- -p 3220
$env:LH_BASE_URL = "http://127.0.0.1:3220"
npm run audit:lighthouse
```

The audited routes and practical regression budgets live in `scripts/lighthouse-budgets.json`. Reports and `summary.json` are written under `test-artifacts/lighthouse/`.

### Cache Header Audits

Run the cache/header audit against a built app when public data, API routes, service worker behavior, or Vercel headers change:

```powershell
npm run build
npm run start -- -p 3220
$env:CACHE_AUDIT_BASE_URL = "http://127.0.0.1:3220"
npm run audit:cache-headers
```

The audit checks cache policy, noindex headers for public data, security headers, blocked raw-data files, service worker freshness, web manifest headers, and no-store behavior for sensitive local API routes. A JSON summary is written to `test-artifacts/cache-headers/summary.json`.

## Engineering Focus

Zenith Companion is maintained like a product, not a one-off calculator.

- **Type safety:** TypeScript models for profiles, preferences, imports, market rows, items, pets, and planning logic.
- **Validation:** profile imports are normalized before they touch local state.
- **Performance:** generated data, route-level tuning, browser benchmarks, and bundle checks guide changes.
- **Accessibility:** keyboard navigation, focus management, labeling, modal behavior, and mobile usability are reviewed as features evolve.
- **Testing:** static checks, unit tests, Playwright flows, accessibility checks, and page-by-page review notes are used during development.
- **Cost discipline:** the app is designed for public-repo automation, Vercel free-tier pressure, cached data, and minimal backend runtime.

## Boundaries

Zenith Companion is unofficial and not affiliated with IdleMMO.

It uses cached/generated data, so prices, routes, EV, and market labels can lag behind the live game or reflect incomplete public information. Profit and EV outputs are decision-support estimates, not guaranteed outcomes.

The app does not ask users to paste an IdleMMO API key into the browser. Profile import is built around visible public character information and a user-controlled save step.

## Roadmap

- Screenshot-based onboarding that explains the real UI instead of adding generic text noise.
- Stronger profile-import recovery and progress visibility for mobile users.
- More combat confidence labeling as formulas are verified.
- More generated indexes for lore, item descriptions, and source relationships.
- Continued mobile navigation polish without weakening desktop planning density.
- More route-level performance budgets as data volume grows.

## Credits

Built by DevMohammed52 as a personal IdleMMO companion project, with testing and feedback from IdleMMO players who helped validate data, workflows, and real-use planning needs.

IdleMMO and its game assets belong to their respective owners. Zenith Companion is a fan-made, unofficial companion tool.
