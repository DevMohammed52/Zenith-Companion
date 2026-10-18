import { BOSS_SCHEDULES } from "../../constants/events";
import { getItemTrueValue } from "@/lib/ev-logic";
import { getSafeMarketValue } from "@/lib/market-pricing";

export type BossPhase = "active" | "ready" | "respawning" | "scheduled" | "unknown";
export type BossView = "details" | "planner";

export type BossSchedule = {
    respawnHours?: number;
    lengthSeconds?: number;
};

export type BossDrop = {
    name: string;
    chance?: number;
    quantity?: number;
    image_url?: string;
    quality?: string;
};

export type ValueSource = "Custom" | "Market" | "Vendor" | "Chest EV" | "Recipe EV" | "True Value" | "Missing";
export type LiquiditySignal = "LIQUID" | "STEADY" | "THIN" | "NO SALES" | "VENDOR SAFE" | "CUSTOM" | "EV MODEL" | "RARE MARKET" | "MIXED VALUES" | "MISSING";

export type WorldBossItemModifier = {
    name: string;
    type: string;
    quality: string;
    imageUrl: string;
    magicFind: number;
    durationMs: number;
};

export interface BossLootDetail extends BossDrop {
    index: number;
    baseChance: number;
    adjustedChance: number;
    trueValue: number;
    marketGross: number;
    marketNet: number;
    vendorNet: number;
    volume: number;
    source: ValueSource;
    expectedVal: number;
    signal: LiquiditySignal;
    magicFindGain: number;
}

export interface ValuedBossRow {
    name: string;
    level?: number | string;
    location?: { name: string };
    image_url?: string;
    loot?: BossDrop[];
    battle_starts_at?: string | null;
    battle_ends_at?: string | null;
    respawnHours?: number;
    lengthSeconds?: number;
    status?: string;
    ev: number;
    dropsCount: number;
    liquiditySignal: LiquiditySignal;
    warnings: string[];
    lootDetails: BossLootDetail[];
    scheduleInfo: BossSchedule | null;
    phase: BossPhase;
    statusLabel: string;
    nextSpawnTime: Date | null;
    battleEndTime: Date | null;
    countdownTarget: Date | null;
    countdownLabel: string;
    battleLengthSeconds: number;
    [key: string]: any;
}

export const WORLD_BOSS_ROUTINE_STORAGE_KEY = "zenith_world_boss_routine_planner";
export const WORLD_BOSS_ITEM_MODIFIER_STORAGE_KEY = "zenith_world_boss_item_modifier_v1";
export const LOBBY_OPEN_WINDOW_MS = 2 * 60 * 60 * 1000;

export const isFiniteDate = (date: Date | null | undefined): date is Date => Boolean(date && Number.isFinite(date.getTime()));

export const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
};

export const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const getBossKey = (boss: any) => String(boss?.id ?? boss?.name ?? "");

export const nearlyEqual = (a: number, b: number) => Math.abs(a - b) < 0.01;

export function getBossWindow(boss: any, now: number) {
    const scheduleInfo: BossSchedule | null = BOSS_SCHEDULES[boss.name] || (
        boss.respawnHours ? { respawnHours: boss.respawnHours, lengthSeconds: boss.lengthSeconds || 3600 } : null
    );
    const originalStart = parseDate(boss.battle_starts_at);
    const originalEnd = parseDate(boss.battle_ends_at);
    const inferredLengthSeconds = originalStart && originalEnd
        ? Math.max(1, Math.round((originalEnd.getTime() - originalStart.getTime()) / 1000))
        : scheduleInfo?.lengthSeconds || boss.lengthSeconds || 3600;
    const cycleMs = scheduleInfo?.respawnHours && scheduleInfo.respawnHours > 0
        ? scheduleInfo.respawnHours * 3600000
        : null;
    const status = String(boss.status || "").toUpperCase();

    if (!isFiniteDate(originalStart)) {
        return {
            scheduleInfo,
            phase: status === "IN_PROGRESS" ? "active" as BossPhase : "unknown" as BossPhase,
            statusLabel: status ? status.replace(/_/g, " ") : "Unknown",
            nextSpawnTime: null,
            battleEndTime: originalEnd,
            countdownTarget: originalEnd,
            countdownLabel: "Ends in",
            battleLengthSeconds: inferredLengthSeconds,
        };
    }

    let nextStart = new Date(originalStart);
    let nextEnd = isFiniteDate(originalEnd)
        ? new Date(originalEnd)
        : new Date(nextStart.getTime() + inferredLengthSeconds * 1000);

    if (cycleMs && cycleMs > 0 && nextEnd.getTime() <= now) {
        const elapsed = now - nextEnd.getTime();
        const steps = Math.floor(elapsed / cycleMs) + 1;
        nextStart = new Date(nextStart.getTime() + steps * cycleMs);
        nextEnd = new Date(nextEnd.getTime() + steps * cycleMs);
    }

    const isActive = now >= nextStart.getTime() && now < nextEnd.getTime();
    const isLobbyOpen = now >= nextStart.getTime() - LOBBY_OPEN_WINDOW_MS && now < nextStart.getTime();
    let phase: BossPhase = "scheduled";
    if (isActive) phase = "active";
    else if (isLobbyOpen) phase = "ready";
    else if (status === "RESPAWNING") phase = "respawning";

    const statusLabel = phase === "active"
        ? "In Progress"
        : phase === "ready"
            ? "Lobby Ready"
            : phase === "respawning"
                ? "Respawning"
                : "Scheduled";

    return {
        scheduleInfo,
        phase,
        statusLabel,
        nextSpawnTime: nextStart,
        battleEndTime: nextEnd,
        countdownTarget: phase === "active" ? nextEnd : nextStart,
        countdownLabel: phase === "active" ? "Ends in" : "Starts in",
        battleLengthSeconds: inferredLengthSeconds,
    };
}

export function applyMagicFindToDrops(drops: BossDrop[], magicFind: number) {
    const multiplier = 1 + clampNumber(Number(magicFind) || 0, 0, 1000) / 100;
    const adjusted = drops.map((drop, index) => {
        const baseChance = Math.max(0, Number(drop.chance) || 0);
        return {
            ...drop,
            index,
            baseChance,
            adjustedChance: baseChance * multiplier,
        };
    });

    let overCap = adjusted.reduce((sum, drop) => sum + drop.adjustedChance, 0) - 100;
    if (overCap > 0) {
        const commonFirst = [...adjusted].sort((a, b) => b.adjustedChance - a.adjustedChance);
        for (const drop of commonFirst) {
            if (overCap <= 0) break;
            const reduction = Math.min(overCap, drop.adjustedChance);
            adjusted[drop.index].adjustedChance -= reduction;
            overCap -= reduction;
        }
    }

    return adjusted.map((drop) => ({
        ...drop,
        adjustedChance: Math.max(0, drop.adjustedChance),
    }));
}

export function getValueBreakdown(
    itemName: string,
    marketData: any,
    allItemsDb: any,
    options?: { customPrices?: Record<string, number>; marketTaxMultiplier?: number; barteringBoost?: number | "" },
) {
    const marketItem = marketData?.[itemName];
    const dbItem = allItemsDb?.[itemName];
    const safeOptions = {
        customPrices: options?.customPrices,
        marketTaxMultiplier: options?.marketTaxMultiplier ?? 0.95,
        barteringBoost: options?.barteringBoost,
    };
    const trueValue = getItemTrueValue(itemName, marketData, allItemsDb, 0, safeOptions);
    const customGross = Number(safeOptions.customPrices?.[itemName] || 0);
    const marketGross = customGross || getSafeMarketValue(marketItem);
    const marketNet = (customGross > 0 || dbItem?.is_tradeable !== false)
        ? marketGross * safeOptions.marketTaxMultiplier
        : 0;
    const vendorNet = Number(dbItem?.vendor_price || marketItem?.vendor_price || 0) * (1 + (Number(safeOptions.barteringBoost) || 0) / 100);
    const volume = Number(marketItem?.vol_3 || 0);

    let source: ValueSource = "Missing";
    if (trueValue <= 0) source = "Missing";
    else if (customGross > 0 && nearlyEqual(trueValue, marketNet)) source = "Custom";
    else if (vendorNet > 0 && nearlyEqual(trueValue, vendorNet)) source = "Vendor";
    else if (marketNet > 0 && nearlyEqual(trueValue, marketNet)) source = "Market";
    else if (dbItem?.loot_table?.length || dbItem?.chest_drops?.length) source = "Chest EV";
    else if (dbItem?.type === "RECIPE" || dbItem?.recipe_yield) source = "Recipe EV";
    else source = "True Value";

    return {
        trueValue,
        marketGross,
        marketNet,
        vendorNet,
        volume,
        source,
    };
}

export function isRareMarketDrop(drop: any, dbItem: any) {
    const type = String(dbItem?.type || "").toUpperCase();
    const quality = String(drop?.quality || dbItem?.quality || "").toUpperCase();
    return type === "PET_EGG" || (/ Egg$/i.test(String(drop?.name || "")) && quality === "MYTHIC");
}

export function getLiquiditySignal(source: ValueSource, volume: number, trueValue: number, rareMarketDrop = false): LiquiditySignal {
    if (trueValue <= 0) return "MISSING";
    if (rareMarketDrop) return "RARE MARKET";
    if (source === "Vendor") return "VENDOR SAFE";
    if (source === "Custom") return "CUSTOM";
    if (source === "Chest EV" || source === "Recipe EV" || source === "True Value") return "EV MODEL";
    if (volume >= 150) return "LIQUID";
    if (volume >= 40) return "STEADY";
    if (volume > 0) return "THIN";
    return "NO SALES";
}

export function getSignalClass(signal: LiquiditySignal) {
    if (signal === "LIQUID" || signal === "VENDOR SAFE" || signal === "CUSTOM") return "boss-signal-good";
    if (signal === "STEADY" || signal === "EV MODEL" || signal === "MIXED VALUES") return "boss-signal-neutral";
    if (signal === "THIN" || signal === "RARE MARKET") return "boss-signal-warn";
    return "boss-signal-bad";
}

export function getBossMarketNote(signals: LiquiditySignal[]): LiquiditySignal {
    const uniqueSignals = Array.from(new Set(signals));
    if (uniqueSignals.length === 0) return "MISSING";
    if (uniqueSignals.length > 1) return "MIXED VALUES";
    return uniqueSignals[0];
}

export function needsBossValueReview(row: any) {
    return row.liquiditySignal === "RARE MARKET" ||
        row.liquiditySignal === "MIXED VALUES" ||
        row.lootDetails?.some((drop: any) => drop.signal === "RARE MARKET");
}

export function getBossDropSourceLabel(drop: any) {
    if (drop.signal === "RARE MARKET") return "Rare market floor";
    return drop.source;
}

export function isSpecialEquipmentModifier(item: { type?: string }) {
    return String(item.type || "").toUpperCase() === "SPECIAL";
}

export function getConfirmedWorldBossItemModifiers(allItemsDb: any): WorldBossItemModifier[] {
    const records = Object.values(allItemsDb || {});
    return records
        .map((item: any) => {
            const effects = Array.isArray(item?.effects)
                ? item.effects.filter((effect: any) => (
                    String(effect?.target || "").toLowerCase() === "world_boss" &&
                    String(effect?.attribute || "").toLowerCase() === "magic_find"
                ))
                : [];
            const magicFind = effects.reduce((total: number, effect: any) => {
                const val = Number(effect?.value);
                return Number.isFinite(val) && val > 0 ? total + val : total;
            }, 0);
            if (magicFind <= 0) return null;
            return {
                name: String(item?.name || ""),
                type: String(item?.type || "ITEM"),
                quality: String(item?.quality || "UNKNOWN"),
                imageUrl: String(item?.image_url || ""),
                magicFind,
                durationMs: effects.reduce((max: number, effect: any) => {
                    const len = Number(effect?.length);
                    return Number.isFinite(len) && len > 0 ? Math.max(max, len) : max;
                }, 0),
            };
        })
        .filter((item): item is WorldBossItemModifier => Boolean(item?.name))
        .filter((item) => !isSpecialEquipmentModifier(item))
        .sort((a, b) => b.magicFind - a.magicFind || a.name.localeCompare(b.name));
}

export function formatWorldBossModifierDuration(durationMs: number) {
    if (!durationMs || durationMs <= 0 || !Number.isFinite(durationMs)) return "Passive";
    const minutes = Math.max(1, Math.round(durationMs / 60000));
    if (minutes < 60) return `${minutes}m`;
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function getWorldBossItemModifierSummary(option: WorldBossItemModifier) {
    return `+${option.magicFind}% MF - ${formatWorldBossModifierDuration(option.durationMs)}`;
}

export function getPhaseClass(phase: BossPhase) {
    if (phase === "active") return "phase-active";
    if (phase === "ready") return "phase-ready";
    if (phase === "respawning") return "phase-respawning";
    return "phase-scheduled";
}

export function generateTimetable(boss: any) {
    if (!isFiniteDate(boss?.nextSpawnTime) || !Number.isFinite(boss?.scheduleInfo?.respawnHours) || boss.scheduleInfo.respawnHours <= 0) return [];
    const times = [];
    const battleSeconds = Math.max(1, Number(boss.battleLengthSeconds) || boss.scheduleInfo.lengthSeconds || 3600);
    let current = boss.nextSpawnTime.getTime();
    for (let i = 0; i < 5; i++) {
        const start = new Date(current);
        const end = new Date(current + battleSeconds * 1000);
        times.push({ start, end });
        current += boss.scheduleInfo.respawnHours * 3600000;
    }
    return times;
}
