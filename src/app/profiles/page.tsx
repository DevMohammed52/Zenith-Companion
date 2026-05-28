"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Copy,
  Download,
  FileUp,
  Home,
  Loader2,
  Package,
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  MAX_PROFILES,
  createDefaultProfile,
  type CharacterProfile,
  type CombatStyle,
  type ProfileFieldSource,
  type ProfileOwnedPet,
  type ProfileUpdateOptions,
  useProfiles,
} from "@/lib/profiles";
import ZenithIcon from "@/components/icons/ZenithIcon";
import QualityText from "@/components/QualityText";
import {
  mergeImportedProfileDraft,
  type ImportedProfileDraft,
  type ImportedProfileMergeResult,
} from "@/lib/profile-import";
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
import { calculateHousingBuffs, canUseHousingGuestAccess, formatHours, getHousingActivityLabel } from "@/lib/housing";
import {
  formatProfileBackupAge,
  getLastProfileBackupAt,
  markProfileBackupCopied,
  PROFILE_BACKUP_DUE_MS,
} from "@/lib/local-backup";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { ErrorState } from "@/components/StateBlock";

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
] as const;

type ProfileSectionId = typeof PROFILE_SECTIONS[number][0];
const PROFILE_SECTION_IDS = new Set<ProfileSectionId>(PROFILE_SECTIONS.map(([id]) => id));
const PROFILE_BACKUP_HASH = "#profile-backup";

const PROFILE_IMPORT_API_URL = "/api";
const CHARACTER_HASH_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;
const LIVE_IMPORT_STORAGE_KEY = "zenith.profileImport.active.v1";
const LIVE_IMPORT_CHANNEL = "zenith-profile-import";
const LIVE_IMPORT_LEASE_KEY = "zenith.profileImport.pollLease.v1";
const LIVE_IMPORT_LEASE_MS = 18000;
const LIVE_IMPORT_HASH_HELP_ID = "profile-live-import-hash-help";
const LIVE_IMPORT_STATUS_ID = "profile-live-import-status";
const LIVE_IMPORT_ERROR_ID = "profile-live-import-error";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === "1"
  ? ""
  : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

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

function formatProfileSourceMode(mode?: string) {
  if (mode === "imported") return "Imported";
  if (mode === "mixed") return "Mixed";
  return "Manual";
}

function formatProfileSourceDate(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function profilePetSnapshotKey(pet: Pick<CharacterProfile["pet"], "species" | "level" | "evolution">) {
  return `${pet.species.toLowerCase()}::${pet.level || ""}::${pet.evolution || ""}`;
}

type ProfileImportReview = ImportedProfileMergeResult & {
  draftName?: string;
  importedSections: string[];
  missingOrPrivate: string[];
};

type LiveProfileImportStatus = "idle" | "queued" | "running" | "waiting_for_budget" | "done" | "error" | "expired";

type LiveProfileImportCharacter = {
  role?: "root" | "visible_alt";
  draft?: ImportedProfileDraft;
};

type LiveProfileImportResult = {
  rootHashTail?: string;
  requestCount?: number;
  durationMs?: number;
  characters?: LiveProfileImportCharacter[];
  warnings?: string[];
};

type LiveProfileImportProgress = {
  current?: number;
  total?: number;
  label?: string;
  estimatedRemainingMs?: number;
};

type LiveProfileImportSnapshot = {
  version: 1;
  jobId: string;
  characterHash?: string;
  characterHashTail?: string;
  status: LiveProfileImportStatus;
  progress?: LiveProfileImportProgress | null;
  result?: LiveProfileImportResult | null;
  selectedIndex?: number;
  error?: string;
  retryAfterMs?: number | null;
  estimatedMs?: number | null;
  startedAt: number;
  updatedAt: number;
};

type LiveProfileImportLease = {
  tabId?: string;
  until?: number;
};

function formatWaitTime(ms?: number) {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return "";
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

function getRetryAfterMs(payload: unknown) {
  if (!isRecord(payload)) return null;
  if (typeof payload.retryAfterMs === "number") return payload.retryAfterMs;
  if (typeof payload.pollAfterMs === "number") return payload.pollAfterMs;
  return null;
}

type PetPickerValue =
  | { kind: "database"; pet: PetDatabaseRecord }
  | { kind: "owned"; pet: ProfileOwnedPet };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLiveImportTerminal(status: LiveProfileImportStatus) {
  return status === "done" || status === "error" || status === "expired";
}

function parseLiveImportSnapshot(value: string | null): LiveProfileImportSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.jobId !== "string" || !parsed.jobId) return null;
    const status = typeof parsed.status === "string" ? parsed.status as LiveProfileImportStatus : "idle";
    if (!["queued", "running", "waiting_for_budget", "done", "error", "expired"].includes(status)) return null;
    const startedAt = typeof parsed.startedAt === "number" ? parsed.startedAt : Date.now();
    const updatedAt = typeof parsed.updatedAt === "number" ? parsed.updatedAt : startedAt;
    return {
      version: 1,
      jobId: parsed.jobId,
      characterHash: typeof parsed.characterHash === "string" ? parsed.characterHash : undefined,
      characterHashTail: typeof parsed.characterHashTail === "string" ? parsed.characterHashTail : undefined,
      status,
      progress: isRecord(parsed.progress) ? parsed.progress : null,
      result: isRecord(parsed.result) ? parsed.result as LiveProfileImportResult : null,
      selectedIndex: typeof parsed.selectedIndex === "number" ? parsed.selectedIndex : 0,
      error: typeof parsed.error === "string" ? parsed.error : "",
      retryAfterMs: typeof parsed.retryAfterMs === "number" ? parsed.retryAfterMs : null,
      estimatedMs: typeof parsed.estimatedMs === "number" ? parsed.estimatedMs : null,
      startedAt,
      updatedAt,
    };
  } catch {
    return null;
  }
}

function parseLiveImportLease(value: string | null): LiveProfileImportLease | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? {
      tabId: typeof parsed.tabId === "string" ? parsed.tabId : undefined,
      until: typeof parsed.until === "number" ? parsed.until : undefined,
    } : null;
  } catch {
    return null;
  }
}

function liveProfileImportStatusLabel(status: LiveProfileImportStatus, retryAfterMs?: number | null) {
  if (status === "queued") return "Queued";
  if (status === "running") return "Importing";
  if (status === "waiting_for_budget") return "Waiting for safe budget";
  if (status === "done") return "Ready to save";
  if (status === "error" && retryAfterMs) return "Import paused";
  if (status === "error") return "Import failed";
  if (status === "expired") return "Expired";
  return "Not started";
}

function liveProfileImportStatusCopy(status: LiveProfileImportStatus, retryAfterMs?: number | null) {
  if (status === "queued") return "Your import is queued. Zenith will restore it if you leave this page and come back.";
  if (status === "running") return "Zenith is fetching visible character details. You can leave this page and return later.";
  if (status === "waiting_for_budget") return "Another scraper or import is using the shared budget, so this job is waiting briefly.";
  if (status === "done") return "Choose the character you want, check the summary, then save it to the active profile.";
  if (status === "error" && retryAfterMs) return "Imports are busy right now. You can close this page and try again after the timer.";
  if (status === "error") return "The import could not finish. Check the message below and try again later.";
  if (status === "expired") return "This import result expired. Start a new import if you still need it.";
  return "Paste a character hash to fetch visible IdleMMO profile details. Nothing is saved until you confirm.";
}

function profileDraftDisplayName(draft?: ImportedProfileDraft) {
  return typeof draft?.name === "string" && draft.name.trim() ? draft.name.trim() : "Imported character";
}

function getLiveImportErrorMessage(payload: unknown, fallback: string) {
  const retryAfterMs = getRetryAfterMs(payload);
  const retryText = retryAfterMs ? formatWaitTime(retryAfterMs) : "";
  if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
    const message = payload.error.message.trim();
    return retryText && !message.toLowerCase().includes("try again")
      ? `${message} Try again in about ${retryText}.`
      : message;
  }
  return retryText ? `${fallback} Try again in about ${retryText}.` : fallback;
}

function formatItemEffects(effects?: ProfileItemRecord["effects"], limit = 3) {
  const entries = (effects || [])
    .filter((effect) => Number(effect?.value || 0) !== 0)
    .slice(0, limit);
  if (!entries.length) return "";
  return entries.map((effect) => {
    const target = String(effect.target || "").replace(/_/g, " ");
    const attribute = String(effect.attribute || "").replace(/_/g, " ");
    const value = Number(effect.value || 0);
    const suffix = effect.value_type === "percentage" || effect.value_type === "efficiency" ? "%" : "";
    const label = attribute === "magic find" ? "MF" : formatStatName(attribute);
    return `${target ? `${target} ` : ""}${label} +${value}${suffix}`;
  }).join(" / ");
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

function buildProfileCopySummary(profile: CharacterProfile) {
  return [
    `${profile.name || "Unnamed Character"} (${profile.kind === "main" ? "main" : "alt"})`,
    `Class: ${profile.className || "Unknown"}`,
    `Total Level: ${Number(profile.levels.totalLevel || 0).toLocaleString()}`,
    `Combat: ${Number(profile.levels.combat || 0).toLocaleString()}`,
    `Location: ${profile.location?.name || "Not imported"}`,
    profile.guild?.tag ? `Guild: ${profile.guild.tag}` : "",
  ].filter(Boolean).join("\n");
}

function formatFieldSourceLabel(source: ProfileFieldSource["source"]) {
  if (source === "imported") return "Imported";
  if (source === "calculated") return "Calculated";
  return "Manual";
}

function FieldSourceChip({ source }: { source?: ProfileFieldSource }) {
  if (!source) return null;
  const timestamp = source.importedAt || source.updatedAt;
  const date = timestamp ? new Date(timestamp) : null;
  const dateLabel = date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)
    : "";
  const label = formatFieldSourceLabel(source.source);
  const accessibleLabel = dateLabel ? `${label}. Last updated ${dateLabel}` : label;
  return (
    <em className={`profile-source-chip source-${source.source}`} aria-label={accessibleLabel}>
      {label}
    </em>
  );
}

function ProfileNumberField({
  label,
  value,
  onChange,
  onBlur,
  step = "1",
  min,
  max,
  hint,
  source,
}: {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  onBlur?: () => void;
  step?: string;
  min?: number;
  max?: number;
  hint?: ReactNode;
  source?: ProfileFieldSource;
}) {
  return (
    <label className="profile-field">
      <span className="profile-field-labelrow">
        <span>{label}</span>
        <FieldSourceChip source={source} />
      </span>
      <input
        className="control-input"
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        onBlur={onBlur}
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
  source,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  source?: ProfileFieldSource;
}) {
  return (
    <label className="profile-field">
      <span className="profile-field-labelrow">
        <span>{label}</span>
        <FieldSourceChip source={source} />
      </span>
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
  subtitle?: ReactNode;
  image?: string;
  badge?: ReactNode;
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
  source,
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
  source?: ProfileFieldSource;
}) {
  const [query, setQuery] = useState("");
  const [menuMetrics, setMenuMetrics] = useState({ placement: "down" as "down" | "up", maxHeight: 320 });
  const open = openId === id;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedImageClass = selected?.title === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 90);
    return options.filter((option) => option.searchText.toLowerCase().includes(needle)).slice(0, 90);
  }, [options, query]);
  const capped = visible.length < options.length;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenId(null);
      setQuery("");
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpenId]);

  useEffect(() => {
    if (!open) return;
    const updateMenuMetrics = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const mobilePicker = window.matchMedia("(max-width: 620px)").matches;
      if (mobilePicker) {
        const next = { placement: "down" as const, maxHeight: Math.max(260, window.innerHeight - 96) };
        setMenuMetrics((current) => current.placement === next.placement && current.maxHeight === next.maxHeight ? current : next);
        return;
      }
      const gap = 10;
      const preferredHeight = 448;
      const minimumUsefulHeight = 280;
      const below = window.innerHeight - rect.bottom - gap;
      const above = rect.top - gap;
      const placement = below < minimumUsefulHeight && above > below ? "up" as const : "down" as const;
      const available = placement === "up" ? above : below;
      const maxHeight = Math.max(220, Math.min(preferredHeight, Math.floor(available)));
      setMenuMetrics((current) => current.placement === placement && current.maxHeight === maxHeight ? current : { placement, maxHeight });
    };

    updateMenuMetrics();
    window.addEventListener("resize", updateMenuMetrics);
    window.addEventListener("scroll", updateMenuMetrics, true);
    return () => {
      window.removeEventListener("resize", updateMenuMetrics);
      window.removeEventListener("scroll", updateMenuMetrics, true);
    };
  }, [open]);

  const pickerMenuStyle = {
    "--profile-picker-menu-max-height": `${menuMetrics.maxHeight}px`,
  } as CSSProperties & Record<"--profile-picker-menu-max-height", string>;

  return (
    <div className={`profile-picker ${open ? "open" : ""}`}>
      <span className="profile-picker-label profile-field-labelrow">
        <span>{label}</span>
        <FieldSourceChip source={source} />
      </span>
      <button
        type="button"
        ref={triggerRef}
        className="profile-picker-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `profile-picker-menu-${id}` : undefined}
        aria-label={`${label}: ${selected?.title || placeholder}`}
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
        <div
          className={`profile-picker-menu ${menuMetrics.placement === "up" ? "drop-up" : ""}`}
          id={`profile-picker-menu-${id}`}
          role="dialog"
          aria-label={`${label} picker`}
          style={pickerMenuStyle}
        >
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
            <input value={query} placeholder={`Search ${label.toLowerCase()}...`} aria-label={`Search ${label.toLowerCase()}`} onChange={(event) => setQuery(event.target.value)} autoFocus />
          </label>
          <div className="profile-picker-options custom-scrollbar">
            {capped && (
              <div className="profile-picker-limit-note" role="note">
                Showing first {visible.length.toLocaleString()} of {options.length.toLocaleString()}. Search to narrow.
              </div>
            )}
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
    replaceState,
    exportProfiles,
    importProfiles,
  } = useProfiles();
  const [transferText, setTransferText] = useState("");
  const [profileHashDraft, setProfileHashDraft] = useState("");
  const [importReview, setImportReview] = useState<ProfileImportReview | null>(null);
  const [liveImportHash, setLiveImportHash] = useState("");
  const [liveImportJobId, setLiveImportJobId] = useState("");
  const [liveImportStatus, setLiveImportStatus] = useState<LiveProfileImportStatus>("idle");
  const [liveImportProgress, setLiveImportProgress] = useState<LiveProfileImportProgress | null>(null);
  const [liveImportResult, setLiveImportResult] = useState<LiveProfileImportResult | null>(null);
  const [liveImportSelectedIndex, setLiveImportSelectedIndex] = useState(0);
  const [liveImportError, setLiveImportError] = useState("");
  const [liveImportRetryAfterMs, setLiveImportRetryAfterMs] = useState<number | null>(null);
  const [liveImportEstimatedMs, setLiveImportEstimatedMs] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(!TURNSTILE_SITE_KEY);
  const [turnstileError, setTurnstileError] = useState("");
  const [toast, setToast] = useState("");
  const [lastBackupAt, setLastBackupAt] = useState(0);
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"restore" | "delete" | null>(null);
  const [activeProfileSection, setActiveProfileSection] = useState<ProfileSectionId>("identity");
  const [petDb, setPetDb] = useState<{ pets: PetDatabaseRecord[]; mastery?: { levels?: PetMasteryLevelRecord[] } } | null>(null);
  const liveImportPollRef = useRef<number | null>(null);
  const liveImportAbortRef = useRef<AbortController | null>(null);
  const liveImportChannelRef = useRef<BroadcastChannel | null>(null);
  const liveImportTabIdRef = useRef(`profile-import-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetRef = useRef<string | null>(null);
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

  const openProfileSection = (section: ProfileSectionId) => {
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
  };

  useEffect(() => () => {
    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
    }
    liveImportAbortRef.current?.abort();
    const lease = parseLiveImportLease(window.localStorage.getItem(LIVE_IMPORT_LEASE_KEY));
    if (lease?.tabId === liveImportTabIdRef.current) {
      window.localStorage.removeItem(LIVE_IMPORT_LEASE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      setTurnstileReady(true);
      return;
    }

    let cancelled = false;
    let fallbackTimeout: number | null = null;
    setTurnstileReady(false);
    setTurnstileError("");

    const renderTurnstile = () => {
      if (cancelled || !turnstileContainerRef.current || !window.turnstile || turnstileWidgetRef.current) return;
      if (fallbackTimeout !== null) {
        window.clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      turnstileWidgetRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "dark",
        callback: (token) => {
          setTurnstileToken(token);
          setTurnstileReady(true);
          setTurnstileError("");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setTurnstileError("Quick check expired. Run it again before importing.");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setTurnstileReady(true);
          setTurnstileError("Quick check could not load. Try refreshing this page.");
        },
      });
      setTurnstileReady(true);
    };

    const handleTurnstileLoadError = () => {
      if (cancelled) return;
      setTurnstileReady(true);
      setTurnstileError("Quick check could not load. Refresh this page or disable blockers for this site.");
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (window.turnstile) {
      renderTurnstile();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderTurnstile, { once: true });
      existingScript.addEventListener("error", handleTurnstileLoadError, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderTurnstile, { once: true });
      script.addEventListener("error", handleTurnstileLoadError, { once: true });
      document.head.appendChild(script);
    }

    fallbackTimeout = window.setTimeout(() => {
      if (!window.turnstile) {
        handleTurnstileLoadError();
        return;
      }
      renderTurnstile();
    }, 8000);

    return () => {
      cancelled = true;
      if (fallbackTimeout !== null) {
        window.clearTimeout(fallbackTimeout);
      }
      if (turnstileWidgetRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current);
      }
      turnstileWidgetRef.current = null;
    };
  }, [activeProfileSection]);

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

  const updateDailyStreak = (value: number | "") => {
    if (!profile) return;
    patchActive({ magicFind: updateMagicFindFromStreak(profile.magicFind, value) });
  };

  const selectPet = (selection: PetPickerValue | null) => {
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
    markProfileBackupCopied();
    setLastBackupAt(getLastProfileBackupAt());
    try {
      await navigator.clipboard?.writeText(payload);
      setToast("Profile export copied to clipboard.");
    } catch {
      setToast("Profile export generated below.");
    }
  };

  const handleCopyValue = async (label: string, value: string) => {
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
  };

  const handleImport = () => {
    if (!transferText.trim()) {
      setToast("Paste a profile export before importing.");
      return;
    }
    setConfirmAction("restore");
  };

  const confirmImportProfiles = () => {
    const result = importProfiles(transferText);
    setConfirmAction(null);
    setToast(result.ok ? "Profiles imported into this browser." : result.error || "Import failed.");
  };

  const buildProfileImportReview = useCallback((importedDraft: ImportedProfileDraft): ProfileImportReview | null => {
    if (!profile) return null;
    const result = mergeImportedProfileDraft(profile, importedDraft);
    return {
      ...result,
      draftName: typeof importedDraft.name === "string" ? importedDraft.name : undefined,
      importedSections: importedDraft.importSource?.importedSections || [],
      missingOrPrivate: importedDraft.importSource?.missingOrPrivate || [],
    };
  }, [profile]);

  const prepareProfileImportReview = useCallback((importedDraft: ImportedProfileDraft, source = "Imported character ready to save.") => {
    const nextReview = buildProfileImportReview(importedDraft);
    if (!nextReview) return;
    setImportReview(nextReview);
    if (source) setToast(source);
  }, [buildProfileImportReview]);

  const saveLiveImportSnapshot = useCallback((patch: Partial<LiveProfileImportSnapshot> & { jobId: string; status: LiveProfileImportStatus }) => {
    const previous = typeof window !== "undefined" ? parseLiveImportSnapshot(window.localStorage.getItem(LIVE_IMPORT_STORAGE_KEY)) : null;
    const now = Date.now();
    const snapshot: LiveProfileImportSnapshot = {
      version: 1,
      jobId: patch.jobId,
      characterHash: patch.characterHash ?? previous?.characterHash,
      characterHashTail: patch.characterHashTail ?? previous?.characterHashTail,
      status: patch.status,
      progress: patch.progress !== undefined ? patch.progress : previous?.progress ?? null,
      result: patch.result !== undefined ? patch.result : previous?.result ?? null,
      selectedIndex: patch.selectedIndex !== undefined ? patch.selectedIndex : previous?.selectedIndex ?? 0,
      error: patch.error !== undefined ? patch.error : previous?.error ?? "",
      retryAfterMs: patch.retryAfterMs !== undefined ? patch.retryAfterMs : previous?.retryAfterMs ?? null,
      estimatedMs: patch.estimatedMs !== undefined ? patch.estimatedMs : previous?.estimatedMs ?? null,
      startedAt: patch.startedAt || previous?.startedAt || now,
      updatedAt: now,
    };

    window.localStorage.setItem(LIVE_IMPORT_STORAGE_KEY, JSON.stringify(snapshot));
    liveImportChannelRef.current?.postMessage({ type: "snapshot", snapshot });
    return snapshot;
  }, []);

  const clearLiveImportSnapshot = useCallback(() => {
    window.localStorage.removeItem(LIVE_IMPORT_STORAGE_KEY);
    const lease = parseLiveImportLease(window.localStorage.getItem(LIVE_IMPORT_LEASE_KEY));
    if (lease?.tabId === liveImportTabIdRef.current) {
      window.localStorage.removeItem(LIVE_IMPORT_LEASE_KEY);
    }
    liveImportChannelRef.current?.postMessage({ type: "clear" });
  }, []);

  const applyLiveImportSnapshot = useCallback((snapshot: LiveProfileImportSnapshot, source: "local" | "remote" = "remote") => {
    setLiveImportJobId(snapshot.jobId);
    if (snapshot.characterHash) setLiveImportHash(snapshot.characterHash);
    setLiveImportStatus(snapshot.status);
    setLiveImportProgress(snapshot.progress || null);
    setLiveImportRetryAfterMs(snapshot.retryAfterMs ?? null);
    setLiveImportEstimatedMs(snapshot.estimatedMs ?? null);
    setLiveImportSelectedIndex(snapshot.selectedIndex || 0);
    setLiveImportError(snapshot.error || "");

    const result = snapshot.result ? {
      ...snapshot.result,
      characters: Array.isArray(snapshot.result.characters)
        ? snapshot.result.characters.filter((entry) => isRecord(entry?.draft))
        : [],
    } : null;
    setLiveImportResult(result);

    const selectedDraft = result?.characters?.[snapshot.selectedIndex || 0]?.draft;
    if (snapshot.status === "done" && selectedDraft) {
      prepareProfileImportReview(selectedDraft, source === "local" ? "" : "Imported character ready to save.");
    } else if (snapshot.status !== "done") {
      setImportReview(null);
    }

    if (!isLiveImportTerminal(snapshot.status)) {
      scheduleLiveImportPoll(snapshot.jobId, document.visibilityState === "hidden" ? 15000 : 3500);
    }
  }, [prepareProfileImportReview]);

  const acquireLiveImportPollingLease = useCallback(() => {
    const now = Date.now();
    const current = parseLiveImportLease(window.localStorage.getItem(LIVE_IMPORT_LEASE_KEY));
    if (current?.tabId && current.tabId !== liveImportTabIdRef.current && Number(current.until || 0) > now) {
      return false;
    }
    window.localStorage.setItem(LIVE_IMPORT_LEASE_KEY, JSON.stringify({
      tabId: liveImportTabIdRef.current,
      until: now + LIVE_IMPORT_LEASE_MS,
    }));
    return true;
  }, []);

  const resetLiveImportState = useCallback((broadcast = true) => {
    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
      liveImportPollRef.current = null;
    }
    setLiveImportJobId("");
    setLiveImportStatus("idle");
    setLiveImportProgress(null);
    setLiveImportResult(null);
    setLiveImportSelectedIndex(0);
    setLiveImportError("");
    setLiveImportRetryAfterMs(null);
    setLiveImportEstimatedMs(null);
    setImportReview(null);
    if (broadcast) {
      clearLiveImportSnapshot();
    }
  }, [clearLiveImportSnapshot]);

  function scheduleLiveImportPoll(jobId: string, delayMs = 3500) {
    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
    }
    const fallbackDelay = document.visibilityState === "hidden" ? 15000 : 3500;
    const safeDelay = Math.max(2000, Math.min(Number(delayMs) || fallbackDelay, document.visibilityState === "hidden" ? 30000 : 15000));
    liveImportPollRef.current = window.setTimeout(() => {
      void pollLiveImportJob(jobId);
    }, safeDelay);
  }

  async function pollLiveImportJob(jobId: string) {
    if (!acquireLiveImportPollingLease()) {
      scheduleLiveImportPoll(jobId, document.visibilityState === "hidden" ? 15000 : 5000);
      return;
    }

    try {
      const response = await fetch(`${PROFILE_IMPORT_API_URL}/profile-import/status/${encodeURIComponent(jobId)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 410) {
        throw new Error(getLiveImportErrorMessage(payload, "Could not read import status."));
      }

      const nextStatus = (isRecord(payload) && typeof payload.status === "string" ? payload.status : "error") as LiveProfileImportStatus;
      setLiveImportStatus(nextStatus);
      setLiveImportProgress(isRecord(payload) && isRecord(payload.progress) ? payload.progress : null);
      setLiveImportRetryAfterMs(getRetryAfterMs(payload));

      if (nextStatus === "done") {
        const result = isRecord(payload) && isRecord(payload.result) ? payload.result as LiveProfileImportResult : null;
        const characters = Array.isArray(result?.characters) ? result.characters.filter((entry) => isRecord(entry?.draft)) : [];
        const nextResult = result ? { ...result, characters } : { characters: [] };
        setLiveImportResult(result ? { ...result, characters } : { characters: [] });
        setLiveImportSelectedIndex(0);
        setLiveImportError(characters.length ? "" : "The import finished, but no visible character profile was returned.");
        saveLiveImportSnapshot({
          jobId,
          status: nextStatus,
          progress: isRecord(payload) && isRecord(payload.progress) ? payload.progress : null,
          result: nextResult,
          selectedIndex: 0,
          error: characters.length ? "" : "The import finished, but no visible character profile was returned.",
          retryAfterMs: null,
        });
        if (characters[0]?.draft) {
          prepareProfileImportReview(characters[0].draft, "Imported character ready to save.");
        }
        return;
      }

      if (nextStatus === "error" || nextStatus === "expired") {
        const errorMessage = `${getLiveImportErrorMessage(payload, "This import could not finish.")} Your local profile was not changed.`;
        setLiveImportError(errorMessage);
        saveLiveImportSnapshot({
          jobId,
          status: nextStatus,
          progress: isRecord(payload) && isRecord(payload.progress) ? payload.progress : null,
          error: errorMessage,
          retryAfterMs: getRetryAfterMs(payload),
        });
        return;
      }

      saveLiveImportSnapshot({
        jobId,
        status: nextStatus,
        progress: isRecord(payload) && isRecord(payload.progress) ? payload.progress : null,
        error: "",
        retryAfterMs: getRetryAfterMs(payload),
      });
      scheduleLiveImportPoll(jobId, isRecord(payload) && typeof payload.pollAfterMs === "number" ? payload.pollAfterMs : 3500);
    } catch (error) {
      const errorMessage = `${error instanceof Error ? error.message : "Could not read import status."} Your local profile was not changed.`;
      setLiveImportStatus("error");
      setLiveImportError(errorMessage);
      saveLiveImportSnapshot({ jobId, status: "error", error: errorMessage });
    }
  }

  const handleStartLiveProfileImport = async () => {
    if (!profile) return;
    const characterHash = liveImportHash.trim();
    if (!CHARACTER_HASH_PATTERN.test(characterHash)) {
      setLiveImportError("Paste only the character hashed ID, not a full profile URL.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setLiveImportError("Complete the quick check before starting the import.");
      return;
    }

    if (liveImportPollRef.current !== null) {
      window.clearTimeout(liveImportPollRef.current);
    }
    liveImportAbortRef.current?.abort();
    const controller = new AbortController();
    liveImportAbortRef.current = controller;

    setLiveImportError("");
    setLiveImportResult(null);
    setLiveImportProgress(null);
    setLiveImportRetryAfterMs(null);
    setLiveImportEstimatedMs(null);
    setImportReview(null);
    setLiveImportStatus("queued");

    try {
      const response = await fetch(`${PROFILE_IMPORT_API_URL}/profile-import/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterHash,
          includeVisibleAlts: true,
          includeMuseum: true,
          turnstileToken: TURNSTILE_SITE_KEY ? turnstileToken : undefined,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLiveImportRetryAfterMs(getRetryAfterMs(payload));
        throw new Error(getLiveImportErrorMessage(payload, "Could not start the import."));
      }
      const jobId = isRecord(payload) && typeof payload.jobId === "string" ? payload.jobId : "";
      if (!jobId) throw new Error("Import started without a job reference. Try again.");
      const estimatedMs = isRecord(payload) && typeof payload.estimatedDurationMs === "number" ? payload.estimatedDurationMs : null;
      setLiveImportJobId(jobId);
      setLiveImportEstimatedMs(estimatedMs);
      setLiveImportStatus("queued");
      saveLiveImportSnapshot({
        jobId,
        characterHash,
        characterHashTail: characterHash.slice(-12),
        status: "queued",
        progress: null,
        result: null,
        selectedIndex: 0,
        error: "",
        retryAfterMs: null,
        estimatedMs,
        startedAt: Date.now(),
      });
      scheduleLiveImportPoll(jobId, isRecord(payload) && typeof payload.pollAfterMs === "number" ? payload.pollAfterMs : 3000);
      setToast("Import started. You can leave this page and come back while Zenith prepares the saved profile preview.");
    } catch (error) {
      if (controller.signal.aborted) return;
      setLiveImportStatus("error");
      setLiveImportJobId("");
      setLiveImportError(`${error instanceof Error ? error.message : "Could not start the import."} Your local profile was not changed.`);
    } finally {
      if (TURNSTILE_SITE_KEY) {
        setTurnstileToken("");
        if (turnstileWidgetRef.current) window.turnstile?.reset(turnstileWidgetRef.current);
      }
    }
  };

  const handleReviewLiveImportCharacter = (index: number) => {
    const character = liveImportResult?.characters?.[index];
    if (!character?.draft) return;
    setLiveImportSelectedIndex(index);
    prepareProfileImportReview(character.draft, "Selected character ready to save.");
    if (liveImportJobId) {
      saveLiveImportSnapshot({
        jobId: liveImportJobId,
        status: liveImportStatus,
        selectedIndex: index,
      });
    }
  };

  useEffect(() => {
    const restoreSavedImport = () => {
      const snapshot = parseLiveImportSnapshot(window.localStorage.getItem(LIVE_IMPORT_STORAGE_KEY));
      if (snapshot) applyLiveImportSnapshot(snapshot, "local");
    };

    restoreSavedImport();

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LIVE_IMPORT_STORAGE_KEY) return;
      if (!event.newValue) {
        resetLiveImportState(false);
        return;
      }
      const snapshot = parseLiveImportSnapshot(event.newValue);
      if (snapshot) applyLiveImportSnapshot(snapshot, "remote");
    };

    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(LIVE_IMPORT_CHANNEL) : null;
    liveImportChannelRef.current = channel;
    if (channel) {
      channel.onmessage = (event: MessageEvent) => {
        const message = event.data;
        if (!isRecord(message)) return;
        if (message.type === "clear") {
          resetLiveImportState(false);
          return;
        }
        if (message.type === "snapshot") {
          const snapshot = parseLiveImportSnapshot(JSON.stringify(message.snapshot));
          if (snapshot) applyLiveImportSnapshot(snapshot, "remote");
        }
      };
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
        if (liveImportChannelRef.current === channel) liveImportChannelRef.current = null;
      }
    };
  }, [applyLiveImportSnapshot, resetLiveImportState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const snapshot = parseLiveImportSnapshot(window.localStorage.getItem(LIVE_IMPORT_STORAGE_KEY));
      if (!snapshot || isLiveImportTerminal(snapshot.status)) return;
      scheduleLiveImportPoll(snapshot.jobId, document.visibilityState === "hidden" ? 15000 : 1500);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (liveImportStatus !== "done") return;
    const importedDraft = liveImportResult?.characters?.[liveImportSelectedIndex]?.draft;
    if (!importedDraft) return;
    const nextReview = buildProfileImportReview(importedDraft);
    if (nextReview) setImportReview(nextReview);
  }, [buildProfileImportReview, liveImportResult, liveImportSelectedIndex, liveImportStatus]);

  const handleApplyProfileImport = () => {
    if (!profile || !importReview) return;
    updateProfile(profile.id, importReview.profile, { markFields: false });
    setTransferText("");
    setToast(`Saved ${importReview.draftName || "imported details"} to ${profile.name || "the active profile"}. The other fetched characters are still available below.`);
    clearLiveImportSnapshot();
  };

  const handleCreateProfileFromSelectedImport = () => {
    const importedDraft = liveImportResult?.characters?.[liveImportSelectedIndex]?.draft;
    if (!importedDraft) return;
    if (state.profiles.length >= MAX_PROFILES) {
      setToast("Profile limit reached.");
      return;
    }
    const baseProfile = {
      ...createDefaultProfile(""),
      kind: "alt" as const,
    };
    const created = {
      ...mergeImportedProfileDraft(baseProfile, importedDraft).profile,
      kind: "alt" as const,
    };
    replaceState({
      ...state,
      activeProfileId: created.id,
      profiles: [...state.profiles, created],
    });
    setToast(`Created ${created.name || "a new profile"} from the selected import. The fetched batch is still available.`);
    clearLiveImportSnapshot();
  };

  const handleCreateProfileFromHash = () => {
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
  };

  const handleDeleteProfile = () => {
    if (!profile) return;
    setConfirmAction("delete");
  };

  const confirmDeleteProfile = () => {
    if (!profile) return;
    deleteProfile(profile.id);
    setConfirmAction(null);
    setToast("Profile deleted.");
  };

  const confirmDetails = confirmAction === "restore"
    ? {
        title: "Restore Profile Backup",
        body: `Replace the current ${state.profiles.length.toLocaleString()} local profile${state.profiles.length === 1 ? "" : "s"} in this browser with the pasted backup JSON? This does not affect IdleMMO or cloud data.`,
        action: "Restore profiles",
        onConfirm: confirmImportProfiles,
      }
    : confirmAction === "delete"
      ? {
          title: "Delete Profile",
          body: `Delete "${profile?.name || "Unnamed"}" from this browser? Profile-scoped local planner data for this character may no longer be reachable.`,
          action: "Delete profile",
          onConfirm: confirmDeleteProfile,
        }
      : null;
  const confirmDialogRef = useModalA11y<HTMLDivElement>(Boolean(confirmDetails), () => setConfirmAction(null), {
    initialFocusRef: confirmCancelRef,
  });

  const liveImportWaitText = formatWaitTime(liveImportProgress?.estimatedRemainingMs || liveImportEstimatedMs || undefined);
  const liveImportRetryText = formatWaitTime(liveImportRetryAfterMs || undefined);
  const liveImportBusy = liveImportStatus === "queued" || liveImportStatus === "running" || liveImportStatus === "waiting_for_budget";
  const liveImportHasUnsavedResult = Boolean(liveImportResult?.characters?.length && importReview);

  const getSlotOptions = (types: string[]) => types.flatMap((type) => itemOptionsByType[type] || []);
  const itemPickerOption = (item: ProfileItemRecord): PickerOption<ProfileItemRecord> => ({
    id: item.name || "",
    title: item.name || "Unknown item",
    subtitle: (
      <>
        <QualityText value={item.quality || "UNKNOWN"}>{item.quality || "UNKNOWN"}</QualityText> - {String(item.type || "").replace(/_/g, " ")}
        {getItemRequirementLevel(item) ? ` - Lv. ${getItemRequirementLevel(item)}` : ""}
      </>
    ),
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
  const renderGearSlot = (key: string, label: string, types: string[], disabled = false, tiered = true) => {
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
          source={fieldSource(`gear.${key}`)}
          onSelect={(item) => {
            const next = item as ProfileItemRecord | null;
            patchActive({
              gear: { ...profile.gear, [key]: next?.name || "" },
              gearTiers: { ...profile.gearTiers, [key]: 1 },
            });
          }}
        />
        {tiered && (
          <ProfileNumberField
            label={`Tier / ${maxTier}`}
            value={profile.gearTiers?.[key] ?? 1}
            min={1}
            max={maxTier}
            onChange={(value) => {
              patchActive({
                gearTiers: {
                  ...profile.gearTiers,
                  [key]: value === "" ? "" : Math.min(Math.max(Number(value) || 1, 1), maxTier),
                },
              });
            }}
            onBlur={() => {
              if (profile.gearTiers?.[key] === "") {
                patchActive({ gearTiers: { ...profile.gearTiers, [key]: 1 } });
              }
            }}
            source={fieldSource(`gearTiers.${key}`)}
          />
        )}
        {selected && (
          <div className="profile-slot-stats">
            <span>{formatShortStats(selected.stats, 5) || formatItemEffects(selected.effects, 4) || "No base stats"}</span>
            {selected.tier_modifiers && <small>Tier gain: {formatShortStats(selected.tier_modifiers, 5)}</small>}
            {tiered && <small>Slot preview: AP {stats.attackPower}, Prot {stats.protection}, Agi {stats.agility}, Acc {stats.accuracy}</small>}
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
          <h1 className="header-title"><ZenithIcon name="profile" size={24} style={{ color: "var(--text-accent)" }} /> PROFILES</h1>
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
  const petOptions: Array<PickerOption<PetPickerValue>> = [
    {
      id: "none",
      title: "No Pet Selected",
      subtitle: "Clear pet data",
      searchText: "none clear no pet",
      value: null,
      muted: true,
    },
    ...(profile?.ownedPets || []).map((ownedPet) => {
      const databasePet = petByName.get(ownedPet.species);
      const title = ownedPet.nickname || ownedPet.species;
      const sourceLabel = ownedPet.source === "imported" ? "Imported owned pet" : "Owned pet";
      return {
        id: `owned-${ownedPet.id}`,
        title,
        subtitle: `${sourceLabel} - ${ownedPet.species} - Lv. ${ownedPet.level || 1} - Evo ${ownedPet.evolution || 0}`,
        image: ownedPet.imageUrl || databasePet?.imageUrl,
        badge: ownedPet.equipped || ownedPet.active ? "Active" : "Owned",
        searchText: [
          title,
          ownedPet.species,
          ownedPet.quality,
          ownedPet.source,
          ownedPet.location?.name,
          ownedPet.hashTail,
          "owned imported snapshot",
        ].filter(Boolean).join(" "),
        value: { kind: "owned", pet: ownedPet } as PetPickerValue,
      };
    }),
    ...pets.map((pet) => ({
      id: `db-${pet.name}`,
      title: pet.name,
      subtitle: (
        <>
          <QualityText value={pet.quality || "UNKNOWN"}>{pet.quality || "UNKNOWN"}</QualityText>
          {pet.acquisition?.[0]?.boss ? ` - ${pet.acquisition[0].boss}` : ""}
        </>
      ),
      image: pet.imageUrl,
      badge: <QualityText value={pet.quality}>{pet.quality}</QualityText>,
      searchText: `${pet.name} ${pet.quality} ${pet.acquisition?.map((entry) => `${entry.boss} ${entry.location}`).join(" ")}`,
      value: { kind: "database", pet } as PetPickerValue,
    })),
  ];
  const selectedPetOption = selectedOwnedPet
    ? petOptions.find((option) => option.id === `owned-${selectedOwnedPet.id}`)
    : selectedPet
      ? petOptions.find((option) => option.id === `db-${selectedPet.name}`)
      : petOptions[0];

  return (
    <main className="container profiles-page" onClick={(event) => {
      if (!(event.target as HTMLElement).closest(".profile-picker")) setOpenPicker(null);
    }}>
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="header profile-header">
        <div>
          <h1 className="header-title"><ZenithIcon name="profile" size={24} style={{ color: "var(--text-accent)" }} /> PROFILES</h1>
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
          <a
            key={id}
            href={`#profile-${id}`}
            aria-current={activeProfileSection === id ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              openProfileSection(id);
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <a
        className="profile-import-jump-card"
        href="#profile-transfer"
        onClick={(event) => {
          event.preventDefault();
          openProfileSection("transfer");
        }}
      >
        <span>
          <FileUp size={17} />
          <strong>Import from IdleMMO</strong>
        </span>
        <em>
          {profile.importSource.importedAt || profile.importSource.refreshedAt
            ? `Last import: ${formatProfileSourceDate(profile.importSource.importedAt || profile.importSource.refreshedAt)}`
            : "Fill visible character details without scrolling through manual setup."}
        </em>
      </a>

      <div className={`profile-backup-reminder ${backupDue ? "profile-backup-reminder-due" : ""}`}>
        <div>
          <strong>Local browser data</strong>
          <span>
            Profiles are saved only in this browser. {formatProfileBackupAge(lastBackupAt)}
          </span>
        </div>
        <button type="button" className="profile-action" onClick={handleExport}>
          <Download size={15} /> Copy backup
        </button>
      </div>

      <section className="profile-layout" aria-label="Profile manager">
        <section className="profile-list-panel" aria-labelledby="profile-list-heading">
          <div className="profile-count">
            <span>{state.profiles.length} / {MAX_PROFILES}</span>
            <strong id="profile-list-heading">Local Profiles</strong>
          </div>
          <div className="profile-list">
            {state.profiles.map((item) => {
              const active = item.id === profile.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`profile-list-item ${item.imageUrl || item.backgroundUrl ? "has-art" : ""} ${active ? "active" : ""}`}
                  aria-pressed={active}
                  aria-label={`${active ? "Active profile" : "Switch to profile"}: ${item.name || "Unnamed Character"}`}
                  onClick={() => setActiveProfile(item.id)}
                >
                  {item.backgroundUrl && <span className="profile-list-item-bg" style={{ backgroundImage: `url("${item.backgroundUrl}")` }} aria-hidden="true" />}
                  <span className="profile-avatar">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <UserRound size={18} />}
                  </span>
                  <span>
                    <strong>{item.name || "Unnamed Character"}</strong>
                    <small>{item.kind === "main" ? "Main" : "Alt"} - {item.className}{item.location?.name ? ` - ${item.location.name}` : ""}</small>
                  </span>
                  {active && <BadgeCheck size={16} />}
                </button>
              );
            })}
          </div>
        </section>

        <div className="profile-editor">
          {activeProfileSection === "identity" && (
          <section id="profile-identity" className="profile-panel profile-identity-panel" tabIndex={-1}>
            <div className="profile-panel-heading">
              <div>
                <h2>Identity</h2>
                <p>Stable profile data used by calculators.</p>
              </div>
              <div className="profile-inline-actions">
                <button type="button" onClick={() => {
                  const created = duplicateProfile(profile.id);
                  if (created) setToast("Profile duplicated.");
                }} disabled={state.profiles.length >= MAX_PROFILES} aria-label="Duplicate active profile">
                  <Copy size={15} />
                </button>
                <button type="button" onClick={handleDeleteProfile} aria-label="Delete active profile">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div
              className={`profile-game-hero ${profile.backgroundUrl ? "has-background" : ""}`}
              style={profile.backgroundUrl ? { backgroundImage: `url(${profile.backgroundUrl})` } : undefined}
            >
              <div className="profile-game-hero-character">
                {profile.imageUrl ? <img src={profile.imageUrl} alt="" /> : <UserRound size={38} />}
              </div>
              <div className="profile-game-hero-panel">
                <div className="profile-game-hero-title">
                  <h3>{profile.name || "Unnamed Character"}</h3>
                  <span>{profile.kind === "main" ? "Main" : "Alt"}</span>
                </div>
                <div className="profile-chip-row">
                  <span>{profile.className}</span>
                  <span>Total Lv. {profile.levels.totalLevel || 0}</span>
                  <span>{profile.location?.name || "No location imported"}</span>
                  {profile.guild?.tag && <span>Guild {profile.guild.tag}</span>}
                </div>
                <div className="profile-copy-row" aria-label="Copy profile values">
                  <button type="button" onClick={() => handleCopyValue("Profile summary", buildProfileCopySummary(profile))}>
                    <Copy size={14} /> Summary
                  </button>
                  <button type="button" onClick={() => handleCopyValue("Profile name", profile.name || "")}>
                    <Copy size={14} /> Name
                  </button>
                  {profile.importSource.characterHashTail && (
                    <button type="button" onClick={() => handleCopyValue("Character hash tail", profile.importSource.characterHashTail || "")}>
                      <Copy size={14} /> Hash tail
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="profile-grid identity-grid">
              <ProfileTextField label="Character Name" value={profile.name} onChange={(name) => patchActive({ name })} placeholder="Character name" source={fieldSource("name")} />
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
                  searchText: `${entry.id} ${entry.category}`,
                  value: entry.id,
                }))}
                openId={openPicker}
                setOpenId={setOpenPicker}
                onSelect={(value) => patchActive({ className: String(value || "Other") })}
                source={fieldSource("className")}
              />
              <label className="profile-field">
                <span className="profile-field-labelrow">
                  <span>Character Type</span>
                  <FieldSourceChip source={fieldSource("kind")} />
                </span>
                <div className="profile-segmented">
                  <button type="button" className={profile.kind === "main" ? "active" : ""} onClick={() => patchActive({ kind: "main" })}>Main</button>
                  <button type="button" className={profile.kind === "alt" ? "active" : ""} onClick={() => patchActive({ kind: "alt" })}>Alt</button>
                </div>
              </label>
            </div>
            <details className="profile-media-details">
              <summary>Media</summary>
              <div className="profile-grid identity-grid">
                <ProfileTextField label="Character Image URL" value={profile.imageUrl} onChange={(imageUrl) => patchActive({ imageUrl })} placeholder="Imported image URL" source={fieldSource("imageUrl")} />
                <ProfileTextField label="Background URL" value={profile.backgroundUrl} onChange={(backgroundUrl) => patchActive({ backgroundUrl })} placeholder="Imported background URL" source={fieldSource("backgroundUrl")} />
              </div>
            </details>
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
              <span className="profile-field-labelrow">
                <span>Notes</span>
                <FieldSourceChip source={fieldSource("notes")} />
              </span>
              <textarea className="control-input" value={profile.notes} onChange={(event) => patchActive({ notes: event.target.value })} />
            </label>
          </section>
          )}

          {activeProfileSection === "levels" && (
          <section id="profile-levels" className="profile-panel" tabIndex={-1}>
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
                    source={fieldSource(`levels.${key}`)}
                  />
                );
              })}
            </div>
          </section>
          )}

          {activeProfileSection === "combat" && (
          <section id="profile-combat" className="profile-panel" tabIndex={-1}>
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
                  source={fieldSource(`secondaryStats.${key}`)}
                />
              ))}
            </div>
          </section>
          )}

          {activeProfileSection === "magic" && (
          <section id="profile-magic" className="profile-panel" tabIndex={-1}>
            <div className="profile-panel-heading">
              <div>
                <h2>Magic, Efficiency, Timers</h2>
                <p>Daily streak, conquest, bartering level, efficiencies, and playtime belong to this character. Page-specific potions, shrine, essence, and weather stay on the relevant page.</p>
              </div>
              <div className="profile-stat-pill"><Sparkles size={14} /> +{dailyBonus}% streak MF</div>
            </div>
            <div className="profile-grid compact">
              <ProfileNumberField label="Combat Magic Find" value={profile.magicFind.combat} min={0} onChange={(value) => updateNested("magicFind", "combat", value)} source={fieldSource("magicFind.combat")} />
              <ProfileNumberField label="Dungeon Magic Find" value={profile.magicFind.dungeon} min={0} onChange={(value) => updateNested("magicFind", "dungeon", value)} source={fieldSource("magicFind.dungeon")} />
              <ProfileNumberField label="World Boss Magic Find" value={profile.magicFind.worldBoss} min={0} onChange={(value) => updateNested("magicFind", "worldBoss", value)} source={fieldSource("magicFind.worldBoss")} />
              <ProfileNumberField
                label="Daily Streak"
                value={profile.magicFind.dailyStreak}
                min={0}
                onChange={updateDailyStreak}
                hint="1% magic find every 10 days, capped at 10%. Tracked once per UTC reset day after you enter it."
                source={fieldSource("magicFind.dailyStreak")}
              />
              <ProfileNumberField label="Hunting Efficiency" value={profile.efficiency.hunting} min={0} onChange={(value) => updateNested("efficiency", "hunting", value)} source={fieldSource("efficiency.hunting")} />
              <ProfileNumberField label="Dungeon Efficiency" value={profile.efficiency.dungeon} min={0} onChange={(value) => updateNested("efficiency", "dungeon", value)} source={fieldSource("efficiency.dungeon")} />
              <ProfileNumberField label="Playtime (hours/day)" value={profile.timers.activeHours} min={0} max={24} onChange={(value) => updateNested("timers", "activeHours", value)} source={fieldSource("timers.activeHours")} />
              <ProfilePicker<AssaultRank>
                id="conquest-buff"
                label="Conquest Buff"
                placeholder="Select conquest buff"
                selected={{
                  id: profile.boosts.conquestRank,
                  title: ASSAULT_OPTIONS.find((option) => option.value === profile.boosts.conquestRank)?.label || "No conquest buff",
                  subtitle: "Alchemy efficiency and tax effects",
                  searchText: profile.boosts.conquestRank,
                  value: profile.boosts.conquestRank,
                }}
                options={ASSAULT_OPTIONS.map((option) => ({
                  id: option.value,
                  title: option.label,
                  subtitle: "Conquest buff",
                  searchText: `${option.value} ${option.label}`,
                  value: option.value as AssaultRank,
                }))}
                openId={openPicker}
                setOpenId={setOpenPicker}
                onSelect={(value) => updateNested("boosts", "conquestRank", value || "none")}
                source={fieldSource("boosts.conquestRank")}
              />
              <ProfileNumberField
                label="Bartering Level"
                value={profile.boosts.barteringLevel}
                min={0}
                max={100}
                onChange={(value) => updateNested("boosts", "barteringLevel", value === "" ? "" : Math.min(100, Math.max(0, Number(value))))}
                hint={`Vendor bonus: +${barteringPercent}%`}
                source={fieldSource("boosts.barteringLevel")}
              />
            </div>
          </section>
          )}

          {activeProfileSection === "pet" && (
          <section id="profile-pet" className="profile-panel" tabIndex={-1}>
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
                source={fieldSource("pet.species")}
              />
              <ProfileTextField label="Quality" value={profile.pet.quality} onChange={(value) => updateNested("pet", "quality", value)} placeholder="Select a pet" source={fieldSource("pet.quality")} />
              <ProfileNumberField label="Pet Level" value={profile.pet.level} min={1} max={100} onChange={(value) => updatePetFormula({ level: value })} source={fieldSource("pet.level")} />
              <ProfileNumberField label="Evolution Level" value={profile.pet.evolution} min={0} max={5} onChange={(value) => updatePetFormula({ evolution: value })} source={fieldSource("pet.evolution")} />
            </div>
            {(selectedOwnedPet || selectedPet) && (
              <div className="profile-selected-card">
                {(selectedOwnedPet?.imageUrl || selectedPet?.imageUrl) && (
                  <img
                    src={selectedOwnedPet?.imageUrl || selectedPet?.imageUrl}
                    alt=""
                    className={(selectedOwnedPet?.species || selectedPet?.name) === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined}
                  />
                )}
                <div>
                  <h3>{selectedOwnedPet?.nickname || selectedOwnedPet?.species || selectedPet?.name}</h3>
                  <p>
                    {selectedOwnedPet ? (
                      <>
                        <QualityText value={selectedOwnedPet.quality || "UNKNOWN"}>{selectedOwnedPet.quality || "Unknown quality"}</QualityText> - {selectedOwnedPet.source === "imported" ? "Imported owned snapshot" : "Owned snapshot"}
                      </>
                    ) : (
                      <>
                        <QualityText value={selectedPet?.quality || "UNKNOWN"}>{selectedPet?.quality || "Unknown quality"}</QualityText> - {selectedPet?.acquisition?.[0]?.boss || "Pet Database"}
                      </>
                    )}
                  </p>
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
                  source={fieldSource(`pet.stats.${key}`)}
                />
              ))}
            </div>
            <label className="profile-field profile-field-wide">
              <span className="profile-field-labelrow">
                <span>Pet Notes</span>
                <FieldSourceChip source={fieldSource("pet.notes")} />
              </span>
              <textarea className="control-input" value={profile.pet.notes} placeholder="Optional notes from screenshots or manual checks..." onChange={(event) => updateNested("pet", "notes", event.target.value)} />
            </label>
          </section>
          )}

          {activeProfileSection === "gear" && (
          <section id="profile-gear" className="profile-panel" tabIndex={-1}>
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
                  {renderGearSlot("special", "Special", ["SPECIAL"], false, false)}
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
                          source={fieldSource(`tools.${key}`)}
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
          )}

          {activeProfileSection === "housing" && (
          <section id="profile-housing" className="profile-panel" tabIndex={-1}>
            <div className="profile-panel-heading">
              <div>
                <h2>Housing Snapshot</h2>
                <p>Housing is profile-scoped and powers connected timers where available.</p>
              </div>
              <a className="profile-secondary-link" href="/housing"><Home size={16} /> Open Housing</a>
            </div>
            <div className="profile-grid">
              <div className="profile-field profile-field-wide">
                <span className="profile-field-labelrow">
                  <span>Mode</span>
                  <FieldSourceChip source={fieldSource("housing.mode")} />
                </span>
                <div className="profile-housing-mode-grid" role="group" aria-label="Housing mode">
                  {[
                    { value: "none", label: "None", hint: "No house buffs" },
                    { value: "owner", label: "Owner", hint: "Use built components" },
                    { value: "guest", label: "Guest", hint: "Use received buffs" },
                  ].map((option) => {
                    const blockedGuestOption = option.value === "guest" && !canUseGuestHousing;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={profile.housing.mode === option.value ? "active" : ""}
                        disabled={blockedGuestOption}
                        onClick={() => {
                          if (blockedGuestOption) return;
                          updateNested("housing", "mode", option.value as CharacterProfile["housing"]["mode"]);
                        }}
                      >
                        <strong>{option.label}</strong>
                        <span>{blockedGuestOption ? `${profile.className} cannot use guest access` : option.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                <span className="profile-field-labelrow">
                  <span>Housing Notes</span>
                  <FieldSourceChip source={fieldSource("housing.notes")} />
                </span>
                <textarea className="control-input" value={profile.housing.notes} onChange={(event) => updateNested("housing", "notes", event.target.value)} />
              </label>
            </div>
          </section>
          )}

          {activeProfileSection === "transfer" && (
          <section id="profile-transfer" className="profile-panel" tabIndex={-1}>
            <div className="profile-panel-heading">
              <div>
                <h2>Import from IdleMMO</h2>
                <p>Fetch your visible IdleMMO character details, choose the character you want, then save it to this local profile.</p>
              </div>
            </div>
            <div className="profile-import-current" aria-label="Saved IdleMMO import status">
              <div>
                <strong>
                  {profile.importSource.importedAt || profile.importSource.refreshedAt
                    ? `Last import: ${formatProfileSourceDate(profile.importSource.importedAt || profile.importSource.refreshedAt)}`
                    : "No IdleMMO import saved yet"}
                </strong>
                <span>
                  {profile.importSource.missingOrPrivate.length
                    ? `${profile.importSource.missingOrPrivate.length} section${profile.importSource.missingOrPrivate.length === 1 ? "" : "s"} could not be imported because they were private or unavailable.`
                    : profile.importSource.importedSections.length
                      ? "Visible character details were saved to this profile."
                      : "Start an import when you want Zenith to fill visible character details."}
                </span>
              </div>
              <span>{formatProfileSourceMode(profile.importSource.mode)}</span>
            </div>
            <div className="profile-live-import" aria-label="Import character from IdleMMO">
              <div className="profile-live-import-copy">
                <div>
                  <strong>Character import</strong>
                  <span>Use the hashed ID shown on your IdleMMO profile. Zenith will fetch visible levels, class, metrics, pets, visible alts, and museum entries.</span>
                </div>
                <div className="profile-live-import-notes" aria-label="Import privacy notes">
                  <span>Your saved Zenith profile stays in this browser.</span>
                  <span>The import service only handles the fetch job; it does not keep your final profile.</span>
                  <span>Usually takes about {liveImportWaitText || "1-2 min"}.</span>
                  <span>You can leave this page and come back.</span>
                  <span>Never paste an IdleMMO API key here.</span>
                </div>
              </div>
              <details className="profile-import-help">
                <summary>Where is my imported data saved?</summary>
                <div>
                  <p>Saved profiles, settings, queues, custom prices, and planner data are stored locally in this browser. Zenith does not store your character profile on a server.</p>
                  <p>The import worker may briefly process visible IdleMMO profile data to finish the import, but you choose what to save, and the saved profile remains on your device. Export a backup before clearing browser data or switching devices.</p>
                </div>
              </details>
              <details className="profile-import-help">
                <summary>How do I find my hashed character ID?</summary>
                <ol>
                  <li>Open IdleMMO, go to Settings, then find the Account section.</li>
                  <li>Enable <strong>Show Hashed Identifiers</strong>.</li>
                  <li>Open the character profile you want to import.</li>
                  <li>Scroll to the Information box and copy the character&apos;s Hashed ID below Birth Date.</li>
                </ol>
              </details>
              <details className="profile-import-help profile-import-limits">
                <summary>What will not be imported?</summary>
                <div>
                  <p>Zenith only reads public character data visible through IdleMMO. It does not fetch private account data or anything that requires your API key.</p>
                  <ul>
                    <li>Inventory, bank, storage, gold, shards, and market orders</li>
                    <li>Equipped gear, tools, food, potions, and anything else</li>
                    <li>Private or hidden alts, and unavailable profile sections</li>
                    <li>Zenith-only settings such as membership, magic find, timers, housing, boosts, custom prices, and tool selections</li>
                  </ul>
                </div>
              </details>
              <div className={`profile-live-import-form ${TURNSTILE_SITE_KEY ? "has-turnstile" : ""}`}>
                <label>
                  <span>Character hashed ID</span>
                  <input
                    className="control-input"
                    value={liveImportHash}
                    aria-describedby={`${LIVE_IMPORT_HASH_HELP_ID} ${LIVE_IMPORT_STATUS_ID}${liveImportError ? ` ${LIVE_IMPORT_ERROR_ID}` : ""}`}
                    aria-invalid={liveImportError && !liveImportJobId ? true : undefined}
                    onChange={(event) => {
                      setLiveImportHash(event.target.value);
                      setLiveImportError("");
                    }}
                    placeholder="Your character hashed ID"
                    autoComplete="off"
                  />
                  <small id={LIVE_IMPORT_HASH_HELP_ID}>Paste the character hashed ID only, not a full IdleMMO profile URL.</small>
                </label>
                {TURNSTILE_SITE_KEY ? (
                  <div className="profile-turnstile" aria-label="Import safety check">
                    <div ref={turnstileContainerRef} />
                    {!turnstileReady && <span>Loading quick check...</span>}
                    {turnstileError && <span className="profile-turnstile-error">{turnstileError}</span>}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="profile-action primary"
                  onClick={handleStartLiveProfileImport}
                  disabled={liveImportBusy || liveImportHasUnsavedResult || (Boolean(TURNSTILE_SITE_KEY) && (!turnstileReady || !turnstileToken))}
                >
                  {liveImportBusy ? <Loader2 size={15} className="spin" /> : <FileUp size={15} />}
                  {liveImportHasUnsavedResult ? "Save current import first" : "Start import"}
                </button>
              </div>
              <div
                id={LIVE_IMPORT_STATUS_ID}
                className={`profile-live-import-status ${liveImportStatus}`}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div>
                  <strong>{liveProfileImportStatusLabel(liveImportStatus, liveImportRetryAfterMs)}</strong>
                  <span>{liveImportProgress?.label || liveProfileImportStatusCopy(liveImportStatus, liveImportRetryAfterMs)}</span>
                </div>
                <div>
                  <strong>
                    {liveImportRetryText
                      ? liveImportRetryText
                      : liveImportProgress
                        ? `${liveImportProgress.current || 0}/${liveImportProgress.total || 20}`
                        : liveImportWaitText
                          ? `~${liveImportWaitText}`
                          : "Ready"}
                  </strong>
                  <span>{liveImportRetryText ? "Try again in" : liveImportProgress ? "Requests used" : "Estimated time"}</span>
                </div>
              </div>
              {liveImportError && (
                <ErrorState
                  compact
                  id={LIVE_IMPORT_ERROR_ID}
                  title="Import could not finish"
                  description={liveImportError}
                />
              )}
              {liveImportJobId && (
                <div className="profile-import-savebar" aria-label="Import recovery controls">
                  <div>
                    <strong>Import recovery is active</strong>
                    <span>This browser will restore the current job after reloads and sync status across open tabs.</span>
                  </div>
                  {!isLiveImportTerminal(liveImportStatus) && (
                    <button type="button" className="profile-action" onClick={() => void pollLiveImportJob(liveImportJobId)}>
                      <Loader2 size={15} /> Check status
                    </button>
                  )}
                  <button type="button" className="profile-action" onClick={() => resetLiveImportState()}>
                    <X size={15} /> Clear saved import
                  </button>
                </div>
              )}
              {liveImportResult?.characters?.length ? (
                <div className="profile-live-import-results" aria-label="Imported characters ready to save">
                  <div className="profile-live-import-result-heading">
                    <strong>{liveImportResult.characters.length} character{liveImportResult.characters.length === 1 ? "" : "s"} found</strong>
                    <span>{liveImportResult.requestCount || 0} safe request{liveImportResult.requestCount === 1 ? "" : "s"} used</span>
                  </div>
                  <div className="profile-live-import-character-list">
                    {liveImportResult.characters.map((character, index) => {
                      const draft = character.draft;
                      const selected = index === liveImportSelectedIndex;
                      return (
                        <button
                          type="button"
                          key={`${character.role || "character"}-${index}-${profileDraftDisplayName(draft)}`}
                          className={`profile-live-import-character ${selected ? "selected" : ""}`}
                          onClick={() => handleReviewLiveImportCharacter(index)}
                        >
                          <span>
                            <strong>{profileDraftDisplayName(draft)}</strong>
                            <small>{character.role === "visible_alt" ? "Visible alt" : "Entered character"}</small>
                          </span>
                          <span>
                            <b>{draft?.importSource?.importedSections?.length || 0}</b>
                            <small>Sections</small>
                          </span>
                          <span>
                            <b>{draft?.importSource?.missingOrPrivate?.length || "None"}</b>
                            <small>Missing/private</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {(liveImportResult.warnings || []).length > 0 && (
                    <p className="profile-transfer-message">{liveImportResult.warnings?.join(" ")}</p>
                  )}
                  {importReview && (
                    <div className="profile-import-savebar">
                      <div>
                        <strong>Ready to save {importReview.draftName || "selected character"}</strong>
                        <span>{importReview.appliedPaths.length} fields will update. {importReview.skippedManualPaths.length ? `${importReview.skippedManualPaths.length} filled manual fields will stay unchanged.` : "Blank/default fields can be filled by the import."}</span>
                      </div>
                      <button type="button" className="profile-action primary" onClick={handleApplyProfileImport}>
                        <BadgeCheck size={15} /> Save to active profile
                      </button>
                      <button type="button" className="profile-action" onClick={handleCreateProfileFromSelectedImport} disabled={state.profiles.length >= MAX_PROFILES}>
                        <Plus size={15} /> Create new profile
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {(profile.importSource.importedSections.length > 0 || profile.importSource.missingOrPrivate.length > 0 || profile.importSource.notes) && (
              <details className="profile-import-review-details profile-import-persistent" aria-label="Saved profile import detail">
                <summary>Import details</summary>
                <div>
                  <strong>Imported</strong>
                  <span>{profile.importSource.importedSections.join(", ") || "None recorded"}</span>
                </div>
                {profile.importSource.missingOrPrivate.length > 0 && (
                  <div>
                    <strong>Not imported</strong>
                    <span>{profile.importSource.missingOrPrivate.join(", ")}</span>
                  </div>
                )}
                {profile.importSource.notes && (
                  <div>
                    <strong>Notes</strong>
                    <span>{profile.importSource.notes}</span>
                  </div>
                )}
              </details>
            )}
            <div className="profile-import-handoff">
              <div>
                <strong>Hidden alt or separate character?</strong>
                <span>Create a local alt profile now, then paste that character&apos;s hashed ID above and import it when you switch to that profile.</span>
              </div>
              <label>
                <span>Character hash</span>
                <input
                  className="control-input"
                  value={profileHashDraft}
                  onChange={(event) => setProfileHashDraft(event.target.value)}
                  placeholder="Paste character hash ID..."
                  autoComplete="off"
                />
              </label>
              <button
                type="button"
                className="profile-action"
                onClick={handleCreateProfileFromHash}
                disabled={state.profiles.length >= MAX_PROFILES}
              >
                <Plus size={15} /> Create alt profile
              </button>
            </div>
            <details id="profile-backup" className="profile-json-transfer" tabIndex={-1}>
              <summary>Backup or restore local profiles</summary>
              <p>This is only for moving Zenith profiles between browsers. It is separate from IdleMMO character import.</p>
              <div className="profile-inline-actions">
                <button type="button" onClick={handleExport}><Download size={15} /> Copy backup JSON</button>
                <button type="button" onClick={handleImport}><Upload size={15} /> Restore from JSON</button>
              </div>
              <textarea
                aria-label="Profile backup JSON"
                className="control-input profile-transfer"
                value={transferText}
                placeholder="Paste a Zenith profile backup JSON here..."
                onChange={(event) => setTransferText(event.target.value)}
              />
            </details>
          </section>
          )}
        </div>
      </section>

      {confirmDetails && (
        <div className="modal-overlay profile-confirm-overlay" role="presentation" onClick={() => setConfirmAction(null)}>
          <div
            className="modal-content profile-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="profile-confirm-title"
            aria-describedby="profile-confirm-copy"
            ref={confirmDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="profile-confirm-title">{confirmDetails.title}</h2>
              <button className="close-btn" type="button" aria-label="Close confirmation" onClick={() => setConfirmAction(null)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="modal-body">
              <p className="profile-confirm-copy" id="profile-confirm-copy">{confirmDetails.body}</p>
              <div className="profile-confirm-actions">
                <button type="button" ref={confirmCancelRef} className="profile-action" onClick={() => setConfirmAction(null)}>Cancel</button>
                <button type="button" className="profile-action danger" onClick={confirmDetails.onConfirm}>{confirmDetails.action}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
