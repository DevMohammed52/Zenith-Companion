"use client";

import { useEffect, useMemo, useState } from "react";
import { type ProfileOwnedPet, useProfiles } from "@/lib/profiles";
import { buildPetMatchLookup, findPetRecordForOwnedPet, type PetRecord } from "@/lib/pets";
import {
  SORT_OPTIONS,
  SOURCE_FILTERS,
  type PendingRemoval,
  type SortDirection,
  type SortKey,
  type SourceFilter,
} from "../types";
import {
  activePetToOwnedPet,
  normalizeText,
  petKey,
} from "../utils/owned-pet-helpers";

export function useOwnedPetsState() {
  const { activeProfile, updateProfile } = useProfiles();
  const [petDb, setPetDb] = useState<PetRecord[]>([]);
  const [toast, setToast] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const ownedPets = useMemo(() => activeProfile?.ownedPets || [], [activeProfile?.ownedPets]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!ownedPets.length) {
      setPetDb([]);
      return;
    }
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setPetDb(Array.isArray(data?.pets) ? data.pets : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ownedPets.length]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => {
      setToast("");
      setPendingRemoval(null);
    }, 5200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const petMatchLookup = useMemo(() => buildPetMatchLookup(petDb), [petDb]);

  const activePetKey = activeProfile ? petKey(activeProfile.pet) : "";
  const importedCount = ownedPets.filter((pet) => pet.source === "imported").length;
  const manualCount = ownedPets.filter((pet) => pet.source === "manual").length;
  const activeCount = ownedPets.filter((pet) => petKey(pet) === activePetKey || pet.active || pet.equipped).length;
  const unmatchedSpeciesCount = ownedPets.filter((pet) => !findPetRecordForOwnedPet(pet, petMatchLookup)).length;
  const importSource = activeProfile?.importSource;
  const importedSections = importSource?.importedSections || [];
  const missingOrPrivate = importSource?.missingOrPrivate || [];
  const hasImportedPetSection = importedSections.some((section) => normalizeText(section).includes("pet"));

  const visiblePets = useMemo(() => {
    const normalizedQuery = normalizeText(query);
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
      if (sortKey === "quality") return (a.quality || "").localeCompare(b.quality || "", undefined, { sensitivity: "base" });
      if (sortKey === "source") return a.source.localeCompare(b.source, undefined, { sensitivity: "base" });
      return (a.nickname || a.species).localeCompare(b.nickname || b.species, undefined, { sensitivity: "base", numeric: true });
    });

    return sortDirection === "desc" ? filtered.reverse() : filtered;
  }, [activePetKey, ownedPets, query, sortDirection, sortKey, sourceFilter]);

  const activeControlCount = [
    query.trim() !== "",
    sourceFilter !== "all",
    sortKey !== "level",
    sortDirection !== "desc",
  ].filter(Boolean).length;
  const controlsModified = activeControlCount > 0;
  const sourceFilterLabel = SOURCE_FILTERS.find((option) => option.id === sourceFilter)?.label || "All";
  const sortLabel = SORT_OPTIONS.find((option) => option.id === sortKey)?.label || "Level";

  const resetControls = () => {
    setQuery("");
    setSourceFilter("all");
    setSortKey("level");
    setSortDirection("desc");
  };

  const updateOwnedPets = (nextPets: ProfileOwnedPet[], message: string) => {
    if (!activeProfile) return;
    updateProfile(activeProfile.id, { ownedPets: nextPets }, { source: "manual", fieldPaths: ["ownedPets"] });
    setToast(message);
  };

  const addCurrentPet = () => {
    if (!activeProfile) return;
    const ownedPet = activePetToOwnedPet(activeProfile);
    if (!ownedPet) {
      setToast("Select a pet on the profile page first.");
      return;
    }
    const duplicate = ownedPets.some((pet) => petKey(pet) === petKey(ownedPet));
    if (duplicate) {
      setToast("That pet setup is already saved.");
      return;
    }
    updateOwnedPets([...ownedPets, ownedPet], "Current profile pet saved.");
  };

  const removePet = (ownedPet: ProfileOwnedPet) => {
    const index = ownedPets.findIndex((pet) => pet.id === ownedPet.id);
    if (index < 0) return;
    setPendingRemoval({ pet: ownedPet, index });
    updateOwnedPets(ownedPets.filter((pet) => pet.id !== ownedPet.id), `${ownedPet.nickname || ownedPet.species} removed.`);
  };

  const undoRemovePet = () => {
    if (!activeProfile || !pendingRemoval) return;
    const nextPets = [...ownedPets];
    nextPets.splice(Math.min(pendingRemoval.index, nextPets.length), 0, pendingRemoval.pet);
    updateProfile(activeProfile.id, { ownedPets: nextPets }, { source: "manual", fieldPaths: ["ownedPets"] });
    setToast(`${pendingRemoval.pet.nickname || pendingRemoval.pet.species} restored.`);
    setPendingRemoval(null);
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
    setToast(`${ownedPet.nickname || ownedPet.species} is now the active pet for ${activeProfile.name}.`);
  };

  return {
    activeProfile,
    ownedPets,
    visiblePets,
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
    toast,
    pendingRemoval,
    resetControls,
    addCurrentPet,
    removePet,
    undoRemovePet,
    handleUseAsActivePet,
  };
}
