# IdleMMO Forge Lessons Empirical Research & Formula Documentation

This document records the empirical mathematical model for Forge Lessons in IdleMMO, verified through live game testing across levels 8, 9, 10, and 11 on account `saqr`.

## 1. Hourly Base Rate Progression Curve

The game uses a piece-wise linear rate curve $R(L)$ that sets the base hourly EXP at Forge Level $L$:

* Level 1 to 10: Slopes by exactly +122.25 EXP/hr per level (from 1,300.00 at Lv 1 to 2,400.20 at Lv 10).
* Level 10 to 25: Slopes by exactly +50.00 EXP/hr per level (from 2,400.20 at Lv 10 to 3,150.00 at Lv 25).
* Level 25 to 50: Slopes by +22.00 EXP/hr per level (from 3,150.00 at Lv 25 to 3,700.00 at Lv 50).
* Level 50 to 70: Slopes by +40.00 EXP/hr per level (from 3,700.00 at Lv 50 to 4,500.00 at Lv 70).
* Level 70 to 90: Slopes by +30.00 EXP/hr per level (from 4,500.00 at Lv 70 to 5,100.00 at Lv 90).
* Level 90 to 100: Slopes by +40.00 EXP/hr per level (from 5,100.00 at Lv 90 to 5,500.00 at Lv 100).

Empirical verified anchor points for Saqr (unbuffed base):
* Level 8: 2,155.70 EXP/hr
* Level 9: 2,277.95 EXP/hr (+122.25 delta)
* Level 10: 2,400.20 EXP/hr (+122.25 delta)
* Level 11: 2,450.22 EXP/hr (+50.02 delta)
* Level 12: 2,500.21 EXP/hr (+49.99 delta)
* Level 13: 2,550.22 EXP/hr (+50.01 delta)
* Level 14: 2,600.22 EXP/hr (+50.00 delta)
* Level 15: 2,650.22 EXP/hr (+50.00 delta)
* Level 16: 2,700.22 EXP/hr (+50.00 delta)
* Level 17: 2,750.22 EXP/hr (+50.00 delta)
* Level 18: 2,800.22 EXP/hr (+50.00 delta)
* Level 19: 2,850.22 EXP/hr (+50.00 delta)
* Level 20: 2,900.22 EXP/hr (+50.00 delta)
* Level 21: 2,950.22 EXP/hr (+50.00 delta)
* Level 22: 3,000.22 EXP/hr (+50.00 delta)
* Level 23: 3,050.22 EXP/hr (+50.00 delta)
* Level 24: 3,100.22 EXP/hr (+50.00 delta)
* Level 25: 3,150.22 EXP/hr (+50.00 delta)
* Level 26: 3,172.22 EXP/hr (+22.00 delta, confirming piecewise slope inflection at Level 25)
* Level 30: 3,260.22 EXP/hr (+22.00 delta/lvl, 5,216.35 EXP/hr with +60% buff)
* Level 41: 3,502.22 EXP/hr (+22.00 delta/lvl, 4,027.55 EXP/hr buffed, confirming +22/lvl across all 16 levels)

## 2. Character Buff Impact

* Primary Skill EXP: Scales lesson experience payout by exactly 1:1. Verified via A/B test with +15% Membership (1.15000 ratio across all materials).
* Primary Skill Efficiency: Compresses lesson burn duration by dividing duration by $(1 + \text{Efficiency})$. Verified via A/B test (10,922s without buff down to 9,929s with +10% Membership, exact 1.10001 ratio).
* Strength EXP: Always yields exactly 5% of Forge EXP earned.

## 3. Grace Window, Over-Level Penalty & Outgrown Penalty

* Grace window (Upper Bound): $\text{Player Level} + 10$.
* Materials with required level $\le \text{Player Level} + 10$ and $\ge \text{Player Level} - 9$ teach at 100% full rate (zero level penalty).
* At Level 15: Grace reaches Level 25 ($15 + 10 = 25$). Steel Bar, Steel Ore, and Banyan Log hit 100% efficiency.
* At Level 16: Grace reaches Level 26 ($16 + 10 = 26$). Pirates Code hits its 94% refined speed cap.
* At Level 17: Grace reaches Level 27 ($17 + 10 = 27$).
* At Level 18: Grace reaches Level 28 ($18 + 10 = 28$).
* At Level 19: Grace reaches Level 29 ($19 + 10 = 29$).
* At Level 20: Grace reaches Level 30 ($20 + 10 = 30$).
* At Level 21: Grace reaches Level 31 ($21 + 10 = 31$).
* At Level 22: Grace reaches Level 32 ($22 + 10 = 32$).
* At Level 23: Grace reaches Level 33 ($23 + 10 = 33$). Abyssal Scroll (Lv 35) reaches full 100% efficiency cap.
* At Level 24: Grace reaches Level 34 ($24 + 10 = 34$). Abyssal Scroll (Lv 35) is 1 level above grace with penalty dropping from 8% to 4%, scaling to 105% efficiency ($0.96 \times 1.09 = 104.64\% \rightarrow 105\%$).
* At Level 25: Grace reaches Level 35 ($25 + 10 = 35$). Abyssal Scroll (Lv 35) enters grace completely with 0 level penalty, achieving its full 109% Legendary speed cap (688.03 EXP). Ivory (Lv 36) is 1 level above grace at 96% efficiency ($0.96 \times 1.00 = 96\%$, 92.88 EXP).
* At Level 26: Grace reaches Level 36 ($26 + 10 = 36$). Ivory (Lv 36) enters grace completely with 0 level penalty, achieving its full 100% efficiency (97.42 EXP).
* At Level 30: Grace reaches Level 40 ($30 + 10 = 40$). Oceanic Essence (Lv 42) reaches full 100% efficiency cap (455.72 EXP). Siren's Soulstone (Lv 42) reaches 88% efficiency (74.57 EXP). Stoneheart Core (Lv 58) rises from 27% to 31% efficiency (79.26 EXP).
* At Level 41: Grace reaches Level 51 ($41 + 10 = 51$). Oceanic Essence (Lv 42) achieves full 109% Legendary speed cap (382.46 EXP). Siren's Soulstone (Lv 42) achieves full 96% Premium speed cap (62.58 EXP). Stoneheart Core (Lv 58) reaches 78% efficiency (157.35 EXP), Grimoire of Shadows (Lv 60) reaches 67% (963.80 EXP), Void Essence (Lv 62) reaches 61% (96.38 EXP), Polar Bear Pelt (Lv 61) reaches 60%, Raccoon Fur reaches 45%, Broken Dwarven Plate reaches 32%.
* Over-level penalty: Loses exactly 4% efficiency per level above grace down to a 25% floor:
  $$\text{Penalty Eff} = \max(0.25, 1.0 - 0.04 \times (\text{Required Level} - (\text{Player Level} + 10)))$$
* Outgrown penalty (Lower Bound): Materials below player level minus 10 ($\text{Required Level} < \text{Player Level} - 10$) are considered "Too Basic" and begin losing efficiency:
  * At Level 14, threshold is $14 - 9 = 5$: Coal Ore (Lv 1) 94%, Goblin Totem (Lv 2) 88%, Goblin Pouch (Lv 2) 92%.
  * At Level 15, threshold is $15 - 9 = 6$: Ducks Mouth (Lv 4) drops to 94%, Coal Ore (Lv 1) drops to 92%, Goblin Totem (Lv 2) drops to 86%, Goblin Pouch (Lv 2) drops to 91%.
  * At Level 16, threshold is $16 - 9 = 7$: Copper Bar (Lv 5) drops to 98%, Ducks Mouth (Lv 4) drops to 92%, Goblin Pouch (Lv 2) drops to 89%, Goblin Totem (Lv 2) drops to 84%, Coal Ore (Lv 1) drops to 91%.
  * At Level 17, threshold is $17 - 9 = 8$: Copper Bar (Lv 5) drops to 96%, Ducks Mouth (Lv 4) drops to 91%, Goblin Pouch (Lv 2) drops to 87%, Goblin Totem (Lv 2) drops to 83%, Coal Ore (Lv 1) drops to 89%.
  * At Level 18, threshold is $18 - 9 = 9$: Copper Bar (Lv 5) drops to 95%, Ducks Mouth (Lv 4) drops to 89%, Goblin Pouch (Lv 2) drops to 86%, Goblin Totem (Lv 2) drops to 81%, Coal Ore (Lv 1) drops to 88%.
  * At Level 19, threshold is $19 - 9 = 10$: Copper Bar (Lv 5) drops to 93%, Ducks Mouth (Lv 4) drops to 88%, Goblin Pouch (Lv 2) drops to 84%, Goblin Totem (Lv 2) drops to 80%, Coal Ore (Lv 1) drops to 86%.
  * At Level 20, threshold is $20 - 9 = 11$: Copper Bar (Lv 5) drops to 91%, Ducks Mouth (Lv 4) drops to 86%, Goblin Pouch (Lv 2) drops to 83%, Goblin Totem (Lv 2) drops to 78%, Coal Ore (Lv 1) drops to 84%.
  * At Level 21, cutoff is $21 - 10 = 11$: Spruce Log (Lv 10) drops to 98%, Iron Bar (Lv 10) drops to 98%, Deer Antler (Lv 8) drops to 92%, Copper Bar (Lv 5) drops to 90%, Ducks Mouth (Lv 4) drops to 85%, Coal Ore (Lv 1) drops to 83%, Goblin Pouch (Lv 2) drops to 81%, Goblin Totem (Lv 2) drops to 77%.
  * At Level 22, cutoff is $22 - 10 = 12$: Spruce Log (Lv 10) drops to 97%, Iron Bar (Lv 10) drops to 97%, Deer Antler (Lv 8) drops to 91%, Copper Bar (Lv 5) drops to 88%, Ducks Mouth (Lv 4) drops to 83%, Coal Ore (Lv 1) drops to 82%, Goblin Pouch (Lv 2) drops to 80%, Goblin Totem (Lv 2) drops to 76%.
  * At Level 23, cutoff is $23 - 10 = 13$: Essence of Shadows (Lv 12) drops from 109% to 107%, Spruce Log (Lv 10) drops to 95%, Iron Bar (Lv 10) drops to 95%, Deer Antler (Lv 8) drops to 89%, Copper Bar (Lv 5) drops to 87%, Ducks Mouth (Lv 4) drops to 82%, Coal Ore (Lv 1) drops to 80%, Goblin Pouch (Lv 2) drops to 79%, Goblin Totem (Lv 2) drops to 75%.
  * At Level 24, cutoff is $24 - 10 = 14$: Essence of Shadows (Lv 12) drops from 107% to 105%, Spruce Log (Lv 10) drops to 94%, Iron Bar (Lv 10) drops to 94%, Deer Antler (Lv 8) drops to 88%, Copper Bar (Lv 5) drops to 85%, Ducks Mouth (Lv 4) drops to 81%, Coal Ore (Lv 1) drops to 79%, Goblin Pouch (Lv 2) drops to 77%, Goblin Totem (Lv 2) drops to 73%.
  * At Level 25, cutoff is $25 - 10 = 15$: Venom Extract (Lv 14) drops from 100% to 98% (frozen at 91.41 EXP), Essence of Shadows (Lv 12) drops from 105% to 104% (frozen at 357.42 EXP), Spruce Log (Lv 10) drops to 92%, Iron Bar (Lv 10) drops to 92%, Deer Antler (Lv 8) drops to 87%, Copper Bar (Lv 5) drops to 84%, Ducks Mouth (Lv 4) drops to 79%, Coal Ore (Lv 1) drops to 78%, Goblin Pouch (Lv 2) drops to 76%, Goblin Totem (Lv 2) drops to 72%.
  * At Level 26, cutoff is $26 - 10 = 16$: Lead Ore (Lv 15) drops from 100% to 99% (frozen at 4.18 EXP), Essence of Shadows (Lv 12) drops from 104% to 103% (frozen at 357.42 EXP), Spruce Log (Lv 10) drops to 91%, Iron Bar (Lv 10) drops to 91%, Deer Antler (Lv 8) drops to 86%, Coal Ore (Lv 1) drops to 77%.
  * At Level 30, cutoff is $30 - 10 = 20$: Lead Ore (Lv 15) drops to 97%, Venom Extract (Lv 14) drops to 95%, Essence of Shadows (Lv 12) drops to 100%, Spruce Log (Lv 10) drops to 89%, Iron Bar (Lv 10) drops to 89%, Deer Antler (Lv 8) drops to 84%, Copper Bar (Lv 5) drops to 81%, Ducks Mouth (Lv 4) drops to 77%, Coal Ore (Lv 1) drops to 75%, Goblin Pouch (Lv 2) drops to 74%, Goblin Totem (Lv 2) drops to 70%.
  * At Level 41, cutoff is $41 - 10 = 31$: Steel Bar, Steel Ore, Banyan Log (Lv 25) drop to 96%, Pirates Code (Lv 26) drops to 91%, Lead Ore (Lv 15) drops to 90%, Venom Extract (Lv 14) drops to 89%, Essence of Shadows (Lv 12) drops to 93%, Spruce Log (Lv 10) & Iron Bar (Lv 10) drop to 83%, Deer Antler (Lv 8) drops to 78%, Copper Bar (Lv 5) drops to 76%, Ducks Mouth (Lv 4) drops to 71%, Coal Ore (Lv 1) drops to 70%, Goblin Pouch (Lv 2) drops to 69%, Goblin Totem (Lv 2) drops to 65%.
* Displayed efficiency on material cards equals $\text{Penalty Eff} \times \text{Quality Speed}$.

## 4. Quality Speed Multipliers (Mob Drops)

* Standard Mob Drops: 91% (0.91)
* Refined Mob Drops: 94% (0.94)
* Premium Mob Drops: 96% (0.96)
* Epic Mob Drops: 100% (1.00)
* Legendary Mob Drops: 109% (1.09)
* Mythic Mob Drops: 120% (1.20)
* Ores, Metal Bars, and Logs always run at standard speed (1.00).

## 5. Clamped Penalty Floors

When an item is severely over-level, its penalty hits the 25% base floor:
* Mythic: $0.25 \times 1.20 = 30\%$ displayed
* Legendary: $0.25 \times 1.09 = 27\%$ displayed
* Epic and Standard Ores/Bars/Logs: $0.25 \times 1.00 = 25\%$ displayed
* Premium: $0.25 \times 0.96 = 24\%$ displayed
* Refined: $0.25 \times 0.94 = 23.5\% \rightarrow 23\%$ or $24\%$ displayed
* Standard Mob Drops: $0.25 \times 0.91 = 22.75\% \rightarrow 23\%$ displayed

## 6. Material Burn Duration & Base Level 1 EXP

Each material has an intrinsic burn duration $T_{\text{item}}$ in seconds that never changes with player level.

At Forge Level 1 (base unbuffed rate 1,300 EXP/hr):
$$\text{Base Level 1 EXP} = \left(\frac{T_{\text{item}}}{3,600}\right) \times 1,300 \times \text{Quality Speed} \times \text{Level 1 Efficiency}$$

All 91 materials are cataloged with their intrinsic burn times and level 1 base EXP in `src/data/normalized-forge-materials.json`.
Raw empirical session logs are preserved in `idlemmo-forge-data.json`.

## 7. Backend API Architecture & Internal Constants

The client-side bundle is purely a presentation layer. All mathematical evaluations, level scaling, and temper updates are performed authoritatively by backend API endpoints:

* `/api/forge/lessons/preview`:
  Calculates lesson previews before starting. Returns `base_experience`, `bonus_experience` (buffs and essence crystals), `temper_increase`, `required_items`, `quantity_per_loop`, and `time_per_loop`.
* `/api/forge/lessons/information`:
  Returns active temper state and historical session metrics:
  * `maximum`: 100 (full temper bar)
  * `shards_per_full_bar`: 11 (base reward for completing a 100% cycle)
  * `early_claim_minimum_ratio`: 0.5 (can claim shards early once reaching 50% temper)
  * `banked_shards`: fractional shard accumulation tracked continuously
  * `max_idle_time`: 21,600,000 ms (exactly 6 hours offline cap)
* Global level difficulty constants:
  `level_difficulty`: 260, `early_level_anchor`: 20, `early_level_strength`: 2, `max_level`: 100.
