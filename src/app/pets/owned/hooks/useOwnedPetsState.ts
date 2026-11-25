"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { type ProfileOwnedPet, useProfiles } from "@/lib/profiles";
import { useToast } from "@/components/ui/Toast";
import {
  buildPetMatchLookup,
  findPetRecordForOwnedPet,
  getBestBattleProfit,
  petSearchText,
  type PetRecord,
} from "@/lib/pets";
import {
  MAX_COMPARE_SELECTION,
  OWNED_PETS_PAGE_SIZE,
  SORT_OPTIONS,
  SOURCE_FILTERS,
  type OwnedTab,
  type OwnedViewMode,
  type SortDirection,
  type SortKey,
  type SourceFilter,
} from "../types";
import {
  activePetToOwnedPet,
  getOwnedPetPower,
  normalizeText,
  petKey,
} from "../utils/owned-pet-helpers";

const VALID_SOURCES = new Set<string>(SOURCE_FILTERS.map((item) => item.id));
const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((item) => item.id));

export function useOwnedPetsState() {
  const { toast } = useToast();
  const { activeProfile, loaded, updateProfile } = useProfiles();
  const [petDb, setPetDb] = useState<PetRecord[]>([]);
  const [petDbLoaded, setPetDbLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<OwnedTab>("owned");
  const [viewMode, setViewMode] = useState<OwnedViewMode>("cards");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(OWNED_PETS_PAGE_SIZE);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [detailPetId, setDetailPetId] = useState<string | null>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const urlInitializedRef = useRef(false);
  const skipNextUrlSyncRef = useRef(false);
  const ownedPets = useMemo(() => activeProfile?.ownedPets || [], [activeProfile?.ownedPets]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (urlInitializedRef.current) return;
    urlInitializedRef.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const view = params.get("view");
      const q = params.get("q");
      const source = params.get("source");
      const sort = params.get("sort");
      const dir = params.get("dir");
      if (tab === "owned" || tab === "missing") setActiveTab(tab);
      if (view === "cards" || view === "table") setViewMode(view);
      if (q) setQuery(q);
      if (source && VALID_SOURCES.has(source)) setSourceFilter(source as SourceFilter);
      if (sort && VALID_SORTS.has(sort)) setSortKey(sort as SortKey);
      if (dir === "asc" || dir === "desc") setSortDirection(dir);
      skipNextUrlSyncRef.current = true;
    } catch {}
  }, []);

  useEffect(() => {
    if (!urlInitializedRef.current) return;
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false;
      return;
    }
    try {
      const url = new URL(window.location.href);
      if (activeTab !== "owned") url.searchParams.set("tab", activeTab);
      else url.searchParams.delete("tab");
      if (viewMode !== "cards") url.searchParams.set("view", viewMode);
      else url.searchParams.delete("view");
      if (query.trim()) url.searchParams.set("q", query.trim());
      else url.searchParams.delete("q");
      if (sourceFilter !== "all") url.searchParams.set("source", sourceFilter);
      else url.searchParams.delete("source");
      if (sortKey !== "level") url.searchParams.set("sort", sortKey);
      else url.searchParams.delete("sort");
      if (sortDirection !== "desc") url.searchParams.set("dir", sortDirection);
      else url.searchParams.delete("dir");
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }, [activeTab, viewMode, query, sourceFilter, sortKey, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, deferredQuery, sourceFilter, sortKey, sortDirection, pageSize, activeProfile?.id]);

  useEffect(() => {
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) {
          setPetDb(Array.isArray(data?.pets) ? data.pets : []);
          setPetDbLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setPetDbLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const petMatchLookup = useMemo(() => buildPetMatchLookup(petDb), [petDb]);
  const activePetKey = activeProfile ? petKey(activeProfile.pet) : "";

  const ownedSpeciesCount = useMemo(() => {
    if (!petDb.length) return 0;
    const matchedNames = new Set<string>();
    for (const pet of ownedPets) {
      const db = findPetRecordForOwnedPet(pet, petMatchLookup);
      if (db) matchedNames.add(db.name);
    }
    return matchedNames.size;
  }, [ownedPets, petDb.length, petMatchLookup]);

  const missingCatalogPets = useMemo(() => {
    if (!petDb.length) return [];
    const ownedNames = new Set<string>();
    for (const pet of ownedPets) {
      const db = findPetRecordForOwnedPet(pet, petMatchLookup);
      if (db) ownedNames.add(db.name);
    }
    const needle = normalizeText(deferredQuery);
    return petDb
      .filter((pet) => !ownedNames.has(pet.name))
      .filter((pet) => !needle || petSearchText(pet).includes(needle));
  }, [deferredQuery, ownedPets, petDb, petMatchLookup]);

  const importedCount = ownedPets.filter((pet) => pet.source === "imported").length;
  const manualCount = ownedPets.filter((pet) => pet.source === "manual").length;
  const activeCount = ownedPets.filter((pet) => petKey(pet) === activePetKey || pet.active || pet.equipped).length;
  const unmatchedSpeciesCount = petDb.length
    ? ownedPets.filter((pet) => !findPetRecordForOwnedPet(pet, petMatchLookup)).length
    : 0;
  const importSource = activeProfile?.importSource;
  const importedSections = importSource?.importedSections || [];
  const missingOrPrivate = importSource?.missingOrPrivate || [];
  const hasImportedPetSection = importedSections.some((section) => normalizeText(section).includes("pet"));

  const activeOwnedPet = useMemo(
    () =>
      ownedPets.find((pet) => petKey(pet) === activePetKey || pet.active || pet.equipped) || null,
    [activePetKey, ownedPets],
  );

  const visiblePets = useMemo(() => {
    const normalizedQuery = normalizeText(deferredQuery);
    const filtered = ownedPets.filter((pet) => {
      const isActive = petKey(pet) === activePetKey || pet.active || pet.equipped;
      if (sourceFilter === "active" && !isActive) return false;
      if (sourceFilter === "imported" && pet.source !== "imported") return false;
      if (sourceFilter === "manual" && pet.source !== "manual") return false;
      if (!normalizedQuery) return true;
      const searchable = [
        pet.species,
        pet.nickname,
        pet.quality,
        pet.location?.name,
        pet.source,
        pet.hashTail,
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });

    filtered.sort((a, b) => {
      if (sortKey === "level") return Number(a.level || 0) - Number(b.level || 0);
      if (sortKey === "power") return getOwnedPetPower(a.stats) - getOwnedPetPower(b.stats);
      if (sortKey === "quality") return (a.quality || "").localeCompare(b.quality || "", undefined, { sensitivity: "base" });
      if (sortKey === "source") return a.source.localeCompare(b.source, undefined, { sensitivity: "base" });
      return (a.nickname || a.species).localeCompare(b.nickname || b.species, undefined, { sensitivity: "base", numeric: true });
    });

    return sortDirection === "desc" ? filtered.reverse() : filtered;
  }, [activePetKey, deferredQuery, ownedPets, sortDirection, sortKey, sourceFilter]);

  const activeListLength = activeTab === "owned" ? visiblePets.length : missingCatalogPets.length;
  const totalPages = Math.max(1, Math.ceil(activeListLength / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedPets = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return visiblePets.slice(start, start + pageSize);
  }, [visiblePets, safePage, pageSize]);

  const paginatedMissingPets = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return missingCatalogPets.slice(start, start + pageSize);
  }, [missingCatalogPets, safePage, pageSize]);

  const detailPet = useMemo(
    () => (detailPetId ? ownedPets.find((pet) => pet.id === detailPetId) || null : null),
    [detailPetId, ownedPets],
  );

  const activeControlCount = [
    query.trim() !== "",
    activeTab === "owned" && sourceFilter !== "all",
    activeTab === "owned" && sortKey !== "level",
    activeTab === "owned" && sortDirection !== "desc",
  ].filter(Boolean).length;
  const controlsModified = activeControlCount > 0;
  const sourceFilterLabel = SOURCE_FILTERS.find((option) => option.id === sourceFilter)?.label || "All";
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortKey)?.label || "Level";

  const resetControls = () => {
    setQuery("");
    setSourceFilter("all");
    setSortKey("level");
    setSortDirection("desc");
    setCurrentPage(1);
  };

  const toggleCompareSelection = (id: string) => {
    setSelectedCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_COMPARE_SELECTION) {
        toast.info(`You can compare up to ${MAX_COMPARE_SELECTION} pets at once.`);
        return current;
      }
      return [...current, id];
    });
  };

  const clearCompareSelection = () => setSelectedCompareIds([]);

  const compareSelectionHref = selectedCompareIds.length
    ? `/pets/compare?pets=${encodeURIComponent(selectedCompareIds.map((id) => `owned:${id}`).join(","))}`
    : "/pets/compare";

  const getCatalogSummary = (ownedPet: ProfileOwnedPet) => {
    const databasePet = findPetRecordForOwnedPet(ownedPet, petMatchLookup);
    const power = getOwnedPetPower(ownedPet.stats);
    const bestBattle = databasePet ? getBestBattleProfit(databasePet, "withSleep", "standard") : null;
    return { databasePet, power, bestBattle };
  };

  const updateOwnedPets = (nextPets: ProfileOwnedPet[]) => {
    if (!activeProfile) return;
    updateProfile(activeProfile.id, { ownedPets: nextPets }, { source: "manual", fieldPaths: ["ownedPets"] });
  };

  const addCurrentPet = () => {
    if (!activeProfile) return;
    const ownedPet = activePetToOwnedPet(activeProfile);
    if (!ownedPet) {
      toast.warning("Select a pet on the profile page first.");
      return;
    }
    const duplicate = ownedPets.some((pet) => petKey(pet) === petKey(ownedPet));
    if (duplicate) {
      toast.info("That pet setup is already saved.");
      return;
    }
    updateOwnedPets([...ownedPets, ownedPet]);
    toast.success("Current profile pet saved.");
  };

  const removePet = (ownedPet: ProfileOwnedPet) => {
    const index = ownedPets.findIndex((pet) => pet.id === ownedPet.id);
    if (index < 0) return;
    const petLabel = ownedPet.nickname || ownedPet.species;
    updateOwnedPets(ownedPets.filter((pet) => pet.id !== ownedPet.id));
    setSelectedCompareIds((current) => current.filter((id) => id !== ownedPet.id));
    if (detailPetId === ownedPet.id) setDetailPetId(null);
    toast({
      title: `${petLabel} removed.`,
      action: {
        label: "Undo",
        onClick: () => {
          if (!activeProfile) return;
          const nextPets = [...ownedPets];
          nextPets.splice(Math.min(index, nextPets.length), 0, ownedPet);
          updateProfile(activeProfile.id, { ownedPets: nextPets }, { source: "manual", fieldPaths: ["ownedPets"] });
          toast.success(`${petLabel} restored.`);
        },
      },
    });
  };

  const handleUseAsActivePet = (ownedPet: ProfileOwnedPet) => {
    if (!activeProfile) return;
    updateProfile(
      activeProfile.id,
      {
        pet: {
          ...activeProfile.pet,
          species: ownedPet.species,
          quality: ownedPet.quality,
          level: ownedPet.level || 1,
          evolution: ownedPet.evolution || 0,
          stats: { ...ownedPet.stats },
          notes: ownedPet.notes,
        },
        ownedPets: ownedPets.map((pet) => ({ ...pet, active: pet.id === ownedPet.id, equipped: pet.id === ownedPet.id })),
      },
      { source: "manual", fieldPaths: ["pet", "ownedPets"] },
    );
    toast.success(`${ownedPet.nickname || ownedPet.species} is now equipped for ${activeProfile.name}.`);
  };

  return {
    loaded,
    petDbLoaded,
    totalCatalogSpeciesCount: petDb.length,
    ownedSpeciesCount,
    activeProfile,
    ownedPets,
    activeOwnedPet,
    visiblePets,
    paginatedPets,
    missingCatalogPets,
    paginatedMissingPets,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    petMatchLookup,
    activePetKey,
    importedCount,
    manualCount,
    activeCount,
    unmatchedSpeciesCount,
    importSource,
    missingOrPrivate,
    hasImportedPetSection,
    query,
    setQuery,
    sourceFilter,
    setSourceFilter,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    isCompactViewport,
    activeControlCount,
    controlsModified,
    sourceFilterLabel,
    sortLabel,
    selectedCompareIds,
    toggleCompareSelection,
    clearCompareSelection,
    compareSelectionHref,
    detailPet,
    setDetailPetId,
    getCatalogSummary,
    resetControls,
    addCurrentPet,
    removePet,
    handleUseAsActivePet,
  };
}
