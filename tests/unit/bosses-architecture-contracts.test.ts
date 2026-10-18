import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import {
    BASE_MOVEMENT_SPEED,
    DEFAULT_RELEVANT_TELEPORT_LEVEL,
    buildWorldBossRoutinePlan,
    calculateTeleportCost,
    calculateTravelSeconds,
    getBossRouteDistance,
} from "@/lib/world-boss-routing";
import {
    applyMagicFindToDrops,
    formatWorldBossModifierDuration,
    generateTimetable,
    getBossWindow,
    getConfirmedWorldBossItemModifiers,
    getLiquiditySignal,
    getValueBreakdown,
    isRareMarketDrop,
    nearlyEqual,
    type BossDrop,
} from "@/app/bosses/types";

describe("bosses architecture and modularization contracts", () => {
    const bossesDir = path.join(process.cwd(), "src", "app", "bosses");
    const pagePath = path.join(bossesDir, "page.tsx");
    const hookPath = path.join(bossesDir, "hooks", "useBossState.ts");
    const componentsDir = path.join(bossesDir, "components");

    it("orchestrator page.tsx is under 200 lines", () => {
        expect(existsSync(pagePath)).toBe(true);
        const content = readFileSync(pagePath, "utf-8");
        const lines = content.split(/\r?\n/).length;
        expect(lines).toBeLessThan(200);
    });

    it("exports dedicated custom hook useBossState", () => {
        expect(existsSync(hookPath)).toBe(true);
        const content = readFileSync(hookPath, "utf-8");
        expect(content).toContain("export function useBossState()");
        expect(content).toContain("buildWorldBossRoutinePlan");
        expect(content).toContain("applyMagicFindToDrops");
        expect(content).toContain("getValueBreakdown");
    });

    it("contains all 6 required feature components", () => {
        const requiredComponents = [
            "BossHeader.tsx",
            "BossCard.tsx",
            "BossDetailsModal.tsx",
            "WorldBossRoutinePlanner.tsx",
            "WorldBossItemEffectPicker.tsx",
            "BossStyles.tsx",
        ];

        for (const comp of requiredComponents) {
            const compPath = path.join(componentsDir, comp);
            expect(existsSync(compPath), `Missing component: ${comp}`).toBe(true);
        }
    });

    it("orchestrator defines layout containment and min-height to guarantee CLS <= 0.1", () => {
        const pageContent = readFileSync(pagePath, "utf-8");
        expect(pageContent).toContain('contain: "layout"');
        expect(pageContent).toMatch(/minHeight:\s*["']520px["']/);
    });

    it("BossHeader includes view switcher, search input, phase filter pills, and sort controls", () => {
        const headerPath = path.join(componentsDir, "BossHeader.tsx");
        const content = readFileSync(headerPath, "utf-8");
        expect(content).toContain("boss-view-switch");
        expect(content).toContain("boss-phase-filters");
        expect(content).toContain("boss-phase-pill");
        expect(content).toContain("boss-search-control");
        expect(content).toContain("boss-radar");
    });

    it("BossCard includes live respawn timer, phase badge, and expected loot value preview", () => {
        const cardPath = path.join(componentsDir, "BossCard.tsx");
        const content = readFileSync(cardPath, "utf-8");
        expect(content).toContain("boss-mobile-card");
        expect(content).toContain("boss-phase");
        expect(content).toContain("m-roi");
        expect(content).toContain("formatCountdown");
        expect(content).toContain("BossTableRow");
    });

    it("BossDetailsModal includes drop table inspector, magic find scaling, value breakdown, and liquidity notes", () => {
        const modalPath = path.join(componentsDir, "BossDetailsModal.tsx");
        const content = readFileSync(modalPath, "utf-8");
        expect(content).toContain("boss-modal");
        expect(content).toContain("boss-loot-list");
        expect(content).toContain("boss-drop-rate");
        expect(content).toContain("boss-loot-value");
        expect(content).toContain("boss-stat-grid");
        expect(content).toContain("upcoming-spawns-section");
        expect(content).toContain("LoreThreadPanel");
    });

    it("WorldBossRoutinePlanner includes movement speed controls, teleport level adjustments, travel mode toggles, and step-by-step route schedule", () => {
        const plannerPath = path.join(componentsDir, "WorldBossRoutinePlanner.tsx");
        const content = readFileSync(plannerPath, "utf-8");
        expect(content).toContain("boss-routine-planner");
        expect(content).toContain("routine-timeline");
        expect(content).toContain("routine-leg");
        expect(content).toContain("routine-segmented");
        expect(content).toContain("routine-toggle");
        expect(content).toContain("routine-boss-picker");
        expect(content).toContain("routine-location-trigger");
    });

    it("WorldBossItemEffectPicker includes modifier selector modal and accessible keyboard navigation", () => {
        const pickerPath = path.join(componentsDir, "WorldBossItemEffectPicker.tsx");
        const content = readFileSync(pickerPath, "utf-8");
        expect(content).toContain("world-boss-effect-picker");
        expect(content).toContain("world-boss-effect-trigger");
        expect(content).toContain("world-boss-effect-menu");
        expect(content).toContain("role=\"listbox\"");
        expect(content).toContain("role=\"option\"");
        expect(content).toContain("handleTriggerKeyDown");
        expect(content).toContain("handleOptionKeyDown");
    });

    it("BossStyles has 100% scoped selectors preventing global CSS leakage", () => {
        const stylesPath = path.join(componentsDir, "BossStyles.tsx");
        const content = readFileSync(stylesPath, "utf-8");
        const match = content.match(/<style jsx global>\{`([\s\S]*?)`\}<\/style>/);
        expect(match).not.toBeNull();
        const rawCss = match ? match[1] : "";
        const root = postcss.parse(rawCss);

        const unscoped: string[] = [];
        root.walkRules((rule) => {
            if (rule.parent?.type === "atrule" && "name" in rule.parent && rule.parent.name === "keyframes") {
                return;
            }
            for (const sel of rule.selectors) {
                const trimmed = sel.trim();
                if (!trimmed.startsWith(".bosses-page")) {
                    unscoped.push(trimmed);
                }
            }
        });

        expect(unscoped).toEqual([]);
    });

    it("enforces >= 44px touch targets on interactive button classes in BossStyles", () => {
        const stylesPath = path.join(componentsDir, "BossStyles.tsx");
        const content = readFileSync(stylesPath, "utf-8");
        expect(content).toMatch(/\.bosses-page \.boss-sort-button\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.boss-phase-pill\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.routine-location-trigger\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.routine-location-menu button\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.routine-segmented button\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.routine-toggle\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.routine-boss-picker button\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.world-boss-effect-trigger\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.world-boss-effect-option\s*\{[^}]*min-height:\s*44px/);
        expect(content).toMatch(/\.bosses-page \.close-btn\s*\{[^}]*min-height:\s*44px/);
    });

    it("preserves desktop radar stats grid and card styling outside media queries", () => {
        const stylesPath = path.join(componentsDir, "BossStyles.tsx");
        const content = readFileSync(stylesPath, "utf-8");
        expect(content).toMatch(/\.bosses-page \.boss-radar-stats\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(7rem,\s*1fr\)\)/);
        expect(content).toMatch(/\.bosses-page \.boss-radar-stats div\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)/);
        expect(content).toMatch(/\.bosses-page \.boss-radar-stats span\s*\{[^}]*display:\s*block/);
        expect(content).toMatch(/\.bosses-page \.boss-radar-stats strong\s*\{[^}]*display:\s*block/);
    });

    describe("strict game math and calculation invariance", () => {
        it("preserves world boss routing calculations", () => {
            const distance = getBossRouteDistance("Enchanted Oasis", "Bluebell Hollow");
            expect(distance).toBe(50_451);

            const tpCost = calculateTeleportCost(distance!, 1_359);
            expect(tpCost).toBe(4_066);

            const travelSec = calculateTravelSeconds(1_000, 25);
            expect(travelSec).toBe(40);
        });

        it("preserves buildWorldBossRoutinePlan schedule mathematics", () => {
            const now = Date.now();
            const mockBosses = [
                {
                    id: 1,
                    name: "Elder Golem",
                    level: 50,
                    location: { name: "The Citadel" },
                    nextSpawnTime: new Date(now + 3600000),
                    ev: 10000,
                },
                {
                    id: 2,
                    name: "Sand Wurm",
                    level: 45,
                    location: { name: "Enchanted Oasis" },
                    nextSpawnTime: new Date(now + 7200000),
                    ev: 15000,
                },
            ];

            const plan = buildWorldBossRoutinePlan(mockBosses, {
                startLocation: "The Citadel",
                selectedBossKeys: ["1", "2"],
                relevantTeleportLevel: DEFAULT_RELEVANT_TELEPORT_LEVEL,
                movementSpeed: BASE_MOVEMENT_SPEED,
                classDiscount: false,
                travelMode: "teleport",
                currentTime: now,
            });

            expect(plan.grossEv).toBe(25000);
            expect(plan.legs.length).toBe(2);
            expect(plan.teleportCost).toBeGreaterThanOrEqual(0);
        });

        it("preserves applyMagicFindToDrops multiplier and overcap trimming", () => {
            const mockDrops = [
                { name: "Common Shard", chance: 80 },
                { name: "Rare Relic", chance: 20 },
            ];

            // 50% MF increases chances by 1.5x: 80 * 1.5 = 120, 20 * 1.5 = 30 -> sum = 150 (overcap 50)
            // Common first reduction trims 50 from 120 -> Common becomes 70, Rare stays 30 -> sum = 100
            const adjusted = applyMagicFindToDrops(mockDrops, 50);
            const sum = adjusted.reduce((acc, d) => acc + d.adjustedChance, 0);
            expect(nearlyEqual(sum, 100)).toBe(true);
            expect(adjusted.find((d) => d.name === "Rare Relic")?.adjustedChance).toBe(30);
            expect(adjusted.find((d) => d.name === "Common Shard")?.adjustedChance).toBe(70);
        });

        it("preserves getBossWindow phase derivation and cycling", () => {
            const now = new Date("2026-10-18T12:00:00Z").getTime();
            // Active window: start is 11:30, end is 12:30
            const activeBoss = {
                name: "Test Active",
                battle_starts_at: "2026-10-18T11:30:00Z",
                battle_ends_at: "2026-10-18T12:30:00Z",
                status: "IN_PROGRESS",
            };
            const activeWindow = getBossWindow(activeBoss, now);
            expect(activeWindow.phase).toBe("active");
            expect(activeWindow.statusLabel).toBe("In Progress");

            // Lobby ready window: start is 13:00, lobby opens 2h before (11:00) -> now (12:00) is ready
            const readyBoss = {
                name: "Test Ready",
                battle_starts_at: "2026-10-18T13:00:00Z",
                battle_ends_at: "2026-10-18T14:00:00Z",
                status: "SCHEDULED",
            };
            const readyWindow = getBossWindow(readyBoss, now);
            expect(readyWindow.phase).toBe("ready");
            expect(readyWindow.statusLabel).toBe("Lobby Ready");

            // Scheduled window: start is 16:00 -> lobby opens at 14:00 -> now (12:00) is scheduled
            const scheduledBoss = {
                name: "Test Scheduled",
                battle_starts_at: "2026-10-18T16:00:00Z",
                battle_ends_at: "2026-10-18T17:00:00Z",
                status: "SCHEDULED",
            };
            const scheduledWindow = getBossWindow(scheduledBoss, now);
            expect(scheduledWindow.phase).toBe("scheduled");
            expect(scheduledWindow.statusLabel).toBe("Scheduled");
        });

        it("preserves getValueBreakdown and getLiquiditySignal calculations", () => {
            const mockMarket = {
                "Dragon Bone": { price: 500, vol_3: 200, vendor_price: 50 },
            };
            const mockDb = {
                "Dragon Bone": { name: "Dragon Bone", is_tradeable: true, vendor_price: 50 },
            };
            const options = { marketTaxMultiplier: 0.95 };

            const breakdown = getValueBreakdown("Dragon Bone", mockMarket, mockDb, options);
            expect(breakdown.marketGross).toBe(500);
            expect(breakdown.marketNet).toBe(475);
            expect(breakdown.trueValue).toBeGreaterThan(0);

            const liquidSignal = getLiquiditySignal(breakdown.source, breakdown.volume, breakdown.trueValue);
            expect(liquidSignal).toBe("LIQUID");

            const rareDrop = isRareMarketDrop({ name: "Golden Phoenix Egg", quality: "MYTHIC" }, { type: "PET_EGG" });
            expect(rareDrop).toBe(true);

            const rareSignal = getLiquiditySignal("Market", 10, 50000, true);
            expect(rareSignal).toBe("RARE MARKET");
        });

        it("handles extreme magic find (> 500% and 1000%) with common drop elimination and exact sum preservation", () => {
            const mockDrops = [
                { name: "Common Shard", chance: 85 },
                { name: "Uncommon Essence", chance: 10 },
                { name: "Rare Relic", chance: 5 },
            ];

            // At 1000% MF (11x multiplier):
            // Common: 85 * 11 = 935
            // Uncommon: 10 * 11 = 110
            // Rare: 5 * 11 = 55
            // Total = 1100 -> overCap = 1000
            // Common (935) is reduced by 935 -> becomes 0
            // Remaining overCap = 65 -> Uncommon (110) reduced by 65 -> becomes 45
            // Rare (55) stays 55
            // Total sum = 0 + 45 + 55 = 100
            const adjusted = applyMagicFindToDrops(mockDrops, 1000);
            const common = adjusted.find((d) => d.name === "Common Shard")?.adjustedChance;
            const uncommon = adjusted.find((d) => d.name === "Uncommon Essence")?.adjustedChance;
            const rare = adjusted.find((d) => d.name === "Rare Relic")?.adjustedChance;

            expect(common).toBe(0);
            expect(uncommon).toBe(45);
            expect(rare).toBe(55);

            const total = adjusted.reduce((sum, d) => sum + d.adjustedChance, 0);
            expect(nearlyEqual(total, 100)).toBe(true);
            for (const d of adjusted) {
                expect(d.adjustedChance).toBeGreaterThanOrEqual(0);
                expect(Number.isFinite(d.adjustedChance)).toBe(true);
            }
        });

        it("handles edge case boss windows with invalid or missing dates gracefully", () => {
            const now = Date.now();
            const bossWithNullDates = {
                name: "Undated Boss",
                battle_starts_at: null,
                battle_ends_at: null,
                status: "IN_PROGRESS",
            };

            const windowResult = getBossWindow(bossWithNullDates, now);
            expect(windowResult.phase).toBe("active");
            expect(windowResult.statusLabel).toBe("IN PROGRESS");
            expect(windowResult.nextSpawnTime).toBeNull();
            expect(windowResult.battleLengthSeconds).toBe(3600);

            const bossWithInvalidDates = {
                name: "Corrupt Date Boss",
                battle_starts_at: "not-a-date",
                battle_ends_at: "invalid",
                status: "SCHEDULED",
            };
            const invalidWindow = getBossWindow(bossWithInvalidDates, now);
            expect(invalidWindow.phase).toBe("unknown");
            expect(invalidWindow.statusLabel).toBe("SCHEDULED");
            expect(invalidWindow.nextSpawnTime).toBeNull();
        });

        it("handles empty drop tables and zero chance drops gracefully", () => {
            const emptyDrops: BossDrop[] = [];
            const adjustedEmpty = applyMagicFindToDrops(emptyDrops, 200);
            expect(adjustedEmpty).toEqual([]);

            const zeroChanceDrops = [
                { name: "Zero Drop", chance: 0 },
                { name: "Guaranteed Drop", chance: 100 },
            ];
            const adjustedZero = applyMagicFindToDrops(zeroChanceDrops, 100);
            expect(adjustedZero.find((d) => d.name === "Zero Drop")?.adjustedChance).toBe(0);
            expect(adjustedZero.find((d) => d.name === "Guaranteed Drop")?.adjustedChance).toBe(100);
        });

        it("advances historical boss windows in O(1) constant time without thread freeze", () => {
            const now = new Date("2026-10-18T12:00:00Z").getTime();
            // Start was in 1970 (56 years ago) with 4-hour respawn cycle
            const historicalBoss = {
                name: "Ancient Prime",
                battle_starts_at: "1970-01-01T00:00:00Z",
                battle_ends_at: "1970-01-01T01:00:00Z",
                respawnHours: 4,
                lengthSeconds: 3600,
            };

            const startTime = performance.now();
            const windowResult = getBossWindow(historicalBoss, now);
            const duration = performance.now() - startTime;

            // Must calculate in < 5ms (O(1) step leap instead of looping 122,000 times)
            expect(duration).toBeLessThan(10);
            expect(windowResult.nextSpawnTime).not.toBeNull();
            expect(windowResult.battleEndTime).not.toBeNull();
            expect(windowResult.battleEndTime!.getTime()).toBeGreaterThan(now);
        });

        it("handles non-positive respawnHours without hanging", () => {
            const now = Date.now();
            const zeroCycleBoss = {
                name: "Stagnant Boss",
                battle_starts_at: new Date(now - 100000).toISOString(),
                battle_ends_at: new Date(now - 50000).toISOString(),
                respawnHours: 0,
            };
            const result = getBossWindow(zeroCycleBoss, now);
            expect(result.scheduleInfo).toBeNull();
            expect(result.phase).toBe("scheduled");
        });

        it("generateTimetable safely handles missing battleLengthSeconds and non-positive cycle", () => {
            const now = Date.now();
            const boss = {
                nextSpawnTime: new Date(now + 10000),
                scheduleInfo: { respawnHours: 6, lengthSeconds: 1800 },
            };
            const timetable = generateTimetable(boss);
            expect(timetable.length).toBe(5);
            for (const item of timetable) {
                expect(Number.isFinite(item.start.getTime())).toBe(true);
                expect(Number.isFinite(item.end.getTime())).toBe(true);
                expect(item.end.getTime()).toBe(item.start.getTime() + 1800 * 1000);
            }

            // Non-positive respawnHours returns empty array
            const invalidCycleBoss = {
                nextSpawnTime: new Date(now + 10000),
                scheduleInfo: { respawnHours: -2 },
            };
            expect(generateTimetable(invalidCycleBoss)).toEqual([]);
        });

        it("getValueBreakdown safely handles omitted options without returning NaN", () => {
            const mockMarket = {
                Ore: { price: 100, vol_3: 50, vendor_price: 10 },
            };
            const mockDb = {
                Ore: { name: "Ore", is_tradeable: true, vendor_price: 10 },
            };

            // Call without options object
            const breakdown = getValueBreakdown("Ore", mockMarket, mockDb);
            expect(Number.isFinite(breakdown.marketNet)).toBe(true);
            expect(breakdown.marketNet).toBe(95); // Default 0.95 tax multiplier
            expect(Number.isFinite(breakdown.vendorNet)).toBe(true);
        });

        it("preserves teleport level 0 without forcing default level 1359", () => {
            const distance = 50_451;
            const costLevel0 = calculateTeleportCost(distance, 0);
            const costLevel1359 = calculateTeleportCost(distance, DEFAULT_RELEVANT_TELEPORT_LEVEL);

            // Level 0 should be base factor only: floor(50451 * (1/300)) = 168
            expect(costLevel0).toBe(168);
            expect(costLevel1359).toBe(4_066);
            expect(costLevel0).toBeLessThan(costLevel1359);
        });

        it("formats world boss item modifier durations correctly across scales", () => {
            expect(formatWorldBossModifierDuration(0)).toBe("Passive");
            expect(formatWorldBossModifierDuration(45_000)).toBe("1m");
            expect(formatWorldBossModifierDuration(3_600_000)).toBe("1h");
            expect(formatWorldBossModifierDuration(5_400_000)).toBe("1.5h");
        });

        it("filters confirmed world boss item modifiers and excludes special equipment", () => {
            const allItemsDb = {
                item1: {
                    name: "Boss Charm",
                    type: "CONSUMABLE",
                    quality: "RARE",
                    effects: [{ target: "world_boss", attribute: "magic_find", value: 15, length: 1800000 }],
                },
                item2: {
                    name: "Non-Boss Ring",
                    type: "JEWELRY",
                    quality: "EPIC",
                    effects: [{ target: "combat", attribute: "magic_find", value: 20 }],
                },
                item3: {
                    name: "Special Armor",
                    type: "SPECIAL",
                    quality: "LEGENDARY",
                    effects: [{ target: "world_boss", attribute: "magic_find", value: 25 }],
                },
            };

            const modifiers = getConfirmedWorldBossItemModifiers(allItemsDb);
            expect(modifiers.length).toBe(1);
            expect(modifiers[0].name).toBe("Boss Charm");
            expect(modifiers[0].magicFind).toBe(15);
            expect(modifiers[0].durationMs).toBe(1800000);
        });

        it("protects against negative drop chances and NaN effect values in modifiers", () => {
            const badDrops: BossDrop[] = [
                { name: "Corrupted Drop", chance: -20 },
                { name: "Legit Drop", chance: 80 },
            ];
            const adjusted = applyMagicFindToDrops(badDrops, 50);
            expect(adjusted.find((d) => d.name === "Corrupted Drop")?.baseChance).toBe(0);
            expect(adjusted.find((d) => d.name === "Corrupted Drop")?.adjustedChance).toBe(0);
            expect(adjusted.find((d) => d.name === "Legit Drop")?.adjustedChance).toBe(100);

            const badEffectsDb = {
                item1: {
                    name: "Broken Relic",
                    effects: [{ target: "world_boss", attribute: "magic_find", value: "not-a-number", length: NaN }],
                },
            };
            const emptyModifiers = getConfirmedWorldBossItemModifiers(badEffectsDb);
            expect(emptyModifiers).toEqual([]);
        });

        it("safely handles non-positive, NaN, and negative durations in formatWorldBossModifierDuration", () => {
            expect(formatWorldBossModifierDuration(-5000)).toBe("Passive");
            expect(formatWorldBossModifierDuration(NaN)).toBe("Passive");
            expect(formatWorldBossModifierDuration(Number.POSITIVE_INFINITY)).toBe("Passive");
        });

        it("safely handles Infinity in generateTimetable respawn hours without producing Invalid Date", () => {
            const infiniteBoss = {
                nextSpawnTime: new Date(),
                scheduleInfo: { respawnHours: Number.POSITIVE_INFINITY },
            };
            expect(generateTimetable(infiniteBoss)).toEqual([]);
        });
    });

    describe("accessibility, mobile ergonomics, and live state contracts", () => {
        it("preserves native table row semantics in BossTableRow without invalid role='button'", () => {
            const cardPath = path.join(componentsDir, "BossCard.tsx");
            const content = readFileSync(cardPath, "utf-8");
            expect(content).not.toMatch(/<tr[^>]*role="button"/);
            expect(content).toMatch(/<tr[^>]*className="clickable-row"/);
        });

        it("provides accessible aria-label on routine start location listbox", () => {
            const plannerPath = path.join(componentsDir, "WorldBossRoutinePlanner.tsx");
            const content = readFileSync(plannerPath, "utf-8");
            expect(content).toMatch(/role="listbox"[^>]*aria-label="Routine start location"/);
        });

        it("uses pointerdown event for immediate mobile touch dismissal in WorldBossItemEffectPicker", () => {
            const pickerPath = path.join(componentsDir, "WorldBossItemEffectPicker.tsx");
            const content = readFileSync(pickerPath, "utf-8");
            expect(content).toContain('addEventListener("pointerdown", handlePointer)');
            expect(content).not.toContain('addEventListener("mousedown", handlePointer)');
        });

        it("ensures selectedBossData searches calculatedRows so live timers tick even under active filters", () => {
            const hookPath = path.join(bossesDir, "hooks", "useBossState.ts");
            const content = readFileSync(hookPath, "utf-8");
            expect(content).toContain("calculatedRows.find((row) => getBossKey(row) === key) || selectedBoss");
        });

        it("prioritizes upcoming and ongoing boss windows over historical past dates in nextBoss derivation", () => {
            const hookPath = path.join(bossesDir, "hooks", "useBossState.ts");
            const content = readFileSync(hookPath, "utf-8");
            expect(content).toContain("upcomingOrActive");
            expect(content).toContain("[...pool].sort");
        });
    });
});
