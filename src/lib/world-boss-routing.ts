export type TravelMode = "teleport" | "travel";

export type WorldBossRoutePair = {
    origin: string;
    destination: string;
    distanceMeters: number;
};

export type RoutineBoss = {
    id?: string | number;
    name: string;
    location?: { name?: string | null } | null;
    nextSpawnTime?: Date | null;
    battleEndTime?: Date | null;
    countdownLabel?: string;
    countdownTarget?: Date | null;
    ev?: number;
};

export type RoutineSettings = {
    startLocation: string;
    selectedBossKeys: string[];
    relevantTeleportLevel: number;
    movementSpeed: number;
    classDiscount: boolean;
    travelMode: TravelMode;
    currentTime?: number;
};

export type RoutineTimingStatus = "ok" | "overlap" | "tight" | "missed" | "unknown";

export type RoutineLeg = {
    boss: RoutineBoss;
    origin: string;
    destination: string;
    distanceMeters: number | null;
    travelSeconds: number | null;
    routeSeconds: number | null;
    teleportCost: number | null;
    ev: number;
    netAfterTeleport: number | null;
    missingDistance: boolean;
    arriveAt: Date | null;
    waitSeconds: number | null;
    timingStatus: RoutineTimingStatus;
    timingNote: string | null;
};

export type RoutinePlan = {
    legs: RoutineLeg[];
    grossEv: number;
    teleportCost: number;
    netEv: number;
    travelSeconds: number;
    missingLegs: number;
    conflictLegs: number;
};

// Legacy factors preserved for interface stability
export const TELEPORT_BASE_FACTOR = 1 / 300;
export const TELEPORT_LEVEL_FACTOR = 1e-6 * (86 / 999);
export const TELEPORT_LEVEL_EXPONENT = 1.9;

export const MIN_TELEPORT_ACTION_COST = 50;
export const TELEPORT_SOFT_CAP_LEVEL = 1500;
export const TELEPORT_BEGINNER_FLOOR_LEVEL = 200;
export const TELEPORT_MAX_SLOPE = 1900.49 / (42645 / 75); // ~3.34237 gold per coordinate unit
export const TELEPORT_FORMULA_LABEL = "max(50, floor((50 + (refAdded(economicLevel) / 42645) * distanceMeters) * (discount ? 0.5 : 1)))";
export const DEFAULT_RELEVANT_TELEPORT_LEVEL = 1359;
export const MAX_RELEVANT_TELEPORT_LEVEL = 2500;
export const DEFAULT_MOVEMENT_SPEED = 25.68;
export const BASE_MOVEMENT_SPEED = 3;

/**
 * Canonical 5 exempt skills excluded from teleportation cost (Patch 0.23.5-PB / 0.83.0-PB).
 * These skills have no direct influence on the core economy.
 */
export const TELEPORT_EXEMPT_SKILL_KEYS = [
    "guild-mastery",
    "shadow-mastery",
    "yule-mastery",
    "springtide-mastery",
    "lunar-mastery",
    "meditation",
] as const;

/**
 * Known world locations and their coordinate map for direct coordinate distance calculation.
 */
export const WORLD_LOCATION_COORDINATES: Record<string, { x: number; y: number }> = {
    "bluebell hollow": { x: 180, y: 100 },
    "whispering woods": { x: 500, y: 150 },
    "eldoria": { x: 290, y: 380 },
    "crystal caverns": { x: 650, y: 420 },
    "skyreach peak": { x: 800, y: 500 },
    "enchanted oasis": { x: 240, y: 770 },
    "floating gardens of aetheria": { x: 120, y: 270 },
    "celestial observatory": { x: 575, y: 710 },
    "isle of whispers": { x: 170, y: 470 },
    "the citadel": { x: 810, y: 100 },
    "wraithwood forest": { x: 315, y: 220 },
};

/**
 * Extracts a character profile's Economic Total Level by deducting the 5 exempt masteries.
 */
export function getProfileEconomicTeleportLevel(profile: {
    levels?: { totalLevel?: number | "" };
    skills?: Record<string, { level?: number | "" }>;
} | null | undefined): number {
    if (!profile) return DEFAULT_RELEVANT_TELEPORT_LEVEL;
    const total = Number(profile.levels?.totalLevel) || 0;
    if (total <= 0) return 0;

    let exempt = 0;
    if (profile.skills) {
        for (const key of TELEPORT_EXEMPT_SKILL_KEYS) {
            const skill = profile.skills[key];
            if (skill && typeof skill.level === "number" && Number.isFinite(skill.level)) {
                exempt += skill.level;
            }
        }
    }
    return Math.max(0, total - exempt);
}

/**
 * Checks whether a character class qualifies for the 50% teleportation discount (Banished & Cursed).
 */
export function isTeleportDiscountClass(className: string | null | undefined): boolean {
    if (!className) return false;
    const normalized = className.trim().toLowerCase();
    return normalized === "banished" || normalized === "cursed";
}

/**
 * Calibrated 11 empirical anchor points combining official v0.83.0 patch notes and verified player data.
 * Format: [Economic Total Level, Slope S (gold per coordinate unit)]
 */
export const TELEPORT_CURVE_ANCHORS: ReadonlyArray<readonly [number, number]> = [
    [200, 0.000000],
    [500, 0.640175],
    [661, 1.181139],
    [800, 1.762239],
    [1000, 2.536077],
    [1035, 2.611754],
    [1100, 2.823107],
    [1200, 3.051382],
    [1344, 3.262776],
    [1398, 3.305932],
    [1500, 3.341571],
] as const;

/**
 * Calculates the reference added cost at the canonical baseline distance (42,645m, Bluebell -> Caverns).
 * Follows the game's exact piecewise quadratic model (Hades reverse-engineered equation):
 * - Level <= 200: 0g added (flat 50g base floor)
 * - Level 200..800: Convex quadratic: (137/90000) * (tl - 200)^2 + (227/300) * (tl - 200)
 * - Level 800..1500: Concave quadratic: 1900.49 - 0.0018319 * (1500 - tl)^2
 * - Level > 1500: Capped at 1900.49g added (1,950g total at 42,645m)
 */
export function calculateReferenceAddedCost(economicLevel: number): number {
    const tl = Math.max(200, Math.min(1500, Number(economicLevel) || 0));
    if (tl <= 200) {
        return 0;
    }
    if (tl < 800) {
        const x = tl - 200;
        return (137 / 90000) * x * x + (227 / 300) * x;
    }
    const dL = 1500 - tl;
    return 1900.49 - 0.0018319 * dL * dL;
}

/**
 * Calculates the exact distance slope S (gold per coordinate unit of 75m) for a given economic level.
 */
export function calculateTeleportSlope(economicLevel: number): number {
    const refAdded = calculateReferenceAddedCost(economicLevel);
    return (refAdded / 42645) * 75;
}

export const WORLD_BOSS_ROUTE_PAIRS: WorldBossRoutePair[] = [
    { origin: "Bluebell Hollow", destination: "Celestial Observatory", distanceMeters: 54504 },
    { origin: "Bluebell Hollow", destination: "Crystal Caverns", distanceMeters: 42645 },
    { origin: "Bluebell Hollow", destination: "Eldoria", distanceMeters: 22562 },
    { origin: "Bluebell Hollow", destination: "Floating Gardens of Aetheria", distanceMeters: 13521 },
    { origin: "Bluebell Hollow", destination: "Isle of Whispers", distanceMeters: 27760 },
    { origin: "Bluebell Hollow", destination: "Skyreach Peak", distanceMeters: 55338 },
    { origin: "Celestial Observatory", destination: "Enchanted Oasis", distanceMeters: 25525 },
    { origin: "Celestial Observatory", destination: "Isle of Whispers", distanceMeters: 35308 },
    { origin: "Crystal Caverns", destination: "Celestial Observatory", distanceMeters: 22466 },
    { origin: "Crystal Caverns", destination: "Enchanted Oasis", distanceMeters: 40430 },
    { origin: "Crystal Caverns", destination: "Isle of Whispers", distanceMeters: 36195 },
    { origin: "Crystal Caverns", destination: "Skyreach Peak", distanceMeters: 12750 },
    { origin: "Eldoria", destination: "Celestial Observatory", distanceMeters: 32702 },
    { origin: "Eldoria", destination: "Crystal Caverns", distanceMeters: 27166 },
    { origin: "Eldoria", destination: "Enchanted Oasis", distanceMeters: 29489 },
    { origin: "Eldoria", destination: "Isle of Whispers", distanceMeters: 11250 },
    { origin: "Eldoria", destination: "Skyreach Peak", distanceMeters: 39295 },
    { origin: "Enchanted Oasis", destination: "Bluebell Hollow", distanceMeters: 50451 },
    { origin: "Enchanted Oasis", destination: "Isle of Whispers", distanceMeters: 23104 },
    { origin: "Floating Gardens of Aetheria", destination: "Celestial Observatory", distanceMeters: 47471 },
    { origin: "Floating Gardens of Aetheria", destination: "Crystal Caverns", distanceMeters: 41311 },
    { origin: "Floating Gardens of Aetheria", destination: "Eldoria", distanceMeters: 15186 },
    { origin: "Floating Gardens of Aetheria", destination: "Enchanted Oasis", distanceMeters: 38565 },
    { origin: "Floating Gardens of Aetheria", destination: "Isle of Whispers", distanceMeters: 15462 },
    { origin: "Floating Gardens of Aetheria", destination: "Skyreach Peak", distanceMeters: 53838 },
    { origin: "Skyreach Peak", destination: "Celestial Observatory", distanceMeters: 23083 },
    { origin: "Skyreach Peak", destination: "Enchanted Oasis", distanceMeters: 46627 },
    { origin: "Skyreach Peak", destination: "Isle of Whispers", distanceMeters: 47304 },
    { origin: "The Citadel", destination: "Bluebell Hollow", distanceMeters: 47250 },
    { origin: "The Citadel", destination: "Celestial Observatory", distanceMeters: 49028 },
    { origin: "The Citadel", destination: "Crystal Caverns", distanceMeters: 26833 },
    { origin: "The Citadel", destination: "Eldoria", distanceMeters: 44294 },
    { origin: "The Citadel", destination: "Enchanted Oasis", distanceMeters: 65974 },
    { origin: "The Citadel", destination: "Floating Gardens of Aetheria", distanceMeters: 53298 },
    { origin: "The Citadel", destination: "Isle of Whispers", distanceMeters: 55444 },
    { origin: "The Citadel", destination: "Skyreach Peak", distanceMeters: 30009 },
    { origin: "The Citadel", destination: "Whispering Woods", distanceMeters: 23550 },
    { origin: "Whispering Woods", destination: "Bluebell Hollow", distanceMeters: 24291 },
    { origin: "Whispering Woods", destination: "Celestial Observatory", distanceMeters: 42375 },
    { origin: "Whispering Woods", destination: "Crystal Caverns", distanceMeters: 23165 },
    { origin: "Whispering Woods", destination: "Eldoria", distanceMeters: 23359 },
    { origin: "Whispering Woods", destination: "Enchanted Oasis", distanceMeters: 50423 },
    { origin: "Whispering Woods", destination: "Floating Gardens of Aetheria", distanceMeters: 29887 },
    { origin: "Whispering Woods", destination: "Isle of Whispers", distanceMeters: 34476 },
    { origin: "Whispering Woods", destination: "Skyreach Peak", distanceMeters: 34573 },
    { origin: "Wraithwood Forest", destination: "Bluebell Hollow", distanceMeters: 13547 },
    { origin: "Wraithwood Forest", destination: "Celestial Observatory", distanceMeters: 41603 },
    { origin: "Wraithwood Forest", destination: "Crystal Caverns", distanceMeters: 29262 },
    { origin: "Wraithwood Forest", destination: "Eldoria", distanceMeters: 12146 },
    { origin: "Wraithwood Forest", destination: "Enchanted Oasis", distanceMeters: 41632 },
    { origin: "Wraithwood Forest", destination: "Floating Gardens of Aetheria", distanceMeters: 15098 },
    { origin: "Wraithwood Forest", destination: "Isle of Whispers", distanceMeters: 21676 },
    { origin: "Wraithwood Forest", destination: "Skyreach Peak", distanceMeters: 42002 },
    { origin: "Wraithwood Forest", destination: "The Citadel", distanceMeters: 38200 },
    { origin: "Wraithwood Forest", destination: "Whispering Woods", distanceMeters: 14835 },
];

const distanceLookup = new Map<string, number>();

for (const pair of WORLD_BOSS_ROUTE_PAIRS) {
    distanceLookup.set(getRouteKey(pair.origin, pair.destination), pair.distanceMeters);
    distanceLookup.set(getRouteKey(pair.destination, pair.origin), pair.distanceMeters);
}

function getRouteKey(origin: string, destination: string) {
    return `${origin.trim().toLowerCase()}::${destination.trim().toLowerCase()}`;
}

export function getBossRouteDistance(origin: string, destination: string): number | null {
    if (!origin || !destination) return null;
    if (origin === destination) return 0;
    const direct = distanceLookup.get(getRouteKey(origin, destination));
    if (direct !== undefined) return direct;

    // Coordinate fallback for unlisted locations (e.g. Wraithwood Forest / Event locations)
    const origCoord = WORLD_LOCATION_COORDINATES[origin.trim().toLowerCase()];
    const destCoord = WORLD_LOCATION_COORDINATES[destination.trim().toLowerCase()];
    if (origCoord && destCoord) {
        const dx = origCoord.x - destCoord.x;
        const dy = origCoord.y - destCoord.y;
        return Math.round(Math.sqrt(dx * dx + dy * dy) * 75);
    }

    return null;
}

export function calculateTeleportCost(distanceMeters: number, relevantTeleportLevel: number, classDiscount = false): number {
    const safeDistance = Math.max(0, Number(distanceMeters) || 0);
    if (safeDistance <= 0) return 0;

    const refAdded = calculateReferenceAddedCost(relevantTeleportLevel);
    const ratePerMeter = refAdded / 42645;
    const rawCost = 50 + ratePerMeter * safeDistance;
    const finalCost = classDiscount ? rawCost * 0.5 : rawCost;

    const minCost = classDiscount ? Math.round(MIN_TELEPORT_ACTION_COST * 0.5) : MIN_TELEPORT_ACTION_COST;
    return Math.max(minCost, Math.floor(finalCost));
}

export function calculateTravelSeconds(distanceMeters: number, movementSpeed: number) {
    const safeSpeed = Math.max(0.1, Number(movementSpeed) || BASE_MOVEMENT_SPEED);
    return Math.round(Math.max(0, distanceMeters) / safeSpeed);
}

export function buildWorldBossRoutinePlan(bosses: RoutineBoss[], settings: RoutineSettings): RoutinePlan {
    const selected = new Set(settings.selectedBossKeys);
    const currentTime = settings.currentTime ?? Date.now();
    const orderedBosses = bosses
        .filter((boss) => selected.has(getRoutineBossKey(boss)))
        .sort((a, b) => {
            const timeA = a.nextSpawnTime?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
            const timeB = b.nextSpawnTime?.getTime?.() ?? Number.MAX_SAFE_INTEGER;
            return timeA - timeB || String(a.name).localeCompare(String(b.name));
        });

    let currentLocation = settings.startLocation;
    let availableAt = currentTime;
    const legs: RoutineLeg[] = [];

    for (const boss of orderedBosses) {
        const destination = boss.location?.name || "Unknown";
        const distanceMeters = getBossRouteDistance(currentLocation, destination);
        const travelSeconds = distanceMeters === null ? null : calculateTravelSeconds(distanceMeters, settings.movementSpeed);
        const teleportCost = distanceMeters === null
            ? null
            : calculateTeleportCost(distanceMeters, settings.relevantTeleportLevel, settings.classDiscount);
        const routeSeconds = settings.travelMode === "travel" ? travelSeconds : distanceMeters === null ? null : 0;
        const ev = Number(boss.ev) || 0;
        const startTime = boss.nextSpawnTime?.getTime?.() ?? null;
        const endTime = boss.battleEndTime?.getTime?.() ?? null;
        const previousAvailableAt = Math.max(currentTime, availableAt);
        const arrivalBase = previousAvailableAt;
        const arriveAtMs = routeSeconds === null ? null : arrivalBase + routeSeconds * 1000;
        const waitSeconds = arriveAtMs === null || startTime === null ? null : Math.max(0, Math.round((startTime - arriveAtMs) / 1000));
        let timingStatus: RoutineTimingStatus = routeSeconds === null ? "unknown" : "ok";
        let timingNote: string | null = null;

        if (routeSeconds === null) {
            timingNote = "Distance missing";
        } else if (arriveAtMs !== null && endTime !== null && arriveAtMs > endTime) {
            timingStatus = "missed";
            timingNote = "Arrives after boss window";
        } else if (startTime !== null && startTime < previousAvailableAt) {
            timingStatus = "overlap";
            timingNote = arriveAtMs !== null && startTime !== null && arriveAtMs > startTime
                ? "Arrives during active window"
                : "Starts before previous stop clears";
        } else if (arriveAtMs !== null && startTime !== null && arriveAtMs > startTime) {
            timingStatus = "tight";
            timingNote = "Arrives after spawn";
        }

        legs.push({
            boss,
            origin: currentLocation,
            destination,
            distanceMeters,
            travelSeconds,
            routeSeconds,
            teleportCost,
            ev,
            netAfterTeleport: teleportCost === null ? null : ev - teleportCost,
            missingDistance: distanceMeters === null,
            arriveAt: arriveAtMs === null ? null : new Date(arriveAtMs),
            waitSeconds,
            timingStatus,
            timingNote,
        });

        currentLocation = destination;
        if (endTime !== null) availableAt = Math.max(availableAt, arriveAtMs ?? availableAt, endTime);
        else if (startTime !== null) availableAt = Math.max(availableAt, arriveAtMs ?? availableAt, startTime);
        else if (arriveAtMs !== null) availableAt = Math.max(availableAt, arriveAtMs);
    }

    const grossEv = legs.reduce((sum, leg) => sum + leg.ev, 0);
    const teleportCost = legs.reduce((sum, leg) => sum + (leg.teleportCost || 0), 0);
    const travelSeconds = legs.reduce((sum, leg) => sum + (leg.travelSeconds || 0), 0);

    return {
        legs,
        grossEv,
        teleportCost,
        netEv: grossEv - teleportCost,
        travelSeconds,
        missingLegs: legs.filter((leg) => leg.missingDistance).length,
        conflictLegs: legs.filter((leg) => leg.timingStatus === "overlap" || leg.timingStatus === "tight" || leg.timingStatus === "missed").length,
    };
}

export function getRoutineBossKey(boss: RoutineBoss) {
    return String(boss.id ?? boss.name);
}
