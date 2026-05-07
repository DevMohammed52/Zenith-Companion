"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Copy,
  Download,
  FileUp,
  Home,
  Package,
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  MAX_PROFILES,
  type CharacterProfile,
  type CombatStyle,
  useProfiles,
} from "@/lib/profiles";
import { useData } from "@/context/DataContext";
import {
  CLASS_DATA,
  ascensionLevel,
  calculatePetStats,
  calculateProfileSecondaryStats,
  barteringBuffPercent,
  dailyStreakMagicFind,
  formatStatName,
  getClassInfo,
  getItemRequirementLevel,
  getPetMasteryStatBonus,
  getToolEfficiency,
  sortProfileItems,
  type PetMasteryLevelRecord,
  type PetDatabaseRecord,
  type ProfileItemRecord,
} from "@/lib/profile-calculations";
import { ASSAULT_OPTIONS, type AssaultRank } from "@/lib/skill-profit";
import { calculateHousingBuffs, formatHours, getHousingActivityLabel } from "@/lib/housing";

const LEVEL_FIELDS: Array<[keyof CharacterProfile["levels"], string, { min: number; max: number }]> = [
  ["totalLevel", "Total Level / TL", { min: 20, max: 2300 }],
  ["combat", "Combat", { min: 1, max: 600 }],
  ["strength", "Strength", { min: 1, max: 100 }],
  ["defence", "Defence", { min: 1, max: 100 }],
  ["speed", "Speed", { min: 1, max: 100 }],
  ["dexterity", "Dexterity", { min: 1, max: 100 }],
  ["huntingMastery", "Hunting Mastery", { min: 1, max: 600 }],
  ["dungeoneering", "Dungeoneering", { min: 1, max: 600 }],
  ["petMastery", "Pet Mastery", { min: 1, max: 100 }],
];

const ASCENSION_LEVEL_FIELDS = new Set<keyof CharacterProfile["levels"]>([
  "combat",
  "huntingMastery",
  "dungeoneering",
]);

const SECONDARY_FIELDS: Array<[keyof CharacterProfile["secondaryStats"], string]> = [
  ["attackPower", "Attack Power"],
  ["protection", "Protection"],
  ["agility", "Agility"],
  ["accuracy", "Accuracy"],
  ["criticalChance", "Crit Chance"],
  ["criticalDamage", "Crit Damage"],
  ["movementSpeed", "Movement Speed"],
  ["damage", "Damage"],
];

const PET_STAT_FIELDS: Array<[keyof CharacterProfile["pet"]["stats"], string]> = [
  ["agility", "Agility"],
  ["accuracy", "Accuracy"],
  ["protection", "Protection"],
  ["attackPower", "Attack Power"],
  ["movementSpeed", "Movement Speed"],
  ["maxHealth", "Max Health"],
  ["maxStamina", "Max Stamina"],
  ["criticalDamage", "Crit Damage"],
  ["criticalChance", "Crit Chance"],
];

const ARMOR_GEAR_FIELDS: Array<[string, string, string[]]> = [
  ["helmet", "Helmet", ["HELMET"]],
  ["chestplate", "Chestplate", ["CHESTPLATE"]],
  ["greaves", "Greaves", ["GREAVES"]],
  ["boots", "Boots", ["BOOTS"]],
  ["gauntlets", "Gauntlets", ["GAUNTLETS"]],
];

const COMBAT_STYLE_OPTIONS: Array<{ value: CombatStyle; label: string; hint: string }> = [
  { value: "swordShield", label: "Sword + Shield", hint: "One sword, optional shield" },
  { value: "dualDaggers", label: "Dual Daggers", hint: "Two dagger slots" },
  { value: "bow", label: "Bow", hint: "Bow only, no shield" },
];

const TOOL_FIELDS: Array<[string, string, string[]]> = [
  ["woodcutting", "Woodcutting", ["FELLING_AXE"]],
  ["mining", "Mining", ["PICKAXE"]],
  ["fishing", "Fishing", ["FISHING_ROD"]],
];

const PROFILE_SECTIONS = [
  ["identity", "Identity"],
  ["levels", "Levels"],
  ["combat", "Combat"],
  ["magic", "Magic"],
  ["pet", "Pet"],
  ["gear", "Gear"],
  ["housing", "Housing"],
  ["transfer", "Import"],
];

function numberFromInput(value: string) {
  return value === "" ? "" : Number(value);
}

function currentUtcResetDate() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetweenUtcDates(fromDate: string, toDate: string) {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return Math.floor((to - from) / 86_400_000);
}

function updateMagicFindFromStreak(
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

function formatShortStats(stats?: Record<string, number> | null, limit = 3) {
  const entries = Object.entries(stats || {}).filter(([, value]) => Number(value) !== 0).slice(0, limit);
  if (!entries.length) return "";
  return entries.map(([key, value]) => `${formatStatName(key)} ${value}`).join(" / ");
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="profile-toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><X size={14} /></button>
    </div>
  );
}

function ProfileNumberField({
  label,
  value,
  onChange,
  step = "1",
  min,
  max,
  hint,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  step?: string;
  min?: number;
  max?: number;
  hint?: ReactNode;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <input
        className="control-input"
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function ProfileTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <input
        className="control-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type PickerOption<T> = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  searchText: string;
  value: T | null;
  muted?: boolean;
};

function ProfilePicker<T>({
  label,
  placeholder,
  selected,
  options,
  openId,
  id,
  setOpenId,
  onSelect,
  disabled,
}: {
  label: string;
  placeholder: string;
  selected?: PickerOption<T> | null;
  options: Array<PickerOption<T>>;
  openId: string | null;
  id: string;
  setOpenId: (value: string | null) => void;
  onSelect: (value: T | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const open = openId === id;
  const selectedImageClass = selected?.title === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 90);
    return options.filter((option) => option.searchText.toLowerCase().includes(needle)).slice(0, 90);
  }, [options, query]);

  return (
    <div className={`profile-picker ${open ? "open" : ""}`}>
      <span className="profile-picker-label">{label}</span>
      <button
        type="button"
        className="profile-picker-button"
        onClick={() => {
          if (disabled) return;
          setQuery("");
          setOpenId(open ? null : id);
        }}
        disabled={disabled}
      >
        <span className="profile-picker-image">
          {selected?.image ? <img src={selected.image} alt="" className={selectedImageClass} /> : <Package size={16} />}
        </span>
        <span className="profile-picker-text">
          <strong>{selected?.title || placeholder}</strong>
          <small>{selected?.subtitle || "Select from database"}</small>
        </span>
        {selected?.badge && <em>{selected.badge}</em>}
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="profile-picker-menu">
          <div className="profile-picker-menu-head">
            <span>Choose {label}</span>
            <button
              type="button"
              onClick={() => {
                setOpenId(null);
                setQuery("");
              }}
              aria-label={`Close ${label.toLowerCase()} picker`}
            >
              <X size={15} />
            </button>
          </div>
          <label className="profile-picker-search">
            <Search size={16} />
            <input value={query} placeholder={`Search ${label.toLowerCase()}...`} onChange={(event) => setQuery(event.target.value)} autoFocus />
          </label>
          <div className="profile-picker-options custom-scrollbar">
            {visible.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`profile-picker-option ${option.muted ? "muted" : ""}`}
                onClick={() => {
                  onSelect(option.value);
                  setOpenId(null);
                  setQuery("");
                }}
              >
                <span className="profile-picker-image">
                  {option.image ? <img src={option.image} alt="" className={option.title === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined} /> : <Package size={16} />}
                </span>
                <span>
                  <strong>{option.title}</strong>
                  {option.subtitle && <small>{option.subtitle}</small>}
                </span>
                {option.badge && <em>{option.badge}</em>}
              </button>
            ))}
            {!visible.length && <div className="profile-picker-empty">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilesPage() {
  const {
    state,
    activeProfile,
    addProfile,
    duplicateProfile,
    deleteProfile,
    setActiveProfile,
    updateProfile,
    exportProfiles,
    importProfiles,
  } = useProfiles();
  const { allItemsDb } = useData();
  const [transferText, setTransferText] = useState("");
  const [toast, setToast] = useState("");
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [petDb, setPetDb] = useState<{ pets: PetDatabaseRecord[]; mastery?: { levels?: PetMasteryLevelRecord[] } } | null>(null);
  const lastAutoStatKey = useRef("");
  const lastPetStatKey = useRef("");

  const profile = activeProfile;
  const housingSummary = useMemo(() => calculateHousingBuffs(profile?.housing), [profile?.housing]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

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

  const patchActive = useCallback((patch: Partial<CharacterProfile>) => {
    if (!profile) return;
    updateProfile(profile.id, patch);
  }, [profile, updateProfile]);

  const updateNested = <Section extends keyof CharacterProfile, Key extends keyof CharacterProfile[Section]>(
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
  };

  useEffect(() => {
    if (!profile || !calculatedSecondary || !autoStatKey || !Object.keys(itemByName).length) return;
    if (lastAutoStatKey.current === autoStatKey) return;
    lastAutoStatKey.current = autoStatKey;
    const current = profile.secondaryStats;
    const changed = SECONDARY_FIELDS.some(([key]) => Number(current[key] || 0) !== Number(calculatedSecondary[key] || 0));
    if (changed) patchActive({ secondaryStats: calculatedSecondary });
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
    patchActive({ pet: { ...profile.pet, stats: nextStats } });
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

  const updateDailyStreak = (value: number | "") => {
    if (!profile) return;
    patchActive({ magicFind: updateMagicFindFromStreak(profile.magicFind, value) });
  };

  const selectPet = (pet: PetDatabaseRecord | null) => {
    if (!profile) return;
    if (!pet) {
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
      });
      return;
    }
    const stats = calculatePetStats(pet, profile.pet.level || 1, profile.pet.evolution || 0, petMasteryBonus);
    patchActive({
      pet: {
        ...profile.pet,
        species: pet.name,
        quality: pet.quality || "",
        stats,
        notes: `${pet.name}${pet.acquisition?.[0]?.boss ? ` from ${pet.acquisition[0].boss}` : ""}`,
      },
    });
  };

  const updatePetFormula = (patch: Partial<CharacterProfile["pet"]>) => {
    if (!profile) return;
    const nextPet = { ...profile.pet, ...patch };
    const stats = selectedPet ? calculatePetStats(selectedPet, nextPet.level, nextPet.evolution, petMasteryBonus) : nextPet.stats;
    patchActive({ pet: { ...nextPet, stats } });
  };

  const handleExport = async () => {
    const payload = exportProfiles();
    setTransferText(payload);
    try {
      await navigator.clipboard?.writeText(payload);
      setToast("Profile export copied to clipboard.");
    } catch {
      setToast("Profile export generated below.");
    }
  };

  const handleImport = () => {
    if (!transferText.trim()) {
      setToast("Paste a profile export before importing.");
      return;
    }
    const confirmed = window.confirm("Importing profiles will replace the current local profile list in this browser. Continue?");
    if (!confirmed) return;
    const result = importProfiles(transferText);
    setToast(result.ok ? "Profiles imported into this browser." : result.error || "Import failed.");
  };

  const handleDeleteProfile = () => {
    if (!profile) return;
    const confirmed = window.confirm(`Delete the local profile "${profile.name || "Unnamed"}" from this browser?`);
    if (!confirmed) return;
    deleteProfile(profile.id);
    setToast("Profile deleted.");
  };

  const getSlotOptions = (types: string[]) => types.flatMap((type) => itemOptionsByType[type] || []);
  const itemPickerOption = (item: ProfileItemRecord): PickerOption<ProfileItemRecord> => ({
    id: item.name || "",
    title: item.name || "Unknown item",
    subtitle: `${item.quality || "UNKNOWN"} - ${String(item.type || "").replace(/_/g, " ")}${getItemRequirementLevel(item) ? ` - Lv. ${getItemRequirementLevel(item)}` : ""}`,
    image: item.image_url,
    badge: item.max_tier ? `T${item.max_tier}` : undefined,
    searchText: `${item.name} ${item.quality} ${item.type} ${formatShortStats(item.stats, 6)}`,
    value: item,
  });
  const updateCombatStyle = (combatStyle: CombatStyle) => {
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
  };
  const renderGearSlot = (key: string, label: string, types: string[], disabled = false) => {
    if (!profile) return null;
    const options = getSlotOptions(types);
    const selected = itemByName[profile.gear[key] || ""];
    const selectedOption = selected ? itemPickerOption(selected) : {
      id: "none",
      title: `Select ${label}`,
      subtitle: label,
      searchText: "none",
      value: null,
    };
    const maxTier = Number(selected?.max_tier || 1);
    const previewProfile = {
      ...profile,
      gear: { ...Object.fromEntries(Object.keys(profile.gear).map((slot) => [slot, ""])), [key]: profile.gear[key] },
      gearTiers: { ...profile.gearTiers, [key]: profile.gearTiers[key] || 1 },
      combatStyle: key === "bow" ? "bow" : key === "offhandWeapon" ? "dualDaggers" : profile.combatStyle,
    } as CharacterProfile;
    const stats = calculateProfileSecondaryStats(previewProfile, itemByName);
    return (
      <div key={key} className={`profile-item-slot rich ${disabled ? "disabled" : ""}`}>
        <ProfilePicker
          id={`gear-${key}`}
          label={label}
          placeholder={`Select ${label}`}
          selected={selectedOption}
          options={[
            { id: "none", title: "None", subtitle: "Clear this slot", searchText: "none clear", value: null, muted: true },
            ...options.map(itemPickerOption),
          ]}
          openId={openPicker}
          setOpenId={setOpenPicker}
          disabled={disabled}
          onSelect={(item) => {
            const next = item as ProfileItemRecord | null;
            patchActive({
              gear: { ...profile.gear, [key]: next?.name || "" },
              gearTiers: { ...profile.gearTiers, [key]: 1 },
            });
          }}
        />
        <ProfileNumberField
          label={`Tier / ${maxTier}`}
          value={profile.gearTiers?.[key] || 1}
          min={1}
          max={maxTier}
          onChange={(value) => patchActive({ gearTiers: { ...profile.gearTiers, [key]: Math.min(Math.max(Number(value) || 1, 1), maxTier) } })}
        />
        {selected && (
          <div className="profile-slot-stats">
            <span>{formatShortStats(selected.stats, 5) || "No base stats"}</span>
            {selected.tier_modifiers && <small>Tier gain: {formatShortStats(selected.tier_modifiers, 5)}</small>}
            <small>Slot preview: AP {stats.attackPower}, Prot {stats.protection}, Agi {stats.agility}, Acc {stats.accuracy}</small>
          </div>
        )}
        {disabled && <div className="profile-slot-stats"><span>Disabled by current weapon setup.</span></div>}
      </div>
    );
  };

  if (!profile) {
    return (
      <main className="container">
        <div className="header">
          <h1 className="header-title"><Users size={24} color="var(--text-accent)" /> PROFILES</h1>
        </div>
      </main>
    );
  }

  const selectedClassOption: PickerOption<string> = {
    id: classInfo.id,
    title: classInfo.id,
    subtitle: classInfo.category,
    image: classInfo.icon,
    badge: classInfo.category,
    searchText: `${classInfo.id} ${classInfo.category}`,
    value: classInfo.id,
  };
  const petOptions: Array<PickerOption<PetDatabaseRecord>> = [
    {
      id: "none",
      title: "No Pet Selected",
      subtitle: "Clear pet data",
      searchText: "none clear no pet",
      value: null,
      muted: true,
    },
    ...pets.map((pet) => ({
      id: pet.name,
      title: pet.name,
      subtitle: `${pet.quality || "UNKNOWN"}${pet.acquisition?.[0]?.boss ? ` - ${pet.acquisition[0].boss}` : ""}`,
      image: pet.imageUrl,
      badge: pet.quality,
      searchText: `${pet.name} ${pet.quality} ${pet.acquisition?.map((entry) => `${entry.boss} ${entry.location}`).join(" ")}`,
      value: pet,
    })),
  ];
  const selectedPetOption = selectedPet
    ? petOptions.find((option) => option.id === selectedPet.name)
    : petOptions[0];

  return (
    <main className="container profiles-page" onClick={(event) => {
      if (!(event.target as HTMLElement).closest(".profile-picker")) setOpenPicker(null);
    }}>
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="header profile-header">
        <div>
          <h1 className="header-title"><Users size={24} color="var(--text-accent)" /> PROFILES</h1>
          <p className="profile-subtitle">Local character setups for calculators. Global prices, membership, custom prices, and theme stay in Settings.</p>
        </div>
        <div className="profile-header-actions">
          <button className="profile-action" type="button" onClick={() => {
            const created = addProfile();
            if (created) setToast("Profile added.");
          }} disabled={state.profiles.length >= MAX_PROFILES}>
            <Plus size={15} /> Add
          </button>
          <button className="profile-action" type="button" onClick={handleExport}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <nav className="profile-section-nav" aria-label="Profile sections">
        {PROFILE_SECTIONS.map(([id, label]) => (
          <a key={id} href={`#profile-${id}`}>{label}</a>
        ))}
      </nav>

      <section className="profile-layout">
        <aside className="profile-list-panel">
          <div className="profile-count">
            <span>{state.profiles.length} / {MAX_PROFILES}</span>
            <strong>Local Profiles</strong>
          </div>
          <div className="profile-list">
            {state.profiles.map((item) => {
              const active = item.id === profile.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`profile-list-item ${active ? "active" : ""}`}
                  onClick={() => setActiveProfile(item.id)}
                >
                  <span className="profile-avatar"><UserRound size={18} /></span>
                  <span>
                    <strong>{item.name || "Unnamed Character"}</strong>
                    <small>{item.kind === "main" ? "Main" : "Alt"} - {item.className}</small>
                  </span>
                  {active && <BadgeCheck size={16} />}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="profile-editor">
          <section id="profile-identity" className="profile-panel profile-identity-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Identity</h2>
                <p>Stable profile data used by calculators.</p>
              </div>
              <div className="profile-inline-actions">
                <button type="button" onClick={() => {
                  const created = duplicateProfile(profile.id);
                  if (created) setToast("Profile duplicated.");
                }} disabled={state.profiles.length >= MAX_PROFILES} title="Duplicate profile">
                  <Copy size={15} />
                </button>
                <button type="button" onClick={handleDeleteProfile} title="Delete profile">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="profile-grid identity-grid">
              <ProfileTextField label="Character Name" value={profile.name} onChange={(name) => patchActive({ name })} placeholder="Character name" />
              <ProfilePicker
                id="class"
                label="Class"
                placeholder="Select Class"
                selected={selectedClassOption}
                options={CLASS_DATA.map((entry) => ({
                  id: entry.id,
                  title: entry.id,
                  subtitle: entry.category,
                  image: entry.icon,
                  badge: entry.category,
                  searchText: `${entry.id} ${entry.category}`,
                  value: entry.id,
                }))}
                openId={openPicker}
                setOpenId={setOpenPicker}
                onSelect={(value) => patchActive({ className: String(value || "Other") })}
              />
              <label className="profile-field">
                <span>Character Type</span>
                <div className="profile-segmented">
                  <button type="button" className={profile.kind === "main" ? "active" : ""} onClick={() => patchActive({ kind: "main" })}>Main</button>
                  <button type="button" className={profile.kind === "alt" ? "active" : ""} onClick={() => patchActive({ kind: "alt" })}>Alt</button>
                </div>
              </label>
            </div>
            <div className="profile-class-card">
              <span className="profile-class-icon">{classInfo.icon ? <img src={classInfo.icon} alt="" /> : <Sparkles size={22} />}</span>
              <div>
                <h3>{classInfo.id}</h3>
                <p>{classInfo.summary}</p>
                <div className="profile-chip-row">
                  {classInfo.effects.map((effect) => <span key={effect}>{effect}</span>)}
                </div>
                <div className="profile-talent-list">
                  {classInfo.talents.length ? classInfo.talents.map((talent) => {
                    const active = Number(profile.levels.combat || 0) >= talent.level;
                    return <em key={talent.name} className={active ? "active" : ""}>{talent.name} Lv.{talent.level}: {talent.description}</em>;
                  }) : <em>No battle talents.</em>}
                </div>
                {classInfo.notes.map((note) => <small key={note}>{note}</small>)}
              </div>
            </div>
            <label className="profile-field profile-field-wide">
              <span>Notes</span>
              <textarea className="control-input" value={profile.notes} onChange={(event) => patchActive({ notes: event.target.value })} />
            </label>
          </section>

          <section id="profile-levels" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Levels</h2>
                <p>Combat, Hunting Mastery, and Dungeoneering can store ascension levels above 100.</p>
              </div>
            </div>
            <div className="profile-grid compact">
              {LEVEL_FIELDS.map(([key, label, limits]) => {
                const asc = ASCENSION_LEVEL_FIELDS.has(key) ? ascensionLevel(profile.levels[key]) : 0;
                return (
                  <ProfileNumberField
                    key={key}
                    label={label}
                    value={profile.levels[key]}
                    min={limits.min}
                    max={limits.max}
                    onChange={(value) => updateNested("levels", key, value)}
                    hint={asc ? `Ascension ${asc}` : undefined}
                  />
                );
              })}
            </div>
          </section>

          <section id="profile-combat" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Combat Snapshot</h2>
                <p>Calculated from core levels, selected gear tiers, pet stats, and active class talents. You can still edit any final value manually.</p>
              </div>
              <div className="profile-stat-pill"><Shield size={14} /> {combatStatTotal.toLocaleString()} calculated dungeon stats</div>
            </div>
            <div className="profile-auto-card">
              {SECONDARY_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{calculatedSecondary?.[key]?.toLocaleString() || 0}</strong>
                </div>
              ))}
            </div>
            <div className="profile-grid compact">
              {SECONDARY_FIELDS.map(([key, label]) => (
                <ProfileNumberField
                  key={key}
                  label={label}
                  value={profile.secondaryStats[key]}
                  step={key === "movementSpeed" ? "0.01" : "1"}
                  min={key === "movementSpeed" ? 3 : key === "criticalChance" || key === "criticalDamage" || key === "damage" ? 0 : 2}
                  onChange={(value) => updateNested("secondaryStats", key, value)}
                />
              ))}
            </div>
          </section>

          <section id="profile-magic" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Magic, Efficiency, Timers</h2>
                <p>Daily streak, conquest, bartering level, efficiencies, and playtime belong to this character. Page-specific potions, shrine, essence, and weather stay on the relevant page.</p>
              </div>
              <div className="profile-stat-pill"><Sparkles size={14} /> +{dailyBonus}% streak MF</div>
            </div>
            <div className="profile-grid compact">
              <ProfileNumberField label="Combat Magic Find" value={profile.magicFind.combat} min={0} onChange={(value) => updateNested("magicFind", "combat", value)} />
              <ProfileNumberField label="Dungeon Magic Find" value={profile.magicFind.dungeon} min={0} onChange={(value) => updateNested("magicFind", "dungeon", value)} />
              <ProfileNumberField label="World Boss Magic Find" value={profile.magicFind.worldBoss} min={0} onChange={(value) => updateNested("magicFind", "worldBoss", value)} />
              <ProfileNumberField
                label="Daily Streak"
                value={profile.magicFind.dailyStreak}
                min={0}
                onChange={updateDailyStreak}
                hint="1% magic find every 10 days, capped at 10%. Tracked once per UTC reset day after you enter it."
              />
              <ProfileNumberField label="Hunting Efficiency" value={profile.efficiency.hunting} min={0} onChange={(value) => updateNested("efficiency", "hunting", value)} />
              <ProfileNumberField label="Dungeon Efficiency" value={profile.efficiency.dungeon} min={0} onChange={(value) => updateNested("efficiency", "dungeon", value)} />
              <ProfileNumberField label="Playtime (hours/day)" value={profile.timers.activeHours} min={0} max={24} onChange={(value) => updateNested("timers", "activeHours", value)} />
              <label className="profile-field">
                <span>Conquest Buff</span>
                <select
                  className="control-input"
                  value={profile.boosts.conquestRank}
                  onChange={(event) => updateNested("boosts", "conquestRank", event.target.value as AssaultRank)}
                >
                  {ASSAULT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <ProfileNumberField
                label="Bartering Level"
                value={profile.boosts.barteringLevel}
                min={0}
                max={100}
                onChange={(value) => updateNested("boosts", "barteringLevel", value === "" ? "" : Math.min(100, Math.max(0, Number(value))))}
                hint={`Vendor bonus: +${barteringPercent}%`}
              />
            </div>
          </section>

          <section id="profile-pet" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Pet</h2>
                <p>Select from the Pet Database, then adjust level, evolution, Pet Mastery, or final visible pet stats.</p>
              </div>
              <div className="profile-stat-pill">+{petMasteryBonus}% Pet Mastery stats</div>
            </div>
            <div className="profile-grid">
              <ProfilePicker
                id="pet"
                label="Pet"
                placeholder="Select Pet"
                selected={selectedPetOption}
                options={petOptions}
                openId={openPicker}
                setOpenId={setOpenPicker}
                onSelect={selectPet}
              />
              <ProfileTextField label="Quality" value={profile.pet.quality} onChange={(value) => updateNested("pet", "quality", value)} placeholder="Select a pet" />
              <ProfileNumberField label="Pet Level" value={profile.pet.level} min={1} max={100} onChange={(value) => updatePetFormula({ level: value })} />
              <ProfileNumberField label="Evolution Level" value={profile.pet.evolution} min={0} max={5} onChange={(value) => updatePetFormula({ evolution: value })} />
            </div>
            {selectedPet && (
              <div className="profile-selected-card">
                <img src={selectedPet.imageUrl} alt="" className={selectedPet.name === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined} />
                <div>
                  <h3>{selectedPet.name}</h3>
                  <p>{selectedPet.quality} - {selectedPet.acquisition?.[0]?.boss || "Pet Database"}</p>
                  <div className="profile-chip-row">
                    {PET_STAT_FIELDS.slice(0, 6).map(([key, label]) => <span key={key}>{label}: {profile.pet.stats[key] || 0}</span>)}
                  </div>
                </div>
              </div>
            )}
            <div className="profile-grid compact">
              {PET_STAT_FIELDS.map(([key, label]) => (
                <ProfileNumberField
                  key={key}
                  label={label}
                  value={profile.pet.stats[key]}
                  step={key === "movementSpeed" || key === "criticalDamage" || key === "criticalChance" ? "0.01" : "1"}
                  onChange={(value) => patchActive({ pet: { ...profile.pet, stats: { ...profile.pet.stats, [key]: value } } })}
                />
              ))}
            </div>
            <label className="profile-field profile-field-wide">
              <span>Pet Notes</span>
              <textarea className="control-input" value={profile.pet.notes} placeholder="Optional notes from screenshots or manual checks..." onChange={(event) => updateNested("pet", "notes", event.target.value)} />
            </label>
          </section>

          <section id="profile-gear" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Gear And Tools</h2>
                <p>Gear and tools come from the item database. Tier 1 is the base item; higher tiers apply stored tier modifiers.</p>
              </div>
            </div>
            <div className="profile-dual-grid">
              <div>
                <h3><Shield size={14} /> Gear</h3>
                <div className="profile-loadout-card">
                  <span><Swords size={14} /> Weapon Setup</span>
                  <div className="profile-loadout-options">
                    {COMBAT_STYLE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={profile.combatStyle === option.value ? "active" : ""}
                        onClick={() => updateCombatStyle(option.value)}
                      >
                        <strong>{option.label}</strong>
                        <small>{option.hint}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="profile-grid single">
                  {ARMOR_GEAR_FIELDS.map(([key, label, types]) => renderGearSlot(key, label, types))}
                  {profile.combatStyle === "swordShield" && (
                    <>
                      {renderGearSlot("weapon", "Sword", ["SWORD"])}
                      {renderGearSlot("shield", "Shield", ["SHIELD"])}
                    </>
                  )}
                  {profile.combatStyle === "dualDaggers" && (
                    <>
                      {renderGearSlot("weapon", "Main Dagger", ["DAGGER"])}
                      {renderGearSlot("offhandWeapon", "Offhand Dagger", ["DAGGER"])}
                      {renderGearSlot("shield", "Shield", ["SHIELD"], true)}
                    </>
                  )}
                  {profile.combatStyle === "bow" && (
                    <>
                      {renderGearSlot("bow", "Bow", ["BOW"])}
                      {renderGearSlot("shield", "Shield", ["SHIELD"], true)}
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3><FileUp size={14} /> Tools</h3>
                <div className="profile-grid single">
                  {TOOL_FIELDS.map(([key, label, types]) => {
                    const selected = itemByName[profile.tools[key] || ""];
                    return (
                      <div key={key} className="profile-item-slot tool-slot">
                        <ProfilePicker
                          id={`tool-${key}`}
                          label={label}
                          placeholder={`Select ${label}`}
                          selected={selected ? itemPickerOption(selected) : {
                            id: "none",
                            title: `Select ${label}`,
                            subtitle: "Tool",
                            searchText: "none",
                            value: null,
                          }}
                          options={[
                            { id: "none", title: "None", subtitle: "Clear this tool", searchText: "none clear", value: null, muted: true },
                            ...getSlotOptions(types).map(itemPickerOption),
                          ]}
                          openId={openPicker}
                          setOpenId={setOpenPicker}
                          onSelect={(item) => {
                            const next = item as ProfileItemRecord | null;
                            patchActive({ tools: { ...profile.tools, [key]: next?.name || "" } });
                          }}
                        />
                        <div className="profile-slot-stats">
                          <span>{selected ? `Efficiency: +${getToolEfficiency(selected)}%` : "No tool selected"}</span>
                          {selected?.requirements && <small>Requires Lv. {getItemRequirementLevel(selected)}</small>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <section id="profile-housing" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Housing Snapshot</h2>
                <p>Housing is profile-scoped and powers connected timers where available.</p>
              </div>
              <a className="profile-secondary-link" href="/housing"><Home size={16} /> Open Housing</a>
            </div>
            <div className="profile-grid">
              <label className="profile-field">
                <span>Mode</span>
                <select className="control-input" value={profile.housing.mode} onChange={(event) => updateNested("housing", "mode", event.target.value as CharacterProfile["housing"]["mode"])}>
                  <option value="none">Not Set</option>
                  <option value="owner">Own House</option>
                  <option value="guest">Guest Buffs</option>
                </select>
              </label>
              <div className="profile-info-card">
                <strong>{housingSummary.availableAnywhere ? "Available anywhere" : housingSummary.locationLimited ? "Location-limited" : "Inactive"}</strong>
                <span>
                  {housingSummary.strongestIdleBonus
                    ? `${getHousingActivityLabel(housingSummary.strongestIdleBonus.activity)} +${formatHours(housingSummary.strongestIdleBonus.hours)}`
                    : "No active idle-time bonus"}
                </span>
              </div>
              <div className="profile-info-card">
                <strong>{housingSummary.activeComponentCount} active</strong>
                <span>{housingSummary.guestCapacity ? `${housingSummary.guestCapacity} guest slots` : "No guest capacity"}</span>
              </div>
              <label className="profile-field profile-field-wide">
                <span>Housing Notes</span>
                <textarea className="control-input" value={profile.housing.notes} onChange={(event) => updateNested("housing", "notes", event.target.value)} />
              </label>
            </div>
          </section>

          <section id="profile-transfer" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Import / Export</h2>
                <p>Use this JSON to move profiles between desktop and laptop. API keys and raw cache data are never included.</p>
              </div>
              <div className="profile-inline-actions">
                <button type="button" onClick={handleExport}><Download size={15} /></button>
                <button type="button" onClick={handleImport}><Upload size={15} /></button>
              </div>
            </div>
            <textarea
              className="control-input profile-transfer"
              value={transferText}
              placeholder="Exported profile JSON or paste an import payload here..."
              onChange={(event) => setTransferText(event.target.value)}
            />
          </section>
        </div>
      </section>
    </main>
  );
}
