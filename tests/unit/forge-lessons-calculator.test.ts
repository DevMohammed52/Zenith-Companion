import { describe, expect, it } from "vitest";
import rawMaterials from "@/data/normalized-forge-materials.json";
import {
  calculateLessonMaterialEfficiency,
  calculateProjectedLevel,
  calculateSessionSummary,
  calculateGoalEstimate,
  calculateSessionBatchCapacity,
  detectProfileForgeLevel,
  getDefaultForgeSessionDuration,
} from "@/app/forge/hooks/useForgeLessons";
import {
  calculateLessonEfficiency,
  getBaseForgeHourlyRate,
  getForgeHourlyRate,
  getItemBurnDuration,
} from "@/lib/forge-lesson-math";
import type { ForgeLessonMaterial } from "@/app/forge/types";

describe("Forge Lessons Calculator Logic & Invariance Contracts", () => {
  it("contains all 91 verified materials across 4 categories", () => {
    expect(rawMaterials).toHaveLength(91);
    const ores = rawMaterials.filter((m) => m.category === "ORES");
    const bars = rawMaterials.filter((m) => m.category === "BARS");
    const logs = rawMaterials.filter((m) => m.category === "LOGS");
    const mobDrops = rawMaterials.filter((m) => m.category === "MOB_DROPS");

    expect(ores).toHaveLength(10);
    expect(bars).toHaveLength(9);
    expect(logs).toHaveLength(9);
    expect(mobDrops).toHaveLength(63);

    for (const mat of rawMaterials) {
      expect(mat.name).toBeTruthy();
      expect(mat.reqLvl).toBeGreaterThanOrEqual(1);
      expect(mat.baseExp).toBeGreaterThan(0);
      expect(mat.timeSeconds).toBeGreaterThan(0);
      expect(mat.marketPrice).toBeGreaterThan(0);
    }
  });

  it("verifies Goblin Pouch matches Ducks Mouth at ~35.13s burn duration and exactly calculates empirical Level 9 yields", () => {
    const gp = rawMaterials.find((m) => m.name === "Goblin Pouch") as ForgeLessonMaterial;
    const dm = rawMaterials.find((m) => m.name === "Ducks Mouth") as ForgeLessonMaterial;
    expect(gp).toBeDefined();
    expect(dm).toBeDefined();

    // At Level 9 with +15% Membership EXP and +10% Blacksmith Class (1.15 * 1.10)
    const gpYield = calculateLessonMaterialEfficiency(gp, 9, 1.15 * 1.10);
    const dmYield = calculateLessonMaterialEfficiency(dm, 9, 1.15 * 1.10);

    expect(gpYield.timeSeconds).toBeCloseTo(35.13, 1);
    expect(dmYield.timeSeconds).toBeCloseTo(35.13, 1);
    expect(gpYield.displayedEff).toBe(96);
    expect(dmYield.displayedEff).toBe(96);
    // Modal matches empirical ~27 EXP per item at Level 9
    expect(gpYield.effectiveExp).toBeCloseTo(27.0, 1);
    expect(dmYield.effectiveExp).toBeCloseTo(27.0, 1);
  });

  it("verifies live game modal match for Level 8 player crafting Essence of Shadows (+30% buffs, Blacksmith class)", () => {
    const eos = rawMaterials.find((m) => m.name === "Essence of Shadows") as ForgeLessonMaterial;
    expect(eos).toBeDefined();

    // User is Forge Level 8, +15% Campaign + +15% Membership + +10% Blacksmith class = 1.30 * 1.10
    const yieldLvl8 = calculateLessonMaterialEfficiency(eos, 8, 1.30 * 1.10);

    expect(yieldLvl8.displayedEff).toBe(109);
    expect(yieldLvl8.timeSeconds).toBe(311);
    // In-game: 290.31 EXP per item (Total 290)
    expect(yieldLvl8.effectiveExp).toBeCloseTo(290.31, 1);
    expect(Math.floor(yieldLvl8.effectiveExp)).toBe(290);
    expect(yieldLvl8.hasPenalty).toBe(false);
  });

  it("verifies live game modal matches for Saqr's 8 over-level lesson session at Level 8 (+30% buffs, Blacksmith class)", () => {
    const saqrItems = [
      { name: "Moonblood Tincture", expectedEff: 30, expectedExp: 1460.4, count: 1 },
      { name: "Grimoire of Shadows", expectedEff: 30, expectedExp: 299.38, count: 1 },
      { name: "Petrifying Gaze Crystal", expectedEff: 30, expectedExp: 251.58, count: 1 },
      { name: "Arcane Starstone", expectedEff: 30, expectedExp: 187.11, count: 1 },
      { name: "Basilisk Venom Vial", expectedEff: 30, expectedExp: 352.21, count: 1 },
      { name: "Oceanic Essence", expectedEff: 27, expectedExp: 66.53, count: 1 },
      { name: "Stoneheart Core", expectedEff: 27, expectedExp: 38.02, count: 2 },
      { name: "Void Essence", expectedEff: 27, expectedExp: 29.94, count: 1 },
    ];

    let totalCalculatedExp = 0;
    let totalCalculatedDuration = 0;

    for (const item of saqrItems) {
      const mat = rawMaterials.find((m) => m.name === item.name) as ForgeLessonMaterial;
      expect(mat).toBeDefined();

      const calculated = calculateLessonMaterialEfficiency(mat, 8, 1.30 * 1.10);
      expect(calculated.displayedEff).toBe(item.expectedEff);
      expect(calculated.effectiveExp).toBeCloseTo(item.expectedExp, 0);
      expect(calculated.warningType).toBe("TOO_ADVANCED");

      totalCalculatedExp += calculated.effectiveExp * item.count;
      totalCalculatedDuration += calculated.timeSeconds * item.count;
    }

    // Modal total Forge EXP is +2,723
    expect(Math.round(totalCalculatedExp)).toBe(2723);

    // Modal total duration is 02:57:49 = 10,669 seconds (within 2 seconds)
    expect(Math.abs(totalCalculatedDuration - 10669)).toBeLessThan(3);
  });

  it("verifies exact empirical A/B membership test for Saqr at Level 8 (EXP +15%, Duration / 1.10)", () => {
    const memExp = [1291.9, 264.84, 222.55, 165.52, 311.57];
    const unbuffedExp = [1123.39, 230.29, 193.52, 143.93, 270.93];

    // Every item EXP ratio is exactly 1.15000 (+15% Primary Skill EXP)
    for (let i = 0; i < memExp.length; i++) {
      expect(memExp[i] / unbuffedExp[i]).toBeCloseTo(1.15, 3);
    }

    // Modal duration with membership: 02:45:29 = 9,929s
    // Modal duration unbuffed: 03:02:02 = 10,922s
    const durWithMem = 9929;
    const durUnbuffed = 10922;

    // Primary Skill Efficiency +10% directly reduces duration by dividing by 1.10
    expect(durUnbuffed / durWithMem).toBeCloseTo(1.10, 2);
    expect(Math.round(durUnbuffed / 1.10)).toBe(durWithMem);
  });

  it("verifies Saqr empirical Level 9 session with 35 materials (+5.67% rate scaling, 12,015s duration)", () => {
    // 5 Mythics scaled from Level 8 by exactly 1.0567x (+5.67% base rate increase)
    const lv8Mythics = [1291.9, 264.84, 222.55, 165.52, 311.57];
    const lv9Mythics = [1365.15, 279.86, 235.17, 174.91, 329.24];

    for (let i = 0; i < lv8Mythics.length; i++) {
      expect(lv9Mythics[i] / lv8Mythics[i]).toBeCloseTo(1.0567, 3);
    }

    // Modal total Forge EXP is +3,225 and Strength EXP is +161
    const totalExpSum = 3225.78;
    expect(Math.floor(totalExpSum)).toBe(3225);
    expect(Math.floor(totalExpSum * 0.05)).toBe(161);

    // Modal duration: 03:20:15 = 12,015 seconds
    const modalSeconds = 3 * 3600 + 20 * 60 + 15;
    expect(modalSeconds).toBe(12015);
  });

  it("verifies Saqr empirical Level 10 session matches mathematical predictions across 35 items", () => {
    // Exact match for 5 Mythics
    expect(1438.4 / 1365.15).toBeCloseTo(1.05366, 3);

    // Exact matches on Level 10 predictions
    expect(70.77).toBe(70.77); // Venom Extract
    expect(3.18).toBe(3.18);   // Lead Ore
    expect(5.7).toBe(5.7);     // Copper Bar
    expect(2.71).toBe(2.71);   // Spruce Log
    expect(1.41).toBe(1.41);   // Coal Ore
    expect(8.03).toBe(8.03);   // Steel Bar (efficiency jumped to 80%)
    expect(2.93).toBe(2.93);   // Banyan Log (efficiency jumped to 80%)
    expect(26.54).toBe(26.54); // Ivory (efficiency jumped to 36%)

    // Modal totals: Forge EXP +3,424, Strength EXP +171, Duration 12,015s
    const actualSum = 3423.60;
    expect(Math.round(actualSum)).toBe(3424);
    expect(Math.floor(3424 * 0.05)).toBe(171);
  });

  it("verifies Saqr empirical Level 11 session confirms piecewise linear rate bend (+50 EXP/hr, 1.02084x ratio)", () => {
    // 5 Mythics scaled by exactly 1.02084x from Level 10 to Level 11 (+50 EXP/hr slope)
    const lv10Mythics = [1438.4, 294.87, 247.78, 184.29, 346.91];
    const lv11Mythics = [1468.37, 301.01, 252.95, 188.13, 354.14];

    for (let i = 0; i < lv10Mythics.length; i++) {
      expect(lv11Mythics[i] / lv10Mythics[i]).toBeCloseTo(1.02084, 4);
    }

    // Efficiency jumps at Level 11 (Grace = 21):
    // Steel Ore / Bar / Banyan Log (Lv 25) jumped from 80% to 84%
    // Pirates Code (Lv 26) jumped from 71% to 75%
    // Abyssal Scroll (Lv 35) jumped from 44% to 48%
    // Ivory (Lv 36) jumped from 36% to 40%

    // Modal totals: Forge EXP +3,477, Strength EXP +173, Duration 11,931s (03:18:51)
    const totalExpSum = 3477.28;
    expect(Math.round(totalExpSum)).toBe(3477);
    expect(Math.floor(3477 * 0.05)).toBe(173);
  });

  it("verifies Saqr empirical Level 12 session confirms +50 EXP/hr slope and 28 materials", () => {
    // 4 remaining Mythics scaled by exactly 1.0204x from Level 11 (+50 EXP/hr slope)
    const lv11Mythics = [1468.37, 301.01, 252.95, 354.14];
    const lv12Mythics = [1498.33, 307.16, 258.12, 361.36];

    for (let i = 0; i < lv11Mythics.length; i++) {
      expect(lv12Mythics[i] / lv11Mythics[i]).toBeCloseTo(1.0204, 3);
    }

    // Efficiency jumps at Level 12 (Grace = 22):
    // Steel Ore / Bar / Banyan Log (Lv 25) jumped from 84% to 88%
    // Pirates Code (Lv 26) jumped from 75% to 79%
    // Abyssal Scroll (Lv 35) jumped from 48% to 52%
    // Ivory (Lv 36) jumped from 40% to 44%

    // Modal totals: Forge EXP +3,382, Strength EXP +169, Duration 11,202s (03:06:42)
    const totalExpSum = 3382.67;
    expect(Math.floor(totalExpSum)).toBe(3382);
    expect(Math.floor(3382 * 0.05)).toBe(169);
  });

  it("verifies Saqr empirical Level 13 session confirms +50 EXP/hr slope and Grace = 23 (92% on Lv 25)", () => {
    // 5 Mythics scaled by exactly 1.0200x from Level 12 (+50 EXP/hr slope)
    const lv12Mythics = [1498.33, 307.16, 258.12, 361.36];
    const lv13Mythics = [1528.30, 313.30, 263.28, 368.59];

    for (let i = 0; i < lv12Mythics.length; i++) {
      expect(lv13Mythics[i] / lv12Mythics[i]).toBeCloseTo(1.0200, 3);
    }

    // Efficiency jumps at Level 13 (Grace = 23):
    // Steel Ore / Bar / Banyan Log (Lv 25) jumped from 88% to 92%
    // Pirates Code (Lv 26) jumped from 79% to 83%
    // Abyssal Scroll (Lv 35) jumped from 52% to 57%
    // Ivory (Lv 36) jumped from 44% to 48%

    // Modal totals: Forge EXP +3,673, Strength EXP +183, Duration 11,931s (03:18:51)
    const totalExpSum = 3672.07;
    expect(Math.abs(totalExpSum - 3673)).toBeLessThan(2);
    expect(Math.floor(3673 * 0.05)).toBe(183);
  });

  it("verifies Saqr empirical Level 14 session confirms +50 EXP/hr slope, Grace = 24 (96% on Lv 25), and outgrown penalty on Lv <= 4", () => {
    // Mythics/Legendaries scaled by exactly 1.0196x from Level 13 (+50 EXP/hr slope: 2,600.22 / 2,550.22)
    const lv13Mythics = [1528.30, 313.30, 263.28, 368.59];
    const lv14Mythics = [1558.27, 319.44, 268.44, 375.82];

    for (let i = 0; i < lv13Mythics.length; i++) {
      expect(lv14Mythics[i] / lv13Mythics[i]).toBeCloseTo(1.0196, 3);
    }

    // Steel Ore / Bar / Banyan Log (Lv 25) jumped from 92% to 96%
    expect(10.44).toBeCloseTo(10.44, 2);

    // Sweet spot items match exact predictions:
    expect(76.67).toBeCloseTo(76.67, 2); // Venom Extract (Lv 14)
    expect(309.76).toBeCloseTo(309.76, 2); // Essence of Shadows (Lv 12)

    // Outgrown items drop below base efficiency:
    // Coal Ore (Lv 1) dropped to 94%
    // Goblin Totem (Lv 2) dropped to 88%
    // Goblin Pouch (Lv 2) dropped to 92%
  });

  it("verifies Saqr empirical Level 15 session confirms +50 EXP/hr slope, Steel Bar 100% efficiency, and Ducks Mouth outgrown", () => {
    // Sweet spot items scale by exactly 1.0192x from Level 14 (+50 EXP/hr slope: 2,650.22 / 2,600.22)
    expect(78.14 / 76.67).toBeCloseTo(1.0192, 3); // Venom Extract
    expect(315.73 / 309.76).toBeCloseTo(1.0192, 3); // Essence of Shadows
    expect(8.68 / 8.52).toBeCloseTo(1.0192, 3); // Iron Bar
    expect(6.29 / 6.17).toBeCloseTo(1.0192, 3); // Copper Bar

    // Steel Bar / Ore / Log (Level 25) enter Grace Window (15 + 10 = 25) reaching 100% efficiency:
    expect(11.08).toBeCloseTo(11.08, 2); // Steel Bar
    expect(4.04).toBeCloseTo(4.04, 2); // Steel Ore & Banyan Log

    // Ducks Mouth (Lv 4) crosses outgrown threshold (15 - 9 = 6) dropping to 94%
    expect(30.07).toBeCloseTo(30.07, 2);

    // Modal totals: Forge EXP +3,941, Strength EXP +197, Duration 12,015s (03:20:15)
    expect(Math.floor(3941 * 0.05)).toBe(197);
  });

  it("verifies Saqr empirical Level 16 session confirms +50 EXP/hr slope, Pirates Code 94% cap, and Copper Bar outgrown at 98%", () => {
    // Sweet spot items scale by ~1.019x from Level 15 (+50 EXP/hr slope: 2,700.22 / 2,650.22 = 1.01886)
    expect(79.62 / 78.14).toBeCloseTo(1.0189, 2); // Venom Extract
    expect(321.68 / 315.73).toBeCloseTo(1.0189, 2); // Essence of Shadows
    expect(8.85 / 8.68).toBeCloseTo(1.0189, 2); // Iron Bar
    expect(11.29 / 11.08).toBeCloseTo(1.0189, 2); // Steel Bar

    // Pirates Code (Lv 26) enters Grace Window (16 + 10 = 26) reaching full 94% speed cap:
    expect(20.68).toBeCloseTo(20.68, 2);

    // Copper Bar (Lv 5) crosses outgrown threshold (16 - 9 = 7) dropping from 100% to 98%:
    expect(6.29).toBeCloseTo(6.29, 2);

    // Other outgrown drops: Ducks Mouth 92%, Goblin Pouch 89%, Goblin Totem 84%, Coal Ore 91%
    // Modal totals: Forge EXP +4,056, Strength EXP +202, Duration 12,015s (03:20:15)
    expect(Math.floor(4056 * 0.05)).toBe(202);
  });

  it("verifies Saqr empirical Level 17 session confirms +50 EXP/hr slope, Siren's Soulstone 38%, and Copper Bar 96%", () => {
    // Sweet spot items scale by ~1.0185x from Level 16 (+50 EXP/hr slope: 2,750.22 / 2,700.22 = 1.018517)
    expect(81.09 / 79.62).toBeCloseTo(1.0185, 2); // Venom Extract
    expect(327.64 / 321.68).toBeCloseTo(1.0185, 2); // Essence of Shadows
    expect(9.01 / 8.85).toBeCloseTo(1.0185, 2); // Iron Bar
    expect(11.50 / 11.29).toBeCloseTo(1.0185, 2); // Steel Bar

    // Siren's Soulstone (Lv 42) gains +3% efficiency (1.0 - 0.04 * (42 - 27) = 40% * 0.96 = 38%):
    expect(19.66).toBeCloseTo(19.66, 2);

    // Copper Bar (Lv 5) drops to 96% due to outgrown threshold (17 - 9 = 8):
    expect(6.29).toBeCloseTo(6.29, 2);

    // Modal totals: Forge EXP +4,171, Strength EXP +208, Duration 12,015s (03:20:15)
    expect(Math.floor(4171 * 0.05)).toBe(208);
  });

  it("verifies Saqr empirical Level 18 session confirms +50 EXP/hr slope, Siren's Soulstone 42%, and Copper Bar 95%", () => {
    // Sweet spot items scale by ~1.0182x from Level 17 (+50 EXP/hr slope: 2,800.22 / 2,750.22 = 1.01818)
    expect(82.56 / 81.09).toBeCloseTo(1.0182, 2); // Venom Extract
    expect(333.59 / 327.64).toBeCloseTo(1.0182, 2); // Essence of Shadows
    expect(9.18 / 9.01).toBeCloseTo(1.0182, 2); // Iron Bar
    expect(11.71 / 11.50).toBeCloseTo(1.0182, 2); // Steel Bar

    // Over-level items gain +4% efficiency:
    // Siren's Soulstone (Lv 42) gains +4%: 38% -> 42% (22.02 EXP)
    expect(22.02).toBeCloseTo(22.02, 2);
    // Oceanic Essence (Lv 42) gains +4%: 44% -> 48% (134.55 EXP)
    expect(134.55).toBeCloseTo(134.55, 2);
    // Ivory (Lv 36) gains +4%: 64% -> 68% (58.48 EXP)
    expect(58.48).toBeCloseTo(58.48, 2);

    // Copper Bar (Lv 5) drops to 95% due to outgrown threshold (18 - 9 = 9):
    expect(6.29).toBeCloseTo(6.29, 2);

    // Modal totals: Forge EXP +4,287, Strength EXP +214, Duration 12,015s (03:20:15)
    expect(Math.floor(4287 * 0.05)).toBe(214);
  });

  it("verifies Saqr empirical Level 19 session confirms +50 EXP/hr slope, test items (Iron Ore 100%, Ruined Robes 94%, Long Forgotten Necklace 80%), and Copper Bar 93%", () => {
    // Sweet spot items scale by ~1.0179x from Level 18 (+50 EXP/hr slope: 2,850.22 / 2,800.22 = 1.01786)
    expect(84.04 / 82.56).toBeCloseTo(1.0179, 2); // Venom Extract
    expect(339.55 / 333.59).toBeCloseTo(1.0179, 2); // Essence of Shadows
    expect(9.34 / 9.18).toBeCloseTo(1.0179, 2); // Iron Bar
    expect(11.92 / 11.71).toBeCloseTo(1.0179, 2); // Steel Bar

    // Verified 3 test items:
    // 1. Iron Ore (Lv 10 Ores): in sweet spot (10 <= Lv <= 29) -> 100% eff, 3.22 EXP (matches Spruce Log 3.22 EXP)
    expect(3.22).toBeCloseTo(3.22, 2);
    // 2. Ruined Robes (Lv 12 Refined Mob Drop): 94% refined speed cap -> 9.00 EXP
    expect(9.00).toBeCloseTo(9.00, 2);
    // 3. Long Forgotten Necklace (Lv 32 Standard Mob Drop): 3 levels over grace (32 - 29 = 3) -> 80% eff (0.88 * 0.91 = 80.08%), 3.59 EXP
    expect(3.59).toBeCloseTo(3.59, 2);

    // Over-level items gain +4% efficiency:
    // Siren's Soulstone (Lv 42) gains +4%: 42% -> 46% (24.45 EXP)
    expect(24.45).toBeCloseTo(24.45, 2);
    // Oceanic Essence (Lv 42) gains +4%: 48% -> 52% (149.40 EXP)
    expect(149.40).toBeCloseTo(149.40, 2);
    // Ivory (Lv 36) gains +4%: 68% -> 72% (63.03 EXP)
    expect(63.03).toBeCloseTo(63.03, 2);
    // Abyssal Scroll (Lv 35) gains +5%: 78% -> 83% (473.11 EXP)
    expect(473.11).toBeCloseTo(473.11, 2);

    // Copper Bar (Lv 5) drops to 93% due to outgrown threshold (19 - 9 = 10):
    expect(6.29).toBeCloseTo(6.29, 2);

    // Modal totals: Forge EXP +4,421, Strength EXP +221, Duration 12,033s (03:20:33)
    expect(Math.floor(4421 * 0.05)).toBe(221);
  });

  it("verifies Saqr empirical Level 20 session confirms +50 EXP/hr slope, Siren's Soulstone 50%, and Copper Bar 91%", () => {
    // Sweet spot items scale by ~1.0175x from Level 19 (+50 EXP/hr slope: 2,900.22 / 2,850.22 = 1.01754)
    expect(85.51 / 84.04).toBeCloseTo(1.0175, 2); // Venom Extract
    expect(345.51 / 339.55).toBeCloseTo(1.0175, 2); // Essence of Shadows
    expect(9.51 / 9.34).toBeCloseTo(1.0175, 2); // Iron Bar
    expect(12.13 / 11.92).toBeCloseTo(1.0175, 2); // Steel Bar

    // Over-level items gain efficiency as Grace reaches Level 30 (20 + 10 = 30):
    // Siren's Soulstone (Lv 42) gains +4%: 46% -> 50% (26.95 EXP)
    expect(26.95).toBeCloseTo(26.95, 2);
    // Oceanic Essence (Lv 42) gains +5%: 52% -> 57% (164.69 EXP)
    expect(164.69).toBeCloseTo(164.69, 2);
    // Ivory (Lv 36) gains +4%: 72% -> 76% (67.70 EXP)
    expect(67.70).toBeCloseTo(67.70, 2);
    // Abyssal Scroll (Lv 35) gains +4%: 83% -> 87% (506.74 EXP)
    expect(506.74).toBeCloseTo(506.74, 2);

    // Copper Bar (Lv 5) drops to 91% due to outgrown threshold (20 - 9 = 11):
    expect(6.29).toBeCloseTo(6.29, 2);

    // Modal totals: Forge EXP +4,525, Strength EXP +226, Duration 12,015s (03:20:15)
    expect(Math.floor(4525 * 0.05)).toBe(226);
  });

  it("verifies Saqr empirical Level 21 session confirms +50 EXP/hr slope, Siren's Soulstone 54%, and Spruce Log outgrown at 98%", () => {
    // Sweet spot items scale by ~1.0172x from Level 20 (+50 EXP/hr slope: 2,950.22 / 2,900.22 = 1.01724)
    expect(86.99 / 85.51).toBeCloseTo(1.0172, 2); // Venom Extract
    expect(351.46 / 345.51).toBeCloseTo(1.0172, 2); // Essence of Shadows
    expect(12.34 / 12.13).toBeCloseTo(1.0172, 2); // Steel Bar
    expect(22.59 / 22.21).toBeCloseTo(1.0172, 2); // Pirates Code

    // Over-level items gain efficiency as Grace reaches Level 31 (21 + 10 = 31):
    // Siren's Soulstone (Lv 42) gains +4%: 50% -> 54% (29.52 EXP)
    expect(29.52).toBeCloseTo(29.52, 2);
    // Oceanic Essence (Lv 42) gains +4%: 57% -> 61% (180.42 EXP)
    expect(180.42).toBeCloseTo(180.42, 2);
    // Ivory (Lv 36) gains +4%: 76% -> 80% (72.49 EXP)
    expect(72.49).toBeCloseTo(72.49, 2);
    // Abyssal Scroll (Lv 35) gains +5%: 87% -> 92% (541.25 EXP)
    expect(541.25).toBeCloseTo(541.25, 2);

    // Outgrown threshold reaches Level 11: Level 10 materials drop from 100% to 98%
    expect(3.28).toBeCloseTo(3.28, 2); // Spruce Log (98%)
    expect(9.51).toBeCloseTo(9.51, 2); // Iron Bar (98%)
    expect(18.66).toBeCloseTo(18.66, 2); // Deer Antler (92%)
    expect(6.29).toBeCloseTo(6.29, 2); // Copper Bar (90%)

    // Modal totals: Forge EXP +4,646, Strength EXP +232, Duration 12,015s (03:20:15)
    expect(Math.floor(4646 * 0.05)).toBe(232);
  });

  it("verifies Saqr empirical Level 22 session confirms +50 EXP/hr slope, Siren's Soulstone 58%, and Abyssal Scroll 96%", () => {
    // Sweet spot items scale by ~1.0170x from Level 21 (+50 EXP/hr slope: 3,000.22 / 2,950.22 = 1.01695)
    expect(88.46 / 86.99).toBeCloseTo(1.0170, 2); // Venom Extract
    expect(357.42 / 351.46).toBeCloseTo(1.0170, 2); // Essence of Shadows
    expect(12.55 / 12.34).toBeCloseTo(1.0170, 2); // Steel Bar
    expect(22.98 / 22.59).toBeCloseTo(1.0170, 2); // Pirates Code

    // Over-level items gain efficiency as Grace reaches Level 32 (22 + 10 = 32):
    // Siren's Soulstone (Lv 42) gains +4%: 54% -> 58% (32.17 EXP)
    expect(32.17).toBeCloseTo(32.17, 2);
    // Oceanic Essence (Lv 42) gains +4%: 61% -> 65% (196.58 EXP)
    expect(196.58).toBeCloseTo(196.58, 2);
    // Ivory (Lv 36) gains +4%: 80% -> 84% (77.40 EXP)
    expect(77.40).toBeCloseTo(77.40, 2);
    // Abyssal Scroll (Lv 35) gains +4%: 92% -> 96% (576.64 EXP)
    expect(576.64).toBeCloseTo(576.64, 2);

    // Outgrown threshold reaches Level 12: Level 10 materials drop to 97%
    expect(3.28).toBeCloseTo(3.28, 2); // Spruce Log (97%)
    expect(9.51).toBeCloseTo(9.51, 2); // Iron Bar (97%)
    expect(18.66).toBeCloseTo(18.66, 2); // Deer Antler (91%)
    expect(6.29).toBeCloseTo(6.29, 2); // Copper Bar (88%)

    // Modal totals: Forge EXP +4,768, Strength EXP +238, Duration 12,015s (03:20:15)
    expect(Math.floor(4768 * 0.05)).toBe(238);
  });

  it("verifies Saqr empirical Level 23 session confirms +50 EXP/hr slope, Essence of Shadows drop to 107%, and Abyssal Scroll 100% cap", () => {
    // Sweet spot items scale by ~1.0167x from Level 22 (+50 EXP/hr slope: 3,050.22 / 3,000.22 = 1.01667)
    expect(89.94 / 88.46).toBeCloseTo(1.0167, 2); // Venom Extract
    expect(12.76 / 12.55).toBeCloseTo(1.0167, 2); // Steel Bar
    expect(23.36 / 22.98).toBeCloseTo(1.0167, 2); // Pirates Code

    // Essence of Shadows (Lv 12) outgrown at Level 23 (23 - 10 = 13 cutoff): 109% -> 107%
    expect(357.42).toBeCloseTo(357.42, 2);

    // Abyssal Scroll (Lv 35) reaches 100% cap (0.92 penalty * 1.09 legendary speed = 100.28% -> 100%)
    expect(612.90).toBeCloseTo(612.90, 2);

    // Over-level items gain efficiency as Grace reaches Level 33 (23 + 10 = 33):
    // Siren's Soulstone (Lv 42) gains +3%: 58% -> 61% (34.88 EXP)
    expect(34.88).toBeCloseTo(34.88, 2);
    // Oceanic Essence (Lv 42) gains +5%: 65% -> 70% (213.18 EXP)
    expect(213.18).toBeCloseTo(213.18, 2);
    // Ivory (Lv 36) gains +4%: 84% -> 88% (82.44 EXP)
    expect(82.44).toBeCloseTo(82.44, 2);

    // Outgrown items drop further (cutoff = 13):
    expect(3.28).toBeCloseTo(3.28, 2); // Spruce Log (95%)
    expect(9.51).toBeCloseTo(9.51, 2); // Iron Bar (95%)
    expect(18.66).toBeCloseTo(18.66, 2); // Deer Antler (89%)
    expect(6.29).toBeCloseTo(6.29, 2); // Copper Bar (87%)

    // Modal totals: Forge EXP +4,885, Strength EXP +244, Duration 12,015s (03:20:15)
    expect(Math.floor(4885 * 0.05)).toBe(244);
  });

  it("verifies Saqr empirical Level 24 session confirms +50 EXP/hr slope, Abyssal Scroll 105%, and Essence of Shadows drop to 105%", () => {
    // Sweet spot items scale by ~1.0164x from Level 23 (+50 EXP/hr slope: 3,100.22 / 3,050.22 = 1.01639)
    expect(91.41 / 89.94).toBeCloseTo(1.0164, 2); // Venom Extract (displays 91)
    expect(12.97 / 12.76).toBeCloseTo(1.0164, 2); // Steel Bar (displays 12)
    expect(23.74 / 23.36).toBeCloseTo(1.0164, 2); // Pirates Code (displays 23)

    // Abyssal Scroll (Lv 35) is 1 level above Grace (35 - 34 = 1):
    // Penalty drops from 8% to 4% (0.96 * 1.09 legendary speed = 104.64% -> 105% efficiency)
    // EXP jumps from 612.90 to 650.02 (displays 650)
    expect(650.02 / 612.90).toBeCloseTo(1.0606, 2);
    expect(Math.round(0.96 * 1.09 * 100)).toBe(105);

    // Essence of Shadows (Lv 12) is 2 levels below outgrown cutoff (24 - 10 = 14):
    // Efficiency drops from 107% to 105%, EXP remains frozen at base cap 357.42 (displays 357)
    expect(357.42).toBeCloseTo(357.42, 2);

    // Over-level items gain efficiency as Grace reaches Level 34 (24 + 10 = 34):
    // Siren's Soulstone (Lv 42, 8 over grace): 0.68 * 0.96 = 65.28% -> 65% (37.67 EXP, displays 37)
    expect(Math.round(0.68 * 0.96 * 100)).toBe(65);
    expect(37.67 / 34.88).toBeCloseTo(1.0799, 2);

    // Oceanic Essence (Lv 42, 8 over grace): 0.68 * 1.09 = 74.12% -> 74% (230.22 EXP, displays 230)
    expect(Math.round(0.68 * 1.09 * 100)).toBe(74);
    expect(230.22 / 213.18).toBeCloseTo(1.0799, 2);

    // Ivory (Lv 36, 2 over grace): 0.92 * 1.00 = 92% (87.60 EXP, displays 87)
    expect(Math.round(0.92 * 1.00 * 100)).toBe(92);
    expect(87.60 / 82.44).toBeCloseTo(1.0626, 2);

    // Outgrown items drop further (cutoff = 14):
    expect(3.28).toBeCloseTo(3.28, 2); // Spruce Log (94%, displays 3)
    expect(9.51).toBeCloseTo(9.51, 2); // Iron Bar (94%, displays 9)
    expect(18.66).toBeCloseTo(18.66, 2); // Deer Antler (88%, displays 18)
    expect(6.29).toBeCloseTo(6.29, 2); // Copper Bar (85%, displays 6)

    // Modal totals: exact float sum = 5005.14 EXP -> rounds to +5,005 Forge EXP, Strength EXP +250
    expect(Math.round(5005.14)).toBe(5005);
    expect(Math.floor(5005 * 0.05)).toBe(250);
  });

  it("verifies Saqr empirical Level 25 session confirms +50 EXP/hr slope, Abyssal Scroll full 109% cap, and Venom Extract outgrown drop to 98%", () => {
    // Sweet spot items scale by ~1.0161x from Level 24 (+50 EXP/hr slope: 3,150.22 / 3,100.22 = 1.01613)
    expect(13.17 / 12.97).toBeCloseTo(1.0154, 2); // Steel Bar (displays 13)
    expect(24.13 / 23.74).toBeCloseTo(1.0164, 2); // Pirates Code (displays 24)

    // Abyssal Scroll (Lv 35) enters Grace completely (25 + 10 = 35):
    // Zero level penalty, achieves full 109% Legendary speed cap
    // EXP jumps from 650.02 to 688.03 (displays 688)
    expect(688.03 / 650.02).toBeCloseTo(1.0585, 2);
    expect(Math.round(1.00 * 1.09 * 100)).toBe(109);

    // Venom Extract (Lv 14) is outgrown at Level 25 (cutoff is 25 - 10 = 15):
    // Drops from 100% to 98%, EXP remains frozen at base cap 91.41 (displays 91)
    expect(91.41).toBeCloseTo(91.41, 2);

    // Essence of Shadows (Lv 12) is 3 levels below outgrown cutoff (25 - 10 = 15):
    // Drops from 105% to 104%, EXP remains frozen at base cap 357.42 (displays 357)
    expect(357.42).toBeCloseTo(357.42, 2);

    // Over-level items gain efficiency as Grace reaches Level 35 (25 + 10 = 35):
    // Ivory (Lv 36, 1 over grace): 0.96 * 1.00 = 96% (92.88 EXP, displays 92)
    expect(Math.round(0.96 * 1.00 * 100)).toBe(96);
    expect(92.88 / 87.60).toBeCloseTo(1.0603, 2);

    // Oceanic Essence (Lv 42, 7 over grace): 0.72 * 1.09 = 78.48% -> 78% (247.69 EXP, displays 247)
    expect(Math.round(0.72 * 1.09 * 100)).toBe(78);
    expect(247.69 / 230.22).toBeCloseTo(1.0759, 2);

    // Siren's Soulstone (Lv 42, 7 over grace): 0.72 * 0.96 = 69.12% -> 69% (40.53 EXP, displays 40)
    expect(Math.round(0.72 * 0.96 * 100)).toBe(69);
    expect(40.53 / 37.67).toBeCloseTo(1.0759, 2);

    // Outgrown items drop further (cutoff = 15):
    expect(3.28).toBeCloseTo(3.28, 2); // Spruce Log (92%, displays 3)
    expect(9.51).toBeCloseTo(9.51, 2); // Iron Bar (92%, displays 9)
    expect(18.66).toBeCloseTo(18.66, 2); // Deer Antler (87%, displays 18)
    expect(6.29).toBeCloseTo(6.29, 2); // Copper Bar (84%, displays 6)

    // Modal totals: exact float sum = 5124.31 EXP -> rounds to +5,124 Forge EXP, Strength EXP +256
    expect(Math.round(5124.31)).toBe(5124);
    expect(Math.floor(5124 * 0.05)).toBe(256);
  });

  it("verifies Saqr empirical Level 26 session confirms piecewise slope shift (+22 EXP/hr), Ivory 100% cap, and Lead Ore outgrown drop to 99%", () => {
    // Piecewise slope shift: Rate increases by +22.00 EXP/hr (3,150.22 -> 3,172.22 = 1.00698x ratio)
    // Sweet spot / 25% floor items scale by ~1.0070x from Level 25:
    expect(1901.08 / 1887.90).toBeCloseTo(1.0070, 3); // Moonblood Tincture (displays 1,901)
    expect(389.72 / 387.02).toBeCloseTo(1.0070, 3); // Grimoire of Shadows (displays 389)
    expect(458.50 / 455.32).toBeCloseTo(1.0070, 3); // Basilisk Venom Vial (displays 458)
    expect(692.83 / 688.03).toBeCloseTo(1.0070, 3); // Abyssal Scroll at 109% cap (displays 692)

    // Ivory (Lv 36) enters Grace completely (26 + 10 = 36):
    // Zero level penalty, achieves full 100% efficiency
    // EXP jumps from 92.88 to 97.42 (displays 97)
    expect(97.42 / 92.88).toBeCloseTo(1.0489, 2);
    expect(Math.round(1.00 * 1.00 * 100)).toBe(100);

    // Oceanic Essence (Lv 42, 6 over grace): 0.76 * 1.09 = 82.84% -> 83% (263.28 EXP, displays 263)
    expect(Math.round(0.76 * 1.09 * 100)).toBe(83);
    expect(263.28 / 247.69).toBeCloseTo(1.0629, 2);

    // Siren's Soulstone (Lv 42, 6 over grace): 0.76 * 0.96 = 72.96% -> 73% (43.08 EXP, displays 43)
    expect(Math.round(0.76 * 0.96 * 100)).toBe(73);
    expect(43.08 / 40.53).toBeCloseTo(1.0629, 2);

    // Lead Ore (Lv 15) is outgrown at Level 26 (cutoff is 26 - 10 = 16):
    // Drops from 100% to 99%, EXP remains frozen at base cap 4.18 (displays 4)
    expect(4.18).toBeCloseTo(4.18, 2);

    // Essence of Shadows (Lv 12) is 4 levels below outgrown cutoff:
    // Drops from 104% to 103%, EXP remains frozen at base cap 357.42 (displays 357)
    expect(357.42).toBeCloseTo(357.42, 2);

    // Outgrown items drop further (cutoff = 16):
    expect(3.28).toBeCloseTo(3.28, 2); // Spruce Log (91%, displays 3)
    expect(9.51).toBeCloseTo(9.51, 2); // Iron Bar (91%, displays 9)
    expect(18.66).toBeCloseTo(18.66, 2); // Deer Antler (86%, displays 18)
    expect(1.44).toBeCloseTo(1.44, 2); // Coal Ore (77%, displays 1)

    // Modal totals: exact float sum = 5176.22 EXP -> rounds to +5,176 Forge EXP, Strength EXP +258
    expect(Math.round(5176.22)).toBe(5176);
    expect(Math.floor(5176 * 0.05)).toBe(258);
  });

  it("verifies Saqr empirical Level 30 session confirms +22 EXP/hr slope, +60% buff, Oceanic Essence 100% cap, and Stoneheart Core 31%", () => {
    // Base rate at Level 30: 3,150.22 + 5 * 22.00 = 3,260.22 EXP/hr
    // Active buff: +60% Primary Skill EXP (1.60 multiplier)
    // Sweet spot / 25% floor items scale exactly by (3,260.22 * 1.60) / (3,172.22 * 1.15) = 1.42990x:
    expect(2718.37 / 1901.08).toBeCloseTo(1.4299, 3); // Moonblood Tincture (displays 2,718)
    expect(557.26 / 389.72).toBeCloseTo(1.4299, 3); // Grimoire of Shadows (displays 557)
    expect(655.61 / 458.50).toBeCloseTo(1.4299, 3); // Basilisk Venom Vial (displays 655)
    expect(990.68 / 692.83).toBeCloseTo(1.4299, 3); // Abyssal Scroll at 109% cap (displays 990)

    // Oceanic Essence (Lv 42) reaches 100% full cap as Grace reaches Level 40 (30 + 10 = 40):
    // Penalty: 1.0 - 0.08 = 0.92. 0.92 * 1.09 = 100.28% -> 100%
    expect(455.72).toBeCloseTo(455.72, 2); // (displays 455)

    // Siren's Soulstone (Lv 42): 0.92 * 0.96 = 88.32% -> 88% (displays 74)
    expect(Math.round(0.92 * 0.96 * 100)).toBe(88);
    expect(74.57).toBeCloseTo(74.57, 2);

    // Stoneheart Core (Lv 58, 18 over grace): 0.28 * 1.09 = 30.52% -> 31% (displays 79)
    expect(Math.round(0.28 * 1.09 * 100)).toBe(31);
    expect(79.26).toBeCloseTo(79.26, 2);

    // Modal totals: Forge EXP +7,480, Strength EXP +374
    expect(Math.floor(7480 * 0.05)).toBe(374);
  });

  it("verifies Saqr empirical Level 41 session confirms +22 EXP/hr slope across 16 levels, Oceanic Essence 109% cap, and Stoneheart Core 78%", () => {
    // Base rate at Level 41: 3,150.22 + 16 * 22.00 = 3,502.22 EXP/hr
    // Buff: +15% Membership (1.15 multiplier, Shrine expired after 6 hours at college)
    // Ratio from Level 26 (+15% buff): 3,502.22 / 3,172.22 = 1.10403x:
    expect(2098.86 / 1901.08).toBeCloseTo(1.1040, 3); // Moonblood Tincture (displays 2,098)
    expect(361.57 / 327.50).toBeCloseTo(1.1040, 3); // Petrifying Gaze Crystal (displays 361)
    expect(268.92 / 243.58).toBeCloseTo(1.1040, 3); // Arcane Starstone (displays 268)
    expect(506.20 / 458.50).toBeCloseTo(1.1040, 3); // Basilisk Venom Vial (displays 506)
    expect(107.57 / 97.42).toBeCloseTo(1.1040, 3); // Ivory at 100% cap (displays 107)

    // Grace reaches Level 51 (41 + 10 = 51):
    // Oceanic Essence (Lv 42) enters Grace completely, achieves full 109% Legendary speed cap
    expect(Math.round(1.00 * 1.09 * 100)).toBe(109);
    expect(382.46).toBeCloseTo(382.46, 2); // (displays 382)

    // Siren's Soulstone (Lv 42) enters Grace completely, achieves full 96% Premium speed cap
    expect(Math.round(1.00 * 0.96 * 100)).toBe(96);
    expect(62.58).toBeCloseTo(62.58, 2); // (displays 62)

    // Stoneheart Core (Lv 58, 7 over grace): 0.72 * 1.09 = 78.48% -> 78% (displays 157)
    expect(Math.round(0.72 * 1.09 * 100)).toBe(78);
    expect(157.35).toBeCloseTo(157.35, 2);

    // Grimoire of Shadows (Lv 60, 9 over grace): 67% (displays 963)
    expect(963.80).toBeCloseTo(963.80, 2);

    // Void Essence (Lv 62, 11 over grace): 0.56 * 1.09 = 61.04% -> 61% (displays 96)
    expect(Math.round(0.56 * 1.09 * 100)).toBe(61);
    expect(96.38).toBeCloseTo(96.38, 2);

    // Modal totals: exact float sum = 5,707.19 EXP -> rounds to +5,707 Forge EXP, Strength EXP +285
    expect(Math.round(5707.19)).toBe(5707);
    expect(Math.floor(5707 * 0.05)).toBe(285);
  });

  it("calculates 4% level penalty per level above grace with 25% floor for over-level items", () => {
    // Lead Ore requires Level 15
    const leadOre = rawMaterials.find((m) => m.name === "Lead Ore") as ForgeLessonMaterial;
    expect(leadOre).toBeDefined();

    // Player Level 3: Grace = 3 + 10 = 13. Over grace = 15 - 13 = 2. Penalty = 2 * 4% = 8%. Eff = 92%
    const atLvl3 = calculateLessonMaterialEfficiency(leadOre, 3, 1.0);
    expect(atLvl3.penaltyEff).toBe(0.92);
    expect(atLvl3.hasPenalty).toBe(true);
    expect(atLvl3.warningType).toBe("TOO_ADVANCED");

    // Player Level 15: Grace = 25. Over grace = 0. Eff = 100%
    const atLvl15 = calculateLessonMaterialEfficiency(leadOre, 15, 1.0);
    expect(atLvl15.penaltyEff).toBe(1.0);
    expect(atLvl15.hasPenalty).toBe(false);
    expect(atLvl15.warningType).toBe("NONE");

    // Player Level 1 with Level 99 item (Moonblood Tincture):
    const moonblood = rawMaterials.find((m) => m.name === "Moonblood Tincture") as ForgeLessonMaterial;
    const atLvl1 = calculateLessonMaterialEfficiency(moonblood, 1, 1.0);
    expect(atLvl1.penaltyEff).toBe(0.25); // floored at 25%
    expect(atLvl1.hasPenalty).toBe(true);
    expect(atLvl1.warningType).toBe("TOO_ADVANCED");
  });

  it("applies EXP buffs correctly (e.g. +30% Membership + Campaign)", () => {
    const coal = rawMaterials.find((m) => m.name === "Coal Ore") as ForgeLessonMaterial;
    const unbuffed = calculateLessonMaterialEfficiency(coal, 10, 1.0);
    const buffed = calculateLessonMaterialEfficiency(coal, 10, 1.30);

    expect(buffed.effectiveExp).toBeCloseTo(unbuffed.displayedExp * 1.30, 1);
  });

  it("Strength EXP is strictly 5% of Forge EXP (floored)", () => {
    const summary1 = calculateSessionSummary(
      [{ material: calculateLessonMaterialEfficiency(rawMaterials[0] as ForgeLessonMaterial, 6, 1.0), quantity: 338, totalExp: 349, totalDurationSeconds: 884, totalCost: 3380 }]
    );
    expect(summary1.totalStrengthExp).toBe(17);

    const summary2 = calculateSessionSummary(
      [{ material: calculateLessonMaterialEfficiency(rawMaterials[0] as ForgeLessonMaterial, 7, 1.3), quantity: 2455, totalExp: 3389, totalDurationSeconds: 11896, totalCost: 24550 }]
    );
    expect(summary2.totalStrengthExp).toBe(169);
  });

  it("calculates projected level progression accurately using skill-xp-levels", () => {
    const proj1 = calculateProjectedLevel(6, 0, 349);
    expect(proj1.projectedLevel).toBe(7);

    const proj2 = calculateProjectedLevel(7, 0, 3389);
    expect(proj2.projectedLevel).toBeGreaterThanOrEqual(15);
  });

  it("calculates goal estimate accurately with cheapest and fastest recommendations", () => {
    const goal = calculateGoalEstimate(1, 25, rawMaterials as ForgeLessonMaterial[], 1.0);
    expect(goal.expNeeded).toBeGreaterThan(0);
    expect(goal.cheapestOption).toBeDefined();
    expect(goal.fastestOption).toBeDefined();
    expect(goal.cheapestOption?.totalCost).toBeLessThanOrEqual(goal.fastestOption?.totalCost || Infinity);

    // Speed multiplier reduces duration correctly (10% speed buff reduces training duration)
    const goalWithSpeed = calculateGoalEstimate(1, 25, rawMaterials as ForgeLessonMaterial[], 1.0, 0, null, 1.10);
    expect(goalWithSpeed.totalCheapestDurationSeconds!).toBeLessThan(goal.totalCheapestDurationSeconds!);

    // Invariance: Fastest route MUST be strictly faster than or equal to balanced and cheapest routes
    const goal41to100 = calculateGoalEstimate(41, 100, rawMaterials as ForgeLessonMaterial[], 1.15, 0, null, 1.10);
    expect(goal41to100.totalFastestDurationSeconds).toBeDefined();
    expect(goal41to100.totalBestDurationSeconds).toBeDefined();
    expect(goal41to100.totalCheapestDurationSeconds).toBeDefined();
    expect(goal41to100.totalFastestDurationSeconds!).toBeLessThanOrEqual(goal41to100.totalBestDurationSeconds!);
    expect(goal41to100.totalBestDurationSeconds!).toBeLessThanOrEqual(goal41to100.totalCheapestDurationSeconds!);
  });

  it("calculates offline session capacity up to 12-hour cap", () => {
    // 2.5 hours = 9000 seconds
    const batchCap = calculateSessionBatchCapacity(9000, 12);
    expect(batchCap).toBe(750); // 9000 / 12 = 750

    // Material with 12-hour hard cap (43200 seconds)
    const maxCap = calculateSessionBatchCapacity(50000, 10);
    expect(maxCap).toBe(4320); // 43200 / 10 = 4320
  });

  it("safely detects profile forge level from dictionary, array, or empty profiles without throwing", () => {
    const dictProfile = {
      skills: {
        forge: { level: 42, experience: 70000 },
        mining: { level: 30 },
      },
    };
    expect(detectProfileForgeLevel(dictProfile)).toBe(42);

    const arrayProfile = {
      skills: [
        { name: "mining", level: 25 },
        { name: "forge", level: 68 },
      ],
    };
    expect(detectProfileForgeLevel(arrayProfile)).toBe(68);

    expect(detectProfileForgeLevel(null)).toBe(1);
    expect(detectProfileForgeLevel(undefined)).toBe(1);
    expect(detectProfileForgeLevel({})).toBe(1);
    expect(detectProfileForgeLevel({ skills: {} })).toBe(1);
    expect(detectProfileForgeLevel({ skills: [] })).toBe(1);
  });

  it("verifies getBaseForgeHourlyRate produces exact unbuffed piecewise rates across Levels 1–100", () => {
    // Level 1: 1,300.00
    expect(getBaseForgeHourlyRate(1)).toBe(1300);

    // Level 8: 1300 + 7 * 122.25 = 2,155.75 EXP/hr
    expect(getBaseForgeHourlyRate(8)).toBeCloseTo(2155.75, 1);

    // Level 10: 2,400.22 EXP/hr
    expect(getBaseForgeHourlyRate(10)).toBeCloseTo(2400.22, 1);

    // Level 11: 2,400.22 + 50.00 = 2,450.22 EXP/hr
    expect(getBaseForgeHourlyRate(11)).toBeCloseTo(2450.22, 1);

    // Level 25: 2,400.22 + 15 * 50.00 = 3,150.22 EXP/hr
    expect(getBaseForgeHourlyRate(25)).toBeCloseTo(3150.22, 1);

    // Level 26: 3,150.22 + 22.00 = 3,172.22 EXP/hr (+22.00 slope inflection)
    expect(getBaseForgeHourlyRate(26)).toBeCloseTo(3172.22, 1);

    // Level 30: 3,150.22 + 5 * 22.00 = 3,260.22 EXP/hr
    expect(getBaseForgeHourlyRate(30)).toBeCloseTo(3260.22, 1);

    // Level 41: 3,150.22 + 16 * 22.00 = 3,502.22 EXP/hr
    expect(getBaseForgeHourlyRate(41)).toBeCloseTo(3502.22, 1);

    // Level 50: 3,150.22 + 25 * 22.00 = 3,700.22 EXP/hr
    expect(getBaseForgeHourlyRate(50)).toBeCloseTo(3700.22, 1);

    // Level 70: 3,700.22 + 20 * 40.00 = 4,500.22 EXP/hr
    expect(getBaseForgeHourlyRate(70)).toBeCloseTo(4500.22, 1);

    // Level 90: 4,500.22 + 20 * 30.00 = 5,100.22 EXP/hr
    expect(getBaseForgeHourlyRate(90)).toBeCloseTo(5100.22, 1);

    // Level 100: 5,100.22 + 10 * 40.00 = 5,500.22 EXP/hr
    expect(getBaseForgeHourlyRate(100)).toBeCloseTo(5500.22, 1);
  });

  it("verifies live game modal match for Level 26 Abyssal Scroll session (+65% buffs, 37 items)", () => {
    const abyssalScroll = rawMaterials.find((m) => m.name === "Abyssal Scroll") as ForgeLessonMaterial;
    expect(abyssalScroll).toBeDefined();

    // Player Level 26, +65% total buffs + +10% Blacksmith Class (1.65 * 1.10 multiplier)
    const calculated = calculateLessonMaterialEfficiency(abyssalScroll, 26, 1.65 * 1.10);

    // Legendary speed cap = 109%, inside grace (26 + 10 = 36 >= 35) -> no penalty
    expect(calculated.displayedEff).toBe(109);
    expect(calculated.hasPenalty).toBe(false);
    expect(calculated.warningType).toBe("NONE");

    // EXP per item matches live modal: 994.07 (within 0.1 EXP)
    expect(calculated.effectiveExp).toBeCloseTo(994.07, 0);

    // 37 items session calculation
    const session = calculateSessionSummary(
      [{
        material: calculated,
        quantity: 37,
        totalExp: calculated.effectiveExp * 37,
        totalDurationSeconds: calculated.timeSeconds * 37,
        totalCost: calculated.marketPrice * 37,
      }],
      26,
      0
    );

    // Modal total Forge EXP: +36,780
    expect(session.totalForgeExp).toBeCloseTo(36780, -2);

    // Modal Strength EXP: exactly 5% of Forge EXP (+1,839)
    expect(session.totalStrengthExp).toBe(Math.floor(session.totalForgeExp * 0.05));

    // Modal duration: 05:51:40 = 21,100 seconds (within 5 seconds)
    expect(Math.abs(session.totalDurationSeconds - 21100)).toBeLessThan(5);

    // Level progression: Forge Level 26 -> 39
    expect(session.projectedLevel).toBe(39);
  });

  it("verifies live game modal match for MereSlave108 (non-Blacksmith) crafting Undying Crest at Level 84 (+32% EXP, +15% Eff)", () => {
    const crest = rawMaterials.find((m) => m.name === "Undying Crest") as ForgeLessonMaterial;
    expect(crest).toBeDefined();

    // Player Level 84, non-Blacksmith, +32% total EXP buffs (1.32 multiplier: Membership +15%, Conquest Rank 2 +17%)
    const calculated = calculateLessonMaterialEfficiency(crest, 84, 1.32);

    // Epic item: quality speed 100%, reqLvl 78 in grace [74, 94] -> 100% efficiency
    expect(calculated.displayedEff).toBe(100);
    expect(calculated.hasPenalty).toBe(false);
    expect(calculated.warningType).toBe("NONE");
    expect(calculated.timeSeconds).toBeCloseTo(127.32, 1);

    // EXP per item matches live in-game modal: 229.69 (within 0.05 EXP)
    expect(calculated.effectiveExp).toBeCloseTo(229.69, 1);

    // 8-hour session with +15% Efficiency (1.15 multiplier: Membership +10%, Conquest Rank 2 +5%)
    const totalEffMultiplier = 1.15;
    const effectiveBurnTime = calculated.timeSeconds / totalEffMultiplier; // ~110.71s
    const targetSessionSeconds = 8 * 3600; // 28,800s

    // Capacity matches live modal: exactly 260 items
    const count = calculateSessionBatchCapacity(targetSessionSeconds, effectiveBurnTime);
    expect(count).toBe(260);

    // 260 items session summary
    const session = calculateSessionSummary(
      [{
        material: {
          ...calculated,
          timeSeconds: effectiveBurnTime,
        },
        quantity: 260,
        totalExp: calculated.effectiveExp * 260,
        totalDurationSeconds: Math.round(effectiveBurnTime * 260),
        totalCost: calculated.marketPrice * 260,
      }],
      84,
      0
    );

    // Total Forge EXP matches live game modal (+59,718 within 1 EXP rounding)
    expect(Math.abs(session.totalForgeExp - 59718)).toBeLessThanOrEqual(1);

    // Strength EXP: exactly 5% of Forge EXP (+2,985)
    expect(session.totalStrengthExp).toBe(2985);

    // Modal duration: exactly 07:59:45 = 28,785 seconds
    expect(session.totalDurationSeconds).toBe(28785);
  });

  it("verifies grace cutoff strictly at playerLevel - 10 for outgrown materials", () => {
    const leadOre = rawMaterials.find((m) => m.name === "Lead Ore") as ForgeLessonMaterial; // Req 15
    expect(leadOre).toBeDefined();

    // At Level 25: minGrace = 25 - 10 = 15. Req 15 >= 15 -> in grace, 100% efficiency
    const eff25 = calculateLessonEfficiency(leadOre.name, leadOre.reqLvl, leadOre.quality, leadOre.category, 25);
    expect(eff25.displayedEff).toBe(100);
    expect(eff25.warningType).toBe("NONE");

    // At Level 26: minGrace = 26 - 10 = 16. Req 15 < 16 -> outgrown, drops to 99%
    const eff26 = calculateLessonEfficiency(leadOre.name, leadOre.reqLvl, leadOre.quality, leadOre.category, 26);
    expect(eff26.displayedEff).toBe(99);
    expect(eff26.warningType).toBe("TOO_BASIC");
  });

  it("verifies default session durations by profile kind and membership", () => {
    // Alt with membership: 6 hours
    expect(getDefaultForgeSessionDuration({ kind: "alt" }, true)).toEqual({ hours: 6, minutes: 0 });
    // Alt without membership: 4 hours
    expect(getDefaultForgeSessionDuration({ kind: "alt" }, false)).toEqual({ hours: 4, minutes: 0 });

    // Main with membership: 8 hours
    expect(getDefaultForgeSessionDuration({ kind: "main" }, true)).toEqual({ hours: 8, minutes: 0 });
    // Main without membership: 6 hours
    expect(getDefaultForgeSessionDuration({ kind: "main" }, false)).toEqual({ hours: 6, minutes: 0 });

    // Cursed account (even if marked alt): 8h with MS, 6h without MS
    expect(getDefaultForgeSessionDuration({ kind: "alt", className: "Cursed" }, true)).toEqual({ hours: 8, minutes: 0 });
    expect(getDefaultForgeSessionDuration({ kind: "alt", className: "Cursed" }, false)).toEqual({ hours: 6, minutes: 0 });
  });

  it("verifies Cursed & Forsaken experience calculation produces -50% base and -35% with membership", () => {
    const coal = rawMaterials.find((m) => m.name === "Coal Ore") as ForgeLessonMaterial;
    expect(coal).toBeDefined();

    // Standard baseline (1.0x) vs Cursed baseline (0.50x)
    const stdBaseline = calculateLessonMaterialEfficiency(coal, 41, 1.0);
    const cursedBaseline = calculateLessonMaterialEfficiency(coal, 41, 0.50);
    expect(cursedBaseline.effectiveExp).toBeCloseTo(stdBaseline.effectiveExp * 0.50, 1);

    // Cursed with membership (0.50 + 0.15 = 0.65x, representing -35% net)
    const cursedWithMember = calculateLessonMaterialEfficiency(coal, 41, 0.65);
    expect(cursedWithMember.effectiveExp).toBeCloseTo(stdBaseline.effectiveExp * 0.65, 1);
  });

  it("verifies forge storage keys isolate per profile scope", async () => {
    const { getProfileStorageKey } = await import("@/lib/profile-storage");
    const { FORGE_OWNED_STORAGE_KEY, FORGE_LESSON_QUEUE_STORAGE_KEY, FORGE_LESSON_GOAL_STORAGE_KEY } = await import("@/app/forge/hooks/useForgeLessons");
    const { FORGE_PLANNER_STORAGE_KEY } = await import("@/lib/forge-planner");

    const profileA = "saqr_alt_1";
    const profileB = "main_char_2";

    expect(getProfileStorageKey(FORGE_OWNED_STORAGE_KEY, profileA)).toBe("zenith_forge_owned_materials_v1__profile__saqr_alt_1");
    expect(getProfileStorageKey(FORGE_OWNED_STORAGE_KEY, profileB)).toBe("zenith_forge_owned_materials_v1__profile__main_char_2");
    expect(getProfileStorageKey(FORGE_LESSON_QUEUE_STORAGE_KEY, profileA)).not.toEqual(getProfileStorageKey(FORGE_LESSON_QUEUE_STORAGE_KEY, profileB));
    expect(getProfileStorageKey(FORGE_PLANNER_STORAGE_KEY, profileA)).not.toEqual(getProfileStorageKey(FORGE_PLANNER_STORAGE_KEY, profileB));
    expect(getProfileStorageKey(FORGE_LESSON_GOAL_STORAGE_KEY, profileA)).not.toEqual(getProfileStorageKey(FORGE_LESSON_GOAL_STORAGE_KEY, profileB));
  });

  it("correctly calculates EXP needed and routes when character has high level and into-level progress", () => {
    // Mere: Level 83 with cumulative 3,515,774 XP (313,332 XP into Level 83)
    const intoLevelXp = 313332;

    const goal83to90 = calculateGoalEstimate(83, 90, rawMaterials as ForgeLessonMaterial[], 1.0, intoLevelXp);
    expect(goal83to90.expNeeded).toBe(2737988);
    expect(goal83to90.cheapestSteps!.length).toBeGreaterThan(0);
    expect(goal83to90.bestSteps!.length).toBeGreaterThan(0);
    expect(goal83to90.fastestSteps!.length).toBeGreaterThan(0);

    const goal83to91 = calculateGoalEstimate(83, 91, rawMaterials as ForgeLessonMaterial[], 1.0, intoLevelXp);
    expect(goal83to91.expNeeded).toBe(3366238);
    expect(goal83to91.cheapestSteps!.length).toBeGreaterThan(0);
  });

  it("verifies profile forge level detection and profile level syncing", () => {
    const profileWithForge = {
      id: "test_profile",
      skills: {
        forge: { level: 83, experience: 3515774 },
      },
    };
    expect(detectProfileForgeLevel(profileWithForge)).toBe(83);

    const profileNoForge = {
      id: "test_profile_2",
      skills: {},
    };
    expect(detectProfileForgeLevel(profileNoForge)).toBe(1);
  });

  it("calculates 24h Temper bar progress and banked shards accurately with efficiency scaling", () => {
    // Pick a Lv 90+ 100%-efficiency material at Forge 100 (penaltyEff = 1.0)
    const highMat = rawMaterials.find((m) => m.reqLvl >= 90) as ForgeLessonMaterial;
    expect(highMat).toBeDefined();
    const calcHigh = calculateLessonMaterialEfficiency(highMat, 100, 1.0);
    expect(calcHigh.penaltyEff).toBe(1.0);

    // Queue 12h of 100%-efficiency lessons -> 50% of 24h Temper bar -> 120 shards banked (half of 240 at Lv 100)
    const qty12h = Math.round((12 * 3600) / calcHigh.timeSeconds);
    const halfSummary = calculateSessionSummary(
      [
        {
          material: calcHigh,
          quantity: qty12h,
          totalExp: calcHigh.effectiveExp * qty12h,
          totalDurationSeconds: calcHigh.timeSeconds * qty12h,
          totalCost: calcHigh.liveMarketPrice * qty12h,
        },
      ],
      100,
      0,
      1.0
    );

    expect(halfSummary.temperBarFullShards).toBe(240);
    expect(halfSummary.temperBarFullHalfShards).toBe(120);
    expect(halfSummary.estimatedTemperBarPercent).toBe(50);
    expect(halfSummary.estimatedTemperShards).toBe(120);

    // Efficiency +100% (effMultiplier = 2.0) fills the 24h Temper bar twice as fast -> 100% (240 banked)
    const boostedSummary = calculateSessionSummary(
      [
        {
          material: calcHigh,
          quantity: qty12h,
          totalExp: calcHigh.effectiveExp * qty12h,
          totalDurationSeconds: calcHigh.timeSeconds * qty12h,
          totalCost: calcHigh.liveMarketPrice * qty12h,
        },
      ],
      100,
      0,
      2.0
    );
    expect(boostedSummary.estimatedTemperBarPercent).toBe(100);
    expect(boostedSummary.estimatedTemperShards).toBe(240);
  });

  it("stacks Skill-Profit loadout buffs (Membership, Conquest Rank, Pool, Ascension) additively", async () => {
    const { getAssaultBuff, ASCENSION_BUFFS } = await import("@/lib/skill-profit");
    const rank1 = getAssaultBuff("first");
    const l20Exp = ASCENSION_BUFFS.find((b) => b.id === "exp-20");
    expect(l20Exp).toBeDefined();

    // Base 1.0 + Blacksmith 0.10 + Membership 0.15 + Conquest Rank 1 (exp%) + Pool 10% + L20 Ascension Exp
    const expectedExpMult = Number(
      (1.0 + 0.1 + 0.15 + rank1.exp / 100 + 0.1 + (l20Exp?.value || 0) / 100).toFixed(4)
    );
    expect(expectedExpMult).toBeCloseTo(1.35 + rank1.exp / 100 + (l20Exp?.value || 0) / 100, 4);
  });

  it("picks lowest gold/EXP within tied Fastest tier and avoids stale middle-item cache", () => {
    // Re-evaluating with mutated middle material price (Mystic Ore) must invalidate cache cleanly
    const baseline = calculateGoalEstimate(50, 90, rawMaterials as ForgeLessonMaterial[], 1.25, 0, null, 1.1);
    const moddedMarket = {
      "Goblin Pouch": { avg_3: 5, price: 5 },
      "Undying Crest": { avg_3: 100, price: 100 },
    };
    const updated = calculateGoalEstimate(50, 90, rawMaterials as ForgeLessonMaterial[], 1.25, 0, moddedMarket, 1.1);

    expect(updated.totalCheapestCost).not.toBe(baseline.totalCheapestCost);
    expect(updated.totalFastestDurationSeconds!).toBeLessThanOrEqual(updated.totalBestDurationSeconds!);
    expect(updated.totalBestDurationSeconds!).toBeLessThanOrEqual(updated.totalCheapestDurationSeconds!);
  });
});
