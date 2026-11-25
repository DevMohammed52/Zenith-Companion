"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { useProfiles } from "@/lib/profiles";
import {
  COMPARISON_STAT_KEYS,
  QUALITY_ORDER,
  buildPetMatchLookup,
  calculatePetStats,
  clampNumber,
  findPetRecordForOwnedPet,
  formatGold,
  getMasteryBonus,
  getPetRecordMatchKey,
  getPetSourceLabel,
  getTotalPower,
  getHuntingTimeSeconds,
  getBestBattleProfit,
  getZoneProfitValue,
  petSearchText,
  qualityLabel,
  type BattleProfitMode,
  type FoodPolicy,
  type PetDatabase,
  type PetRecord,
  type StatKey,
} from "@/lib/pets";
import {
  BEST_BATTLE_ZONE,
  MAX_COMPARE,
  STORAGE_KEY,
  type CompareState,
  type ComparedPet,
  type PetOption,
} from "../types";
import {
  databaseOptionId,
  formatOwnedPetMeta,
  getBattleModeLabel,
  metricValue,
  ownedOptionId,
  ownedPetSearchText,
  ownedPetStatsToComparisonStats,
} from "../utils/compare-helpers";

export function usePetCompareState() {
  const { activeProfile } = useProfiles();
  const [database, setDatabase] = useState<PetDatabase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [petLevel, setPetLevel] = useState(100);
  const [masteryLevel, setMasteryLevel] = useState(100);
  const [evolutionStage, setEvolutionStage] = useState(0);
  const [evolutionStat, setEvolutionStat] = useState<StatKey | "all">("all");
  const [patBonus, setPatBonus] = useState(false);
  const [battleMode, setBattleMode] = useState<BattleProfitMode>("withSleep");
  const [battleZone, setBattleZone] = useState(BEST_BATTLE_ZONE);
  const [foodPolicy, setFoodPolicy] = useState<FoodPolicy>("standard");
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const loadedStorageKeyRef = useRef<string | null>(null);
  const skipNextSaveRef = useRef(false);
  const activeProfileId = activeProfile?.id || null;
  const storageKey = useMemo(() => getProfileStorageKey(STORAGE_KEY, activeProfileId), [activeProfileId]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setIsCompactViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    loadedStorageKeyRef.current = null;
    setSelectedIds([]);
    setPetLevel(100);
    setMasteryLevel(100);
    setEvolutionStage(0);
    setEvolutionStat("all");
    setPatBonus(false);
    setBattleMode("withSleep");
    setBattleZone(BEST_BATTLE_ZONE);
    setFoodPolicy("standard");

    let hasUrlSelection = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPets = params.get("pets");
      if (urlPets) {
        const parsedIds = urlPets
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => (item.includes(":") ? item : databaseOptionId(item)))
          .slice(0, MAX_COMPARE);
        if (parsedIds.length > 0) {
          setSelectedIds(parsedIds);
          hasUrlSelection = true;
        }
      }
    } catch {}

    try {
      const raw = localStorage.getItem(storageKey) ?? (activeProfileId ? null : localStorage.getItem(STORAGE_KEY));
      if (raw) {
        const stored = JSON.parse(raw) as CompareState;
        if (!hasUrlSelection) {
          if (Array.isArray(stored.selectedIds)) {
            setSelectedIds(stored.selectedIds.slice(0, MAX_COMPARE));
          } else if (Array.isArray(stored.selectedNames)) {
            setSelectedIds(stored.selectedNames.map(databaseOptionId).slice(0, MAX_COMPARE));
          }
        }
        if (typeof stored.petLevel === "number") setPetLevel(clampNumber(stored.petLevel, 1, 100));
        if (typeof stored.masteryLevel === "number") setMasteryLevel(clampNumber(stored.masteryLevel, 1, 100));
        if (typeof stored.evolutionStage === "number") setEvolutionStage(clampNumber(stored.evolutionStage, 0, 5));
        if (stored.evolutionStat) setEvolutionStat(stored.evolutionStat);
        if (typeof stored.patBonus === "boolean") setPatBonus(stored.patBonus);
        if (stored.battleMode) setBattleMode(stored.battleMode);
        if (stored.battleZone) setBattleZone(stored.battleZone);
        if (stored.foodPolicy) setFoodPolicy(stored.foodPolicy);
      }
    } catch {}
    loadedStorageKeyRef.current = storageKey;
    skipNextSaveRef.current = true;
  }, [activeProfileId, storageKey]);

  useEffect(() => {
    if (loadedStorageKeyRef.current !== storageKey) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const payload: CompareState = {
      selectedIds,
      petLevel,
      masteryLevel,
      evolutionStage,
      evolutionStat,
      patBonus,
      battleMode,
      battleZone,
      foodPolicy,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (selectedIds.length > 0) {
        url.searchParams.set("pets", selectedIds.join(","));
      } else {
        url.searchParams.delete("pets");
      }
      window.history.replaceState(null, "", url.toString());
    }
  }, [
    battleMode,
    battleZone,
    evolutionStage,
    evolutionStat,
    foodPolicy,
    masteryLevel,
    patBonus,
    petLevel,
    selectedIds,
    storageKey,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Pet comparison data is unavailable.")),
      )
      .then((data: PetDatabase) => {
        if (!cancelled) setDatabase(data);
      })
      .catch((error) => {
        if (!cancelled)
          setLoadError(
            error instanceof Error ? error.message : "Pet comparison data is unavailable.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pets = useMemo(() => {
    const list = database?.pets || [];
    return [...list].sort((a, b) => {
      const quality = (QUALITY_ORDER[b.quality] || 0) - (QUALITY_ORDER[a.quality] || 0);
      return quality || a.name.localeCompare(b.name);
    });
  }, [database]);

  const petMatchLookup = useMemo(() => buildPetMatchLookup(pets), [pets]);
  const activeProfilePetSpecies = activeProfile?.pet?.species;
  const unmatchedOwnedPetCount = useMemo(
    () =>
      (activeProfile?.ownedPets || []).filter(
        (ownedPet) => !findPetRecordForOwnedPet(ownedPet, petMatchLookup),
      ).length,
    [activeProfile?.ownedPets, petMatchLookup],
  );
  const unmatchedOwnedPetNames = useMemo(
    () =>
      (activeProfile?.ownedPets || [])
        .filter((ownedPet) => !findPetRecordForOwnedPet(ownedPet, petMatchLookup))
        .map((ownedPet) => ownedPet.nickname?.trim() || ownedPet.species)
        .filter(Boolean),
    [activeProfile?.ownedPets, petMatchLookup],
  );

  const compareOptions = useMemo<PetOption[]>(() => {
    const ownedOptions: PetOption[] = [];
    for (const ownedPet of activeProfile?.ownedPets || []) {
      const pet = findPetRecordForOwnedPet(ownedPet, petMatchLookup);
      if (!pet) continue;
      const title = ownedPet.nickname?.trim() || ownedPet.species;
      const subtitle = `${formatOwnedPetMeta(ownedPet)} - ${ownedPet.species}`;
      ownedOptions.push({
        id: ownedOptionId(ownedPet.id),
        kind: "owned",
        pet,
        ownedPet,
        title,
        subtitle,
        meta: ownedPet.source === "imported" ? "Owned" : "Manual",
        searchText: `${ownedPetSearchText(ownedPet)} ${petSearchText(pet)}`,
      });
    }

    const databaseOptions = pets.map((pet) => ({
      id: databaseOptionId(pet.name),
      kind: "database" as const,
      pet,
      title: pet.name,
      subtitle: `${qualityLabel(pet.quality)} - ${getPetSourceLabel(pet)}`,
      meta: formatGold(pet.exchange?.minPrice),
      searchText: petSearchText(pet),
    }));

    return [...ownedOptions, ...databaseOptions];
  }, [activeProfile?.ownedPets, petMatchLookup, pets]);

  const masteryBonus = useMemo(
    () => getMasteryBonus(database, masteryLevel),
    [database, masteryLevel],
  );

  const battleZoneOptions = useMemo(() => {
    const zones = new Set<string>();
    for (const pet of pets) {
      for (const zone of pet.battle?.zones || []) {
        if (zone.zone) zones.add(zone.zone);
      }
    }
    const sortedZones = Array.from(zones).sort((a, b) => {
      const levelA = Number(a.match(/\d+/)?.[0] || 0);
      const levelB = Number(b.match(/\d+/)?.[0] || 0);
      return levelA - levelB || a.localeCompare(b);
    });
    return [
      { value: BEST_BATTLE_ZONE, label: "Best recorded zone" },
      ...sortedZones.map((zone) => ({ value: zone, label: zone.replace(/^Level\s+/, "L") })),
    ];
  }, [pets]);

  useEffect(() => {
    if (
      battleZone !== BEST_BATTLE_ZONE &&
      !battleZoneOptions.some((option) => option.value === battleZone)
    ) {
      setBattleZone(BEST_BATTLE_ZONE);
    }
  }, [battleZone, battleZoneOptions]);

  const getBattleSample = useCallback(
    (pet: PetRecord) => {
      if (battleZone === BEST_BATTLE_ZONE) return getBestBattleProfit(pet, battleMode, foodPolicy);
      const zone = pet.battle?.zones?.find((entry) => entry.zone === battleZone);
      if (!zone)
        return { value: 0, zone: null as string | null, mode: null as BattleProfitMode | null };
      return {
        value: getZoneProfitValue(zone, battleMode, foodPolicy),
        zone: zone.zone,
        mode: battleMode,
      };
    },
    [battleMode, battleZone, foodPolicy],
  );

  const rows = useMemo<ComparedPet[]>(() => {
    return selectedIds
      .map((id) => compareOptions.find((option) => option.id === id))
      .filter((option): option is PetOption => Boolean(option))
      .map((option) => {
        const stats = option.ownedPet
          ? ownedPetStatsToComparisonStats(option.ownedPet.stats)
          : calculatePetStats(
              option.pet,
              petLevel,
              masteryBonus,
              evolutionStage,
              evolutionStat,
              patBonus,
            );
        return {
          id: option.id,
          label: option.title,
          subtitle: option.ownedPet ? option.subtitle : getPetSourceLabel(option.pet),
          source: option.kind,
          pet: option.pet,
          ownedPet: option.ownedPet,
          stats,
          totalPower: getTotalPower(stats),
          huntingTime: getHuntingTimeSeconds(stats),
          battle: getBattleSample(option.pet),
        };
      });
  }, [
    compareOptions,
    evolutionStage,
    evolutionStat,
    getBattleSample,
    masteryBonus,
    patBonus,
    petLevel,
    selectedIds,
  ]);

  const unavailableSelectedIds = useMemo(
    () => selectedIds.filter((id) => !compareOptions.some((option) => option.id === id)),
    [compareOptions, selectedIds],
  );

  const profilePetOption = useMemo(() => {
    const activeOwnedPet = compareOptions.find(
      (option) =>
        option.kind === "owned" &&
        option.ownedPet &&
        (option.ownedPet.active || option.ownedPet.equipped),
    );
    if (activeOwnedPet) return activeOwnedPet;
    if (!activeProfilePetSpecies) return null;
    const profilePet = findPetRecordForOwnedPet(
      { species: activeProfilePetSpecies },
      petMatchLookup,
    );
    if (!profilePet) return null;
    return (
      compareOptions.find(
        (option) =>
          option.kind === "database" &&
          getPetRecordMatchKey(option.pet) === getPetRecordMatchKey(profilePet),
      ) || null
    );
  }, [activeProfilePetSpecies, compareOptions, petMatchLookup]);

  const topPicks = useMemo(() => {
    const winners = new Map<string, PetRecord>();
    let highestPower: { pet: PetRecord; value: number } | null = null;
    let fastestHunt: { pet: PetRecord; value: number } | null = null;
    let highestBattle: { pet: PetRecord; value: number } | null = null;
    let highestMarket: { pet: PetRecord; value: number } | null = null;

    for (const pet of pets) {
      const stats = calculatePetStats(
        pet,
        petLevel,
        masteryBonus,
        evolutionStage,
        evolutionStat,
        patBonus,
      );
      const power = getTotalPower(stats);
      const hunt = getHuntingTimeSeconds(stats);
      const battle = getBattleSample(pet).value;
      const market = pet.exchange?.minPrice || 0;
      if (!highestPower || power > highestPower.value) highestPower = { pet, value: power };
      if (!fastestHunt || hunt < fastestHunt.value) fastestHunt = { pet, value: hunt };
      if (battle > 0 && (!highestBattle || battle > highestBattle.value))
        highestBattle = { pet, value: battle };
      if (market > 0 && (!highestMarket || market > highestMarket.value))
        highestMarket = { pet, value: market };
    }

    if (highestPower) winners.set("Highest power", highestPower.pet);
    if (fastestHunt) winners.set("Lowest formula hunt time", fastestHunt.pet);
    if (highestBattle) winners.set("Highest recorded EV", highestBattle.pet);
    if (highestMarket) winners.set("Highest sale value", highestMarket.pet);
    return Array.from(winners.entries());
  }, [
    evolutionStage,
    evolutionStat,
    getBattleSample,
    masteryBonus,
    patBonus,
    petLevel,
    pets,
  ]);

  const battleCoverage = useMemo(() => {
    const petsWithBattle = pets.filter((pet) =>
      (pet.battle?.zones || []).some((zone) => zone.zone),
    );
    const selectedZonePets =
      battleZone === BEST_BATTLE_ZONE
        ? petsWithBattle.length
        : petsWithBattle.filter((pet) =>
            pet.battle?.zones?.some((zone) => zone.zone === battleZone),
          ).length;
    const comparedWithZone = rows.filter((row) => Boolean(row.battle.zone)).length;
    return {
      petsWithBattle: petsWithBattle.length,
      selectedZonePets,
      comparedWithZone,
    };
  }, [battleZone, pets, rows]);

  const addPet = (id: string) => {
    setSelectedIds((current) => {
      const without = current.filter((entry) => entry !== id);
      return [...without, id].slice(-MAX_COMPARE);
    });
  };

  const setSlot = (index: number, id: string) => {
    setSelectedIds((current) => {
      const next = [...current];
      next[index] = id;
      return Array.from(new Set(next.filter(Boolean))).slice(0, MAX_COMPARE);
    });
  };

  const clearSlot = (index: number) =>
    setSelectedIds((current) => current.filter((_, slotIndex) => slotIndex !== index));

  const clearAllSelected = () => setSelectedIds([]);

  const scenarioModified =
    petLevel !== 100 ||
    masteryLevel !== 100 ||
    evolutionStage !== 0 ||
    evolutionStat !== "all" ||
    patBonus ||
    battleMode !== "withSleep" ||
    battleZone !== BEST_BATTLE_ZONE ||
    foodPolicy !== "standard";

  const resetScenario = () => {
    setPetLevel(100);
    setMasteryLevel(100);
    setEvolutionStage(0);
    setEvolutionStat("all");
    setPatBonus(false);
    setBattleMode("withSleep");
    setBattleZone(BEST_BATTLE_ZONE);
    setFoodPolicy("standard");
  };

  const metricBounds = useMemo(() => {
    const keys = ["power", "hunt", "battle", "market", ...COMPARISON_STAT_KEYS];
    return Object.fromEntries(
      keys.map((key) => {
        const values = rows
          .map((row) => metricValue(row, key))
          .filter((value) => Number.isFinite(value) && value > 0);
        return [
          key,
          { max: Math.max(0, ...values), min: values.length ? Math.min(...values) : 0 },
        ];
      }),
    ) as Record<string, { max: number; min: number }>;
  }, [rows]);

  const slotCount = Math.max(2, Math.min(MAX_COMPARE, selectedIds.length + 1));
  const slots = Array.from(
    { length: selectedIds.length >= MAX_COMPARE ? MAX_COMPARE : slotCount },
    (_, index) => selectedIds[index] || null,
  );
  const scenarioSummary = `Lv ${petLevel} / PM ${masteryLevel} / ${getBattleModeLabel(battleMode)}`;
  const comparisonSummary = rows.length
    ? `${rows.length} selected / ${battleCoverage.comparedWithZone} with EV`
    : "No pets selected";

  return {
    database,
    loadError,
    activeProfile,
    selectedIds,
    setSelectedIds,
    petLevel,
    setPetLevel,
    masteryLevel,
    setMasteryLevel,
    evolutionStage,
    setEvolutionStage,
    evolutionStat,
    setEvolutionStat,
    patBonus,
    setPatBonus,
    battleMode,
    setBattleMode,
    battleZone,
    setBattleZone,
    foodPolicy,
    setFoodPolicy,
    isCompactViewport,
    compareOptions,
    battleZoneOptions,
    rows,
    unavailableSelectedIds,
    profilePetOption,
    topPicks,
    battleCoverage,
    scenarioModified,
    metricBounds,
    slots,
    scenarioSummary,
    comparisonSummary,
    unmatchedOwnedPetCount,
    unmatchedOwnedPetNames,
    addPet,
    setSlot,
    clearSlot,
    clearAllSelected,
    resetScenario,
  };
}
