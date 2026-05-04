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
    ev?: number;
};

export type RoutineSettings = {
    startLocation: string;
    selectedBossKeys: string[];
    effectiveTeleportLevel: number;
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

export const TELEPORT_DIVISOR = 40197000;
export const DEFAULT_EFFECTIVE_TELEPORT_LEVEL = 1800;
export const MAX_EFFECTIVE_TELEPORT_LEVEL = 2300;
export const DEFAULT_MOVEMENT_SPEED = 25.68;
export const BASE_MOVEMENT_SPEED = 3;

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
];

const distanceLookup = new Map<string, number>();

for (const pair of WORLD_BOSS_ROUTE_PAIRS) {
    distanceLookup.set(getRouteKey(pair.origin, pair.destination), pair.distanceMeters);
    distanceLookup.set(getRouteKey(pair.destination, pair.origin), pair.distanceMeters);
}

function getRouteKey(origin: string, destination: string) {
    return `${origin.trim().toLowerCase()}::${destination.trim().toLowerCase()}`;
}

export function getBossRouteDistance(origin: string, destination: string) {
    if (!origin || !destination) return null;
    if (origin === destination) return 0;
    return distanceLookup.get(getRouteKey(origin, destination)) ?? null;
}

export function calculateTeleportCost(distanceMeters: number, effectiveTeleportLevel: number, classDiscount = false) {
    const safeDistance = Math.max(0, Number(distanceMeters) || 0);
    const safeLevel = Math.max(0, Number(effectiveTeleportLevel) || 0);
    const multiplier = classDiscount ? 0.5 : 1;
    return Math.round((safeDistance * safeLevel * safeLevel / TELEPORT_DIVISOR) * multiplier);
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
    let previousBossEnd: number | null = null;
    const legs: RoutineLeg[] = [];

    for (const boss of orderedBosses) {
        const destination = boss.location?.name || "Unknown";
        const distanceMeters = getBossRouteDistance(currentLocation, destination);
        const travelSeconds = distanceMeters === null ? null : calculateTravelSeconds(distanceMeters, settings.movementSpeed);
        const teleportCost = distanceMeters === null
            ? null
            : calculateTeleportCost(distanceMeters, settings.effectiveTeleportLevel, settings.classDiscount);
        const routeSeconds = settings.travelMode === "travel" ? travelSeconds : distanceMeters === null ? null : 0;
        const ev = Number(boss.ev) || 0;
        const startTime = boss.nextSpawnTime?.getTime?.() ?? null;
        const endTime = boss.battleEndTime?.getTime?.() ?? null;
        const arrivalBase = Math.max(currentTime, availableAt);
        const arriveAtMs = routeSeconds === null ? null : arrivalBase + routeSeconds * 1000;
        const waitSeconds = arriveAtMs === null || startTime === null ? null : Math.max(0, Math.round((startTime - arriveAtMs) / 1000));
        let timingStatus: RoutineTimingStatus = routeSeconds === null ? "unknown" : "ok";
        let timingNote: string | null = null;

        if (routeSeconds === null) {
            timingNote = "Distance missing";
        } else if (arriveAtMs !== null && endTime !== null && arriveAtMs > endTime) {
            timingStatus = "missed";
            timingNote = "Arrives after boss window";
        } else if (previousBossEnd !== null && startTime !== null && startTime < previousBossEnd) {
            timingStatus = "overlap";
            timingNote = "Overlaps previous boss";
        } else if (arriveAtMs !== null && startTime !== null && arriveAtMs > startTime) {
            timingStatus = "tight";
            timingNote = "Arrives after spawn";
        } else if (waitSeconds !== null && waitSeconds <= 300) {
            timingStatus = "tight";
            timingNote = waitSeconds <= 0 ? "Back-to-back window" : "Starts within 5m of arrival";
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
        if (endTime !== null) availableAt = Math.max(arriveAtMs ?? availableAt, endTime);
        else if (startTime !== null) availableAt = Math.max(arriveAtMs ?? availableAt, startTime);
        else if (arriveAtMs !== null) availableAt = arriveAtMs;
        previousBossEnd = endTime;
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
