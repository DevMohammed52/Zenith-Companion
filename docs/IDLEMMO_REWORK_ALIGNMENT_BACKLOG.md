# IdleMMO Rework Alignment Backlog

Audited against IdleMMO releases v0.72.1 through v0.86.0 (October 2026).

---

## Tier 1: Core Math & Game Calculation Alignment (Priority)

- [x] **1. Regional Conquest Assault Buffs (v0.84.0)**
  - **In-Game**: Conquest assault rewards increased by ~50%.
    - 1st Place: +25% Primary Skill EXP, +5% Primary Skill Efficiency *(was 15% / 3%)*
    - 2nd Place: +17% Primary Skill EXP, +5% Primary Skill Efficiency *(was 10% / 3%)*
    - 3rd Place: +13% Primary Skill EXP, +5% Primary Skill Efficiency *(was 8% / 3%)*
    - 4th Place: +10% Primary Skill EXP, +3% Primary Skill Efficiency *(was 6% / 2%)*
    - 5th–7th Place: +7% Primary Skill EXP, +3% Primary Skill Efficiency *(was 6% / 2%)*
    - 8th–10th Place: +3% Primary Skill EXP, +2% Primary Skill Efficiency *(was 2% / 1%)*
  - **Affected Files**: `src/lib/skill-profit.ts` (`ASSAULT_BUFFS`), `tests/unit/`

- [x] **2. Teleportation Cost Formula & Soft Cap (v0.83.0)**
  - **In-Game**: Teleport costs overhauled and capped at Total Level 1,500 (e.g. Bluebell → Crystal Caverns maxes out at 1,950g instead of 5,184g at TL 1,800). Beginner trips under TL 200 flattened to 50g base.
  - **Affected Files**: `src/lib/world-boss-routing.ts` (`calculateTeleportCost`, constants), `tests/unit/world-boss-routing.test.ts`

- [x] **3. Alt Character Base Idle Hours & Market-Locked Class Rules (v0.85.0)**
  - **In-Game**: Alts now receive 4 hours (Free) or 6 hours (Member) base idle time (was 3h/4h). Market-locked classes (Banished, Cursed) receive full main character idle time (8 hours) even when designated as an alt.
  - **Affected Files**: `src/lib/housing.ts` (`getProfileBaseIdleActionHours`), `tests/unit/`

---

## Tier 2: Missing Core Systems & Content Additions

- [ ] **4. Slayer Skill & Per-Enemy Hunting Efficiency Ranks (v0.82.0 – v0.84.0)**
  - **In-Game**: Combat skill trained via personal, party, and guild contracts. Milestones award Slayer Shards (+20% in v0.84). Each enemy rank confers permanent damage boost and +0% to +10% hunting efficiency for that specific enemy.
  - **Affected Files**: `src/app/profiles/`, `src/app/enemies/`, `src/app/combat/`, data models

- [ ] **5. Village Mastery Skill & Economy (v0.74.0 – v0.80.2)**
  - **In-Game**: Complete primary skill covering building dwellings, gathering houses, storehouses, citizen food balance, tax rates, VR-to-gold conversion rate curves, warfare scouting, and 21-day leagues (750k passive EXP contribution cap).
  - **Affected Files**: `src/app/profiles/`, new village planner/calculator module

- [x] **6. New Mythic Pet: Shardback (v0.84.0)**
  - **In-Game**: Mythic pet added to the Celestial Exchange (300,000 Shards).
  - **Stats**: High-defense tank profile (Base: 9/9/9/9, per-level: Protection +1.04, Attack +0.92, Accuracy +0.92, Agility +0.81, Speed +0.225, Health +20, Stamina +1.5).
  - **Affected Files**: `public/pet-database.json`, `public/all-items-db.json`, `public/items-map.json`, `scripts/build-pet-database.mjs`, `tests/unit/pet-stats.test.ts`

- [ ] **7. Tavern Auctions & Giveaways (v0.83.0 – v0.83.2)**
  - **In-Game**: In-game player auction house with 12% tax (free) / 8% (members), 30-minute anti-sniping bid reset, 1m min price, and player giveaways.
  - **Affected Files**: Market/economy tools

- [ ] **8. Item Loaning System (v0.84.0)**
  - **In-Game**: Direct risk-free equipment loaning with automated 3-day return lock and "Loaned" item status badges.
  - **Affected Files**: Profile gear management, inventory view

- [ ] **9. Forge Lessons & Temper Bar (v0.84.0)**
  - **In-Game**: Lessons tab using raw materials (ores, bars, logs, materials) close to player level for Forge + Strength EXP, filling the Temper Bar for shards.
  - **Status**: Research pending on exact game math.

---

## Tier 3: Minor Tweaks & Combat Rules

- [ ] **10. Guild Armoury Items (v0.73.2 / v0.84.0)**
  - **In-Game**: Temporary guild boosts (Trebuchet, Battering Ram, Explosive Keg, Scorpion, Medical Kit, Medical Tent) providing combat, defense, and EXP buffs.
  - **Affected Files**: Buff lists for combat / raid planners

- [ ] **11. Guidance Scroll Timings & Limits (v0.84.0 / v0.85.0)**
  - **In-Game**: Writing time increased to 90 min (was 60 min), 48h claim window, 3 pending max with membership (1 without).
  - **Affected Files**: Profile / meditation helpers

- [ ] **12. Combat Queue Limit (v0.73.0)**
  - **In-Game**: Battle queue max enemies increased to 6.
  - **Affected Files**: Combat simulator
