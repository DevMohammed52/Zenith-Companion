# Agent Guidelines for Zenith Companion

## 1. Tooling & Token Efficiency
* **Fast Search:** Always use `rg` (ripgrep) for regex and code search, and `fd` for fast file listing instead of slow recursive grep/find commands or full-directory dumps.
* **Surgical Reads:** Never read giant files in full unless strictly necessary. Use line-slice ranges with `view_file` to conserve tokens aggressively.
* **Knowledge Graph (Mandatory):** Whenever investigating code dependencies, route structure, state flows, or architectural impact, ALWAYS query the graphify knowledge graph at `graphify-out/` first via `query_graph` (MCP) or `graphify query` (CLI), along with `get_node` and `shortest_path`. Never guess file relations when the knowledge graph exists. Keep the graph updated after code modifications using `graphify update .`.

## 2. Strict Logic Invariance
* **Do NOT alter game logic or calculations:** Mathematical formulas (alchemy EV, market pricing guards, combat simulation, boss timers, drop chances, skill profit formulas, pet stat curves) are complex, interconnected, and production-tested.
* **Scope of Review:** All UI/UX polish, refactoring, and code reviews must be strictly presentation-layer (semantic HTML, CSS modules/tokens, responsiveness, accessibility, layout stability, and clean, human copy).

## 3. UI/UX Consistency & "No AI Slop" Standard
* **Design Tokens:** Always adhere to established CSS variables in `globals.css` (`--bg-base`, `--bg-panel`, `--bg-card`, `--border-subtle`, `--text-main`, `--text-muted`, `--text-accent`, `--quality-*`).
* **Clean Copy (Zero Slop):** Eliminate corporate filler, redundant explanatory paragraphs, and AI-sounding fluff. Keep titles, badges, and tooltips concise, natural, and gamer-friendly.
* **Responsive & Accessible:** Ensure interactive elements have $\ge 44\text{px}$ touch targets on mobile, high contrast, and keyboard focus states.
* **Layout Stability:** Prevent Cumulative Layout Shift (CLS) by giving dynamic cards, charts, and image containers defined aspect ratios or minimum heights.

## 4. Quality Verification
* **Zero Regressions:** After any changes, always run:
  ```powershell
  npm run test:unit; npm run typecheck
  ```
* **Production Build Check:** For layout or metadata updates, ensure `npm run build` succeeds cleanly.

## 5. Page Decomposition & Modularization Backlog (22 Remaining)
*Goal: Decompose monolithic God Pages into modular feature components under `src/app/<route>/components/` and custom hooks under `src/app/<route>/hooks/`, reducing `page.tsx` to an orchestrator (< 200 lines) with strict layout containment (`CLS <= 0.1`) and game math invariance.*

### Completed (4/25)
- [x] `/housing` (was 4,322 lines $\rightarrow$ 41 lines)
- [x] `/bosses` (was 2,886 lines $\rightarrow$ 147 lines)
- [x] `/dungeons` (was 3,131 lines $\rightarrow$ 157 lines)
- [x] `/profiles` (was 3,434 lines $\rightarrow$ 213 lines)

### Tier 1: Mega God Pages (> 2,000 Lines) — 8 Pages
- [ ] `/forge` (2,633 lines) — Ore forging, catalyst calculations, heat mechanics, profit EV
- [ ] `/market-alerts` (2,518 lines) — Live price triggers, volume filters, notification routing
- [ ] `/lore` (2,480 lines) — Lore browser, thread connections, search indexing
- [ ] `/map` (2,409 lines) — World locations, coordinate routing, travel time calculator
- [ ] `/items` (2,309 lines) — Item database, vendor values, recipes, filtering system
- [ ] `/skill-profit` (2,297 lines) — Multi-skill yield profit calculator, action time scaling
- [ ] `/weather` (2,154 lines) — Live weather rotation, zone forecasts, enemy affinities
- [ ] `/combat` (2,072 lines) — Battle simulator, kill time EV, gear damage formulas

### Tier 2: Heavy Pages (1,000 – 1,999 Lines) — 10 Pages
- [ ] `/bis` (1,901 lines) — Best-in-slot gear solver, set bonuses, stat prioritization
- [ ] `/enemies` (1,688 lines) — Bestiary, drop tables, weakness breakdown, level requirements
- [ ] `/pets` (1,682 lines) — Pet database, stat growth curves, egg hatch projections
- [ ] `/alchemy` (1,384 lines) — Standard potion recipes, mastery levels, recursive ingredient EV
- [ ] `/alchemy/mythic` (1,363 lines) — Mythic elixir cauldron, fail-chance mitigation, gem valuations
- [ ] `/museum` (1,346 lines) — Collection completion tracker, account deduplication grid
- [ ] `/pets/compare` (1,185 lines) — Side-by-side pet comparison matrix, stat differential charts
- [ ] `/guilds` (1,113 lines) — Guild database, member rosters, raid progression
- [ ] `/crafting` (1,111 lines) — Recipe crafting tree, material requirements, cost vs profit
- [ ] `/settings` (1,028 lines) — Local storage backups, UI preferences, cache flush tools

### Tier 3: Moderate Pages (500 – 999 Lines) — 3 Pages
- [ ] `/conquest` (759 lines) — Guild territory control, buffs, battle log timelines
- [ ] `/` (Dashboard / Home) (598 lines) — Dashboard home, activity command bar, quick cards
- [ ] `/pets/owned` (552 lines) — Active pet lineup, bond levels, skill bonus toggles

---

## 6. IdleMMO Game Knowledge Base
A local, indexed knowledge repository of the IdleMMO game is maintained at `.agents/knowledge/idlemmo/`:
* **Master Index**: `.agents/knowledge/idlemmo/INDEX.md`
* **Wiki Knowledge Base**: `.agents/knowledge/idlemmo/wiki/` (161 complete docs: combat, skills, pets, items, housing, conquest, etc.)
* **Official Roadmap**: `.agents/knowledge/idlemmo/roadmap.md` (Trello public roadmap cards: in-progress, upcoming, archived)
* **Patch Notes**: `.agents/knowledge/idlemmo/patch-notes-summary.md` and `public/idlemmo-patch-notes.json` (280+ releases)
* **Official Support & Haunty Wiki**: `https://support.idle-mmo.com/` (Patch 0.86.1+).
  - Every wiki article has a native clean markdown endpoint: `https://support.idle-mmo.com/wiki/<category>/<page>.md`
  - Knowledge base articles: `https://support.idle-mmo.com/knowledge-base/<category>/<page>.md`
  - In-house AI assistant ("Boo"): Accessible via `POST https://support.idle-mmo.com/question-box` with `{ question: string }` and CSRF cookie.
* **Wiki Recency vs Patch Notes Verification**: Wiki articles often lag behind live game updates. ALWAYS verify the article's "Last updated" date against newer releases in `public/idlemmo-patch-notes.json` (or live patch notes). If a patch was released after the wiki article was last modified, the patch notes take precedence.
* **Usage & Token Efficiency Hierarchy**:
  1. **Tier 1 (Lowest Tokens & Instant)**: ALWAYS search `.agents/knowledge/idlemmo/` with `rg` and read specific line slices (`view_file`).
  2. **Tier 2 (Official Remote Markdown)**: When verifying unindexed patch notes or recent game rule changes, fetch the direct clean `.md` URL on `support.idle-mmo.com/...md`.
  3. **Tier 3 (Boo AI Assistant)**: Use Boo (`/question-box`) primarily for discovering which obscure article a game mechanic is filed under (via its `articles` source references), rather than relying on its text generation for deep mathematical formulas.

---

## 7. GitHub Workflow & API Rate Safety
* **Pre-flight Workflow Check:** ALWAYS run gh run list --limit 5 before executing any API queries, scraper runs, or test scripts. If an automated workflow (such as Update Market, Boss, Pet & Conquest Data or Update Guild Data) is in_progress, DO NOT initiate local scraper runs or heavy API bursts to prevent:
  1. Compounding API rate limit consumption (user key limit: 60 req/min).
  2. Git push collisions with automated data publisher commits on main.
* **Rate Limit Budget:** The IdleMMO API key limit is **60 requests/minute** (1 req/sec). Maintain an explicit request throttle / delay (>= 1,000ms–1,500ms) with exponential backoff on HTTP 429.
