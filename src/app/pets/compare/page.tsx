"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  Gauge,
  HeartPulse,
  MapPinned,
  PawPrint,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { getProfileStorageKey } from "@/lib/profile-storage";
import { useProfiles, type ProfileOwnedPet, type ProfilePetStats } from "@/lib/profiles";
import ZenithIcon from "@/components/icons/ZenithIcon";
import {
  BattleProfitMode,
  COMPARISON_STAT_KEYS,
  FoodPolicy,
  PetDatabase,
  PetRecord,
  QUALITY_COLORS,
  QUALITY_ORDER,
  STAT_LABELS,
  StatKey,
  buildPetMatchLookup,
  calculatePetStats,
  clampNumber,
  findPetRecordForOwnedPet,
  formatGold,
  formatNumber,
  getBestBattleProfit,
  getHuntingTimeSeconds,
  getMasteryBonus,
  getPetImage,
  getPetRecordMatchKey,
  getPetSourceLabel,
  getTotalPower,
  getZoneProfitValue,
  isUpsideDownPet,
  petSearchText,
  qualityLabel,
  secondsToDuration,
} from "@/lib/pets";
import styles from "./page.module.css";

const STORAGE_KEY = "zenith_pet_compare_state_v1";
const MAX_COMPARE = 4;

type CompareState = {
  selectedIds?: string[];
  selectedNames?: string[];
  petLevel?: number;
  masteryLevel?: number;
  evolutionStage?: number;
  evolutionStat?: StatKey | "all";
  patBonus?: boolean;
  battleMode?: BattleProfitMode;
  battleZone?: string;
  foodPolicy?: FoodPolicy;
};

type ComparedPet = {
  id: string;
  label: string;
  subtitle: string;
  source: "database" | "owned";
  pet: PetRecord;
  ownedPet?: ProfileOwnedPet;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  battle: ReturnType<typeof getBestBattleProfit>;
};

type PetOption = {
  id: string;
  kind: "database" | "owned";
  pet: PetRecord;
  ownedPet?: ProfileOwnedPet;
  title: string;
  subtitle: string;
  meta: string;
  searchText: string;
};

const EVOLUTION_OPTIONS: Array<{ value: StatKey | "all"; label: string }> = [
  { value: "all", label: "All-stat preview" },
  { value: "agility", label: "Agility" },
  { value: "accuracy", label: "Accuracy" },
  { value: "protection", label: "Protection" },
  { value: "attack_power", label: "Attack Power" },
  { value: "movement_speed", label: "Move Speed" },
];

const BATTLE_OPTIONS: Array<{ value: BattleProfitMode; label: string }> = [
  { value: "withSleep", label: "With sleep" },
  { value: "noSleep", label: "No sleep" },
  { value: "healingWithSleep", label: "Healing + sleep" },
];

const FOOD_OPTIONS: Array<{ value: FoodPolicy; label: string }> = [
  { value: "standard", label: "Food cost" },
  { value: "none", label: "No food cost" },
];

const BEST_BATTLE_ZONE = "best";
const DATABASE_OPTION_PREFIX = "db:";
const OWNED_OPTION_PREFIX = "owned:";

const PROFILE_STAT_TO_COMPARE_STAT: Array<[keyof ProfilePetStats, StatKey]> = [
  ["agility", "agility"],
  ["accuracy", "accuracy"],
  ["protection", "protection"],
  ["attackPower", "attack_power"],
  ["movementSpeed", "movement_speed"],
  ["maxHealth", "max_health"],
  ["maxStamina", "max_stamina"],
  ["criticalDamage", "critical_damage"],
  ["criticalChance", "critical_chance"],
];

function databaseOptionId(name: string) {
  return `${DATABASE_OPTION_PREFIX}${name}`;
}

function ownedOptionId(id: string) {
  return `${OWNED_OPTION_PREFIX}${id}`;
}

function toStatNumber(value: number | "") {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function ownedPetStatsToComparisonStats(stats: ProfilePetStats): Partial<Record<StatKey, number>> {
  return Object.fromEntries(PROFILE_STAT_TO_COMPARE_STAT.map(([profileKey, compareKey]) => [compareKey, toStatNumber(stats[profileKey])])) as Partial<
    Record<StatKey, number>
  >;
}

function ownedPetMissingStatCount(stats: ProfilePetStats) {
  return PROFILE_STAT_TO_COMPARE_STAT.filter(([profileKey]) => stats[profileKey] === "").length;
}

function ownedPetSearchText(ownedPet: ProfileOwnedPet) {
  return [
    ownedPet.nickname,
    ownedPet.species,
    ownedPet.quality,
    ownedPet.source,
    ownedPet.location?.name,
    ownedPet.hashTail,
    ownedPet.apiId,
    ownedPet.petId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function formatOwnedPetMeta(ownedPet: ProfileOwnedPet) {
  const level = ownedPet.level === "" ? "Lv. ?" : `Lv. ${ownedPet.level}`;
  const evolution = ownedPet.evolution === "" ? "Evo ?" : `Evo ${ownedPet.evolution}`;
  const source = ownedPet.source === "imported" ? "Imported" : "Manual";
  return `${source} snapshot - ${level} - ${evolution}`;
}

function PetImage({ pet }: { pet: PetRecord }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const image = getPetImage(pet);
  return (
    <div className={styles.petAvatar}>
      {(!image || failed || !loaded) && <PawPrint size={28} />}
      {image && !failed ? (
        <img
          src={image}
          alt=""
          className={`${loaded ? styles.petImageLoaded : styles.petImageLoading} ${isUpsideDownPet(pet) ? styles.petImageUpsideDown : ""}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (rawValue: string) => {
    if (rawValue === "") {
      setDraft("");
      return;
    }
    const nextValue = clampNumber(Number(rawValue), min, max);
    setDraft(String(nextValue));
    onChange(nextValue);
  };

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => {
          if (draft === "") setDraft(String(value));
        }}
      />
    </label>
  );
}

function OptionMenu<T extends string>({
  label,
  value,
  options,
  open,
  onOpen,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  open: boolean;
  onOpen: (open: boolean) => void;
  onChange: (value: T) => void;
}) {
  const selected = options.find((option) => option.value === value) || options[0];
  const reactId = useId();
  const menuId = `pet-compare-menu-${reactId}`;
  const labelId = `${menuId}-label`;
  const valueId = `${menuId}-value`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    window.requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [open, selectedIndex]);

  const closeMenu = (returnFocus = true) => {
    onOpen(false);
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const moveToOption = (index: number) => {
    const nextIndex = Math.min(options.length - 1, Math.max(0, index));
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  };

  const chooseOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        onOpen(true);
        return;
      }
      moveToOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        onOpen(true);
        return;
      }
      moveToOption(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      if (open) moveToOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      if (open) moveToOption(options.length - 1);
    } else if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      chooseOption(activeIndex);
    }
  };

  return (
    <div className={`${styles.field} ${styles.menuField}`} data-menu-root>
      <span id={labelId}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className={styles.menuTrigger}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        onKeyDown={handleKeyDown}
        onClick={() => onOpen(!open)}
      >
        <span id={valueId}>{selected.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.menuPanel} id={menuId} role="listbox" aria-labelledby={labelId} onKeyDown={handleKeyDown}>
          {options.map((option, index) => (
            <button
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              key={option.value}
              className={option.value === value ? styles.selectedOption : ""}
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => {
                onChange(option.value);
                closeMenu();
              }}
              onFocus={() => setActiveIndex(index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PetPicker({
  slotIndex,
  value,
  options,
  open,
  onOpen,
  onSelect,
  onClear,
}: {
  slotIndex: number;
  value: string | null;
  options: PetOption[];
  open: boolean;
  onOpen: (open: boolean) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const selected = options.find((option) => option.id === value) || null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options
      .filter((option) => !needle || option.searchText.includes(needle))
      .slice(0, 32);
  }, [options, query]);

  const closePicker = () => {
    setQuery("");
    onOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  return (
    <div className={styles.picker} data-menu-root>
      <button
        ref={triggerRef}
        type="button"
        className={styles.pickerTrigger}
        style={selected ? ({ "--accent": QUALITY_COLORS[selected.pet.quality] } as CSSProperties) : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => onOpen(!open)}
      >
        {selected ? <PetImage pet={selected.pet} /> : <div className={styles.emptyAvatar}>{slotIndex + 1}</div>}
        <span>
          <strong>{selected?.title || `Choose pet ${slotIndex + 1}`}</strong>
          <small>{selected ? `${selected.subtitle}${selected.kind === "owned" ? " / Snapshot stats" : ""}` : "Search pet database or owned snapshots"}</small>
        </span>
        <ChevronDown size={17} />
      </button>
      {selected && (
        <button type="button" className={styles.clearSlot} onClick={onClear} aria-label={`Clear ${selected.title} from comparison`} title="Clear pet slot">
          <X size={15} />
        </button>
      )}
      {open && (
        <div className={styles.pickerPanel} role="dialog" aria-label={`Choose pet for comparison slot ${slotIndex + 1}`}>
          <div className={styles.pickerPanelHeader}>
            <span>Choose pet</span>
            <button
              type="button"
              onClick={closePicker}
              aria-label="Close pet picker"
            >
              <X size={16} />
            </button>
          </div>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pet, boss, source..."
              aria-label={`Search pets for comparison slot ${slotIndex + 1}`}
            />
          </label>
          <div className={styles.petOptions}>
            {filtered.map((option) => (
              <button
                type="button"
                key={option.id}
                className={option.id === value ? styles.petOptionSelected : ""}
                onClick={() => {
                  onSelect(option.id);
                  closePicker();
                }}
              >
                <PetImage pet={option.pet} />
                <span>
                  <strong>{option.title}</strong>
                  <small>
                    {option.subtitle}
                  </small>
                </span>
                <em className={option.kind === "owned" ? styles.ownedOptionMeta : undefined}>{option.meta}</em>
              </button>
            ))}
            {!filtered.length && <div className={styles.emptyList}>No pets match that search.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function metricValue(row: ComparedPet, key: string) {
  if (key === "power") return row.totalPower;
  if (key === "hunt") return row.huntingTime;
  if (key === "battle") return row.battle.value;
  if (key === "market") return row.pet.exchange?.minPrice || 0;
  return Number(row.stats[key as StatKey] || 0);
}

function getBattleModeLabel(mode: BattleProfitMode) {
  return BATTLE_OPTIONS.find((option) => option.value === mode)?.label || "Battle sample";
}

function getFoodPolicyLabel(policy: FoodPolicy) {
  return policy === "standard" ? "Food cost included" : "Food cost ignored";
}

function formatBattleEv(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value === 0) return "0g";
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "" : "-";
  return `${sign}${Math.abs(rounded).toLocaleString()}g`;
}

function getRecordedZoneCount(pet: PetRecord) {
  return pet.battle?.zones?.filter((zone) => zone.zone).length || 0;
}

function getRecordedDropCount(pet: PetRecord, zoneName: string | null) {
  if (!zoneName) return 0;
  const zone = pet.battle?.zones?.find((entry) => entry.zone === zoneName);
  return zone?.drops?.filter((drop) => drop.itemName).length || 0;
}

export default function PetComparisonPage() {
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const loadedStorageKeyRef = useRef<string | null>(null);
  const activeProfileId = activeProfile?.id || null;
  const storageKey = useMemo(() => getProfileStorageKey(STORAGE_KEY, activeProfileId), [activeProfileId]);

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

    try {
      const raw = localStorage.getItem(storageKey) ?? (activeProfileId ? null : localStorage.getItem(STORAGE_KEY));
      if (raw) {
        const stored = JSON.parse(raw) as CompareState;
        if (Array.isArray(stored.selectedIds)) {
          setSelectedIds(stored.selectedIds.slice(0, MAX_COMPARE));
        } else if (Array.isArray(stored.selectedNames)) {
          setSelectedIds(stored.selectedNames.map(databaseOptionId).slice(0, MAX_COMPARE));
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
  }, [activeProfileId, storageKey]);

  useEffect(() => {
    if (loadedStorageKeyRef.current !== storageKey) return;
    const payload: CompareState = { selectedIds, petLevel, masteryLevel, evolutionStage, evolutionStat, patBonus, battleMode, battleZone, foodPolicy };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [battleMode, battleZone, evolutionStage, evolutionStat, foodPolicy, masteryLevel, patBonus, petLevel, selectedIds, storageKey]);

  useEffect(() => {
    let cancelled = false;
    fetch("/pet-database.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Pet comparison data is unavailable."))))
      .then((data: PetDatabase) => {
        if (!cancelled) setDatabase(data);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Pet comparison data is unavailable.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest("[data-menu-root]")) setOpenMenu(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [openMenu]);

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
    () => (activeProfile?.ownedPets || []).filter((ownedPet) => !findPetRecordForOwnedPet(ownedPet, petMatchLookup)).length,
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

  const masteryBonus = useMemo(() => getMasteryBonus(database, masteryLevel), [database, masteryLevel]);

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
    if (battleZone !== BEST_BATTLE_ZONE && !battleZoneOptions.some((option) => option.value === battleZone)) {
      setBattleZone(BEST_BATTLE_ZONE);
    }
  }, [battleZone, battleZoneOptions]);

  const getBattleSample = useCallback((pet: PetRecord) => {
    if (battleZone === BEST_BATTLE_ZONE) return getBestBattleProfit(pet, battleMode, foodPolicy);
    const zone = pet.battle?.zones?.find((entry) => entry.zone === battleZone);
    if (!zone) return { value: 0, zone: null as string | null, mode: null as BattleProfitMode | null };
    return { value: getZoneProfitValue(zone, battleMode, foodPolicy), zone: zone.zone, mode: battleMode };
  }, [battleMode, battleZone, foodPolicy]);

  const rows = useMemo<ComparedPet[]>(() => {
    return selectedIds
      .map((id) => compareOptions.find((option) => option.id === id))
      .filter((option): option is PetOption => Boolean(option))
      .map((option) => {
        const stats = option.ownedPet
          ? ownedPetStatsToComparisonStats(option.ownedPet.stats)
          : calculatePetStats(option.pet, petLevel, masteryBonus, evolutionStage, evolutionStat, patBonus);
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
  }, [compareOptions, evolutionStage, evolutionStat, getBattleSample, masteryBonus, patBonus, petLevel, selectedIds]);

  const unavailableSelectedIds = useMemo(
    () => selectedIds.filter((id) => !compareOptions.some((option) => option.id === id)),
    [compareOptions, selectedIds],
  );

  const profilePetOption = useMemo(() => {
    const activeOwnedPet = compareOptions.find((option) => option.kind === "owned" && option.ownedPet && (option.ownedPet.active || option.ownedPet.equipped));
    if (activeOwnedPet) return activeOwnedPet;
    if (!activeProfilePetSpecies) return null;
    const profilePet = findPetRecordForOwnedPet({ species: activeProfilePetSpecies }, petMatchLookup);
    if (!profilePet) return null;
    return compareOptions.find((option) => option.kind === "database" && getPetRecordMatchKey(option.pet) === getPetRecordMatchKey(profilePet)) || null;
  }, [activeProfilePetSpecies, compareOptions, petMatchLookup]);

  const topPicks = useMemo(() => {
    const winners = new Map<string, PetRecord>();
    let highestPower: { pet: PetRecord; value: number } | null = null;
    let fastestHunt: { pet: PetRecord; value: number } | null = null;
    let highestBattle: { pet: PetRecord; value: number } | null = null;
    let highestMarket: { pet: PetRecord; value: number } | null = null;

    for (const pet of pets) {
      const stats = calculatePetStats(pet, petLevel, masteryBonus, evolutionStage, evolutionStat, patBonus);
      const power = getTotalPower(stats);
      const hunt = getHuntingTimeSeconds(stats);
      const battle = getBattleSample(pet).value;
      const market = pet.exchange?.minPrice || 0;
      if (!highestPower || power > highestPower.value) highestPower = { pet, value: power };
      if (!fastestHunt || hunt < fastestHunt.value) fastestHunt = { pet, value: hunt };
      if (battle > 0 && (!highestBattle || battle > highestBattle.value)) highestBattle = { pet, value: battle };
      if (market > 0 && (!highestMarket || market > highestMarket.value)) highestMarket = { pet, value: market };
    }

    if (highestPower) winners.set("Highest power", highestPower.pet);
    if (fastestHunt) winners.set("Lowest formula hunt time", fastestHunt.pet);
    if (highestBattle) winners.set("Highest recorded EV", highestBattle.pet);
    if (highestMarket) winners.set("Highest sale value", highestMarket.pet);
    return Array.from(winners.entries());
  }, [evolutionStage, evolutionStat, getBattleSample, masteryBonus, patBonus, petLevel, pets]);

  const battleCoverage = useMemo(() => {
    const petsWithBattle = pets.filter((pet) => (pet.battle?.zones || []).some((zone) => zone.zone));
    const selectedZonePets = battleZone === BEST_BATTLE_ZONE
      ? petsWithBattle.length
      : petsWithBattle.filter((pet) => pet.battle?.zones?.some((zone) => zone.zone === battleZone)).length;
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

  const clearSlot = (index: number) => setSelectedIds((current) => current.filter((_, slotIndex) => slotIndex !== index));

  const metricBounds = useMemo(() => {
    const keys = ["power", "hunt", "battle", "market", ...COMPARISON_STAT_KEYS];
    return Object.fromEntries(
      keys.map((key) => {
        const values = rows.map((row) => metricValue(row, key)).filter((value) => Number.isFinite(value) && value > 0);
        return [key, { max: Math.max(0, ...values), min: values.length ? Math.min(...values) : 0 }];
      }),
    ) as Record<string, { max: number; min: number }>;
  }, [rows]);

  const slotCount = Math.max(2, Math.min(MAX_COMPARE, selectedIds.length + 1));
  const slots = Array.from({ length: selectedIds.length >= MAX_COMPARE ? MAX_COMPARE : slotCount }, (_, index) => selectedIds[index] || null);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.kicker}>
            <ZenithIcon name="pets" size={17} /> Pet Comparison
          </span>
          <h1>Compare Pets</h1>
          <p>Pick pets, adjust the shared stat setup, and compare hunting speed, recorded battle EV, sources, and sale listings.</p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/pets" className={styles.secondaryLink}>
            Pet Database <ArrowRight size={16} />
          </Link>
          <button type="button" className={styles.secondaryLink} onClick={() => setSelectedIds([])}>
            <Trash2 size={16} /> Clear comparison
          </button>
        </div>
      </section>

      {loadError && <div className={styles.state}>{loadError}</div>}
      {!database && !loadError && <div className={styles.state}>Loading pet comparison data...</div>}

      {database && (
        <>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.kicker}>Scenario</span>
                <h2>Shared Pet Setup</h2>
              </div>
              {profilePetOption && (
                <button type="button" className={styles.profilePetButton} onClick={() => addPet(profilePetOption.id)}>
                  <Sparkles size={16} />
                  Add {activeProfile?.name}&apos;s {profilePetOption.title}
                </button>
              )}
            </div>
            <div className={styles.controls}>
              <NumberField label="Pet level" value={petLevel} min={1} max={100} onChange={setPetLevel} />
              <NumberField label="Pet Mastery" value={masteryLevel} min={1} max={100} onChange={setMasteryLevel} />
              <NumberField label="Evolution" value={evolutionStage} min={0} max={5} onChange={setEvolutionStage} />
              <OptionMenu label="Evolution stat" value={evolutionStat} options={EVOLUTION_OPTIONS} open={openMenu === "evolution"} onOpen={(open) => setOpenMenu(open ? "evolution" : null)} onChange={setEvolutionStat} />
              <OptionMenu label="Battle sample" value={battleMode} options={BATTLE_OPTIONS} open={openMenu === "battle"} onOpen={(open) => setOpenMenu(open ? "battle" : null)} onChange={setBattleMode} />
              <OptionMenu label="Battle zone" value={battleZone} options={battleZoneOptions} open={openMenu === "battle-zone"} onOpen={(open) => setOpenMenu(open ? "battle-zone" : null)} onChange={setBattleZone} />
              <OptionMenu label="Food" value={foodPolicy} options={FOOD_OPTIONS} open={openMenu === "food"} onOpen={(open) => setOpenMenu(open ? "food" : null)} onChange={setFoodPolicy} />
              <button
                type="button"
                className={`${styles.toggle} ${patBonus ? styles.activeToggle : ""}`}
                aria-pressed={patBonus}
                onClick={() => setPatBonus((value) => !value)}
              >
                <HeartPulse size={16} /> Pat +5%
              </button>
            </div>
            <p className={styles.snapshotHint}>Shared setup affects database pets only; owned snapshots use saved stats.</p>
            <p className={styles.scenarioNote}>
              Level, mastery, evolution, and pat affect database species previews. Owned snapshots keep imported/manual stat values. Battle EV uses recorded
              research data only; it does not import live pet state, route movement, active map position, or future combat scaling.
            </p>
            <div className={styles.auditGrid} aria-label="Pet comparison assumptions">
              <div className={styles.auditCard}>
                <Database size={17} />
                <span>Battle data</span>
                <strong>Research snapshot</strong>
                <small>Compared only where recorded zones exist.</small>
              </div>
              <div className={styles.auditCard}>
                <MapPinned size={17} />
                <span>Zone picker</span>
                <strong>{battleZone === BEST_BATTLE_ZONE ? "Best recorded zone" : battleZone.replace(/^Level\s+/, "L")}</strong>
                <small>No travel path or map-routing rank is applied.</small>
              </div>
              <div className={styles.auditCard}>
                <Clock3 size={17} />
                <span>Cycle model</span>
                <strong>{getBattleModeLabel(battleMode)}</strong>
                <small>Uses the selected recorded sleep/stamina scenario.</small>
              </div>
              <div className={styles.auditCard}>
                <Utensils size={17} />
                <span>Food model</span>
                <strong>{getFoodPolicyLabel(foodPolicy)}</strong>
                <small>Food is toggled from the recorded cheapest food cost.</small>
              </div>
            </div>
            <div className={styles.contextStrip} aria-label="Recorded battle coverage summary">
              <div>
                <span>Battle coverage</span>
                <strong>{battleCoverage.selectedZonePets}/{battleCoverage.petsWithBattle} pets</strong>
                <small>{battleZone === BEST_BATTLE_ZONE ? "Any recorded zone" : battleZone.replace(/^Level\s+/, "L")}</small>
              </div>
              <div>
                <span>Compared now</span>
                <strong>{battleCoverage.comparedWithZone}/{rows.length || 0}</strong>
                <small>Only selected pets are shown below.</small>
              </div>
              <div>
                <span>Ranking scope</span>
                <strong>Recorded EV only</strong>
                <small>No route travel, current map position, or live battle state.</small>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.kicker}>Selection</span>
                <h2>Pets To Compare</h2>
              </div>
              <div className={styles.countPill}>{rows.length}/{MAX_COMPARE}</div>
            </div>
            <div className={styles.pickerGrid}>
              {slots.map((name, index) => (
                <PetPicker
                  key={index}
                  slotIndex={index}
                  value={name}
                  options={compareOptions}
                  open={openMenu === `pet-${index}`}
                  onOpen={(open) => setOpenMenu(open ? `pet-${index}` : null)}
                  onSelect={(optionId) => setSlot(index, optionId)}
                  onClear={() => clearSlot(index)}
                />
              ))}
            </div>
            {unavailableSelectedIds.length > 0 && (
              <div className={styles.warningNotice} role="status">
                <span>{unavailableSelectedIds.length} saved comparison slot{unavailableSelectedIds.length === 1 ? "" : "s"} could not be restored for this profile or database version.</span>
                <button type="button" onClick={() => setSelectedIds((current) => current.filter((id) => !unavailableSelectedIds.includes(id)))}>
                  Remove unavailable
                </button>
              </div>
            )}
            {unmatchedOwnedPetCount > 0 && (
              <p className={styles.quickPickNote}>
                {unmatchedOwnedPetCount} owned snapshot{unmatchedOwnedPetCount === 1 ? "" : "s"} cannot be compared yet because the species does not match the pet database:
                {" "}
                {unmatchedOwnedPetNames.slice(0, 3).join(", ")}
                {unmatchedOwnedPetNames.length > 3 ? ` +${unmatchedOwnedPetNames.length - 3}` : ""}.
                {" "}
                <Link href="/pets/owned">Review owned pets</Link>
              </p>
            )}
            <div className={styles.quickPicks}>
              {topPicks.map(([label, pet]) => (
                <button type="button" key={label} onClick={() => addPet(databaseOptionId(pet.name))}>
                  <span>{label}</span>
                  <strong>{pet.name}</strong>
                </button>
              ))}
            </div>
            <p className={styles.quickPickNote}>Quick picks use the shared formula setup and market listings only; they are not personalized map or route recommendations.</p>
          </section>

          {rows.length === 0 ? (
            <section className={styles.emptyState}>
              <PawPrint size={38} />
              <h2>Select a pet to preview, add another to compare.</h2>
              <p>Use the quick picks or search by pet, boss, source, rarity, or exchange listing.</p>
            </section>
          ) : (
            <>
              <section className={styles.compareCards}>
                {rows.map((row) => {
                  const recordedZones = getRecordedZoneCount(row.pet);
                  const recordedDrops = getRecordedDropCount(row.pet, row.battle.zone);
                  return (
                    <article key={row.id} className={styles.compareCard} style={{ "--accent": QUALITY_COLORS[row.pet.quality] } as CSSProperties}>
                      <div className={styles.cardTop}>
                        <PetImage pet={row.pet} />
                        <div>
                          <h3>{row.label}</h3>
                          <p>{row.subtitle}</p>
                        </div>
                        <span>{row.source === "owned" ? "Snapshot stats" : qualityLabel(row.pet.quality)}</span>
                      </div>
                      <div className={styles.cardStats}>
                        <div>
                          <Swords size={15} />
                          <strong>{formatNumber(row.totalPower)}</strong>
                          <span>Power</span>
                        </div>
                        <div>
                          <Gauge size={15} />
                          <strong>{formatNumber(row.stats.movement_speed, 2)}m/s</strong>
                          <span>Move</span>
                        </div>
                        <div>
                          <Clock3 size={15} />
                          <strong>{secondsToDuration(row.huntingTime)}</strong>
                          <span>Hunt</span>
                        </div>
                      </div>
                      <div className={styles.cardFooter}>
                        <span>{row.battle.zone || "No recorded zone"}</span>
                        <strong className={row.battle.value < 0 ? styles.lossValue : ""}>
                          {row.battle.zone ? `${formatBattleEv(row.battle.value)}/hr` : "No EV"}
                        </strong>
                      </div>
                      <div className={styles.sampleBadges} aria-label={`${row.label} recorded battle coverage`}>
                        {row.ownedPet && <span>{qualityLabel(row.pet.quality)} species match</span>}
                        {row.ownedPet && <span>Snapshot stats</span>}
                        {row.ownedPet && ownedPetMissingStatCount(row.ownedPet.stats) > 0 && <span>{ownedPetMissingStatCount(row.ownedPet.stats)} missing stats count as 0</span>}
                        <span>{recordedZones} recorded zones</span>
                        <span>{recordedDrops ? `${recordedDrops} drop rows` : "Drops not recorded"}</span>
                        <span>{battleZone === BEST_BATTLE_ZONE ? "Best recorded only" : "Selected zone"}</span>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.kicker}>Breakdown</span>
                    <h2>Side-by-Side Metrics</h2>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <div className={styles.tableScrollHint}>Swipe sideways for metrics</div>
                  <table className={styles.compareTable} style={{ "--compare-cols": rows.length } as CSSProperties}>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        {rows.map((row) => (
                          <th key={row.id}>{row.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <MetricRow label="Total power" icon={<Swords size={15} />} rows={rows} metricKey="power" bounds={metricBounds} formatter={(value) => formatNumber(value)} />
                      <MetricRow label="Hunting time" icon={<Search size={15} />} rows={rows} metricKey="hunt" bounds={metricBounds} lowerIsBetter formatter={(value) => secondsToDuration(value)} />
                      <MetricRow label="Recorded battle EV" icon={<BarChart3 size={15} />} rows={rows} metricKey="battle" bounds={metricBounds} formatter={(value) => (value ? `${formatBattleEv(value)}/hr` : "-")} />
                      <MetricRow label="Lowest sale listing" icon={<CircleDollarSign size={15} />} rows={rows} metricKey="market" bounds={metricBounds} formatter={(value) => formatGold(value)} />
                      {COMPARISON_STAT_KEYS.map((key) => (
                        <MetricRow
                          key={key}
                          label={STAT_LABELS[key]}
                          icon={key === "protection" ? <Shield size={15} /> : <Sparkles size={15} />}
                          rows={rows}
                          metricKey={key}
                          bounds={metricBounds}
                          formatter={(value) =>
                            key === "movement_speed" || key === "critical_damage" || key === "critical_chance" ? formatNumber(value, 2) : formatNumber(value)
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}

function MetricRow({
  label,
  icon,
  rows,
  metricKey,
  bounds,
  lowerIsBetter = false,
  formatter,
}: {
  label: string;
  icon: ReactNode;
  rows: ComparedPet[];
  metricKey: string;
  bounds: Record<string, { max: number; min: number }>;
  lowerIsBetter?: boolean;
  formatter: (value: number) => string;
}) {
  const bound = bounds[metricKey] || { max: 0, min: 0 };
  return (
    <tr>
      <td>
        <span className={styles.metricLabel}>
          {icon}
          {label}
        </span>
      </td>
      {rows.map((row) => {
        const value = metricValue(row, metricKey);
        const isBest = value > 0 && (lowerIsBetter ? value === bound.min : value === bound.max);
        return (
          <td key={row.id} className={isBest ? styles.bestCell : ""}>
            {formatter(value)}
          </td>
        );
      })}
    </tr>
  );
}
