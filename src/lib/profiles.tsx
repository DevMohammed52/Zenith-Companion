"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const PROFILE_STORAGE_KEY = "zenith_character_profiles_v1";
export const PROFILE_UPDATED_EVENT = "zenith-profiles-updated";
export const MAX_PROFILES = 5;

export type ProfileKind = "main" | "alt";

export type CharacterProfile = {
  schemaVersion: 1;
  id: string;
  name: string;
  kind: ProfileKind;
  className: string;
  notes: string;
  levels: {
    totalLevel: number | "";
    combat: number | "";
    strength: number | "";
    defence: number | "";
    speed: number | "";
    dexterity: number | "";
    huntingMastery: number | "";
    dungeoneering: number | "";
    petMastery: number | "";
  };
  secondaryStats: {
    attackPower: number | "";
    protection: number | "";
    agility: number | "";
    accuracy: number | "";
    criticalChance: number | "";
    criticalDamage: number | "";
    movementSpeed: number | "";
    damage: number | "";
  };
  magicFind: {
    combat: number | "";
    dungeon: number | "";
    worldBoss: number | "";
    dailyStreak: number | "";
  };
  efficiency: {
    hunting: number | "";
    dungeon: number | "";
  };
  timers: {
    /**
     * Stored as Playtime in the UI. The old idleTimerHours key is retained
     * only so older local exports keep importing cleanly.
     */
    activeHours: number | "";
    idleTimerHours: number | "";
  };
  pet: {
    species: string;
    quality: string;
    level: number | "";
    evolution: number | "";
    stats: Record<string, number | "">;
    notes: string;
  };
  gear: Record<string, string>;
  gearTiers: Record<string, number | "">;
  tools: Record<string, string>;
  housing: {
    mode: "owner" | "guest" | "none";
    notes: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ProfilesState = {
  schemaVersion: 1;
  activeProfileId: string | null;
  profiles: CharacterProfile[];
};

type ProfilesContextValue = {
  state: ProfilesState;
  activeProfile: CharacterProfile | null;
  loaded: boolean;
  addProfile: (name?: string) => CharacterProfile | null;
  duplicateProfile: (profileId: string) => CharacterProfile | null;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;
  updateProfile: (profileId: string, patch: Partial<CharacterProfile>) => void;
  replaceState: (state: ProfilesState) => void;
  exportProfiles: () => string;
  importProfiles: (payload: string) => { ok: boolean; error?: string };
};

const DEFAULT_GEAR = {
  helmet: "",
  chestplate: "",
  greaves: "",
  boots: "",
  gauntlets: "",
  weapon: "",
  shield: "",
  bow: "",
};

const DEFAULT_GEAR_TIERS: Record<string, number | ""> = {
  helmet: "",
  chestplate: "",
  greaves: "",
  boots: "",
  gauntlets: "",
  weapon: "",
  shield: "",
  bow: "",
};

const DEFAULT_TOOLS = {
  woodcutting: "",
  mining: "",
  fishing: "",
};

const DEFAULT_PET_STATS: Record<string, number | ""> = {
  agility: "",
  accuracy: "",
  protection: "",
  attack_power: "",
  movement_speed: "",
  max_health: "",
  max_stamina: "",
  critical_damage: "",
  critical_chance: "",
};

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

const makeId = () => (
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `profile_${Date.now()}_${Math.random().toString(16).slice(2)}`
);

const cleanNumber = (value: unknown): number | "" => {
  if (value === "") return "";
  const next = Number(value);
  return Number.isFinite(next) ? next : "";
};

export function createDefaultProfile(name = "New Character"): CharacterProfile {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: makeId(),
    name,
    kind: "main",
    className: "Warrior",
    notes: "",
    levels: {
      totalLevel: 20,
      combat: 1,
      strength: 1,
      defence: 1,
      speed: 1,
      dexterity: 1,
      huntingMastery: 1,
      dungeoneering: 1,
      petMastery: 1,
    },
    secondaryStats: {
      attackPower: 2,
      protection: 2,
      agility: 2,
      accuracy: 2,
      criticalChance: 0,
      criticalDamage: 0,
      movementSpeed: 3,
      damage: 0,
    },
    magicFind: {
      combat: 0,
      dungeon: 0,
      worldBoss: 0,
      dailyStreak: 0,
    },
    efficiency: {
      hunting: 0,
      dungeon: 0,
    },
    timers: {
      activeHours: 0,
      idleTimerHours: "",
    },
    pet: {
      species: "",
      quality: "",
      level: "",
      evolution: "",
      stats: { ...DEFAULT_PET_STATS },
      notes: "",
    },
    gear: { ...DEFAULT_GEAR },
    gearTiers: { ...DEFAULT_GEAR_TIERS },
    tools: { ...DEFAULT_TOOLS },
    housing: {
      mode: "none",
      notes: "",
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function sanitizeProfile(input: Partial<CharacterProfile> | null | undefined): CharacterProfile {
  const base = createDefaultProfile(typeof input?.name === "string" ? input.name.slice(0, 40) : "New Character");
  const next: CharacterProfile = {
    ...base,
    ...input,
    schemaVersion: 1,
    id: typeof input?.id === "string" && input.id ? input.id : base.id,
    name: typeof input?.name === "string" ? input.name.slice(0, 40) : base.name,
    kind: input?.kind === "alt" ? "alt" : "main",
    className: typeof input?.className === "string" && input.className.trim() && input.className !== "Standard"
      ? input.className.slice(0, 40)
      : base.className,
    notes: typeof input?.notes === "string" ? input.notes.slice(0, 500) : "",
    levels: { ...base.levels, ...(input?.levels || {}) },
    secondaryStats: { ...base.secondaryStats, ...(input?.secondaryStats || {}) },
    magicFind: { ...base.magicFind, ...(input?.magicFind || {}) },
    efficiency: { ...base.efficiency, ...(input?.efficiency || {}) },
    timers: { ...base.timers, ...(input?.timers || {}) },
    pet: { ...base.pet, ...(input?.pet || {}), stats: { ...DEFAULT_PET_STATS, ...(input?.pet?.stats || {}) } },
    gear: { ...DEFAULT_GEAR, ...(input?.gear || {}) },
    gearTiers: { ...DEFAULT_GEAR_TIERS, ...(input?.gearTiers || {}) },
    tools: { ...DEFAULT_TOOLS, ...(input?.tools || {}) },
    housing: { ...base.housing, ...(input?.housing || {}) },
    createdAt: typeof input?.createdAt === "string" ? input.createdAt : base.createdAt,
    updatedAt: typeof input?.updatedAt === "string" ? input.updatedAt : base.updatedAt,
  };

  for (const key of Object.keys(next.levels) as Array<keyof CharacterProfile["levels"]>) {
    next.levels[key] = cleanNumber(next.levels[key]);
  }
  for (const key of Object.keys(next.secondaryStats) as Array<keyof CharacterProfile["secondaryStats"]>) {
    next.secondaryStats[key] = cleanNumber(next.secondaryStats[key]);
  }
  for (const key of Object.keys(next.magicFind) as Array<keyof CharacterProfile["magicFind"]>) {
    next.magicFind[key] = cleanNumber(next.magicFind[key]);
  }
  for (const key of Object.keys(next.efficiency) as Array<keyof CharacterProfile["efficiency"]>) {
    next.efficiency[key] = cleanNumber(next.efficiency[key]);
  }
  for (const key of Object.keys(next.timers) as Array<keyof CharacterProfile["timers"]>) {
    next.timers[key] = cleanNumber(next.timers[key]);
  }
  if (next.timers.activeHours === "" && next.timers.idleTimerHours !== "") {
    next.timers.activeHours = next.timers.idleTimerHours;
    next.timers.idleTimerHours = "";
  }
  next.pet.level = cleanNumber(next.pet.level);
  next.pet.evolution = cleanNumber(next.pet.evolution);
  for (const key of Object.keys(next.pet.stats)) {
    next.pet.stats[key] = cleanNumber(next.pet.stats[key]);
  }
  for (const key of Object.keys(next.gearTiers)) {
    next.gearTiers[key] = cleanNumber(next.gearTiers[key]);
  }
  next.housing.mode = next.housing.mode === "owner" || next.housing.mode === "guest" ? next.housing.mode : "none";

  return next;
}

export function sanitizeProfilesState(input: Partial<ProfilesState> | null | undefined): ProfilesState {
  const profiles = Array.isArray(input?.profiles)
    ? input.profiles.slice(0, MAX_PROFILES).map((profile) => sanitizeProfile(profile))
    : [];
  return {
    schemaVersion: 1,
    activeProfileId: profiles.some((profile) => profile.id === input?.activeProfileId)
      ? String(input?.activeProfileId)
      : profiles[0]?.id || null,
    profiles,
  };
}

export function getActiveProfile(state: ProfilesState): CharacterProfile | null {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || state.profiles[0] || null;
}

export function getProfileDungeonStatTotal(profile: CharacterProfile | null | undefined) {
  if (!profile) return 0;
  return (
    Number(profile.secondaryStats.attackPower || 0) +
    Number(profile.secondaryStats.protection || 0) +
    Number(profile.secondaryStats.agility || 0) +
    Number(profile.secondaryStats.accuracy || 0)
  );
}

export function getProfileCombatPrimary(profile: CharacterProfile | null | undefined) {
  return {
    combatLevel: Number(profile?.levels.combat || 0),
    strength: Number(profile?.levels.strength || 0),
    dexterity: Number(profile?.levels.dexterity || 0),
    defence: Number(profile?.levels.defence || 0),
  };
}

function readProfilesState(): ProfilesState {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) return sanitizeProfilesState(JSON.parse(stored));
  } catch {}
  return sanitizeProfilesState({ profiles: [createDefaultProfile("Main Character")] });
}

function writeProfilesState(state: ProfilesState) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProfilesState>(() => sanitizeProfilesState(null));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setState(readProfilesState());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_STORAGE_KEY) handleUpdate();
    };

    const initial = readProfilesState();
    setState(initial);
    if (initial.profiles.length === 0) {
      const fallback = sanitizeProfilesState({ profiles: [createDefaultProfile("Main Character")] });
      writeProfilesState(fallback);
      setState(fallback);
    }
    setLoaded(true);
    window.addEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const replaceState = useCallback((nextState: ProfilesState) => {
    const sanitized = sanitizeProfilesState(nextState);
    const ensured = sanitized.profiles.length ? sanitized : sanitizeProfilesState({ profiles: [createDefaultProfile("Main Character")] });
    setState(ensured);
    writeProfilesState(ensured);
  }, []);

  const addProfile = useCallback((name?: string) => {
    if (state.profiles.length >= MAX_PROFILES) return null;
    const profile = createDefaultProfile(name || `Character ${state.profiles.length + 1}`);
    replaceState({
      ...state,
      activeProfileId: profile.id,
      profiles: [...state.profiles, profile],
    });
    return profile;
  }, [replaceState, state]);

  const duplicateProfile = useCallback((profileId: string) => {
    if (state.profiles.length >= MAX_PROFILES) return null;
    const source = state.profiles.find((profile) => profile.id === profileId);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy = sanitizeProfile({
      ...source,
      id: makeId(),
      name: `${source.name} Copy`.slice(0, 40),
      createdAt: now,
      updatedAt: now,
    });
    replaceState({ ...state, activeProfileId: copy.id, profiles: [...state.profiles, copy] });
    return copy;
  }, [replaceState, state]);

  const deleteProfile = useCallback((profileId: string) => {
    const profiles = state.profiles.filter((profile) => profile.id !== profileId);
    const nextProfiles = profiles.length ? profiles : [createDefaultProfile("Main Character")];
    replaceState({
      ...state,
      activeProfileId: nextProfiles[0]?.id || null,
      profiles: nextProfiles,
    });
  }, [replaceState, state]);

  const setActiveProfile = useCallback((profileId: string) => {
    if (!state.profiles.some((profile) => profile.id === profileId)) return;
    replaceState({ ...state, activeProfileId: profileId });
  }, [replaceState, state]);

  const updateProfile = useCallback((profileId: string, patch: Partial<CharacterProfile>) => {
    const now = new Date().toISOString();
    replaceState({
      ...state,
      profiles: state.profiles.map((profile) => (
        profile.id === profileId
          ? sanitizeProfile({ ...profile, ...patch, updatedAt: now })
          : profile
      )),
    });
  }, [replaceState, state]);

  const exportProfiles = useCallback(() => JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
  }, null, 2), [state]);

  const importProfiles = useCallback((payload: string) => {
    try {
      const parsed = JSON.parse(payload);
      const next = sanitizeProfilesState({
        activeProfileId: parsed.activeProfileId,
        profiles: parsed.profiles || [],
      });
      if (!next.profiles.length) return { ok: false, error: "No profiles found in the import payload." };
      replaceState(next);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
    }
  }, [replaceState]);

  const activeProfile = useMemo(() => getActiveProfile(state), [state]);

  const value = useMemo<ProfilesContextValue>(() => ({
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
  }), [
    activeProfile,
    addProfile,
    deleteProfile,
    duplicateProfile,
    exportProfiles,
    importProfiles,
    loaded,
    replaceState,
    setActiveProfile,
    state,
    updateProfile,
  ]);

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfiles() {
  const context = useContext(ProfilesContext);
  if (!context) throw new Error("useProfiles must be used inside ProfileProvider");
  return context;
}
