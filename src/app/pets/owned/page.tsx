"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownUp, ArrowRight, BadgeCheck, Clock3, Database, PawPrint, Plus, Search, Shield, Trash2 } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { type CharacterProfile, type ProfileOwnedPet, type ProfilePetStats, useProfiles } from "@/lib/profiles";
import { buildPetMatchLookup, findPetRecordForOwnedPet, type PetRecord } from "@/lib/pets";
import styles from "./page.module.css";

const PET_STAT_LABELS: Array<[keyof ProfilePetStats, string]> = [
  ["agility", "Agi"],
  ["accuracy", "Acc"],
  ["protection", "Prot"],
  ["attackPower", "AP"],
  ["movementSpeed", "Move"],
  ["maxHealth", "HP"],
  ["maxStamina", "Stam"],
  ["criticalDamage", "CDmg"],
  ["criticalChance", "Crit"],
];

const SOURCE_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "imported", label: "Imported" },
  { id: "manual", label: "Manual" },
] as const;

const SORT_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "level", label: "Level" },
  { id: "quality", label: "Quality" },
  { id: "source", label: "Source" },
] as const;

type SourceFilter = typeof SOURCE_FILTERS[number]["id"];
type SortKey = typeof SORT_OPTIONS[number]["id"];
type SortDirection = "asc" | "desc";
type PendingRemoval = {
  pet: ProfileOwnedPet;
  index: number;
};

const FRIENDLY_SECTION_LABELS: Record<string, string> = {
  museum_private: "Museum private",
  pets_private: "Pets private",
  pet_private: "Pets private",
  pets_missing: "No imported pet section",
  pet_missing: "No imported pet section",
};

function makeOwnedPetId() {
  return `owned_pet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function activePetToOwnedPet(profile: CharacterProfile): ProfileOwnedPet | null {
  if (!profile.pet.species.trim()) return null;
  return {
    id: makeOwnedPetId(),
    species: profile.pet.species.trim(),
    nickname: "",
    quality: profile.pet.quality || "",
    level: profile.pet.level || 1,
    experience: "",
    totalExperience: "",
    evolution: profile.pet.evolution || 0,
    evolutionTargets: [],
    active: true,
    equipped: true,
    source: "manual",
    stats: { ...profile.pet.stats },
    notes: profile.pet.notes || "",
  };
}

function petKey(pet: Pick<ProfileOwnedPet, "species" | "level" | "evolution">) {
  return `${pet.species.toLowerCase()}::${pet.level || ""}::${pet.evolution || ""}`;
}

function formatValue(value: number | "") {
  if (value === "") return "-";
  return Number(value).toLocaleString();
}

function formatOptionalNumber(value: number | "" | undefined) {
  if (value === "" || typeof value === "undefined") return "None";
  return Number(value).toLocaleString();
}

function formatDateTime(value?: string) {
  if (!value) return "Not imported";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatOptionalDateTime(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatSourceMode(value?: string) {
  if (value === "imported") return "Imported";
  if (value === "mixed") return "Mixed";
  return "Manual";
}

function formatSectionLabel(value: string) {
  const normalized = normalizeText(value).replace(/[\s-]+/g, "_");
  if (FRIENDLY_SECTION_LABELS[normalized]) return FRIENDLY_SECTION_LABELS[normalized];
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSectionList(values?: string[]) {
  if (!values?.length) return "None";
  const labels = values.map(formatSectionLabel);
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 3).join(", ")} +${labels.length - 3}`;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function missingStatCount(stats: ProfilePetStats) {
  return PET_STAT_LABELS.filter(([key]) => stats[key] === "").length;
}

export default function OwnedPetsPage() {
  const { activeProfile, updateProfile } = useProfiles();
  const [petDb, setPetDb] = useState<PetRecord[]>([]);
  const [toast, setToast] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const ownedPets = useMemo(() => activeProfile?.ownedPets || [], [activeProfile?.ownedPets]);

  useEffect(() => {
    if (!ownedPets.length) {
      setPetDb([]);
      return;
    }
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => response.ok ? response.json() : null)
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
        ownedPets: ownedPets.map((pet) => ({ ...pet, active: pet.id === ownedPet.id })),
      },
      { source: "manual", fieldPaths: ["pet", "ownedPets"] },
    );
    setToast(`${ownedPet.nickname || ownedPet.species} is now the active pet for ${activeProfile.name}.`);
  };

  return (
    <main className={`container ${styles.page}`}>
      <section className={styles.header}>
        <div>
          <span className={styles.kicker}><ZenithIcon name="pets" size={17} /> Profile Pets</span>
          <h1>Owned Pets</h1>
          <p>Saved pets belong to the active local profile and stay in browser storage until imported, added, used, or removed.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/profiles#profile-pet" className={styles.secondaryAction}>Profile pet <ArrowRight size={16} /></Link>
          <button type="button" className={styles.primaryAction} onClick={addCurrentPet}>
            <Plus size={16} /> Add active pet
          </button>
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="Owned pet summary">
        <div><Database size={17} /><span>Total saved</span><strong>{ownedPets.length}</strong></div>
        <div><PawPrint size={17} /><span>Active/equipped</span><strong>{activeCount}</strong></div>
        <div><BadgeCheck size={17} /><span>Manual</span><strong>{manualCount}</strong></div>
        <div><Shield size={17} /><span>Imported</span><strong>{importedCount}</strong></div>
      </section>

      {activeProfile && (
        <section className={styles.importReadiness} aria-label="Owned pet import readiness">
          <div>
            <Shield size={16} />
            <span>Profile source</span>
            <strong>{formatSourceMode(importSource?.mode)}</strong>
          </div>
          <div>
            <Clock3 size={16} />
            <span>Last import</span>
            <strong>{formatDateTime(importSource?.importedAt || importSource?.refreshedAt)}</strong>
          </div>
          <div>
            <Database size={16} />
            <span>Pet section</span>
            <strong>{hasImportedPetSection ? "Imported" : "Not imported"}</strong>
          </div>
          <div className={missingOrPrivate.length ? styles.warningCell : ""}>
            <AlertTriangle size={16} />
            <span>Missing/private</span>
            <strong>{formatSectionList(missingOrPrivate)}</strong>
          </div>
          <div className={unmatchedSpeciesCount ? styles.warningCell : ""}>
            <PawPrint size={16} />
            <span>Database links</span>
            <strong>{unmatchedSpeciesCount ? `${unmatchedSpeciesCount} not linked yet` : "All linked"}</strong>
          </div>
        </section>
      )}

      {activeProfile && ownedPets.length > 0 && (
        <section className={styles.controls} aria-label="Owned pet filters">
          <label className={styles.searchBox} htmlFor="owned-pet-search">
            <span>Search</span>
            <div>
              <Search size={16} />
              <input
                id="owned-pet-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Species, nickname, quality, source..."
                autoComplete="off"
              />
            </div>
          </label>

          <div className={styles.segment} aria-label="Source filter">
            {SOURCE_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={sourceFilter === option.id ? styles.activeControl : ""}
                aria-pressed={sourceFilter === option.id}
                onClick={() => setSourceFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={styles.segment} aria-label="Sort controls">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={sortKey === option.id ? styles.activeControl : ""}
                aria-pressed={sortKey === option.id}
                onClick={() => setSortKey(option.id)}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              className={styles.directionButton}
              aria-label={`Change sort direction, currently ${sortDirection === "asc" ? "ascending" : "descending"}`}
              onClick={() => setSortDirection((current) => current === "asc" ? "desc" : "asc")}
            >
              <ArrowDownUp size={15} /> {sortDirection === "asc" ? "Asc" : "Desc"}
            </button>
          </div>
        </section>
      )}

      {!activeProfile && (
        <section className={styles.empty}>
          <PawPrint size={40} />
          <h2>No active profile.</h2>
          <p>Create or select a profile before saving owned pets.</p>
        </section>
      )}

      {activeProfile && !ownedPets.length && (
        <section className={styles.empty}>
          <PawPrint size={40} />
          <h2>No owned pets saved.</h2>
          <p>Select a pet in Profiles, set its level/evolution, then add it here as a local snapshot.</p>
        </section>
      )}

      {activeProfile && ownedPets.length > 0 && (
        <section className={styles.resultHeader} aria-live="polite">
          <span>{visiblePets.length} shown</span>
          <strong>{sourceFilter === "all" ? "All saved pets" : SOURCE_FILTERS.find((option) => option.id === sourceFilter)?.label}</strong>
        </section>
      )}

      {activeProfile && ownedPets.length > 0 && visiblePets.length > 0 && (
        <section className={styles.grid} aria-label={`${activeProfile.name} owned pets`}>
          {visiblePets.map((ownedPet) => {
            const databasePet = findPetRecordForOwnedPet(ownedPet, petMatchLookup);
            const isActive = petKey(ownedPet) === activePetKey || ownedPet.active || ownedPet.equipped;
            const missingStats = missingStatCount(ownedPet.stats);
            const displayName = ownedPet.nickname || ownedPet.species;
            return (
              <article key={ownedPet.id} className={`${styles.card} ${isActive ? styles.activeCard : ""}`}>
                <div className={styles.cardTop}>
                  <div className={styles.petImage}>
                    {ownedPet.imageUrl || databasePet?.imageUrl ? <img src={ownedPet.imageUrl || databasePet?.imageUrl || ""} alt="" /> : <PawPrint size={24} />}
                  </div>
                  <div>
                    <h2>{displayName}</h2>
                    <p>{ownedPet.quality || databasePet?.quality || "Unknown quality"} - Lv. {ownedPet.level || 1} - Evo {ownedPet.evolution || 0}</p>
                  </div>
                  {isActive && <span className={styles.activePill}>Active</span>}
                </div>
                <div className={styles.statGrid}>
                  {PET_STAT_LABELS.slice(0, 6).map(([key, label]) => (
                    <span key={key}>{label}<strong>{formatValue(ownedPet.stats[key])}</strong></span>
                  ))}
                </div>
                <div className={styles.metaRow}>
                  <span className={ownedPet.source === "imported" ? styles.importedMeta : styles.manualMeta}>{formatSourceMode(ownedPet.source)}</span>
                  <span>{ownedPet.location?.name || databasePet?.acquisition?.[0]?.boss || "Source unknown"}</span>
                  {!databasePet && <span className={styles.warningMeta}>No database match</span>}
                  {missingStats > 0 && <span className={styles.warningMeta}>{missingStats} missing stats</span>}
                  {ownedPet.totalExperience !== "" && <span>{Number(ownedPet.totalExperience).toLocaleString()} pet XP</span>}
                </div>
                <details className={styles.detailPanel}>
                  <summary aria-label={`View details for ${displayName}`}>Details for {displayName}</summary>
                  <div className={styles.detailGrid}>
                    <div>
                      <strong>All Stats</strong>
                      <div className={styles.fullStatGrid}>
                        {PET_STAT_LABELS.map(([key, label]) => (
                          <span key={key}>{label}<b>{formatValue(ownedPet.stats[key])}</b></span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <strong>Evolution</strong>
                      <span>State <b>{formatOptionalNumber(ownedPet.evolution)}</b></span>
                      <span>Max <b>{formatOptionalNumber(ownedPet.evolutionMax)}</b></span>
                      <span>Next bonus <b>{formatOptionalNumber(ownedPet.evolutionNextBonus)}</b></span>
                      <span>Can evolve <b>{ownedPet.evolutionCanEvolve ? "Yes" : "No"}</b></span>
                    </div>
                    <div>
                      <strong>Import Source</strong>
                      <span>Source <b>{formatSourceMode(ownedPet.source)}</b></span>
                      <span>Imported <b>{formatDateTime(ownedPet.importedAt)}</b></span>
                      <span>Hash <b>{ownedPet.hashTail ? `...${ownedPet.hashTail}` : "None"}</b></span>
                      <span>API ID <b>{ownedPet.apiId ? String(ownedPet.apiId) : "None"}</b></span>
                    </div>
                    <div>
                      <strong>State</strong>
                      <span>Equipped <b>{ownedPet.equipped ? "Yes" : "No"}</b></span>
                      <span>Location <b>{ownedPet.location?.name || "Unknown"}</b></span>
                      <span>Health <b>{ownedPet.health ? `${formatOptionalNumber(ownedPet.health.current)} / ${formatOptionalNumber(ownedPet.health.maximum)}` : "Unknown"}</b></span>
                      <span>Battle ends <b>{formatOptionalDateTime(ownedPet.battle?.endsAt)}</b></span>
                    </div>
                  </div>
                  {ownedPet.evolutionTargets.length > 0 && (
                    <div className={styles.targetRow}>
                      <strong>Evolution targets</strong>
                      <span>{ownedPet.evolutionTargets.map((target) => target.label || target.key).join(" / ")}</span>
                    </div>
                  )}
                </details>
                {ownedPet.notes && <p className={styles.notes}>{ownedPet.notes}</p>}
                <div className={styles.cardActions}>
                  <button type="button" aria-label={`Set ${displayName} as active pet`} onClick={() => handleUseAsActivePet(ownedPet)}>Set active pet</button>
                  <button type="button" aria-label={`Remove ${displayName} from owned pets`} onClick={() => removePet(ownedPet)}><Trash2 size={15} /> Remove</button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {activeProfile && ownedPets.length > 0 && !visiblePets.length && (
        <section className={styles.empty}>
          <Search size={40} />
          <h2>No owned pets match.</h2>
          <p>Adjust the search text or filter selection.</p>
        </section>
      )}

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          <span>{toast}</span>
          {pendingRemoval ? (
            <button type="button" onClick={undoRemovePet}>
              Undo
            </button>
          ) : null}
        </div>
      )}
    </main>
  );
}
