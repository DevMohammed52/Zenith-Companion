"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultProfile,
  MAX_PROFILES,
  useProfiles,
  type CharacterProfile,
  type CombatStyle,
  type ProfileFieldSource,
  type ProfileOwnedPet,
  type ProfileSkillSnapshot,
  type ProfileUpdateOptions,
  type ProfilesState,
} from "@/lib/profiles";
import { useData } from "@/context/DataContext";
import {
  calculatePetStats,
  calculateProfileSecondaryStats,
  barteringBuffPercent,
  dailyStreakMagicFind,
  getClassInfo,
  getPetMasteryStatBonus,
  sortProfileItems,
  type ClassInfo,
  type PetDatabaseRecord,
  type PetMasteryLevelRecord,
  type ProfileItemRecord,
} from "@/lib/profile-calculations";
import {
  calculateHousingBuffs,
  canUseHousingGuestAccess,
  type HousingBuffSummary,
} from "@/lib/housing";
import {
  getLastProfileBackupAt,
  markProfileBackupCopied,
  PROFILE_BACKUP_DUE_MS,
} from "@/lib/local-backup";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { PROFILE_BACKUP_HASH, PROFILE_SECTION_IDS, type ProfileSectionId } from "../types";
import { SECONDARY_FIELDS } from "../components/ProfileCombatSection";
import { PET_STAT_FIELDS, type PetPickerValue } from "../components/ProfilePetSection";
import { CHARACTER_HASH_PATTERN } from "./useLiveProfileImport";

export function currentUtcResetDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetweenUtcDates(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return Math.floor((to - from) / 86_400_000);
}

export function updateMagicFindFromStreak(
  magicFind: CharacterProfile["magicFind"],
  nextDailyStreak: number | "",
) {
  const previousBonus = dailyStreakMagicFind(magicFind.dailyStreak);
  const nextBonus = dailyStreakMagicFind(nextDailyStreak);
  const syncValue = (current: number | "") => {
    const numeric = Number(current || 0);
    if (numeric === previousBonus || numeric < nextBonus) return nextBonus;
    return current;
  };

  return {
    ...magicFind,
    dailyStreak: nextDailyStreak,
    dailyStreakLastAutoDate: currentUtcResetDate(),
    combat: syncValue(magicFind.combat),
    dungeon: syncValue(magicFind.dungeon),
    worldBoss: syncValue(magicFind.worldBoss),
  };
}

export function profilePetSnapshotKey(pet: Pick<CharacterProfile["pet"], "species" | "level" | "evolution">): string {
  return `${pet.species.toLowerCase()}::${pet.level || ""}::${pet.evolution || ""}`;
}

export interface UseProfileStateReturn {
  // Profiles context
  state: ProfilesState;
  profile: CharacterProfile | null;
  loaded: boolean;
  addProfile: (name?: string) => CharacterProfile | null;
  duplicateProfile: (profileId: string) => CharacterProfile | null;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;
  updateProfile: (profileId: string, patch: Partial<CharacterProfile>, options?: ProfileUpdateOptions) => void;
  replaceState: (state: ProfilesState) => void;
  exportProfiles: () => string;
  importProfiles: (payload: string) => { ok: boolean; error?: string };

  // Section Navigation
  activeProfileSection: ProfileSectionId;
  setActiveProfileSection: (section: ProfileSectionId) => void;
  openProfileSection: (section: ProfileSectionId) => void;

  // UI State & Feedback
  toast: string;
  setToast: (toast: string) => void;
  openPicker: string | null;
  setOpenPicker: (id: string | null) => void;
  confirmAction: "restore" | "delete" | null;
  setConfirmAction: (action: "restore" | "delete" | null) => void;
  confirmDetails: {
    title: string;
    body: string;
    action: string;
    onConfirm: () => void;
  } | null;
  confirmDialogRef: React.RefObject<HTMLDivElement | null>;
  confirmCancelRef: React.RefObject<HTMLButtonElement | null>;

  // Backup & Storage
  transferText: string;
  setTransferText: (text: string) => void;
  lastBackupAt: number;
  backupDue: boolean;
  handleExport: () => Promise<void>;
  handleCopyValue: (label: string, value: string) => Promise<void>;
  handleImport: () => void;
  confirmImportProfiles: () => void;
  handleDeleteProfile: () => void;
  confirmDeleteProfile: () => void;

  // External Databases & Derived Computations
  petDb: { pets: PetDatabaseRecord[]; mastery?: { levels?: PetMasteryLevelRecord[] } } | null;
  allItemsDb: Record<string, ProfileItemRecord> | null;
  itemByName: Record<string, ProfileItemRecord>;
  itemOptionsByType: Record<string, ProfileItemRecord[]>;
  pets: PetDatabaseRecord[];
  selectedPet: PetDatabaseRecord | undefined;
  petByName: Map<string, PetDatabaseRecord>;
  selectedOwnedPet: ProfileOwnedPet | null;
  classInfo: ClassInfo;
  dailyBonus: number;
  barteringPercent: number;
  petMasteryBonus: number;
  calculatedSecondary: Record<string, number> | null;
  combatStatTotal: number;
  housingSummary: HousingBuffSummary;
  canUseGuestHousing: boolean;

  // Mutation Handlers
  patchActive: (patch: Partial<CharacterProfile>, options?: ProfileUpdateOptions) => void;
  fieldSource: (path: string) => ProfileFieldSource | undefined;
  updateNested: <Section extends keyof CharacterProfile, Key extends keyof CharacterProfile[Section]>(
    section: Section,
    key: Key,
    value: CharacterProfile[Section][Key],
  ) => void;
  getSkillInputLevel: (skillKey: string) => number | "";
  updateSkillLevel: (skillKey: string, levelValue: number | "") => void;
  updateDailyStreak: (value: number | "") => void;
  selectPet: (selection: PetPickerValue | null) => void;
  updatePetFormula: (patch: Partial<CharacterProfile["pet"]>) => void;
  updateCombatStyle: (combatStyle: CombatStyle) => void;
  profileHashDraft: string;
  setProfileHashDraft: (hash: string) => void;
  handleCreateProfileFromHash: () => void;
}

export function useProfileState(): UseProfileStateReturn {
  const {
    state,
    activeProfile,
    loaded,
    addProfile,
    duplicateProfile,
    deleteProfile,
    setActiveProfile,
    updateProfile,
    replaceState,
    exportProfiles,
    importProfiles,
  } = useProfiles();

  const [transferText, setTransferText] = useState("");
  const [profileHashDraft, setProfileHashDraft] = useState("");
  const [toast, setToast] = useState("");
  const [lastBackupAt, setLastBackupAt] = useState(0);
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"restore" | "delete" | null>(null);
  const [activeProfileSection, setActiveProfileSection] = useState<ProfileSectionId>("identity");
  const [petDb, setPetDb] = useState<{ pets: PetDatabaseRecord[]; mastery?: { levels?: PetMasteryLevelRecord[] } } | null>(null);

  const confirmCancelRef = useRef<HTMLButtonElement | null>(null);
  const lastAutoStatKey = useRef("");
  const lastPetStatKey = useRef("");

  const profile = activeProfile;
  const backupDue = state.profiles.length > 0 && (!lastBackupAt || Date.now() - lastBackupAt > PROFILE_BACKUP_DUE_MS);
  const needsItemData = activeProfileSection === "gear";
  const needsPetData = activeProfileSection === "pet" || activeProfileSection === "levels";
  const { allItemsDb } = useData({ autoLoad: needsItemData });

  const housingSummary = useMemo(
    () => calculateHousingBuffs(profile?.housing, { profileClassName: profile?.className }),
    [profile?.className, profile?.housing],
  );
  const canUseGuestHousing = canUseHousingGuestAccess(profile?.className);

  useEffect(() => {
    if (!needsPetData || petDb) return;
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled) setPetDb(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [needsPetData, petDb]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    setLastBackupAt(getLastProfileBackupAt());
  }, []);

  useEffect(() => {
    const syncSectionFromHash = () => {
      if (window.location.hash === PROFILE_BACKUP_HASH) {
        setActiveProfileSection("transfer");
        return;
      }
      const section = window.location.hash.replace(/^#profile-/, "") as ProfileSectionId;
      if (PROFILE_SECTION_IDS.has(section)) setActiveProfileSection(section);
    };
    syncSectionFromHash();
    window.addEventListener("hashchange", syncSectionFromHash);
    return () => window.removeEventListener("hashchange", syncSectionFromHash);
  }, []);

  useEffect(() => {
    if (activeProfileSection !== "transfer" || window.location.hash !== PROFILE_BACKUP_HASH) return;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById("profile-backup");
      if (!(target instanceof HTMLDetailsElement)) return;
      target.open = true;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stickyOffset = window.matchMedia("(max-width: 1180px)").matches ? 92 : 24;
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - stickyOffset);
      target.focus({ preventScroll: true });
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeProfileSection]);

  const openProfileSection = useCallback((section: ProfileSectionId) => {
    setActiveProfileSection(section);
    setOpenPicker(null);
    const nextHash = `#profile-${section}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
    window.requestAnimationFrame(() => {
      const target = document.getElementById(`profile-${section}`);
      if (!target) return;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stickyOffset = window.matchMedia("(max-width: 1180px)").matches ? 92 : 24;
      const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - stickyOffset);
      target.focus({ preventScroll: true });
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }, []);

  const itemOptionsByType = useMemo(() => {
    const grouped: Record<string, ProfileItemRecord[]> = {};
    Object.values((allItemsDb || {}) as Record<string, ProfileItemRecord>).forEach((item) => {
      if (!item?.name || !item?.type) return;
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push(item);
    });
    Object.keys(grouped).forEach((type) => {
      grouped[type] = sortProfileItems(grouped[type]);
    });
    return grouped;
  }, [allItemsDb]);

  const itemByName = useMemo(() => (allItemsDb || {}) as Record<string, ProfileItemRecord>, [allItemsDb]);

  const pets = useMemo(() => [...(petDb?.pets || [])].sort((a, b) => {
    const rarityOrder = ["UNKNOWN", "STANDARD", "REFINED", "PREMIUM", "EPIC", "LEGENDARY", "MYTHIC", "UNIQUE"];
    const qualityDelta = rarityOrder.indexOf(String(b.quality || "UNKNOWN")) - rarityOrder.indexOf(String(a.quality || "UNKNOWN"));
    if (qualityDelta !== 0) return qualityDelta;
    return a.name.localeCompare(b.name);
  }), [petDb]);

  const selectedPet = useMemo(() => pets.find((pet) => pet.name === profile?.pet.species), [pets, profile?.pet.species]);
  const petByName = useMemo(() => new Map(pets.map((pet) => [pet.name, pet])), [pets]);
  const selectedOwnedPet = useMemo(() => {
    if (!profile?.ownedPets.length) return null;
    const active = profile.ownedPets.find((pet) => pet.active || pet.equipped);
    if (active) return active;
    const activeKey = profilePetSnapshotKey(profile.pet);
    return profile.ownedPets.find((pet) => profilePetSnapshotKey(pet) === activeKey) || null;
  }, [profile]);

  const classInfo = getClassInfo(profile?.className || "Other");
  const dailyBonus = dailyStreakMagicFind(profile?.magicFind.dailyStreak ?? 0);
  const barteringPercent = barteringBuffPercent(profile?.boosts.barteringLevel ?? 0);
  const petMasteryBonus = getPetMasteryStatBonus(petDb?.mastery?.levels, profile?.levels.petMastery ?? 1);

  const calculatedSecondary = useMemo(() => (
    profile ? calculateProfileSecondaryStats(profile, itemByName) : null
  ), [itemByName, profile]);

  const autoStatKey = useMemo(() => {
    if (!profile) return "";
    return JSON.stringify({
      className: profile.className,
      levels: profile.levels,
      gear: profile.gear,
      gearTiers: profile.gearTiers,
      petStats: profile.pet.stats,
    });
  }, [profile]);

  const combatStatTotal = calculatedSecondary
    ? calculatedSecondary.attackPower + calculatedSecondary.protection + calculatedSecondary.agility + calculatedSecondary.accuracy
    : 0;

  const patchActive = useCallback((patch: Partial<CharacterProfile>, options?: ProfileUpdateOptions) => {
    if (!profile) return;
    updateProfile(profile.id, patch, options);
  }, [profile, updateProfile]);

  const fieldSource = useCallback((path: string) => profile?.fieldSources?.[path], [profile?.fieldSources]);

  const updateNested = useCallback(<Section extends keyof CharacterProfile, Key extends keyof CharacterProfile[Section]>(
    section: Section,
    key: Key,
    value: CharacterProfile[Section][Key],
  ) => {
    if (!profile) return;
    const sectionValue = profile[section];
    if (!sectionValue || typeof sectionValue !== "object") return;
    patchActive({
      [section]: {
        ...(sectionValue as object),
        [key]: value,
      },
    } as Partial<CharacterProfile>);
  }, [patchActive, profile]);

  const getSkillInputLevel = useCallback((skillKey: string): number | "" => {
    if (!profile?.skills) return "";
    const entry =
      profile.skills[skillKey] ??
      profile.skills[skillKey.replace(/-/g, "_")] ??
      profile.skills[skillKey.replace(/_/g, "-")];
    return typeof entry?.level === "number" || entry?.level === "" ? entry.level : "";
  }, [profile?.skills]);

  const updateSkillLevel = useCallback((skillKey: string, levelValue: number | "") => {
    if (!profile) return;
    const currentSkills = profile.skills || {};
    const existing =
      currentSkills[skillKey] ??
      currentSkills[skillKey.replace(/-/g, "_")] ??
      currentSkills[skillKey.replace(/_/g, "-")];
    const nextEntry: ProfileSkillSnapshot = {
      level: levelValue,
      experience: existing?.experience ?? "",
    };
    patchActive(
      {
        skills: {
          ...currentSkills,
          [skillKey]: nextEntry,
        },
      },
      {
        source: "manual",
        fieldPaths: [`skills.${skillKey}`],
      },
    );
  }, [patchActive, profile]);

  useEffect(() => {
    if (!profile || !calculatedSecondary || !autoStatKey || !Object.keys(itemByName).length) return;
    if (lastAutoStatKey.current === autoStatKey) return;
    lastAutoStatKey.current = autoStatKey;
    const current = profile.secondaryStats;
    const changed = SECONDARY_FIELDS.some(([key]) => Number(current[key] || 0) !== Number(calculatedSecondary[key] || 0));
    if (changed) {
      patchActive(
        { secondaryStats: calculatedSecondary },
        { source: "calculated", fieldPaths: SECONDARY_FIELDS.map(([key]) => `secondaryStats.${key}`) },
      );
    }
  }, [autoStatKey, calculatedSecondary, itemByName, patchActive, profile]);

  useEffect(() => {
    if (!profile || !selectedPet) return;
    const petStatKey = JSON.stringify({
      species: selectedPet.name,
      level: profile.pet.level || 1,
      evolution: profile.pet.evolution || 0,
      petMasteryBonus,
    });
    if (lastPetStatKey.current === petStatKey) return;
    lastPetStatKey.current = petStatKey;
    const nextStats = calculatePetStats(selectedPet, profile.pet.level || 1, profile.pet.evolution || 0, petMasteryBonus);
    const changed = PET_STAT_FIELDS.some(([key]) => Number(profile.pet.stats[key] || 0) !== Number(nextStats[key] || 0));
    if (!changed) return;
    patchActive(
      { pet: { ...profile.pet, stats: nextStats } },
      { source: "calculated", fieldPaths: PET_STAT_FIELDS.map(([key]) => `pet.stats.${key}`) },
    );
  }, [patchActive, petMasteryBonus, profile, selectedPet]);

  useEffect(() => {
    if (!profile) return;
    const today = currentUtcResetDate();
    const lastAutoDate = profile.magicFind.dailyStreakLastAutoDate;
    if (!lastAutoDate) {
      patchActive({ magicFind: { ...profile.magicFind, dailyStreakLastAutoDate: today } });
      return;
    }
    const elapsedDays = daysBetweenUtcDates(lastAutoDate, today);
    if (elapsedDays <= 0 || profile.magicFind.dailyStreak === "") return;
    const nextDailyStreak = Math.max(0, Number(profile.magicFind.dailyStreak || 0) + elapsedDays);
    patchActive({ magicFind: updateMagicFindFromStreak(profile.magicFind, nextDailyStreak) });
  }, [patchActive, profile]);

  const updateDailyStreak = useCallback((value: number | "") => {
    if (!profile) return;
    patchActive({ magicFind: updateMagicFindFromStreak(profile.magicFind, value) });
  }, [patchActive, profile]);

  const selectPet = useCallback((selection: PetPickerValue | null) => {
    if (!profile) return;
    if (!selection) {
      patchActive({
        pet: {
          ...profile.pet,
          species: "",
          quality: "",
          level: 1,
          evolution: 0,
          notes: "",
          stats: {
            agility: "",
            accuracy: "",
            protection: "",
            attackPower: "",
            movementSpeed: "",
            maxHealth: "",
            maxStamina: "",
            criticalDamage: "",
            criticalChance: "",
          },
        },
        ownedPets: profile.ownedPets.map((pet) => ({ ...pet, active: false, equipped: false })),
      });
      return;
    }

    if (selection.kind === "owned") {
      const ownedPet = selection.pet;
      const nextPet = {
        ...profile.pet,
        species: ownedPet.species,
        quality: ownedPet.quality || "",
        level: ownedPet.level || 1,
        evolution: ownedPet.evolution || 0,
        stats: { ...ownedPet.stats },
        notes: ownedPet.notes || `${ownedPet.nickname || ownedPet.species} owned snapshot`,
      };
      lastPetStatKey.current = JSON.stringify({
        species: ownedPet.species,
        level: nextPet.level,
        evolution: nextPet.evolution,
        petMasteryBonus,
      });
      patchActive(
        {
          pet: nextPet,
          ownedPets: profile.ownedPets.map((pet) => ({
            ...pet,
            active: pet.id === ownedPet.id,
            equipped: pet.id === ownedPet.id,
          })),
        },
        { source: ownedPet.source === "imported" ? "imported" : "manual", fieldPaths: ["pet", "ownedPets"] },
      );
      return;
    }

    const pet = selection.pet;
    const stats = calculatePetStats(pet, profile.pet.level || 1, profile.pet.evolution || 0, petMasteryBonus);
    patchActive({
      pet: {
        ...profile.pet,
        species: pet.name,
        quality: pet.quality || "",
        stats,
        notes: `${pet.name}${pet.acquisition?.[0]?.boss ? ` from ${pet.acquisition[0].boss}` : ""}`,
      },
      ownedPets: profile.ownedPets.map((ownedPet) => ({ ...ownedPet, active: false, equipped: false })),
    });
  }, [patchActive, petMasteryBonus, profile]);

  const updatePetFormula = useCallback((patch: Partial<CharacterProfile["pet"]>) => {
    if (!profile) return;
    const nextPet = { ...profile.pet, ...patch };
    const stats = selectedPet ? calculatePetStats(selectedPet, nextPet.level, nextPet.evolution, petMasteryBonus) : nextPet.stats;
    patchActive({ pet: { ...nextPet, stats } });
  }, [patchActive, petMasteryBonus, profile, selectedPet]);

  const handleExport = useCallback(async () => {
    const payload = exportProfiles();
    setTransferText(payload);
    markProfileBackupCopied();
    setLastBackupAt(getLastProfileBackupAt());
    try {
      await navigator.clipboard?.writeText(payload);
      setToast("Profile export copied to clipboard.");
    } catch {
      setToast("Profile export generated below.");
    }
  }, [exportProfiles]);

  const handleCopyValue = useCallback(async (label: string, value: string) => {
    const text = value.trim();
    if (!text) {
      setToast(`${label} is empty.`);
      return;
    }
    try {
      await navigator.clipboard?.writeText(text);
      setToast(`${label} copied.`);
    } catch {
      setToast(`${label}: ${text}`);
    }
  }, []);

  const handleImport = useCallback(() => {
    if (!transferText.trim()) {
      setToast("Paste a profile export before importing.");
      return;
    }
    setConfirmAction("restore");
  }, [transferText]);

  const confirmImportProfiles = useCallback(() => {
    const result = importProfiles(transferText);
    setConfirmAction(null);
    setToast(result.ok ? "Profiles imported into this browser." : result.error || "Import failed.");
  }, [importProfiles, transferText]);

  const handleDeleteProfile = useCallback(() => {
    if (!profile) return;
    setConfirmAction("delete");
  }, [profile]);

  const confirmDeleteProfile = useCallback(() => {
    if (!profile) return;
    deleteProfile(profile.id);
    setConfirmAction(null);
    setToast("Profile deleted.");
  }, [deleteProfile, profile]);

  const handleCreateProfileFromHash = useCallback(() => {
    const hash = profileHashDraft.trim();
    if (state.profiles.length >= MAX_PROFILES) {
      setToast("Profile limit reached.");
      return;
    }
    if (!CHARACTER_HASH_PATTERN.test(hash)) {
      setToast("Enter a valid character hash first.");
      return;
    }
    const created = {
      ...createDefaultProfile(`Character ${state.profiles.length + 1}`),
      kind: "alt" as const,
      importSource: {
        mode: "manual" as const,
        characterHashTail: hash.slice(-12),
        importedSections: [],
        missingOrPrivate: [],
        notes: "Hash reference saved for a future optional profile import.",
      },
    };
    replaceState({
      ...state,
      activeProfileId: created.id,
      profiles: [...state.profiles, created],
    });
    setProfileHashDraft("");
    setToast("Alt profile created. Switch to it, then import that character's hash.");
  }, [profileHashDraft, replaceState, state]);

  const updateCombatStyle = useCallback((combatStyle: CombatStyle) => {
    if (!profile) return;
    const nextGear = { ...profile.gear };
    if (combatStyle === "swordShield") {
      nextGear.offhandWeapon = "";
      nextGear.bow = "";
    } else if (combatStyle === "dualDaggers") {
      nextGear.shield = "";
      nextGear.bow = "";
    } else {
      nextGear.weapon = "";
      nextGear.offhandWeapon = "";
      nextGear.shield = "";
    }
    patchActive({ combatStyle, gear: nextGear });
  }, [patchActive, profile]);

  const confirmDetails = useMemo(() => {
    if (confirmAction === "restore") {
      return {
        title: "Restore Profile Backup",
        body: `Replace the current ${state.profiles.length.toLocaleString()} local profile${state.profiles.length === 1 ? "" : "s"} in this browser with the pasted backup JSON? This does not affect IdleMMO or cloud data.`,
        action: "Restore profiles",
        onConfirm: confirmImportProfiles,
      };
    }
    if (confirmAction === "delete") {
      return {
        title: "Delete Profile",
        body: `Delete "${profile?.name || "Unnamed"}" from this browser? Profile-scoped local planner data for this character may no longer be reachable.`,
        action: "Delete profile",
        onConfirm: confirmDeleteProfile,
      };
    }
    return null;
  }, [confirmAction, confirmDeleteProfile, confirmImportProfiles, profile?.name, state.profiles.length]);

  const confirmDialogRef = useModalA11y<HTMLDivElement>(
    Boolean(confirmDetails),
    () => setConfirmAction(null),
    { initialFocusRef: confirmCancelRef },
  );

  return {
    state,
    profile,
    loaded,
    addProfile,
    duplicateProfile,
    deleteProfile,
    setActiveProfile,
    updateProfile,
    replaceState,
    exportProfiles,
    importProfiles,
    activeProfileSection,
    setActiveProfileSection,
    openProfileSection,
    toast,
    setToast,
    openPicker,
    setOpenPicker,
    confirmAction,
    setConfirmAction,
    confirmDetails,
    confirmDialogRef,
    confirmCancelRef,
    transferText,
    setTransferText,
    lastBackupAt,
    backupDue,
    handleExport,
    handleCopyValue,
    handleImport,
    confirmImportProfiles,
    handleDeleteProfile,
    confirmDeleteProfile,
    petDb,
    allItemsDb,
    itemByName,
    itemOptionsByType,
    pets,
    selectedPet,
    petByName,
    selectedOwnedPet,
    classInfo,
    dailyBonus,
    barteringPercent,
    petMasteryBonus,
    calculatedSecondary,
    combatStatTotal,
    housingSummary,
    canUseGuestHousing,
    patchActive,
    fieldSource,
    updateNested,
    getSkillInputLevel,
    updateSkillLevel,
    updateDailyStreak,
    selectPet,
    updatePetFormula,
    updateCombatStyle,
    profileHashDraft,
    setProfileHashDraft,
    handleCreateProfileFromHash,
  };
}
