"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useProfiles } from "@/lib/profiles";
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
  calculatePetStats,
  clampNumber,
  formatGold,
  formatNumber,
  getBestBattleProfit,
  getHuntingTimeSeconds,
  getMasteryBonus,
  getPetImage,
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
  pet: PetRecord;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  battle: ReturnType<typeof getBestBattleProfit>;
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
  return (
    <div className={`${styles.field} ${styles.menuField}`} data-menu-root>
      <span>{label}</span>
      <button type="button" className={styles.menuTrigger} aria-expanded={open} onClick={() => onOpen(!open)}>
        <span>{selected.label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.menuPanel}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={option.value === value ? styles.selectedOption : ""}
              onClick={() => {
                onChange(option.value);
                onOpen(false);
              }}
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
  pets,
  open,
  onOpen,
  onSelect,
  onClear,
}: {
  slotIndex: number;
  value: string | null;
  pets: PetRecord[];
  open: boolean;
  onOpen: (open: boolean) => void;
  onSelect: (name: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const selected = pets.find((pet) => pet.name === value) || null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pets
      .filter((pet) => !needle || petSearchText(pet).includes(needle))
      .slice(0, 32);
  }, [pets, query]);

  return (
    <div className={styles.picker} data-menu-root>
      <button
        type="button"
        className={styles.pickerTrigger}
        style={selected ? ({ "--accent": QUALITY_COLORS[selected.quality] } as CSSProperties) : undefined}
        aria-expanded={open}
        onClick={() => onOpen(!open)}
      >
        {selected ? <PetImage pet={selected} /> : <div className={styles.emptyAvatar}>{slotIndex + 1}</div>}
        <span>
          <strong>{selected?.name || `Choose pet ${slotIndex + 1}`}</strong>
          <small>{selected ? `${qualityLabel(selected.quality)} - ${getPetSourceLabel(selected)}` : "Search pet database"}</small>
        </span>
        <ChevronDown size={17} />
      </button>
      {selected && (
        <button type="button" className={styles.clearSlot} onClick={onClear} title="Clear pet slot">
          <X size={15} />
        </button>
      )}
      {open && (
        <div className={styles.pickerPanel}>
          <div className={styles.pickerPanelHeader}>
            <span>Choose pet</span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onOpen(false);
              }}
              aria-label="Close pet picker"
            >
              <X size={16} />
            </button>
          </div>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pet, boss, source..." autoFocus />
          </label>
          <div className={styles.petOptions}>
            {filtered.map((pet) => (
              <button
                type="button"
                key={pet.name}
                className={pet.name === value ? styles.petOptionSelected : ""}
                onClick={() => {
                  onSelect(pet.name);
                  setQuery("");
                  onOpen(false);
                }}
              >
                <PetImage pet={pet} />
                <span>
                  <strong>{pet.name}</strong>
                  <small>
                    {qualityLabel(pet.quality)} - {getPetSourceLabel(pet)}
                  </small>
                </span>
                <em>{formatGold(pet.exchange?.minPrice)}</em>
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
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [petLevel, setPetLevel] = useState(100);
  const [masteryLevel, setMasteryLevel] = useState(100);
  const [evolutionStage, setEvolutionStage] = useState(0);
  const [evolutionStat, setEvolutionStat] = useState<StatKey | "all">("all");
  const [patBonus, setPatBonus] = useState(false);
  const [battleMode, setBattleMode] = useState<BattleProfitMode>("withSleep");
  const [battleZone, setBattleZone] = useState(BEST_BATTLE_ZONE);
  const [foodPolicy, setFoodPolicy] = useState<FoodPolicy>("standard");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const loadedStorage = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as CompareState;
        if (Array.isArray(stored.selectedNames)) setSelectedNames(stored.selectedNames.slice(0, MAX_COMPARE));
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
    loadedStorage.current = true;
  }, []);

  useEffect(() => {
    if (!loadedStorage.current) return;
    const payload: CompareState = { selectedNames, petLevel, masteryLevel, evolutionStage, evolutionStat, patBonus, battleMode, battleZone, foodPolicy };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [battleMode, battleZone, evolutionStage, evolutionStat, foodPolicy, masteryLevel, patBonus, petLevel, selectedNames]);

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

  const getBattleSample = (pet: PetRecord) => {
    if (battleZone === BEST_BATTLE_ZONE) return getBestBattleProfit(pet, battleMode, foodPolicy);
    const zone = pet.battle?.zones?.find((entry) => entry.zone === battleZone);
    if (!zone) return { value: 0, zone: null as string | null, mode: null as BattleProfitMode | null };
    return { value: getZoneProfitValue(zone, battleMode, foodPolicy), zone: zone.zone, mode: battleMode };
  };

  const rows = useMemo<ComparedPet[]>(() => {
    return selectedNames
      .map((name) => pets.find((pet) => pet.name === name))
      .filter((pet): pet is PetRecord => Boolean(pet))
      .map((pet) => {
        const stats = calculatePetStats(pet, petLevel, masteryBonus, evolutionStage, evolutionStat, patBonus);
        return {
          pet,
          stats,
          totalPower: getTotalPower(stats),
          huntingTime: getHuntingTimeSeconds(stats),
          battle: getBattleSample(pet),
        };
      });
  }, [battleMode, battleZone, evolutionStage, evolutionStat, foodPolicy, masteryBonus, patBonus, petLevel, pets, selectedNames]);

  const profilePet = useMemo(() => {
    if (!activeProfile?.pet?.species) return null;
    return pets.find((pet) => pet.name.toLowerCase() === activeProfile.pet.species.toLowerCase()) || null;
  }, [activeProfile, pets]);

  const topPicks = useMemo(() => {
    const compared = pets.map((pet) => {
      const stats = calculatePetStats(pet, petLevel, masteryBonus, evolutionStage, evolutionStat, patBonus);
      return {
        pet,
        power: getTotalPower(stats),
        hunt: getHuntingTimeSeconds(stats),
        battle: getBattleSample(pet).value,
        market: pet.exchange?.minPrice || 0,
      };
    });
    const unique = new Map<string, PetRecord>();
    [...compared].sort((a, b) => b.power - a.power).slice(0, 1).forEach((row) => unique.set("Highest power", row.pet));
    [...compared].sort((a, b) => a.hunt - b.hunt).slice(0, 1).forEach((row) => unique.set("Lowest formula hunt time", row.pet));
    [...compared].filter((row) => row.battle > 0).sort((a, b) => b.battle - a.battle).slice(0, 1).forEach((row) => unique.set("Highest recorded EV", row.pet));
    [...compared].filter((row) => row.market > 0).sort((a, b) => b.market - a.market).slice(0, 1).forEach((row) => unique.set("Highest sale value", row.pet));
    return Array.from(unique.entries());
  }, [battleMode, battleZone, evolutionStage, evolutionStat, foodPolicy, masteryBonus, patBonus, petLevel, pets]);

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

  const addPet = (name: string) => {
    setSelectedNames((current) => {
      const without = current.filter((entry) => entry !== name);
      return [...without, name].slice(-MAX_COMPARE);
    });
  };

  const setSlot = (index: number, name: string) => {
    setSelectedNames((current) => {
      const next = [...current];
      next[index] = name;
      return Array.from(new Set(next.filter(Boolean))).slice(0, MAX_COMPARE);
    });
  };

  const clearSlot = (index: number) => setSelectedNames((current) => current.filter((_, slotIndex) => slotIndex !== index));

  const metricBounds = useMemo(() => {
    const keys = ["power", "hunt", "battle", "market", ...COMPARISON_STAT_KEYS];
    return Object.fromEntries(
      keys.map((key) => {
        const values = rows.map((row) => metricValue(row, key)).filter((value) => Number.isFinite(value) && value > 0);
        return [key, { max: Math.max(0, ...values), min: values.length ? Math.min(...values) : 0 }];
      }),
    ) as Record<string, { max: number; min: number }>;
  }, [rows]);

  const slotCount = Math.max(2, Math.min(MAX_COMPARE, selectedNames.length + 1));
  const slots = Array.from({ length: selectedNames.length >= MAX_COMPARE ? MAX_COMPARE : slotCount }, (_, index) => selectedNames[index] || null);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.kicker}>
            <PawPrint size={17} /> Pet Comparison
          </span>
          <h1>Compare Pets</h1>
          <p>Pick pets, adjust the shared stat setup, and compare hunting speed, recorded battle EV, sources, and sale listings.</p>
        </div>
        <div className={styles.heroActions}>
          <Link href="/pets" className={styles.secondaryLink}>
            Pet Database <ArrowRight size={16} />
          </Link>
          <button type="button" className={styles.secondaryLink} onClick={() => setSelectedNames([])}>
            <Trash2 size={16} /> Clear
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
              {profilePet && (
                <button type="button" className={styles.profilePetButton} onClick={() => addPet(profilePet.name)}>
                  <Sparkles size={16} />
                  Add {activeProfile?.name}'s {profilePet.name}
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
              <button type="button" className={`${styles.toggle} ${patBonus ? styles.activeToggle : ""}`} onClick={() => setPatBonus((value) => !value)}>
                <HeartPulse size={16} /> Pat +5%
              </button>
            </div>
            <p className={styles.scenarioNote}>
              Level, mastery, evolution, and pat affect stats and hunting speed. Battle EV uses recorded research data only; it does not import live pet state,
              route movement, active map position, or future combat scaling.
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
                  pets={pets}
                  open={openMenu === `pet-${index}`}
                  onOpen={(open) => setOpenMenu(open ? `pet-${index}` : null)}
                  onSelect={(petName) => setSlot(index, petName)}
                  onClear={() => clearSlot(index)}
                />
              ))}
              {selectedNames.length < MAX_COMPARE && (
                <button type="button" className={styles.addSlot} onClick={() => setOpenMenu(`pet-${selectedNames.length}`)}>
                  <Plus size={18} /> Add pet
                </button>
              )}
            </div>
            <div className={styles.quickPicks}>
              {topPicks.map(([label, pet]) => (
                <button type="button" key={label} onClick={() => addPet(pet.name)}>
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
              <h2>Select two pets to begin.</h2>
              <p>Use the quick picks or search by pet, boss, source, rarity, or exchange listing.</p>
            </section>
          ) : (
            <>
              <section className={styles.compareCards}>
                {rows.map((row) => {
                  const recordedZones = getRecordedZoneCount(row.pet);
                  const recordedDrops = getRecordedDropCount(row.pet, row.battle.zone);
                  return (
                    <article key={row.pet.name} className={styles.compareCard} style={{ "--accent": QUALITY_COLORS[row.pet.quality] } as CSSProperties}>
                      <div className={styles.cardTop}>
                        <PetImage pet={row.pet} />
                        <div>
                          <h3>{row.pet.name}</h3>
                          <p>{getPetSourceLabel(row.pet)}</p>
                        </div>
                        <span>{qualityLabel(row.pet.quality)}</span>
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
                      <div className={styles.sampleBadges} aria-label={`${row.pet.name} recorded battle coverage`}>
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
                  <table className={styles.compareTable} style={{ "--compare-cols": rows.length } as CSSProperties}>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        {rows.map((row) => (
                          <th key={row.pet.name}>{row.pet.name}</th>
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
          <td key={row.pet.name} className={isBest ? styles.bestCell : ""}>
            {formatter(value)}
          </td>
        );
      })}
    </tr>
  );
}
