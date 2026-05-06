"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Copy,
  Download,
  FileUp,
  Home,
  Plus,
  Search,
  Shield,
  Trash2,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import {
  MAX_PROFILES,
  type CharacterProfile,
  useProfiles,
} from "@/lib/profiles";
import { useData } from "@/context/DataContext";

const CLASS_OPTIONS = [
  {
    value: "Warrior",
    label: "Warrior",
    detail: "Melee combat class. Use this when your character is built around weapon damage and frontline stats.",
    tags: ["Combat", "Melee"],
  },
  {
    value: "Shadowblade",
    label: "Shadowblade",
    detail: "Dexterity-style combat class. Useful for profile planning where accuracy, agility, and speed matter.",
    tags: ["Combat", "Dexterity"],
  },
  {
    value: "Ranger",
    label: "Ranger",
    detail: "Ranged combat class. Keep bow and hunting-related setup linked here for future calculators.",
    tags: ["Combat", "Ranged"],
  },
  {
    value: "Cursed",
    label: "Cursed",
    detail: "Restricted class. Market/trade profit views should avoid assuming normal selling access.",
    tags: ["Restricted", "No market"],
  },
  {
    value: "Banished",
    label: "Banished",
    detail: "Restricted class. Useful for route, combat, and dungeon planning, but market profit needs special handling.",
    tags: ["Restricted", "No market"],
  },
  {
    value: "Forsaken",
    label: "Forsaken",
    detail: "Special class profile slot for future class-specific modifiers and restrictions.",
    tags: ["Special"],
  },
];

const CLASS_OPTION_VALUES = new Set(CLASS_OPTIONS.map((option) => option.value));

const QUALITY_ORDER: Record<string, number> = {
  STANDARD: 1,
  REFINED: 2,
  PREMIUM: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
  UNIQUE: 7,
};

const PET_STAT_KEYS = [
  "agility",
  "accuracy",
  "protection",
  "attack_power",
  "movement_speed",
  "max_health",
  "max_stamina",
  "critical_damage",
  "critical_chance",
] as const;

const PET_STAT_LABELS: Record<(typeof PET_STAT_KEYS)[number], string> = {
  agility: "Agility",
  accuracy: "Accuracy",
  protection: "Protection",
  attack_power: "Attack Power",
  movement_speed: "Movement Speed",
  max_health: "Max Health",
  max_stamina: "Max Stamina",
  critical_damage: "Critical Damage",
  critical_chance: "Critical Chance",
};

const BOOSTED_PET_STATS = new Set<string>([
  "agility",
  "accuracy",
  "protection",
  "attack_power",
  "movement_speed",
]);

const LEVEL_FIELDS: Array<[keyof CharacterProfile["levels"], string]> = [
  ["totalLevel", "Total Level / TL"],
  ["combat", "Combat"],
  ["strength", "Strength"],
  ["defence", "Defence"],
  ["speed", "Speed"],
  ["dexterity", "Dexterity"],
  ["huntingMastery", "Hunting Mastery"],
  ["dungeoneering", "Dungeoneering"],
  ["petMastery", "Pet Mastery"],
];

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

const GEAR_FIELDS: Array<[string, string, string[]]> = [
  ["helmet", "Helmet", ["HELMET"]],
  ["chestplate", "Chestplate", ["CHESTPLATE"]],
  ["greaves", "Greaves", ["GREAVES"]],
  ["boots", "Boots", ["BOOTS"]],
  ["gauntlets", "Gauntlets", ["GAUNTLETS"]],
  ["weapon", "Weapon", ["SWORD", "DAGGER"]],
  ["shield", "Shield", ["SHIELD"]],
  ["bow", "Bow", ["BOW"]],
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

function ProfileNumberField({
  label,
  value,
  onChange,
  step = "1",
  min,
  max,
  suffix,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  step?: string;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <div className="profile-number-wrap">
        <input
          className="control-input"
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(numberFromInput(event.target.value))}
        />
        {suffix && <em>{suffix}</em>}
      </div>
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

type ItemOption = {
  name: string;
  type?: string;
  quality?: string;
  max_tier?: number;
  image_url?: string | null;
  stats?: Record<string, number | string | null> | null;
};

type ItemDatabase = Record<string, ItemOption>;

type PetRecord = {
  name: string;
  quality?: string;
  imageUrl?: string;
  sourceOverride?: { label?: string | null } | null;
  rarity?: { worldBoss?: string | null } | null;
  acquisition?: Array<{ location?: string | null; boss?: string | null }>;
  stats?: Record<string, { max?: number | null; base?: number | null; per_level?: number | null }>;
};

type PetDatabase = {
  pets?: PetRecord[];
};

type PickerOption = {
  value: string;
  label: string;
  detail?: string;
  imageUrl?: string | null;
  badge?: string;
  tags?: string[];
};

function qualityRank(quality?: string | null) {
  return QUALITY_ORDER[String(quality || "").toUpperCase()] || 99;
}

function cleanQuality(quality?: string | null) {
  const raw = String(quality || "").trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : "";
}

function getPetSourceLabel(pet: PetRecord | null | undefined) {
  if (!pet) return "";
  return pet.sourceOverride?.label || pet.rarity?.worldBoss || pet.acquisition?.[0]?.location || "Source pending";
}

function statLabel(key: string) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPetStatEntries(pet: PetRecord | null | undefined) {
  if (!pet?.stats) return [];
  return Object.entries(pet.stats)
    .map(([key, value]) => ({
      label: statLabel(key),
      value: Number(value?.max ?? value?.base ?? 0),
    }))
    .filter((entry) => entry.value > 0)
    .slice(0, 6)
    .map((entry) => ({ ...entry, valueLabel: entry.value.toLocaleString() }));
}

function getPetMasteryBonus(petDatabase: PetDatabase | null, level: number | "") {
  const levels = (petDatabase as unknown as { mastery?: { levels?: Array<{ level?: number; stat_bonus_percent?: number }> } })?.mastery?.levels || [];
  const target = Math.min(100, Math.max(1, Number(level || 1)));
  const found = levels.find((entry) => Number(entry.level) === target) || levels.reduce<{ level?: number; stat_bonus_percent?: number } | null>((closest, entry) => {
    if (Number(entry.level) > target) return closest;
    if (!closest || Number(entry.level) > Number(closest.level)) return entry;
    return closest;
  }, null);
  const raw = Number(found?.stat_bonus_percent || 0);
  return raw <= 1 ? raw * 100 : raw;
}

function calculatePetStats(pet: PetRecord | null, petLevel: number | "", masteryLevel: number | "", evolution: number | "", petDatabase: PetDatabase | null) {
  const values: Record<string, number | ""> = {};
  if (!pet?.stats) return values;
  const level = Math.min(100, Math.max(1, Number(petLevel || 1)));
  const masteryBonus = getPetMasteryBonus(petDatabase, masteryLevel);
  const evolutionBonus = Math.max(0, Number(evolution || 0)) * 5;
  for (const key of PET_STAT_KEYS) {
    const stat = pet.stats[key];
    if (!stat) {
      values[key] = "";
      continue;
    }
    const raw = Number(stat.base || 0) + (level - 1) * Number((stat as { per_level?: number }).per_level || 0);
    const boosted = BOOSTED_PET_STATS.has(key) ? raw * (1 + (masteryBonus + evolutionBonus) / 100) : raw;
    values[key] = key === "movement_speed" || key === "critical_damage" || key === "critical_chance"
      ? Number(boosted.toFixed(2))
      : Math.floor(boosted);
  }
  return values;
}

function CustomPicker({
  label,
  value,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  onChange,
  allowClear = true,
}: {
  label: string;
  value: string;
  options: PickerOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  onChange: (value: string) => void;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value) || null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = needle
      ? options.filter((option) => [
          option.label,
          option.detail,
          option.badge,
          ...(option.tags || []),
        ].filter(Boolean).join(" ").toLowerCase().includes(needle))
      : options;
    return source.slice(0, 90);
  }, [options, query]);

  return (
    <div className={`profile-picker ${open ? "open" : ""}`}>
      <button className="profile-picker-trigger" type="button" onClick={() => setOpen((state) => !state)} aria-expanded={open}>
        {selected?.imageUrl ? <img src={selected.imageUrl} alt="" /> : <span className="profile-picker-icon">{selected?.label?.charAt(0) || "-"}</span>}
        <span className="profile-picker-copy">
          <strong>{selected?.label || placeholder}</strong>
          <small>{selected?.badge || selected?.detail || label}</small>
        </span>
        <ChevronDown size={18} />
      </button>
      {open && (
        <div className="profile-picker-menu">
          <label className="profile-picker-search">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="profile-picker-options custom-scrollbar">
            {allowClear && (
              <button
                className="profile-picker-option"
                type="button"
                onClick={() => {
                  onChange("");
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="profile-picker-icon">-</span>
                <span>
                  <strong>None</strong>
                  <small>Clear this selection</small>
                </span>
              </button>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                className={`profile-picker-option ${option.value === value ? "selected" : ""}`}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {option.imageUrl ? <img src={option.imageUrl} alt="" /> : <span className="profile-picker-icon">{option.label.charAt(0)}</span>}
                <span>
                  <strong>{option.label}</strong>
                  <small>{[option.badge, option.detail].filter(Boolean).join(" - ")}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function petSearchText(pet: PetRecord) {
  return [
    pet.name,
    pet.quality,
    getPetSourceLabel(pet),
    ...getPetStatEntries(pet).map((entry) => `${entry.label} ${entry.valueLabel}`),
  ].filter(Boolean).join(" ").toLowerCase();
}

function ProfilePetPicker({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: PetRecord[];
  onSelect: (pet: PetRecord | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = value ? options.find((pet) => pet.name.toLowerCase() === value.toLowerCase()) || null : null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 80);
    return options.filter((pet) => petSearchText(pet).includes(needle)).slice(0, 80);
  }, [options, query]);

  return (
    <div className={`profile-pet-picker ${open ? "open" : ""}`}>
      <button className="profile-pet-trigger" type="button" onClick={() => setOpen((state) => !state)}>
        {selected?.imageUrl ? <img src={selected.imageUrl} alt="" /> : <span className="profile-pet-empty-icon">?</span>}
        <span className="profile-pet-trigger-copy">
          <strong>{selected?.name || "Select pet"}</strong>
          <small>{selected ? `${cleanQuality(selected.quality) || "Unknown quality"} - ${getPetSourceLabel(selected)}` : "Search the Pet Database"}</small>
        </span>
        <ChevronDown size={18} />
      </button>

      {open && (
        <div className="profile-pet-menu">
          <label className="profile-pet-search">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              placeholder="Search pet, quality, source, or stat..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="profile-pet-options custom-scrollbar">
            <button
              className="profile-pet-option"
              type="button"
              onClick={() => {
                onSelect(null);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="profile-pet-empty-icon">-</span>
              <span>
                <strong>No pet selected</strong>
                <small>Clear pet data for this profile</small>
              </span>
            </button>
            {filtered.map((pet) => (
              <button
                key={pet.name}
                className={`profile-pet-option ${pet.name === selected?.name ? "selected" : ""}`}
                type="button"
                onClick={() => {
                  onSelect(pet);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {pet.imageUrl ? <img src={pet.imageUrl} alt="" /> : <span className="profile-pet-empty-icon">?</span>}
                <span>
                  <strong>{pet.name}</strong>
                  <small>{cleanQuality(pet.quality) || "Unknown quality"} - {getPetSourceLabel(pet)}</small>
                </span>
              </button>
            ))}
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
  const [transferMessage, setTransferMessage] = useState("");
  const [petDatabase, setPetDatabase] = useState<PetDatabase | null>(null);

  const profile = activeProfile;
  const combatStatTotal = useMemo(() => {
    if (!profile) return 0;
    return (
      Number(profile.secondaryStats.attackPower || 0) +
      Number(profile.secondaryStats.protection || 0) +
      Number(profile.secondaryStats.agility || 0) +
      Number(profile.secondaryStats.accuracy || 0)
    );
  }, [profile]);

  const itemOptionsByType = useMemo(() => {
    const grouped: Record<string, ItemOption[]> = {};
    Object.values((allItemsDb || {}) as ItemDatabase).forEach((item) => {
      if (!item?.name || !item?.type) return;
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push(item);
    });
    Object.values(grouped).forEach((items) => {
      items.sort((a, b) => qualityRank(a.quality) - qualityRank(b.quality) || a.name.localeCompare(b.name));
    });
    return grouped;
  }, [allItemsDb]);

  useEffect(() => {
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Pet database unavailable"))))
      .then((data: PetDatabase) => {
        if (!cancelled) setPetDatabase(data);
      })
      .catch(() => {
        if (!cancelled) setPetDatabase({ pets: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const petOptions = useMemo(() => {
    return [...(petDatabase?.pets || [])].sort((a, b) => qualityRank(a.quality) - qualityRank(b.quality) || a.name.localeCompare(b.name));
  }, [petDatabase]);

  const selectedPet = useMemo(() => {
    if (!profile?.pet.species) return null;
    return petOptions.find((pet) => pet.name.toLowerCase() === profile.pet.species.toLowerCase()) || null;
  }, [petOptions, profile]);

  const getSlotOptions = (types: string[]) => (
    types.flatMap((type) => itemOptionsByType[type] || [])
  );

  const getSlotPickerOptions = (types: string[]) => (
    getSlotOptions(types).map((item) => ({
      value: item.name,
      label: item.name,
      badge: cleanQuality(item.quality) || item.type || "",
      detail: item.type ? item.type.replaceAll("_", " ").toLowerCase() : "",
      imageUrl: item.image_url,
      tags: [item.quality || "", item.type || ""],
    }))
  );

  const getSelectedItem = (name: string) => (
    name ? (allItemsDb as ItemDatabase | undefined)?.[name] : undefined
  );

  const patchActive = (patch: Partial<CharacterProfile>) => {
    if (!profile) return;
    updateProfile(profile.id, patch);
  };

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

  const handleExport = async () => {
    const payload = exportProfiles();
    setTransferText(payload);
    setTransferMessage("Export generated below.");
    try {
      await navigator.clipboard?.writeText(payload);
      setTransferMessage("Export generated below and copied to clipboard.");
    } catch {
      setTransferMessage("Export generated below. Copy it from the text box.");
    }
  };

  const handleImport = () => {
    if (!transferText.trim()) {
      setTransferMessage("Paste a profile export before importing.");
      return;
    }
    const confirmed = window.confirm("Importing profiles will replace the current local profile list in this browser. Continue?");
    if (!confirmed) return;
    const result = importProfiles(transferText);
    setTransferMessage(result.ok ? "Profiles imported." : result.error || "Import failed.");
  };

  const handleDeleteProfile = () => {
    if (!profile) return;
    const confirmed = window.confirm(`Delete the local profile "${profile.name}" from this browser?`);
    if (!confirmed) return;
    deleteProfile(profile.id);
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

  const classOption = CLASS_OPTIONS.find((option) => option.value === profile.className);

  return (
    <main className="container profiles-page">
      <div className="header profile-header">
        <div>
          <h1 className="header-title"><Users size={24} color="var(--text-accent)" /> PROFILES</h1>
          <p className="profile-subtitle">Local character setups for calculators. Global prices, membership, and theme stay in Settings.</p>
        </div>
        <div className="profile-header-actions">
          <button className="profile-action" type="button" onClick={() => addProfile()} disabled={state.profiles.length >= MAX_PROFILES}>
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
                    <strong>{item.name}</strong>
                    <small>{item.kind === "main" ? "Main" : "Alt"} - {item.className || "Class not set"}</small>
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
                <button type="button" onClick={() => duplicateProfile(profile.id)} disabled={state.profiles.length >= MAX_PROFILES} title="Duplicate profile">
                  <Copy size={15} />
                </button>
                <button type="button" onClick={handleDeleteProfile} title="Delete profile">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="profile-grid">
              <ProfileTextField label="Character Name" value={profile.name} onChange={(name) => patchActive({ name })} />
              <div className="profile-field">
                <span>Class</span>
                <CustomPicker
                  label="Class"
                  value={CLASS_OPTION_VALUES.has(profile.className) ? profile.className : ""}
                  options={CLASS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                    detail: option.detail,
                    badge: option.tags[0],
                    tags: option.tags,
                  }))}
                  placeholder="Select class"
                  searchPlaceholder="Search class..."
                  onChange={(className) => patchActive({ className })}
                  allowClear={false}
                />
              </div>
              <label className="profile-field">
                <span>Character Type</span>
                <div className="profile-segmented">
                  <button type="button" className={profile.kind === "main" ? "active" : ""} onClick={() => patchActive({ kind: "main" })}>Main</button>
                  <button type="button" className={profile.kind === "alt" ? "active" : ""} onClick={() => patchActive({ kind: "alt" })}>Alt</button>
                </div>
              </label>
              {classOption && (
                <div className="profile-class-card profile-field-wide">
                  <strong>{classOption.label}</strong>
                  <p>{classOption.detail}</p>
                  <div>
                    {classOption.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
              )}
              <label className="profile-field profile-field-wide">
                <span>Notes</span>
                <textarea className="control-input" value={profile.notes} onChange={(event) => patchActive({ notes: event.target.value })} />
              </label>
            </div>
          </section>

          <section id="profile-levels" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Levels</h2>
                <p>Levels above 100 are stored as entered for future ascension-aware logic.</p>
              </div>
            </div>
            <div className="profile-grid compact">
              {LEVEL_FIELDS.map(([key, label]) => (
                <ProfileNumberField
                  key={key}
                  label={label}
                  value={profile.levels[key]}
                  min={key === "totalLevel" ? 20 : 1}
                  max={key === "totalLevel" ? 2300 : key === "strength" || key === "defence" || key === "speed" || key === "dexterity" || key === "petMastery" ? 100 : 600}
                  onChange={(value) => {
                    if (key === "petMastery") {
                      const nextStats = calculatePetStats(selectedPet, profile.pet.level, value, profile.pet.evolution, petDatabase);
                      patchActive({
                        levels: { ...profile.levels, [key]: value },
                        pet: { ...profile.pet, stats: { ...profile.pet.stats, ...nextStats } },
                      });
                      return;
                    }
                    updateNested("levels", key, value);
                  }}
                />
              ))}
            </div>
          </section>

          <section id="profile-combat" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Combat Snapshot</h2>
                <p>Use the visible final values from the game. Auto-calculation comes after gear and pet formulas are verified.</p>
              </div>
              <div className="profile-stat-pill"><Shield size={14} /> {combatStatTotal.toLocaleString()} dungeon stats</div>
            </div>
            <div className="profile-grid compact">
              {SECONDARY_FIELDS.map(([key, label]) => (
                <ProfileNumberField
                  key={key}
                  label={label}
                  value={profile.secondaryStats[key]}
                  step={key === "movementSpeed" ? "0.01" : "1"}
                  min={key === "criticalChance" || key === "criticalDamage" || key === "damage" ? 0 : key === "movementSpeed" ? 3 : 2}
                  suffix={key === "movementSpeed" ? "m/s" : undefined}
                  onChange={(value) => updateNested("secondaryStats", key, value)}
                />
              ))}
            </div>
          </section>

          <section id="profile-magic" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Magic, Efficiency, Timers</h2>
                <p>Final visible values first. Page-specific potions, essence, shrine, and weather stay on the relevant page.</p>
              </div>
            </div>
            <div className="profile-grid compact">
              <ProfileNumberField label="Combat Magic Find" value={profile.magicFind.combat} min={0} suffix="%" onChange={(value) => updateNested("magicFind", "combat", value)} />
              <ProfileNumberField label="Dungeon Magic Find" value={profile.magicFind.dungeon} min={0} suffix="%" onChange={(value) => updateNested("magicFind", "dungeon", value)} />
              <ProfileNumberField label="World Boss Magic Find" value={profile.magicFind.worldBoss} min={0} suffix="%" onChange={(value) => updateNested("magicFind", "worldBoss", value)} />
              <ProfileNumberField label="Daily Streak" value={profile.magicFind.dailyStreak} min={0} onChange={(value) => updateNested("magicFind", "dailyStreak", value)} />
              <ProfileNumberField label="Hunting Efficiency" value={profile.efficiency.hunting} min={0} suffix="%" onChange={(value) => updateNested("efficiency", "hunting", value)} />
              <ProfileNumberField label="Dungeon Efficiency" value={profile.efficiency.dungeon} min={0} suffix="%" onChange={(value) => updateNested("efficiency", "dungeon", value)} />
              <ProfileNumberField
                label="Playtime (hours/day)"
                value={profile.timers.activeHours || profile.timers.idleTimerHours}
                step="0.25"
                min={0}
                max={24}
                suffix="hours"
                onChange={(value) => patchActive({ timers: { activeHours: value, idleTimerHours: "" } })}
              />
            </div>
          </section>

          <section id="profile-pet" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Pet</h2>
                <p>Select a pet from the Pet Database, then store level and evolution for calculators.</p>
              </div>
            </div>
            <div className="profile-grid">
              <div className="profile-field">
                <span>Pet</span>
                <ProfilePetPicker
                  value={profile.pet.species}
                  options={petOptions}
                  onSelect={(pet) => {
                    const nextStats = calculatePetStats(pet, profile.pet.level, profile.levels.petMastery, profile.pet.evolution, petDatabase);
                    patchActive({
                      pet: {
                        ...profile.pet,
                        species: pet?.name || "",
                        quality: pet?.quality || "",
                        stats: { ...profile.pet.stats, ...nextStats },
                        notes: pet?.name === profile.pet.species ? profile.pet.notes : "",
                      },
                    });
                  }}
                />
              </div>
              <label className="profile-field">
                <span>Quality</span>
                <input className="control-input" type="text" value={profile.pet.quality} readOnly placeholder="Select a pet" />
              </label>
              <ProfileNumberField
                label="Pet Level"
                value={profile.pet.level}
                min={1}
                max={100}
                onChange={(value) => {
                  const nextStats = calculatePetStats(selectedPet, value, profile.levels.petMastery, profile.pet.evolution, petDatabase);
                  patchActive({ pet: { ...profile.pet, level: value, stats: { ...profile.pet.stats, ...nextStats } } });
                }}
              />
              <ProfileNumberField
                label="Evolution Level"
                value={profile.pet.evolution}
                min={0}
                max={5}
                onChange={(value) => {
                  const nextStats = calculatePetStats(selectedPet, profile.pet.level, profile.levels.petMastery, value, petDatabase);
                  patchActive({ pet: { ...profile.pet, evolution: value, stats: { ...profile.pet.stats, ...nextStats } } });
                }}
              />
              {selectedPet && (
                <div className="profile-pet-card profile-field-wide">
                  {selectedPet.imageUrl ? <img src={selectedPet.imageUrl} alt="" /> : null}
                  <div>
                    <strong>{selectedPet.name}</strong>
                    <span>{getPetSourceLabel(selectedPet)}</span>
                    <div className="profile-pet-stat-grid">
                      {getPetStatEntries(selectedPet).length ? getPetStatEntries(selectedPet).map((entry) => (
                        <small key={entry.label}><b>{entry.label}</b> {entry.valueLabel}</small>
                      )) : <small>Stats pending in local database</small>}
                    </div>
                  </div>
                </div>
              )}
              <div className="profile-field profile-field-wide">
                <span>Pet Stats</span>
                <div className="profile-grid compact profile-pet-stat-editor">
                  {PET_STAT_KEYS.map((key) => (
                    <ProfileNumberField
                      key={key}
                      label={PET_STAT_LABELS[key]}
                      value={profile.pet.stats?.[key] ?? ""}
                      step={key === "movement_speed" || key === "critical_damage" || key === "critical_chance" ? "0.01" : "1"}
                      suffix={key === "movement_speed" ? "m/s" : undefined}
                      onChange={(value) => patchActive({ pet: { ...profile.pet, stats: { ...profile.pet.stats, [key]: value } } })}
                    />
                  ))}
                </div>
              </div>
              <label className="profile-field profile-field-wide">
                <span>Pet Notes</span>
                <textarea
                  className="control-input"
                  value={profile.pet.notes}
                  placeholder="Optional notes from your character screen..."
                  onChange={(event) => updateNested("pet", "notes", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section id="profile-gear" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Gear And Tools</h2>
                <p>Gear and tools come from the item database. Tier modifiers are stored per profile for future stat calculation.</p>
              </div>
            </div>
            <div className="profile-dual-grid">
              <div>
                <h3><Shield size={14} /> Gear</h3>
                <div className="profile-grid single">
                  {GEAR_FIELDS.map(([key, label, types]) => {
                    const selected = getSelectedItem(profile.gear[key] || "");
                    const maxTier = Number(selected?.max_tier || 0);
                    return (
                      <div key={key} className="profile-item-slot">
                        <div className="profile-field">
                          <span>{label}</span>
                          <CustomPicker
                            label={label}
                            value={profile.gear[key] || ""}
                            options={getSlotPickerOptions(types)}
                            placeholder={`Select ${label.toLowerCase()}`}
                            searchPlaceholder={`Search ${label.toLowerCase()}...`}
                            onChange={(value) => {
                              patchActive({
                                gear: { ...profile.gear, [key]: value },
                                gearTiers: { ...profile.gearTiers, [key]: "" },
                              });
                            }}
                          />
                        </div>
                        <ProfileNumberField
                          label={`Tier${maxTier ? ` / ${maxTier}` : ""}`}
                          value={profile.gearTiers?.[key] || ""}
                          min={0}
                          max={maxTier || undefined}
                          onChange={(value) => patchActive({ gearTiers: { ...profile.gearTiers, [key]: maxTier ? Math.min(Number(value) || 0, maxTier) : value } })}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3><FileUp size={14} /> Tools</h3>
                <div className="profile-grid single">
                  {TOOL_FIELDS.map(([key, label, types]) => (
                    <div key={key} className="profile-field">
                      <span>{label}</span>
                      <CustomPicker
                        label={label}
                        value={profile.tools[key] || ""}
                        options={getSlotPickerOptions(types)}
                        placeholder={`Select ${label.toLowerCase()}`}
                        searchPlaceholder={`Search ${label.toLowerCase()}...`}
                        onChange={(value) => patchActive({ tools: { ...profile.tools, [key]: value } })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="profile-housing" className="profile-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>Housing Snapshot</h2>
                <p>Housing gets its own page later. This stores the current profile boundary.</p>
              </div>
              <Home size={18} color="var(--text-accent)" />
            </div>
            <div className="profile-grid">
              <div className="profile-field">
                <span>Mode</span>
                <CustomPicker
                  label="Housing mode"
                  value={profile.housing.mode}
                  options={[
                    { value: "none", label: "Not Set", detail: "No housing data stored yet" },
                    { value: "owner", label: "Own House", detail: "Track this profile as the house owner" },
                    { value: "guest", label: "Guest Buffs", detail: "Store buffs received from another house" },
                  ]}
                  placeholder="Select housing mode"
                  searchPlaceholder="Search housing mode..."
                  onChange={(value) => updateNested("housing", "mode", (value || "none") as CharacterProfile["housing"]["mode"])}
                  allowClear={false}
                />
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
            <div className="profile-transfer-actions">
              <button className="profile-action" type="button" onClick={handleExport}><Download size={15} /> Generate export</button>
              <button className="profile-action" type="button" onClick={handleImport}><Upload size={15} /> Import pasted profiles</button>
            </div>
            {transferMessage && <p className="profile-transfer-message">{transferMessage}</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
