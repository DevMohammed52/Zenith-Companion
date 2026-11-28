# Zenith Companion — Active Roadmap

This roadmap tracks remaining UI/UX upgrades, icon design, infrastructure work, and upcoming game features for Zenith Companion. Completed Phases 1–9 (39/39 UI primitives, Tiers 1–7 route migrations, System Error/404/Loading pages, API Gateway hardening, and Legacy `globals.css` purge) are preserved in full in [docs/ROADMAP_ARCHIVE.md](docs/ROADMAP_ARCHIVE.md).

---

## Architectural Principles & Scope Boundaries

1. **Strict Logic Invariance**:
   Mathematical formulas, economy calculations, scrapers, API endpoints, D1 SQLite edge databases, and data schemas remain untouched unless fixing a verified Stage 1 calculation or data bug. Presentation refactors cover semantic HTML, CSS modules/tokens, responsiveness, accessibility, zero CLS, and clean copy.
2. **No AI Slop / Native Gamer Terminology**:
   User-facing copy uses direct IdleMMO terminology (*Efficiency*, *Drops/Loot*, *Active Windows*) and avoids filler prose.
3. **Critical Design Evaluation & Simplification**:
   Every route removes redundant metric boxes and visual noise so players can finish primary tasks immediately above the fold.
4. **Five Verification Gates**:
   Logic Invariance, Layout Stability & Ergonomics (`CLS <= 0.1`, touch targets `>= 44x44px`), Visual Contrast (`WCAG AA >= 4.5:1`), Unit & Contract Tests (`npm run test:unit`), and TypeScript + Build (`npm run typecheck`, `npm run build`, Playwright checks).

---

## Completed Foundation (Archived)

- **Phases 1–9 Complete**: `[2026-11-28 12:56]` All 39 UI primitives, all application routes across Tiers 1–7, System pages (`loading`, `not-found`, `error`, `global-error`), the standardized Next.js API + Cloudflare Worker gateway, and the `globals.css` legacy purge (`237 KB -> 37 KB`) are complete. See [docs/ROADMAP_ARCHIVE.md](docs/ROADMAP_ARCHIVE.md) for the full changelog-level archive.

---

## Active & Upcoming Work

1. - [x] **Contextual Icon Audit & Custom SVG Icon System** (`[2026-11-28 15:58]`):
   - Created `src/components/icons/CustomIcons.tsx` with 25 bespoke `24x24` (`1.75px` stroke) vector SVGs: 10 distinct equipment silhouettes (`SlotHelmetIcon`, `SlotChestplateIcon`, `SlotGreavesIcon`, `SlotBootsIcon`, `SlotGauntletsIcon`, `SlotSwordIcon`, `SlotDaggerIcon`, `SlotBowIcon`, `SlotShieldIcon`, `SlotSpecialIcon`), 7 skill/tool icons (`SkillWoodcuttingIcon`, `SkillMiningIcon`, `SkillFishingIcon`, `SkillCookingIcon`, `SkillSmeltingIcon`, `SkillConstructionIcon`, `SkillMeditationIcon`), and 8 domain/route emblems (`WhatsNewIcon` megaphone, `MythicFlaskIcon`, `ConquestBannerIcon`, `MagicStormIcon`, `CraftingQueueIcon`, `BisCrestIcon`, `EnemyMonsterIcon`, `ForgeAnvilIcon`).
   - Unified `src/lib/icons.ts` (`CONCEPT_ICONS`), `src/components/icons/ZenithIcon.tsx`, `src/lib/navigation.ts`, `src/lib/route-recovery.ts`, and `src/app/types.ts` so Sidebar, Mobile Dock, Not-Found recovery, Dashboard, and in-page headers share matching context-specific icons.
   - Replaced mismatched icons across `/bis`, `/profiles` (including slot-specific empty fallbacks for Combat Equipment & Gathering Tools), `/whats-new`, `/alchemy`, `/alchemy/mythic`, `/crafting`, `/skill-profit` (skill icons on tabs & tool pickers), `/housing` (empty state `housing`, repair `craftTool`, warnings `warning`, `house-ledger` `scroll`, `pet-quarters` `pets`, and all 13 activity handlers), `/forge`, `/museum`, `/enemies`, `/lore`, `ItemModal`, `DashboardModuleGrid`, `BackToTop`, `/pets`, `OfflineSupport`, and `LoreThreadPanel`, eliminating all stray direct `lucide-react` imports outside `src/lib/icons.ts`, `ZenithIcon.tsx`, and legacy `StateBlock.tsx`. Verified with `npx knip --include files`, `npm run test:unit` (`858 passed | 1 skipped`), `npm run typecheck`, `npm run build` (`41/41`), icon visual captures, and Playwright checks.
2. - [x] **Remaining Component & Shell Cleanup** (`[2026-11-28 16:25]`):
   - Migrated `/pets` off `@/components/StateBlock` (replacing with `EmptyState` + layout-matched card `Skeleton`s) and deleted `StateBlock.tsx` / `StateBlock.module.css`; replaced `<style jsx global>` in `LoreThreadPanel.tsx` with scoped `LoreThreadPanel.module.css` (`44px` touch target + focus-visible + reduced-motion); stripped remaining `·` / `&middot;` separators across Conquest, Weather, Lore, Shell/Modals, Guilds, Map, Profiles, Pets, and Forge; tightened `320px` `ShellHeader` search button + `ProfileSwitcher` truncation; dev-gated `/ui-preview` in `page.tsx` and `src/proxy.ts` (`ENABLE_UI_PREVIEW !== "1"` -> 404 in production); and hardened `scripts/clean-cache.mjs` to skip `.next/dev` whenever a `next dev` server is active.
3. - [x] **Deep Per-Page Polish & Cross-App Consistency Audit** (`[2026-11-28 17:20]`):
   - Audited all 27 routes across `1440x900`, `375x812`, and `320x700` viewports (`CLS`, overflow, `>= 44x44px` touch targets, `axe-core` WCAG 2.2 AA contrast/ARIA, inline search `showShortcutHint={false}` isolation, and console errors).
   - Fixed `Bosses.module.css` selected routine `Scheduled`/`Unknown` badge contrast (`4.38:1` -> `rgba(10, 13, 20, 0.78)` + `#e2e8f0`, passing `bosses-interactions.spec.ts` on desktop & mobile); tightened `NumberInput` mobile `<input>` minimum width (`44px`) and `.qtySlot` / Forge Level container widths so all mobile controls clear `>= 44x44px`; eliminated mobile CLS > `0.1` on `/weather` (moving `MagicStorm` alert below weather switcher), `/museum` (matching loading/empty hero and body height), `/alchemy` & `/alchemy/mythic` (matching `1000px` `<Suspense>` fallback + `820px` skeleton height), `/forge/craft` (`320px` header wrap stability), and `/` (`DashboardPriorityTools` 5-row `.profitStage` reservation); and replaced remaining `•` inline metadata separators with ` | ` across `/whats-new`, `/conquest`, `/map`, `/bosses`, `/dungeons`, `/patch-notes`, `/skill-profit`, and `Timeline.tsx`.
4. - [x] **Workspace & Build Cache Hygiene** (`[2026-11-28 14:13]`):
   - Deleted `44,417.3 MB` (`45,090.1 MB` total `.next\dev`) of accumulated Next.js 16 Turbopack dev cache and added `"clean:cache": "node scripts/clean-cache.mjs"` in `package.json` (`scripts/clean-cache.mjs`, supporting `--all`) to clear `.next/dev`, `.next/cache`, `.next/trace`, `test-results`, `playwright-report`, and `coverage` safely without touching tracked files or data.
5. - [x] **Scrapers & GitHub Actions Architecture Overhaul** (`[2026-11-28 18:34]`):
   - Upgraded `scripts/idlemmo-fetch-utils.mjs` (`RATE_PROFILES = { isolated: 68, shared: 60 }`, `76 req/min` safety ceiling, header-aware `x-ratelimit-remaining` / `x-ratelimit-reset` cooldowns, 20s timeouts, `5xx`/network retries) and aligned sibling `scripts/*` to the verified `80 req/min` API key tier while preserving 12-20 req/min headroom for concurrent Cloudflare Worker profile imports.
   - Eliminated ~936+ redundant API calls per full `scraper.mjs` cycle (`327` `is_tradeable: false` items skipped before market queries, `72` non-existent phantom alchemy `Recipe:` strings removed, `12h` compact cooldowns for zero-history and listings-only items inside `marketData._meta`, end-of-cycle single write in `--once` mode, fixed `execFileSync` ESM import for conquest season archives, and `hasMarketItemChanged` / `mergeMarketItemEntry` timestamp preservation to cut no-op git diff churn) with verified math invariance (`tests/unit/scraper-pipeline-architecture.test.ts`).
   - Added [`scripts/discover-idlemmo-catalog.mjs`](scripts/discover-idlemmo-catalog.mjs) (`npm run idlemmo:discover`) to paginate all 41 verified `/v1/item/search` types plus unmapped entity loot, `/inspect` new or undetailed items, sync `all-items-db.json` and `items-map.json`, and regenerate derivative usage/lore maps.
   - Prioritized Market (`24x/day` hourly: 6 full every 4h + 18 priority on remaining hours), Conquest (`36x/day` standalone at `:35` odd & `:50` hourly + `24x/day` bundled = `60` refreshes/day), and Hot Guilds (`12x/day` every 2h at `:35` even, with daily `00:35` `--discover-new` and weekly Sunday `02:35` `warm`) in a collision-free clock grid (~72–75 automated Vercel deployments/day, leaving ~25/day headroom below Hobby's 100/day limit), plus `--ignore-only=public/scraper-status.json` no-op commit guards, `DATA_DELAYED_AFTER_MS = 2.5h` alignment, and `vercel.json` `ignoreCommand` for docs/tests/workflows-only commits.
6. - [ ] **New IdleMMO Research & Feature Expansions**:
   - Deep-dive reverse-engineering of IdleMMO Combat mechanics/formulas + dedicated Combat Calculator page (`/combat`), Lv 1–100 **Best Skill Path Finder** per skill, full-game missing feature/improvement gap analysis, and backlog items #1 & #3.
7. - [ ] **Rebuild User Onboarding from Scratch** *(deferred until core pages & polish settle — `[2026-11-28 11:00]`)*:
   - Retired experimental `FirstRunSetup` modal (`2026-11-28 11:00`) from `layout.tsx` and `globals.css`. Design a non-blocking onboarding flow later (e.g., compact 1-field hash quick-import in `ProfileSwitcher` + contextual setup hints inside calculator toolbars at point of value).
8. - [ ] **Telemetry Upgrade & Legal Pages (`/about`, `/privacy`, `/terms`) (Low Priority)** (`[2026-11-27 23:19]`):
   - Build batched non-PII feature/search/conversion event telemetry (`UsageTracker` queue + `/api/usage/events` + D1 batch storage within the 100k/day free-tier write cap), add explicit **Analytics Opt-Out** toggle in `/settings`, align `SiteFooter` and `DataCachePanel` privacy copy with real Cloudflare telemetry/Turnstile behavior, and author alias-based (`/about`, `/privacy`, `/terms` under `D3vxGh0st` / Discord `d3v_gh0st` without exposing personal name or Gmail).
