"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownUp,
  BadgeInfo,
  BarChart3,
  Check,
  ChevronDown,
  ChevronsUp,
  Database,
  Dumbbell,
  Egg,
  Gauge,
  HeartPulse,
  PawPrint,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Swords,
  X,
  Zap,
} from "lucide-react";
import { useItemModal } from "@/context/ItemModalContext";
import { GameImage } from "@/components/GameImage";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { ErrorState, LoadingState, NoResultsState } from "@/components/StateBlock";
import { useProfiles, type ProfileOwnedPet } from "@/lib/profiles";
import { buildPetMatchLookup, findPetRecordForOwnedPet, getPetRecordMatchKey } from "@/lib/pets";
import { calculatePetStatValue, type PetStatKey } from "@/lib/pet-stats";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { QUALITY_COLORS, getQualityRank, formatQualityLabel, getQualityTextStyle } from "@/lib/quality";

type Quality =
  | "STANDARD"
  | "REFINED"
  | "PREMIUM"
  | "EPIC"
  | "LEGENDARY"
  | "MYTHIC"
  | "UNIQUE"
  | "UNKNOWN";

type StatKey = PetStatKey;

type PetStat = {
  base: number;
  per_level: number;
};

type PetEgg = {
  name: string;
  hashedId?: string;
  imageUrl?: string | null;
  quality: Quality;
  vendorPrice?: number | null;
  isTradeable?: boolean;
  worldBosses?: Array<{ id?: number; name: string }>;
};

type PetAcquisition = {
  boss?: string;
  location?: string;
  levelRequirement?: string;
  egg?: string;
  chancePercent?: number | null;
  quality?: Quality;
};

type PetExchange = {
  listingCount: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  averagePrice?: number | null;
  medianPrice?: number | null;
  sampleListings?: Array<{ level?: number | null; quality?: Quality; price?: number | null }>;
};

type PetSourceOverride = {
  type: "merchant" | "event" | "unique";
  availability?: string;
  label: string;
  imageUrl?: string | null;
  merchant?: {
    name: string;
    url: string;
    currency?: string | null;
    price?: number | null;
  } | null;
  notes?: string[];
};

type BattleZone = {
  zone: string;
  battleTimeSeconds?: number | null;
  enemiesBattled?: number | null;
  lootPieces?: number | null;
  expectedRevenuePerBattle?: number | null;
  expectedRevenuePerHour?: number | null;
  expectedProfitPerBattle?: number | null;
  expectedProfitPerHourWithSleep?: number | null;
  expectedProfitPerHourNoSleep?: number | null;
  expectedProfitPerHourHealingWithSleep?: number | null;
  profitMargin?: number | null;
  foodCostPerHourCheapest?: number | null;
  cycle?: {
    maxStamina?: number | null;
    staminaDrainPerHour?: number | null;
    staminaDrainPerBattle?: number | null;
    timeBattledForZeroStaminaSeconds?: number | null;
    staminaRecoveryZeroToFullSeconds?: number | null;
    battlesBeforeSleep?: number | null;
    healthRecoveryZeroToFullSeconds?: number | null;
    sleepToBattleForStamina?: number | null;
    battleToSleepForHp?: number | null;
  };
  drops?: Array<{
    itemName?: string | null;
    expectedDropPercent?: number | null;
    totalDrops?: number | null;
    dropValueShareMaxPrice?: number | null;
    dropValueShareVendor?: number | null;
    dropValueShare?: number | null;
    valueShareMaxPrice?: number | null;
    valueSharePercent?: number | null;
    prices?: Record<string, number | null> | null;
    source?: string;
  }>;
  ranking?: {
    rank?: string | null;
    profit_per_hour_pm100?: number | null;
    pet_exp_profit_efficiency_scale?: number | null;
  } | null;
};

type PetRecord = {
  id?: number | null;
  hashedId?: string | null;
  name: string;
  quality: Quality;
  imageUrl?: string | null;
  description?: string | null;
  egg?: PetEgg | null;
  stats?: Partial<Record<StatKey, PetStat>> | null;
  acquisition?: PetAcquisition[];
  sourceOverride?: PetSourceOverride | null;
  rarity?: {
    codexId?: string;
    worldBoss?: string;
    dropChancePercent?: number | null;
  } | null;
  exchange?: PetExchange | null;
  valuation?: {
    eggPrice?: number | null;
    level100Bonus?: number | null;
    samples?: Array<{ level?: number | null; rarity?: string | null; eggPrice?: number | null; roughEstimate?: number | null }>;
  } | null;
  battle?: {
    zones?: BattleZone[];
  };
};

type MasteryLevel = {
  level: number;
  stat_bonus_percent?: number | null;
};

type PetDatabase = {
  meta: {
    generatedAt: string;
    verificationStatus: string;
    counts?: {
      pets: number;
      petsWithStats: number;
      petsWithEggs: number;
      petsWithExchangeListings: number;
      exchangeListings: number;
      exchangeSpecies: number;
    };
    sources?: string[];
  };
  formulas?: Record<string, string>;
  qualityStamina?: {
    battle?: Array<Record<string, unknown>>;
    hunting?: Array<{ quality: Quality; hunting_stamina_per_second: number }>;
  };
  mastery?: {
    levels?: MasteryLevel[];
  };
  pets: PetRecord[];
};

type SortKey = "name" | "quality" | "power" | "speed" | "battleProfit" | "market" | "drop";
type SourceFilter = "ALL" | "OWNED" | "EGG" | "BOSS" | "EXCHANGE" | "MERCHANT" | "EVENT" | "UNIQUE" | "MISSING_EGG";
type ViewMode = "cards" | "table";
type BattleProfitMode = "noSleep" | "withSleep" | "healingWithSleep";
type FoodPolicy = "standard" | "none";
type BattleDrop = NonNullable<BattleZone["drops"]>[number];

type BattleSelection = {
  pet: PetRecord;
  zone: BattleZone;
};

type StoredPetState = {
  searchTerm?: string;
  qualityFilter?: Quality | "ALL";
  sourceFilter?: SourceFilter;
  sortBy?: SortKey;
  sortDesc?: boolean;
  viewMode?: ViewMode;
  petLevel?: number;
  masteryLevel?: number;
  evolutionStage?: number;
  evolutionStat?: StatKey | "all";
  patBonus?: boolean;
  battleProfitMode?: BattleProfitMode;
  foodPolicy?: FoodPolicy | "workbook";
  beastmaster?: boolean;
};

type PetSelectOption<T extends string> = { value: T; label: string; qualityTone?: string };

const PET_DATABASE_STORAGE_KEY = "zenith_pet_database_state_v1";

const isDisplayableBattleDrop = (drop: BattleDrop | null | undefined) => {
  const itemName = String(drop?.itemName || "").trim();
  if (!itemName) return false;
  const normalized = itemName.replace(/[\s_:-]+/g, " ").toLowerCase();
  if (["total", "grand total", "subtotal", "average", "material", "item", "drop"].includes(normalized)) return false;
  return (drop?.expectedDropPercent !== null && drop?.expectedDropPercent !== undefined) || Boolean(drop?.prices);
};

const STAT_LABELS: Record<StatKey, string> = {
  agility: "Agility",
  accuracy: "Accuracy",
  protection: "Protection",
  attack_power: "Attack Power",
  movement_speed: "Move Speed",
  max_health: "Health",
  max_stamina: "Stamina",
  critical_damage: "Crit Damage",
  critical_chance: "Crit Chance",
};

const SORT_OPTIONS: Array<PetSelectOption<SortKey>> = [
  { value: "power", label: "Power" },
  { value: "speed", label: "Move Speed" },
  { value: "battleProfit", label: "Battle Samples" },
  { value: "market", label: "Lowest Listing" },
  { value: "drop", label: "Drop Chance" },
  { value: "quality", label: "Quality" },
  { value: "name", label: "Name" },
];

const SOURCE_OPTIONS: Array<PetSelectOption<SourceFilter>> = [
  { value: "ALL", label: "All" },
  { value: "OWNED", label: "Owned by active profile" },
  { value: "EGG", label: "Has egg item" },
  { value: "BOSS", label: "World boss drop" },
  { value: "EXCHANGE", label: "Exchange listed" },
  { value: "MERCHANT", label: "Merchant" },
  { value: "EVENT", label: "Event / legacy" },
  { value: "UNIQUE", label: "Unique" },
  { value: "MISSING_EGG", label: "No linked egg item" },
];

const EVOLUTION_STAT_OPTIONS: Array<PetSelectOption<StatKey | "all">> = [
  { value: "all", label: "All stats" },
  { value: "agility", label: "Agility" },
  { value: "accuracy", label: "Accuracy" },
  { value: "protection", label: "Protection" },
  { value: "attack_power", label: "Attack Power" },
  { value: "movement_speed", label: "Move Speed" },
];

const BATTLE_PROFIT_OPTIONS: Array<{ value: BattleProfitMode; label: string }> = [
  { value: "withSleep", label: "With sleep" },
  { value: "noSleep", label: "No sleep" },
  { value: "healingWithSleep", label: "Healing + sleep" },
];

const FOOD_OPTIONS: Array<{ value: FoodPolicy; label: string }> = [
  { value: "standard", label: "Food cost" },
  { value: "none", label: "No food" },
];

const QUALITY_OPTIONS: Array<PetSelectOption<Quality | "ALL">> = [
  { value: "ALL", label: "All" },
  { value: "STANDARD", label: "STANDARD", qualityTone: "STANDARD" },
  { value: "REFINED", label: "REFINED", qualityTone: "REFINED" },
  { value: "PREMIUM", label: "PREMIUM", qualityTone: "PREMIUM" },
  { value: "EPIC", label: "EPIC", qualityTone: "EPIC" },
  { value: "LEGENDARY", label: "LEGENDARY", qualityTone: "LEGENDARY" },
  { value: "MYTHIC", label: "MYTHIC", qualityTone: "MYTHIC" },
  { value: "UNIQUE", label: "UNIQUE", qualityTone: "UNIQUE" },
];

function formatGold(value?: number | null) {
  if (!value || value <= 0) return "-";
  return `${Math.round(value).toLocaleString()}g`;
}

function formatCompactGold(value?: number | null) {
  if (!value || value <= 0) return "-";
  return `${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(value))}g`;
}

function formatNumber(value?: number | null, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPercent(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${normalized.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function qualityLabel(quality: string) {
  return formatQualityLabel(quality);
}

function secondsToDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "-";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const sec = rounded % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${sec}s`;
  return `${sec}s`;
}

function getMasteryBonus(database: PetDatabase | null, level: number) {
  const levels = database?.mastery?.levels || [];
  const found = levels.find((entry) => Number(entry.level) === level);
  const rawBonus = Number(found?.stat_bonus_percent || 0);
  return rawBonus <= 1 ? rawBonus * 100 : rawBonus;
}

function calculateStats(
  pet: PetRecord,
  level: number,
  masteryBonusPercent: number,
  evolutionStage: number,
  evolutionStat: StatKey | "all",
  patBonus: boolean,
) {
  const stats = pet.stats || {};
  const values: Partial<Record<StatKey, number>> = {};

  (Object.keys(STAT_LABELS) as StatKey[]).forEach((key) => {
    const stat = stats[key];
    if (!stat) return;
    values[key] = calculatePetStatValue(stat, {
      statKey: key,
      level,
      masteryBonusPercent,
      evolutionStage,
      evolutionApplies: evolutionStat === "all" || evolutionStat === key,
      patBonus,
    });
  });

  return values;
}

function getTotalPower(stats: Partial<Record<StatKey, number>>) {
  return Math.floor(
    Number(stats.attack_power || 0) +
      Number(stats.protection || 0) +
      Number(stats.agility || 0) +
      Number(stats.accuracy || 0),
  );
}

function getHuntingTimeSeconds(stats: Partial<Record<StatKey, number>>) {
  const agility = Number(stats.agility || 0);
  const movementSpeed = Number(stats.movement_speed || 0);
  return 200 - 125 * (0.7 * Math.min(agility / 120, 1) + 0.3 * Math.min(movementSpeed / 100, 1));
}

function getZoneProfitValue(zone: BattleZone, mode: BattleProfitMode, foodPolicy: FoodPolicy) {
  let value =
    mode === "noSleep"
      ? Number(zone.expectedProfitPerHourNoSleep || 0)
      : mode === "healingWithSleep"
        ? Number(zone.expectedProfitPerHourHealingWithSleep || 0)
        : Number(zone.expectedProfitPerHourWithSleep || 0);
  if (foodPolicy === "none") {
    value += Number(zone.foodCostPerHourCheapest || 0);
  }
  return value;
}

function getBestBattleProfit(pet: PetRecord, mode: BattleProfitMode, foodPolicy: FoodPolicy) {
  const zones = pet.battle?.zones || [];
  return zones.reduce(
    (best, zone) => {
      const value = getZoneProfitValue(zone, mode, foodPolicy);
      if (value <= best.value) return best;
      return {
        value,
        zone: zone.zone,
        mode,
      };
    },
    { value: 0, zone: null as string | null, mode: null as BattleProfitMode | null },
  );
}

function petSearchText(pet: PetRecord) {
  return [
    pet.name,
    pet.quality,
    pet.egg?.name,
    pet.rarity?.worldBoss,
    pet.sourceOverride?.label,
    pet.sourceOverride?.merchant?.name,
    pet.sourceOverride?.availability,
    ...(pet.sourceOverride?.notes || []),
    ...(pet.acquisition || []).flatMap((entry) => [entry.boss, entry.location, entry.egg]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function ownedPetSearchText(pets: ProfileOwnedPet[]) {
  return pets
    .flatMap((pet) => [pet.nickname, pet.species, pet.quality, pet.source, pet.location?.name, pet.hashTail])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPetSourceLabel(pet: PetRecord) {
  return pet.sourceOverride?.label || pet.rarity?.worldBoss || pet.acquisition?.[0]?.location || "Source pending";
}

function getMerchantPrice(source?: PetSourceOverride | null) {
  if (!source?.merchant) return null;
  const price = source.merchant.price;
  if (!price) return source.merchant.name;
  return `${source.merchant.name} - ${price.toLocaleString()} ${source.merchant.currency || "shards"}`;
}

function formatBattleZoneCount(pet: PetRecord) {
  const count = pet.battle?.zones?.length || 0;
  if (!count) return "-";
  return `${count} zone${count === 1 ? "" : "s"}`;
}

function getBestBattleZone(pet: PetRecord, mode: BattleProfitMode, foodPolicy: FoodPolicy) {
  return (pet.battle?.zones || []).reduce<BattleZone | null>((best, zone) => {
    if (!best) return zone;
    return getZoneProfitValue(zone, mode, foodPolicy) > getZoneProfitValue(best, mode, foodPolicy) ? zone : best;
  }, null);
}

function PetSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  open,
  onOpenChange,
}: {
  label: string;
  value: T;
  options: Array<PetSelectOption<T>>;
  onChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selected = options.find((option) => option.value === value) || options[0];
  const reactId = useId();
  const menuId = `pet-select-${reactId}`;
  const labelId = `${menuId}-label`;
  const valueId = `${menuId}-value`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [menuMaxHeight, setMenuMaxHeight] = useState(280);
  const renderOptionLabel = (option: PetSelectOption<T> | undefined) => {
    if (!option) return "";
    if (option.qualityTone) {
      return <span style={getQualityTextStyle(option.qualityTone)}>{option.label}</span>;
    }
    return option.label;
  };

  const updateMenuPlacement = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportPadding = 12;
    const preferredHeight = 300;
    const isCompactPicker = window.matchMedia("(max-width: 820px)").matches;
    const spaceBelow = Math.max(72, window.innerHeight - rect.bottom - viewportPadding);
    const spaceAbove = Math.max(72, rect.top - viewportPadding);
    const nextPlacement = !isCompactPicker && spaceBelow < preferredHeight && spaceAbove > spaceBelow ? "up" : "down";
    setPlacement(nextPlacement);
    setMenuMaxHeight(Math.min(preferredHeight, nextPlacement === "up" ? spaceAbove : spaceBelow));
  };

  useEffect(() => {
    if (!open) return;
    updateMenuPlacement();
    if (window.matchMedia("(max-width: 820px)").matches) {
      triggerRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    }
    setActiveIndex(selectedIndex);
    window.requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
    window.addEventListener("resize", updateMenuPlacement);
    window.addEventListener("scroll", updateMenuPlacement, true);
    return () => {
      window.removeEventListener("resize", updateMenuPlacement);
      window.removeEventListener("scroll", updateMenuPlacement, true);
    };
  }, [open, selectedIndex]);

  const closeMenu = (returnFocus = true) => {
    onOpenChange(false);
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const chooseOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  };

  const moveToOption = (index: number) => {
    const nextIndex = Math.min(options.length - 1, Math.max(0, index));
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
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
        onOpenChange(true);
        return;
      }
      moveToOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        onOpenChange(true);
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
    <div className={`pet-field pet-dropdown ${open ? "open" : ""} ${open && placement === "up" ? "open-up" : ""}`}>
      <span id={labelId}>{label}</span>
      <button
        ref={triggerRef}
        type="button"
        className="pet-select-button"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (!open) updateMenuPlacement();
          onOpenChange(!open);
        }}
      >
        <span id={valueId}>{renderOptionLabel(selected)}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          className="pet-select-menu"
          id={menuId}
          role="listbox"
          aria-labelledby={labelId}
          onKeyDown={handleKeyDown}
          style={{ "--pet-select-max-height": `${menuMaxHeight}px` } as CSSProperties}
        >
          {options.map((option, index) => (
            <button
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              key={option.value}
              className={option.value === value ? "selected" : ""}
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => {
                onChange(option.value);
                closeMenu();
              }}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span>{renderOptionLabel(option)}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PetNumberField({
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
    <label className="pet-field">
      <span>{label}</span>
      <input
        className="pet-number"
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

function PetImage({ pet }: { pet: PetRecord }) {
  const image = pet.imageUrl || pet.egg?.imageUrl;
  return (
    <div className="pet-avatar">
      {image ? (
        <GameImage
          src={image}
          alt=""
          width={44}
          height={44}
          sizes="44px"
          className={pet.name === "Dead Wyrmshadow" ? "pet-image-upside-down" : undefined}
          loading="lazy"
        />
      ) : (
        <PawPrint size={30} />
      )}
    </div>
  );
}

function PetCard({
  pet,
  stats,
  totalPower,
  huntingTime,
  ownedCount,
  onInspect,
}: {
  pet: PetRecord;
  stats: Partial<Record<StatKey, number>>;
  totalPower: number;
  huntingTime: number;
  ownedCount: number;
  onInspect: () => void;
}) {
  const accent = QUALITY_COLORS[pet.quality] || QUALITY_COLORS.UNKNOWN;
  const battleZoneCount = pet.battle?.zones?.length || 0;
  return (
    <button
      aria-label={`Open ${pet.name} pet details`}
      className="pet-card"
      onClick={onInspect}
      style={{ "--quality-accent": accent } as React.CSSProperties}
      type="button"
    >
      <div className="pet-card-top">
        <PetImage pet={pet} />
        <div>
          <div className="pet-card-name">{pet.name}</div>
          <div className="pet-card-source">{getPetSourceLabel(pet)}</div>
        </div>
        <div className="pet-card-badges">
          {ownedCount > 0 && <span className="pet-owned-pill">Owned {ownedCount}</span>}
          <span className="pet-quality-pill">{qualityLabel(pet.quality)}</span>
        </div>
      </div>
      <div className="pet-card-stats">
        <span>
          <Swords size={14} /> {formatNumber(totalPower)}
        </span>
        <span>
          <Gauge size={14} /> {formatNumber(stats.movement_speed, 2)}m/s
        </span>
        <span>
          <Search size={14} /> {secondsToDuration(huntingTime)}
        </span>
      </div>
      <div className="pet-card-market">
        <span>{pet.exchange?.listingCount ? `Lowest listing (${pet.exchange.listingCount} listed)` : "Lowest listing"}</span>
        <strong>{formatGold(pet.exchange?.minPrice)}</strong>
      </div>
      <div className="pet-card-market pet-card-market-secondary">
        <span>{battleZoneCount ? `Battle research (${battleZoneCount} zone${battleZoneCount === 1 ? "" : "s"})` : "Battle research"}</span>
        <strong>{battleZoneCount ? "Open samples" : "No sample"}</strong>
      </div>
    </button>
  );
}

export default function PetsPage() {
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
  const [selectedPetName, setSelectedPetName] = useState<string | null>(null);
  const [selectedBattle, setSelectedBattle] = useState<BattleSelection | null>(null);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [modalRootReady, setModalRootReady] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const { openItem, openItemByName } = useItemModal();
  const { activeProfile } = useProfiles();

  useEffect(() => {
    setModalRootReady(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const syncViewport = () => setIsCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

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

  useEffect(() => {
    if (!openPetSelect) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".pet-dropdown")) {
        setOpenPetSelect(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPetSelect(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPetSelect]);

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

  const petRows = useMemo(() => {
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

  const selectedRow = useMemo(
    () => (selectedPetName ? petRows.find((row) => row.pet.name === selectedPetName) || null : null),
    [petRows, selectedPetName],
  );
  const selectedBattleDrops = useMemo(
    () => selectedBattle?.zone.drops?.filter(isDisplayableBattleDrop) || [],
    [selectedBattle],
  );
  const petDetailDialogRef = useModalA11y<HTMLDivElement>(Boolean(selectedRow), () => setSelectedPetName(null));
  const petBattleDialogRef = useModalA11y<HTMLDivElement>(Boolean(selectedBattle), () => setSelectedBattle(null));

  const counts = database?.meta.counts;
  const bestHunter = petRows.reduce<(typeof petRows)[number] | null>(
    (best, row) => (!best || row.huntingTime < best.huntingTime ? row : best),
    null,
  );
  const bestMarket = petRows.reduce<(typeof petRows)[number] | null>(
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
  const scenarioLabel = `Scenario: Lv ${petLevel} / Mastery ${masteryLevel} / Evo ${evolutionStage}`;
  const resultAnnouncement = petRows.length
    ? `${petRows.length} pet${petRows.length === 1 ? "" : "s"} shown.`
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

  return (
    <main className="pets-page">
      <section className="pets-hero">
        <div>
          <div className="pets-kicker">
            <ZenithIcon name="pets" size={16} /> Pet Database
          </div>
          <h1>Pet Database</h1>
          <p>
            Compare pet stats, sources, listing-based market values, and optional battle or hunting context in one place.
          </p>
        </div>
        <div className="pets-hero-grid">
          <div>
            <span>Pets</span>
            <strong>{counts?.pets || database?.pets.length || "-"}</strong>
          </div>
          <div>
            <span>Egg Links</span>
            <strong>{counts?.petsWithEggs || "-"}</strong>
          </div>
          <div>
            <span>Listings</span>
            <strong>{counts?.exchangeListings?.toLocaleString() || "-"}</strong>
          </div>
          <div>
            <span>Mastery Bonus</span>
            <strong>{masteryBonus}%</strong>
          </div>
          <div>
            <span>Owned Species</span>
            <strong>{ownedSpeciesCount || "-"}</strong>
          </div>
        </div>
      </section>

      <section className="pets-toolbar">
        <div className="pet-toolbar-title">
          <span><SlidersHorizontal size={15} aria-hidden="true" /> Filters</span>
          <small>
            {hasActiveFilters
              ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
              : `${petRows.length.toLocaleString()} visible`}
          </small>
          <button type="button" onClick={resetPetControls} disabled={!primaryControlsModified} aria-label="Reset pet filters and sorting">
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </button>
        </div>
        <label className="pet-search">
          <Search size={18} />
          <input
            aria-label="Search pets"
            value={searchTerm}
            placeholder="Search pets, eggs, bosses, sources..."
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>
        <details className="pet-filter-panel" open={!isCompactViewport ? true : undefined}>
          <summary>
            <span><SlidersHorizontal size={15} aria-hidden="true" /> Pet filters</span>
            <small>{primaryControlsModified ? "Customized" : "Default"}</small>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className="pet-filter-grid">
            <PetSelect label="Quality" value={qualityFilter} options={QUALITY_OPTIONS} onChange={setQualityFilter} open={openPetSelect === "quality"} onOpenChange={(open) => setOpenPetSelect(open ? "quality" : null)} />
            <PetSelect label="Source" value={sourceFilter} options={SOURCE_OPTIONS} onChange={setSourceFilter} open={openPetSelect === "source"} onOpenChange={(open) => setOpenPetSelect(open ? "source" : null)} />
            <PetSelect label="Sort" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} open={openPetSelect === "sort"} onOpenChange={(open) => setOpenPetSelect(open ? "sort" : null)} />
            <button
              type="button"
              className="pet-icon-button"
              aria-pressed={sortDesc}
              aria-label={`Toggle sort direction, currently ${sortDesc ? "descending" : "ascending"}`}
              onClick={() => setSortDesc((value) => !value)}
              title="Toggle sort direction"
            >
              <ArrowDownUp size={17} />
              <span>{sortDesc ? "Desc" : "Asc"}</span>
            </button>
          </div>
        </details>
        <div className="pet-segment" aria-label="View mode">
          <button type="button" className={viewMode === "cards" ? "active" : ""} aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")}>
            Cards
          </button>
          <button type="button" className={viewMode === "table" ? "active" : ""} aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")}>
            Table
          </button>
        </div>
      </section>

      <details className="pets-calculator">
        <summary className="calculator-title">
          <ChevronsUp size={18} />
          <div>
            <strong>Pet setup</strong>
            <span>
              Lv {petLevel} / Mastery {masteryLevel} / Evo {evolutionStage} / {battleProfitMode === "noSleep" ? "No sleep" : "With sleep"}
            </span>
          </div>
        </summary>
        <div className="calculator-fields">
          <PetNumberField label="Pet Level" value={petLevel} min={1} max={100} onChange={setPetLevel} />
          <PetNumberField label="Pet Mastery" value={masteryLevel} min={1} max={100} onChange={setMasteryLevel} />
          <PetNumberField label="Evolution" value={evolutionStage} min={0} max={5} onChange={setEvolutionStage} />
          <PetSelect label="Evolution stat" value={evolutionStat} options={EVOLUTION_STAT_OPTIONS} onChange={setEvolutionStat} open={openPetSelect === "evolution"} onOpenChange={(open) => setOpenPetSelect(open ? "evolution" : null)} />
          <PetSelect label="Battle sample mode" value={battleProfitMode} options={BATTLE_PROFIT_OPTIONS} onChange={setBattleProfitMode} open={openPetSelect === "profit"} onOpenChange={(open) => setOpenPetSelect(open ? "profit" : null)} />
          <PetSelect label="Food" value={foodPolicy} options={FOOD_OPTIONS} onChange={setFoodPolicy} open={openPetSelect === "food"} onOpenChange={(open) => setOpenPetSelect(open ? "food" : null)} />
          <button
            className={`pet-toggle ${patBonus ? "active" : ""}`}
            aria-label="Toggle pet pat bonus"
            aria-pressed={patBonus}
            onClick={() => setPatBonus((value) => !value)}
          >
            <HeartPulse size={16} />
            Pat +5%
          </button>
          <button
            className={`pet-toggle ${beastmaster ? "active" : ""}`}
            aria-label="Toggle Beastmaster context"
            aria-pressed={beastmaster}
            onClick={() => setBeastmaster((value) => !value)}
          >
            <PawPrint size={16} />
            Beastmaster
          </button>
          {activeProfile?.pet?.species ? (
            <button
              className="pet-toggle"
              onClick={() => {
                setSearchTerm(activeProfile.pet.species);
                if (typeof activeProfile.pet.level === "number") setPetLevel(clampNumber(activeProfile.pet.level, 1, 100));
                if (typeof activeProfile.pet.evolution === "number") setEvolutionStage(clampNumber(activeProfile.pet.evolution, 0, 5));
                if (typeof activeProfile.levels.petMastery === "number") setMasteryLevel(clampNumber(activeProfile.levels.petMastery, 1, 100));
              }}
            >
              <Database size={16} />
              Use profile pet
            </button>
          ) : null}
          {ownedPetCount > 0 ? (
            <button
              className={`pet-toggle ${sourceFilter === "OWNED" ? "active" : ""}`}
              aria-label="Show owned pets from the active profile"
              aria-pressed={sourceFilter === "OWNED"}
              onClick={() => {
                setSourceFilter("OWNED");
                setSearchTerm("");
              }}
            >
              <PawPrint size={16} />
              Owned pets
            </button>
          ) : null}
        </div>
        <div className="pet-effect-note">
          Stats update from this setup. Market values and battle notes stay separate.
        </div>
      </details>

      {loadError && <ErrorState title="Pet database unavailable" description={loadError} />}
      {!database && !loadError && <LoadingState title="Loading pet database" description="Preparing pet stats, exchange listings, ownership matches, and battle samples." />}

      {database && (
        <>
          <section className="pets-signal-row">
            <div>
              <Dumbbell size={18} />
              <span>Visible</span>
              <strong>{petRows.length}</strong>
            </div>
            <div>
              <Search size={18} />
              <span>Fastest</span>
              <strong>{bestHunter ? secondsToDuration(bestHunter.huntingTime) : "-"}</strong>
            </div>
            <div>
              <BarChart3 size={18} />
              <span>Battle Samples</span>
              <strong>{battleResearchPetCount || "-"}</strong>
            </div>
            <div>
              <Database size={18} />
              <span>Highest Listing</span>
              <strong>{bestMarket ? formatCompactGold(bestMarket.pet.exchange?.minPrice) : "-"}</strong>
            </div>
            <div>
              <PawPrint size={18} />
              <span>Owned Matches</span>
              <strong>{ownedPetCount ? `${ownedPetCount} pets / ${ownedSpeciesCount} species` : "-"}</strong>
            </div>
          </section>
          <div className="pet-result-status" aria-live="polite" aria-atomic="true">
            <span>{resultAnnouncement}</span>
            <strong className={scenarioIsModified ? "modified" : undefined}>
              {scenarioLabel}{scenarioIsModified ? " / Modified" : ""}
            </strong>
          </div>

          <div className="pets-content">
            <section className="pets-list" aria-label="Pet results">
              {petRows.length === 0 ? (
                <NoResultsState
                  title="No pets found"
                  description={
                    hasActiveFilters
                      ? `Search "${searchTerm || "any"}" with ${qualityFilter === "ALL" ? "all qualities" : qualityLabel(qualityFilter)} and ${SOURCE_OPTIONS.find((option) => option.value === sourceFilter)?.label || "all sources"}.`
                      : "The pet database loaded, but no rows matched the current view."
                  }
                  action={hasActiveFilters ? (
                    <button type="button" onClick={clearPetFilters}>
                      Clear filters
                    </button>
                  ) : null}
                />
              ) : viewMode === "cards" ? (
                <div className="pets-card-grid">
                  {petRows.map((row) => (
                    <PetCard
                      key={row.pet.name}
                      pet={row.pet}
                      stats={row.stats}
                      totalPower={row.totalPower}
                      huntingTime={row.huntingTime}
                      ownedCount={row.ownedPets.length}
                      onInspect={() => setSelectedPetName(row.pet.name)}
                    />
                  ))}
                </div>
              ) : (
                <div className="pets-table-wrap">
                  <table className="pets-table">
                    <thead>
                      <tr>
                        <th>Pet</th>
                        <th>Quality</th>
                        <th>Power</th>
                        <th>Move</th>
                        <th>Hunter</th>
                        <th>Battle Samples</th>
                        <th>Owned</th>
                        <th>Source</th>
                        <th>Exchange</th>
                      </tr>
                    </thead>
                    <tbody>
                      {petRows.map((row) => (
                        <tr key={row.pet.name}>
                          <td>
                            <span className="table-pet-cell">
                              <PetImage pet={row.pet} />
                              <span>{row.pet.name}</span>
                              <button
                                type="button"
                                aria-label={`Open details for ${row.pet.name}`}
                                onClick={() => setSelectedPetName(row.pet.name)}
                              >
                                Open details
                              </button>
                            </span>
                          </td>
                          <td>{qualityLabel(row.pet.quality)}</td>
                          <td>{formatNumber(row.totalPower)}</td>
                          <td>{formatNumber(row.stats.movement_speed, 2)}m/s</td>
                          <td>{secondsToDuration(row.huntingTime)}</td>
                          <td>{formatBattleZoneCount(row.pet)}</td>
                          <td>{row.ownedPets.length ? `${row.ownedPets.length} saved` : "-"}</td>
                          <td>{getPetSourceLabel(row.pet)}</td>
                          <td>{formatGold(row.pet.exchange?.minPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {modalRootReady && selectedRow ? createPortal(
              (
              <div className="pet-modal-backdrop" role="presentation" onClick={() => setSelectedPetName(null)}>
              <div className="pet-detail pet-modal" aria-labelledby="pet-detail-title" aria-modal="true" ref={petDetailDialogRef} role="dialog" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
                <button className="pet-detail-close" type="button" aria-label="Close pet details" onClick={() => setSelectedPetName(null)} title="Close pet details">
                  <X size={16} />
                </button>
                <div className="pet-detail-head">
                  <PetImage pet={selectedRow.pet} />
                  <div>
                    <span className="pet-quality-line" style={getQualityTextStyle(selectedRow.pet.quality)}>
                      {qualityLabel(selectedRow.pet.quality)}
                    </span>
                    <h2 id="pet-detail-title">{selectedRow.pet.name}</h2>
                    <p>{getPetSourceLabel(selectedRow.pet)}</p>
                  </div>
                </div>

                <div className="pet-detail-metrics">
                  <div>
                    <Swords size={15} />
                    <span>Total Power</span>
                    <strong>{formatNumber(selectedRow.totalPower)}</strong>
                  </div>
                  <div>
                    <Gauge size={15} />
                    <span>Movement</span>
                    <strong>{formatNumber(selectedRow.stats.movement_speed, 2)}m/s</strong>
                  </div>
                  <div>
                    <Search size={15} />
                    <span>Hunt Time</span>
                    <strong>{secondsToDuration(selectedRow.huntingTime)}</strong>
                  </div>
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Shield size={15} /> Stats
                  </h3>
                  <div className="pet-stat-grid">
                    {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => (
                      <div key={key}>
                        <span>{STAT_LABELS[key]}</span>
                        <strong>
                          {key === "movement_speed" || key === "critical_damage" || key === "critical_chance"
                            ? formatNumber(selectedRow.stats[key], 2)
                            : formatNumber(selectedRow.stats[key])}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Egg size={15} /> Source
                  </h3>
                  {selectedRow.pet.egg ? (
                    <button
                      className="pet-egg-button"
                      onClick={() => {
                        const egg = selectedRow.pet.egg;
                        if (!egg) return;
                        setSelectedPetName(null);
                        if (egg.hashedId) openItem(egg.hashedId);
                        else openItemByName(egg.name);
                      }}
                    >
                      <GameImage
                        src={selectedRow.pet.egg.imageUrl}
                        alt=""
                        width={34}
                        height={34}
                        sizes="34px"
                        fallback={<Egg size={18} />}
                      />
                      <span>{selectedRow.pet.egg.name}</span>
                      <strong>{selectedRow.pet.egg.worldBosses?.map((boss) => boss.name).join(", ") || "Open item"}</strong>
                    </button>
                  ) : (
                    <p className="pet-muted">No linked egg item in the current public item database.</p>
                  )}
                  {selectedRow.pet.sourceOverride ? (
                    <div className="pet-source-override">
                      <span>{selectedRow.pet.sourceOverride.label}</span>
                      {selectedRow.pet.sourceOverride.merchant?.url ? (
                        <a href={selectedRow.pet.sourceOverride.merchant.url} target="_blank" rel="noreferrer">
                          {getMerchantPrice(selectedRow.pet.sourceOverride)}
                        </a>
                      ) : null}
                      {selectedRow.pet.sourceOverride.notes?.map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </div>
                  ) : null}
                  {selectedRow.pet.acquisition?.length ? (
                    <div className="pet-source-list">
                      {selectedRow.pet.acquisition.map((entry, index) => (
                        <div key={`${entry.egg}-${index}`}>
                          <span>{entry.boss || entry.location || "Unknown source"}</span>
                          <strong>
                            {entry.chancePercent ? `${entry.chancePercent}%` : "Chance pending"} - {entry.levelRequirement || "No level data"}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Database size={15} /> Exchange Listings
                  </h3>
                  <p className="pet-section-note">
                    These are Companion Exchange listing snapshots, not guaranteed sale prices. Use the lowest listing as a market floor and the median/average as context when enough listings exist.
                  </p>
                  <div className="pet-source-list">
                    <div>
                      <span>Companion Exchange listings</span>
                      <strong>{selectedRow.pet.exchange?.listingCount || 0}</strong>
                    </div>
                    <div>
                      <span>Lowest listing</span>
                      <strong>{formatGold(selectedRow.pet.exchange?.minPrice)}</strong>
                    </div>
                    <div>
                      <span>Median listing</span>
                      <strong>{formatGold(selectedRow.pet.exchange?.medianPrice)}</strong>
                    </div>
                    <div>
                      <span>Average listing</span>
                      <strong>{formatGold(selectedRow.pet.exchange?.averagePrice)}</strong>
                    </div>
                  </div>
                  {selectedRow.pet.valuation ? (
                    <div className="pet-source-list pet-source-list-spaced">
                      <div>
                        <span>Value model egg price</span>
                        <strong>{formatGold(selectedRow.pet.valuation.eggPrice)}</strong>
                      </div>
                      <div>
                        <span>Level 100 bonus</span>
                        <strong>{formatGold(selectedRow.pet.valuation.level100Bonus)}</strong>
                      </div>
                      <div>
                        <span>Sample estimate</span>
                        <strong>{formatGold(selectedRow.pet.valuation.samples?.[0]?.roughEstimate)}</strong>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="pet-detail-section">
                  <h3>
                    <Zap size={15} /> Battle Context
                  </h3>
                  <p className="pet-section-note">
                    Zone rows are deeper research data, not standalone pet ROI. They are useful for comparing pet fit, but actual profit depends more on the character doing combat than on the pet alone.
                  </p>
                  {selectedRow.pet.battle?.zones?.length ? (
                    (() => {
                      const bestZone = getBestBattleZone(selectedRow.pet, battleProfitMode, foodPolicy);
                      return (
                        <>
                          <div className="pet-battle-preview">
                            <div>
                              <span>Best sample zone</span>
                              <strong>{bestZone?.zone || "Sample pending"}</strong>
                            </div>
                            <div>
                              <span>Selected mode</span>
                              <strong>{BATTLE_PROFIT_OPTIONS.find((option) => option.value === battleProfitMode)?.label}</strong>
                            </div>
                            {bestZone ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPetName(null);
                                  setSelectedBattle({ pet: selectedRow.pet, zone: bestZone });
                                }}
                              >
                                Open best zone
                              </button>
                            ) : null}
                          </div>
                          <details className="pet-battle-details">
                            <summary>
                              <span>{selectedRow.pet.battle.zones.length} zone{selectedRow.pet.battle.zones.length === 1 ? "" : "s"} with battle samples</span>
                              <strong>View all zones</strong>
                            </summary>
                            <div className="pet-zone-list">
                              {selectedRow.pet.battle.zones.map((zone) => (
                                <button
                                  type="button"
                                  className="pet-zone-button"
                                  key={zone.zone}
                                  onClick={() => {
                                    setSelectedPetName(null);
                                    setSelectedBattle({ pet: selectedRow.pet, zone });
                                  }}
                                >
                                  <span>{zone.zone}</span>
                                  <strong>
                                    {secondsToDuration(zone.battleTimeSeconds)} - {zone.enemiesBattled || "-"} enemies
                                  </strong>
                                </button>
                              ))}
                            </div>
                          </details>
                        </>
                      );
                    })()
                  ) : (
                    <p className="pet-muted">No battle data is available for this pet yet.</p>
                  )}
                </div>

                <div className="pet-research-note">
                  <BadgeInfo size={15} />
                  <span>Pet stats update from the scenario controls above. Listing prices, value estimates, and battle returns are separate data sources and should not be read as the same type of value.</span>
                </div>
              </div>
              </div>
              ),
              document.body,
            ) : null}
          </div>

          {modalRootReady && selectedBattle ? createPortal(
            (
            <div className="pet-modal-backdrop pet-battle-backdrop" role="presentation" onClick={() => setSelectedBattle(null)}>
              <div className="pet-battle-modal" aria-labelledby="pet-battle-title" aria-modal="true" ref={petBattleDialogRef} role="dialog" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
                <button className="pet-detail-close" type="button" aria-label="Close battle details" onClick={() => setSelectedBattle(null)} title="Close battle details">
                  <X size={16} />
                </button>
                <div className="pet-detail-head">
                  <PetImage pet={selectedBattle.pet} />
                  <div>
                    <span className="pet-quality-line" style={getQualityTextStyle(selectedBattle.pet.quality)}>
                      Battle Samples
                    </span>
                    <h2 id="pet-battle-title">{selectedBattle.pet.name}</h2>
                    <p>{selectedBattle.zone.zone}</p>
                  </div>
                </div>
                <div className="pet-research-note">
                  <BadgeInfo size={15} />
                  <span>This is zone research for the selected scenario, not a standalone pet ROI. Character stats, gear, food, sleep timing, and combat zone choice drive the final return.</span>
                </div>
                <div className="pet-detail-metrics">
                  <div>
                    <Zap size={15} />
                    <span>Battle Time</span>
                    <strong>{secondsToDuration(selectedBattle.zone.battleTimeSeconds)}</strong>
                  </div>
                  <div>
                    <Swords size={15} />
                    <span>Enemies</span>
                    <strong>{formatNumber(selectedBattle.zone.enemiesBattled)}</strong>
                  </div>
                  <div>
                    <Database size={15} />
                    <span>Loot Pieces</span>
                    <strong>{formatNumber(selectedBattle.zone.lootPieces)}</strong>
                  </div>
                </div>
                <div className="pet-source-list">
                  <div>
                    <span>Selected profit/hr</span>
                    <strong>{formatGold(getZoneProfitValue(selectedBattle.zone, battleProfitMode, foodPolicy))}</strong>
                  </div>
                  <div>
                    <span>Profit/hr no sleep</span>
                    <strong>{formatGold(selectedBattle.zone.expectedProfitPerHourNoSleep)}</strong>
                  </div>
                  <div>
                    <span>Profit/hr with sleep</span>
                    <strong>{formatGold(selectedBattle.zone.expectedProfitPerHourWithSleep)}</strong>
                  </div>
                  <div>
                    <span>Healing + sleep</span>
                    <strong>{formatGold(selectedBattle.zone.expectedProfitPerHourHealingWithSleep)}</strong>
                  </div>
                  <div>
                    <span>Revenue/battle</span>
                    <strong>{formatGold(selectedBattle.zone.expectedRevenuePerBattle)}</strong>
                  </div>
                  <div>
                    <span>Profit/battle</span>
                    <strong>{formatGold(selectedBattle.zone.expectedProfitPerBattle)}</strong>
                  </div>
                  <div>
                    <span>Food cost/hr</span>
                    <strong>{formatGold(selectedBattle.zone.foodCostPerHourCheapest)}</strong>
                  </div>
                  <div>
                    <span>Profit margin</span>
                    <strong>{formatPercent(selectedBattle.zone.profitMargin)}</strong>
                  </div>
                </div>
                <div className="pet-detail-section">
                  <h3>
                    <HeartPulse size={15} /> Sleep / Stamina Cycle
                  </h3>
                  <div className="pet-source-list">
                    <div>
                      <span>Max stamina</span>
                      <strong>{formatNumber(selectedBattle.zone.cycle?.maxStamina)}</strong>
                    </div>
                    <div>
                      <span>Stamina / battle</span>
                      <strong>{formatNumber(selectedBattle.zone.cycle?.staminaDrainPerBattle, 2)}</strong>
                    </div>
                    <div>
                      <span>Stamina / hour</span>
                      <strong>{formatNumber(selectedBattle.zone.cycle?.staminaDrainPerHour, 2)}</strong>
                    </div>
                    <div>
                      <span>Battles before sleep</span>
                      <strong>{formatNumber(selectedBattle.zone.cycle?.battlesBeforeSleep, 1)}</strong>
                    </div>
                    <div>
                      <span>Zero stamina battle time</span>
                      <strong>{secondsToDuration(selectedBattle.zone.cycle?.timeBattledForZeroStaminaSeconds)}</strong>
                    </div>
                    <div>
                      <span>Stamina recovery</span>
                      <strong>{secondsToDuration(selectedBattle.zone.cycle?.staminaRecoveryZeroToFullSeconds)}</strong>
                    </div>
                    <div>
                      <span>Health recovery</span>
                      <strong>{secondsToDuration(selectedBattle.zone.cycle?.healthRecoveryZeroToFullSeconds)}</strong>
                    </div>
                    <div>
                      <span>Sleep/battle stamina</span>
                      <strong>{formatNumber(selectedBattle.zone.cycle?.sleepToBattleForStamina, 2)}</strong>
                    </div>
                  </div>
                </div>
                <div className="pet-detail-section">
                  <h3>
                    <BarChart3 size={15} /> Expected Drop Breakdown
                  </h3>
                  {selectedBattleDrops.length ? (
                    <div className="pet-drop-table-wrap">
                      <table className="pet-drop-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Drop</th>
                            <th>Value share</th>
                            <th>Best price</th>
                            <th>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBattleDrops
                            .slice()
                            .sort((a, b) => Number(b.valueShareMaxPrice || b.valueSharePercent || 0) - Number(a.valueShareMaxPrice || a.valueSharePercent || 0))
                            .slice(0, 16)
                            .map((drop, index) => (
                              <tr key={`${drop.itemName}-${drop.source}-${index}`}>
                                <td>{drop.itemName || "-"}</td>
                                <td>{formatPercent(drop.expectedDropPercent, 3)}</td>
                                <td>{formatPercent(drop.valueShareMaxPrice ?? drop.valueSharePercent, 1)}</td>
                                <td>{formatGold(drop.prices?.bestAfterTaxSellValue ?? drop.prices?.megaLastDayPriceAfterTax ?? drop.prices?.marketPrice)}</td>
                                <td>{drop.source === "mega_test_calculator" ? "Battle sample" : "Drop table"}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="pet-muted">No drop breakdown matched this zone yet.</p>
                  )}
                </div>
                <div className="pet-detail-section">
                  <h3>
                    <BadgeInfo size={15} /> Scenario Context
                  </h3>
                  <div className="pet-source-list">
                    <div>
                      <span>Mode</span>
                      <strong>{BATTLE_PROFIT_OPTIONS.find((option) => option.value === battleProfitMode)?.label}</strong>
                    </div>
                    <div>
                      <span>Food</span>
                      <strong>{FOOD_OPTIONS.find((option) => option.value === foodPolicy)?.label}</strong>
                    </div>
                    <div>
                      <span>Beastmaster</span>
                      <strong>{beastmaster ? "+10% pet EXP" : "Off"}</strong>
                    </div>
                  </div>
                </div>
                <div className="pet-research-note">
                  <BadgeInfo size={15} />
                  <span>Profit shown here reflects the selected sleep and food settings. Beastmaster is shown as pet EXP context.</span>
                </div>
              </div>
            </div>
            ),
            document.body,
          ) : null}
        </>
      )}
    </main>
  );
}
