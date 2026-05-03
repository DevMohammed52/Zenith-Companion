# Zenith Companion

Zenith Companion is a responsive analytics dashboard for **IdleMMO**. It turns market history, item metadata, combat drops, dungeon loot, boss schedules, and crafting recipes into practical decisions: what to craft, what to farm, which areas are worth fighting in, and which items deserve attention right now.

This started as a personal side project, but it is built like a real product: automated data refreshes, reusable game logic, searchable item intelligence, responsive UI, and GitHub Actions-backed market updates.

## Highlights

- **Live market intelligence**  
  Tracks cached market history for IdleMMO items and exposes 3-day, 7-day, 14-day, and 30-day price signals.

- **Alchemy profit calculator**  
  Calculates material cost, market revenue, vendor revenue, net profit, daily profit, ROI, volume, and recommended action for alchemy recipes.

- **Mythic Lab**  
  A dedicated workflow for high-level recipes with project-style planning and material tracking.

- **Combat analytics**  
  Estimates EV per kill and gold per hour from enemy loot tables, drop rates, and the user's kills/hour setting.

- **Area profit overview**  
  Summarizes combat value by location so users can compare zones instead of checking every enemy one by one.

- **Dungeon and boss tools**  
  Compares dungeon EV, entry cost, profit per run, expected runs per drop, and world boss loot value.

- **Item database and global search**  
  Provides searchable access to item metadata, market information, sources, recipes, and usage relationships.

- **Crafting queue**  
  Lets users plan batches, estimate materials, and track potential profit from queued recipes.

- **Responsive interface**  
  Designed to work across mobile, tablet, laptop, desktop, and zoomed browser layouts.

## Why It Exists

IdleMMO has a lot of moving parts: item prices change, crafting margins move, drops have different probabilities, and some choices only make sense when you combine several data sources. Zenith Companion pulls those pieces together so players can answer questions like:

- Which alchemy recipes are profitable right now?
- Should I sell this item, vendor it, or use it for crafting?
- Which combat area gives the best average gold/hour?
- Which dungeon has the best expected value after entry cost?
- What items are connected to a recipe, source, dungeon, or boss?

## Tech Stack

- **Framework:** Next.js App Router
- **UI:** React, TypeScript, custom CSS
- **Icons:** Lucide React
- **Data refresh:** Node.js scraper
- **Automation:** GitHub Actions
- **Deployment target:** Vercel

## Project Structure

```text
src/
  app/                  Next.js routes and feature pages
  components/           Shared UI components
  context/              Client-side app data and state providers
  lib/                  Formatting, preferences, and game logic helpers
  constants/            Game event/weather constants
public/
  *.json                Cached game, item, market, search, and usage data
scripts/
  rebuild-usage-map.mjs Builds item usage and search indexes
scraper.mjs             IdleMMO market and boss data updater
.github/workflows/     Automated data refresh workflow
```

## Data Pipeline

1. `scraper.mjs` reads item metadata from `public/all-items-db.json`.
2. It fetches market history from the IdleMMO API while respecting the API rate limit.
3. It updates cached JSON data in `public/`.
4. `scripts/rebuild-usage-map.mjs` rebuilds item relationships and search indexes.
5. GitHub Actions commits refreshed data back to the repository.
6. The Next.js app serves the latest cached data as static JSON.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` file if you want to run the scraper:

```env
IDLEMMO_API_KEY=your_api_key_here
```

Run the app:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

Run a one-time scrape:

```bash
npm run scrape
```

## Notes

- `public/*.json` files are generated/cached data used by the deployed app.
- Personal debugging and maintenance scripts are kept out of the repository.
- Market values are estimates based on cached API data and may lag behind live in-game prices.

## Status

Zenith Companion is actively evolving as a personal project. The goal is to keep improving the decision-making tools, responsiveness, and quality of the market/game intelligence over time.
