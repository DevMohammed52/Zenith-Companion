"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfiles, type ProfileOwnedPet } from "@/lib/profiles";
import { buildPetMatchLookup, findPetRecordForOwnedPet, getPetRecordMatchKey } from "@/lib/pets";
import { getQualityRank } from "@/lib/quality";
import {
  MOBILE_PET_BATCH_SIZE,
  PET_DATABASE_STORAGE_KEY,
  type BattleDrop,
  type BattleProfitMode,
  type BattleSelection,
  type FoodPolicy,
  type PetDatabase,
  type PetRecord,
  type PetRow,
  type Quality,
  type SortKey,
  type SourceFilter,
  type StatKey,
  type StoredPetState,
  type ViewMode,
} from "../types";
import {
  calculateStats,
  clampNumber,
  getBestBattleProfit,
  getHuntingTimeSeconds,
  getMasteryBonus,
  getTotalPower,
  isDisplayableBattleDrop,
  ownedPetSearchText,
  petSearchText,
} from "../utils/pet-helpers";

export function usePetsState() {
  const searchParams = useSearchParams();
  const [database, setDatabase] = useState<PetDatabase | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [qualityFilter, setQualityFilter] = useState<Quality | "ALL">("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("power");
  const [sortDesc, setSortDesc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [petLevel, setPetLevel] = useState(100);
  const [masteryLevel, setMasteryLevel] = useState(100);
  const [evolutionStage, setEvolutionStage] = useState(0);
  const [evolutionStat, setEvolutionStat] = useState<StatKey | "all">("all");
  const [patBonus, setPatBonus] = useState(false);
  const [battleProfitMode, setBattleProfitMode] = useState<BattleProfitMode>("withSleep");
  const [foodPolicy, setFoodPolicy] = useState<FoodPolicy>("standard");
  const [beastmaster, setBeastmaster] = useState(false);
  const [openPetSelect, setOpenPetSelect] = useState<string | null>(null);
  const [selectedPetName, setSelectedPetNameState] = useState<string | null>(null);
  const [selectedBattle, setSelectedBattle] = useState<BattleSelection | null>(null);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [modalRootReady, setModalRootReady] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Pagination state (default 24 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const { activeProfile } = useProfiles();

  useEffect(() => {
    setModalRootReady(true);
  }, []);

  // Viewport tracking
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  // Load stored state
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PET_DATABASE_STORAGE_KEY);
      if (!raw) {
        setHasLoadedStoredState(true);
        return;
      }
      const stored = JSON.parse(raw) as StoredPetState;
      if (typeof stored.searchTerm === "string") setSearchTerm(stored.searchTerm);
      if (stored.qualityFilter) setQualityFilter(stored.qualityFilter);
      if (stored.sourceFilter) setSourceFilter(stored.sourceFilter);
      if (stored.sortBy) setSortBy(stored.sortBy);
      if (typeof stored.sortDesc === "boolean") setSortDesc(stored.sortDesc);
      if (stored.viewMode) setViewMode(stored.viewMode);
      if (typeof stored.petLevel === "number") setPetLevel(clampNumber(stored.petLevel, 1, 100));
      if (typeof stored.masteryLevel === "number") setMasteryLevel(clampNumber(stored.masteryLevel, 1, 100));
      if (typeof stored.evolutionStage === "number") setEvolutionStage(clampNumber(stored.evolutionStage, 0, 5));
      if (stored.evolutionStat) setEvolutionStat(stored.evolutionStat);
      if (typeof stored.patBonus === "boolean") setPatBonus(stored.patBonus);
      if (stored.battleProfitMode) setBattleProfitMode(stored.battleProfitMode);
      if (stored.foodPolicy) setFoodPolicy(stored.foodPolicy === "workbook" ? "standard" : stored.foodPolicy);
      if (typeof stored.beastmaster === "boolean") setBeastmaster(stored.beastmaster);
    } catch {
      window.localStorage.removeItem(PET_DATABASE_STORAGE_KEY);
    } finally {
      setHasLoadedStoredState(true);
    }
  }, []);

  // Persist state
  useEffect(() => {
    if (!hasLoadedStoredState) return;
    const stored: StoredPetState = {
      searchTerm,
      qualityFilter,
      sourceFilter,
      sortBy,
      sortDesc,
      viewMode,
      petLevel,
      masteryLevel,
      evolutionStage,
      evolutionStat,
      patBonus,
      battleProfitMode,
      foodPolicy,
      beastmaster,
    };
    window.localStorage.setItem(PET_DATABASE_STORAGE_KEY, JSON.stringify(stored));
  }, [
    hasLoadedStoredState,
    searchTerm,
    qualityFilter,
    sourceFilter,
    sortBy,
    sortDesc,
    viewMode,
    petLevel,
    masteryLevel,
    evolutionStage,
    evolutionStat,
    patBonus,
    battleProfitMode,
    foodPolicy,
    beastmaster,
  ]);

  // Fetch pet database
  useEffect(() => {
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Pet database unavailable"))))
      .then((data: PetDatabase) => {
        if (cancelled) return;
        setDatabase(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Pet database failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keyboard navigation & modal dismiss
  useEffect(() => {
    if (!selectedPetName && !selectedBattle) return;
    document.body.classList.add("pet-modal-open");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedPetName(null);
      setSelectedBattle(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("pet-modal-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPetName, selectedBattle]);

  // Deep-linking: auto-select pet from URL param on load
  useEffect(() => {
    const petParam = searchParams?.get("pet");
    if (!petParam || !database?.pets) return;
    const match = database.pets.find(
      (p) => p.name.toLowerCase() === petParam.toLowerCase() || String(p.id) === petParam,
    );
    if (match) {
      setSelectedPetNameState(match.name);
    }
  }, [database, searchParams]);

  // Synchronize URL query parameter when selectedPetName changes
  const setSelectedPetName = (petName: string | null) => {
    setSelectedPetNameState(petName);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (petName) {
        url.searchParams.set("pet", petName);
      } else {
        url.searchParams.delete("pet");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const masteryBonus = useMemo(() => getMasteryBonus(database, masteryLevel), [database, masteryLevel]);
  const petMatchLookup = useMemo(() => buildPetMatchLookup(database?.pets || []), [database?.pets]);
  const ownedPetsByPetKey = useMemo(() => {
    const map = new Map<string, ProfileOwnedPet[]>();
    for (const ownedPet of activeProfile?.ownedPets || []) {
      const matchedPet = findPetRecordForOwnedPet(ownedPet, petMatchLookup);
      if (!matchedPet) continue;
      const key = getPetRecordMatchKey(matchedPet);
      map.set(key, [...(map.get(key) || []), ownedPet]);
    }
    return map;
  }, [activeProfile?.ownedPets, petMatchLookup]);

  const ownedSpeciesCount = ownedPetsByPetKey.size;
  const ownedPetCount = activeProfile?.ownedPets.length || 0;

  const petRows: PetRow[] = useMemo(() => {
    const pets = database?.pets || [];
    const query = deferredSearchTerm.trim().toLowerCase();
    return pets
      .map((pet) => {
        const stats = calculateStats(pet, petLevel, masteryBonus, evolutionStage, evolutionStat, patBonus);
        const totalPower = getTotalPower(stats);
        const huntingTime = getHuntingTimeSeconds(stats);
        const battleProfit = getBestBattleProfit(pet, battleProfitMode, foodPolicy);
        const ownedPets = ownedPetsByPetKey.get(getPetRecordMatchKey(pet)) || [];
        const searchText = `${petSearchText(pet)} ${ownedPetSearchText(ownedPets)}`;
        return { pet, stats, totalPower, huntingTime, battleProfit, ownedPets, searchText };
      })
      .filter(({ pet, ownedPets, searchText }) => {
        const matchesSearch = !query || searchText.includes(query);
        const matchesQuality = qualityFilter === "ALL" || pet.quality === qualityFilter;
        const matchesSource =
          sourceFilter === "ALL" ||
          (sourceFilter === "OWNED" && ownedPets.length > 0) ||
          (sourceFilter === "EGG" && Boolean(pet.egg)) ||
          (sourceFilter === "BOSS" && Boolean(pet.rarity?.worldBoss || pet.acquisition?.length)) ||
          (sourceFilter === "EXCHANGE" && Boolean(pet.exchange?.listingCount)) ||
          (sourceFilter === "MERCHANT" && pet.sourceOverride?.type === "merchant") ||
          (sourceFilter === "EVENT" && pet.sourceOverride?.type === "event") ||
          (sourceFilter === "UNIQUE" && pet.sourceOverride?.type === "unique") ||
          (sourceFilter === "MISSING_EGG" && !pet.egg);
        return matchesSearch && matchesQuality && matchesSource;
      })
      .sort((a, b) => {
        let left = 0;
        let right = 0;
        if (sortBy === "power") {
          left = a.totalPower;
          right = b.totalPower;
        } else if (sortBy === "speed") {
          left = Number(a.stats.movement_speed || 0);
          right = Number(b.stats.movement_speed || 0);
        } else if (sortBy === "battleProfit") {
          left = a.battleProfit.value;
          right = b.battleProfit.value;
        } else if (sortBy === "market") {
          left = Number(a.pet.exchange?.minPrice || 0);
          right = Number(b.pet.exchange?.minPrice || 0);
        } else if (sortBy === "drop") {
          left = Number(a.pet.rarity?.dropChancePercent || 0);
          right = Number(b.pet.rarity?.dropChancePercent || 0);
        } else if (sortBy === "quality") {
          left = getQualityRank(a.pet.quality);
          right = getQualityRank(b.pet.quality);
        } else {
          return sortDesc ? b.pet.name.localeCompare(a.pet.name) : a.pet.name.localeCompare(b.pet.name);
        }
        return sortDesc ? right - left : left - right;
      });
  }, [
    database,
    deferredSearchTerm,
    qualityFilter,
    sourceFilter,
    sortBy,
    sortDesc,
    petLevel,
    masteryBonus,
    evolutionStage,
    evolutionStat,
    patBonus,
    battleProfitMode,
    foodPolicy,
    ownedPetsByPetKey,
  ]);

  // Reset pagination to page 1 on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm, qualityFilter, sourceFilter, sortBy, sortDesc, pageSize]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(petRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return petRows.slice(start, start + pageSize);
  }, [petRows, safeCurrentPage, pageSize]);

  const selectedRow = useMemo(
    () => (selectedPetName ? petRows.find((row) => row.pet.name === selectedPetName) || null : null),
    [petRows, selectedPetName],
  );

  const selectedBattleDrops = useMemo(
    () => selectedBattle?.zone.drops?.filter(isDisplayableBattleDrop) || [],
    [selectedBattle],
  );

  const counts = database?.meta.counts;
  const bestHunter = petRows.reduce<PetRow | null>(
    (best, row) => (!best || row.huntingTime < best.huntingTime ? row : best),
    null,
  );
  const bestMarket = petRows.reduce<PetRow | null>(
    (best, row) => (!best || Number(row.pet.exchange?.minPrice || 0) > Number(best.pet.exchange?.minPrice || 0) ? row : best),
    null,
  );
  const battleResearchPetCount = petRows.filter((row) => (row.pet.battle?.zones?.length || 0) > 0).length;
  const activeFilterCount = [
    searchTerm.trim() !== "",
    qualityFilter !== "ALL",
    sourceFilter !== "ALL",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;
  const sortIsModified = sortBy !== "power" || !sortDesc;
  const primaryControlsModified = hasActiveFilters || sortIsModified;
  const scenarioIsModified =
    petLevel !== 100 ||
    masteryLevel !== 100 ||
    evolutionStage !== 0 ||
    evolutionStat !== "all" ||
    patBonus ||
    battleProfitMode !== "withSleep" ||
    foodPolicy !== "standard" ||
    beastmaster;
  const scenarioLabel = `Lv ${petLevel} | Mastery ${masteryLevel} | Evo ${evolutionStage}`;
  const resultAnnouncement = petRows.length
    ? `Showing ${paginatedRows.length} of ${petRows.length} pets (Page ${safeCurrentPage} of ${totalPages}).`
    : "No pets match the current filters.";

  const clearPetFilters = () => {
    setSearchTerm("");
    setQualityFilter("ALL");
    setSourceFilter("ALL");
  };

  const resetPetControls = () => {
    clearPetFilters();
    setSortBy("power");
    setSortDesc(true);
  };

  const applyProfilePet = () => {
    if (!activeProfile?.pet?.species) return;
    setSearchTerm(activeProfile.pet.species);
    if (typeof activeProfile.pet.level === "number") setPetLevel(clampNumber(activeProfile.pet.level, 1, 100));
    if (typeof activeProfile.pet.evolution === "number") setEvolutionStage(clampNumber(activeProfile.pet.evolution, 0, 5));
    if (typeof activeProfile.levels.petMastery === "number") setMasteryLevel(clampNumber(activeProfile.levels.petMastery, 1, 100));
  };

  return {
    database,
    loadError,
    searchTerm,
    setSearchTerm,
    qualityFilter,
    setQualityFilter,
    sourceFilter,
    setSourceFilter,
    sortBy,
    setSortBy,
    sortDesc,
    setSortDesc,
    viewMode,
    setViewMode,
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
    battleProfitMode,
    setBattleProfitMode,
    foodPolicy,
    setFoodPolicy,
    beastmaster,
    setBeastmaster,
    openPetSelect,
    setOpenPetSelect,
    selectedPetName,
    setSelectedPetName,
    selectedBattle,
    setSelectedBattle,
    modalRootReady,
    isCompactViewport,
    isSetupOpen,
    setIsSetupOpen,
    currentPage: safeCurrentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedRows,
    activeProfile,
    masteryBonus,
    ownedSpeciesCount,
    ownedPetCount,
    petRows,
    selectedRow,
    selectedBattleDrops,
    counts,
    bestHunter,
    bestMarket,
    battleResearchPetCount,
    activeFilterCount,
    hasActiveFilters,
    sortIsModified,
    primaryControlsModified,
    scenarioIsModified,
    scenarioLabel,
    resultAnnouncement,
    clearPetFilters,
    resetPetControls,
    applyProfilePet,
  };
}

export type PetsState = ReturnType<typeof usePetsState>;
