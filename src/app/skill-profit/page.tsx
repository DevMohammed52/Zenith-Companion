"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Eye,
  Filter,
  Info,
  PackageSearch,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { formatGold } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost, getProfileConquestRank } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import {
  SKILL_TO_HOUSING_ACTIVITY,
  calculateHousingBuffs,
  formatHours,
  getHousingIdleHoursForActivity,
} from "@/lib/housing";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import {
  ASCENSION_BUFFS,
  ASSAULT_OPTIONS,
  AssaultRank,
  DEFAULT_TOOL_SELECTIONS,
  GearData,
  ItemRegistry,
  SKILLS,
  SKILL_TOOLS,
  SkillName,
  SkillProfitRow,
  SkillProfitSettings,
  SkillProfitSortKey,
  ToolSkill,
  buildForgeRecipes,
  calculateSkillProfitRow,
  calculateSkillProfitRows,
  getBuffTotals,
} from "@/lib/skill-profit";
import styles from "./page.module.css";

const STORAGE_KEY = "zenith_skill_profit_finder";

const DEFAULT_SETTINGS: SkillProfitSettings = {
  membership: false,
  classBonus: false,
  energizingPoolExp: 0,
  assaultRank: "none",
  ascensionBuffIds: [],
  tools: DEFAULT_TOOL_SELECTIONS,
  customPrices: {},
  barteringBoost: 0,
};

type PersistedState = {
  settings: SkillProfitSettings;
  activeSkill: SkillName | "All";
  sortKey: SkillProfitSortKey;
  sortDesc: boolean;
  searchTerm: string;
  minVolume: number;
  ascensionOpen: boolean;
};

const DEFAULT_STATE: PersistedState = {
  settings: DEFAULT_SETTINGS,
  activeSkill: "All",
  sortKey: "profitPerHour",
  sortDesc: true,
  searchTerm: "",
  minVolume: 100,
  ascensionOpen: true,
};

const SORT_LABELS: Record<SkillProfitSortKey, string> = {
  name: "Item",
  skill: "Skill",
  level: "Level",
  profitEach: "Net Each",
  profitPerHour: "Gold/Hr",
  roi: "ROI",
  itemsPerHour: "Items/Hr",
  expPerSecond: "Exp/S",
  expPerHour: "Exp/Hr",
  finalDuration: "Duration",
  volume3d: "3D Vol",
  inputCost: "Input",
  salePrice: "Price",
};

export default function SkillProfitPage() {
  const { marketData, allItemsDb } = useData();
  const { openItemByName, prefetchItem } = useItemModal();
  const { preferences, setPreferences, loaded: preferencesLoaded } = usePreferences();
  const { activeProfile, updateProfile } = useProfiles();
  const [settings, setSettings] = useState<SkillProfitSettings>(DEFAULT_STATE.settings);
  const [activeSkill, setActiveSkill] = useState<SkillName | "All">(DEFAULT_STATE.activeSkill);
  const [sortKey, setSortKey] = useState<SkillProfitSortKey>(DEFAULT_STATE.sortKey);
  const [sortDesc, setSortDesc] = useState(DEFAULT_STATE.sortDesc);
  const [searchTerm, setSearchTerm] = useState(DEFAULT_STATE.searchTerm);
  const [minVolume, setMinVolume] = useState(DEFAULT_STATE.minVolume);
  const [ascensionOpen, setAscensionOpen] = useState(DEFAULT_STATE.ascensionOpen);
  const [loadedStoredState, setLoadedStoredState] = useState(false);
  const [gearData, setGearData] = useState<GearData | null>(null);
  const [itemRegistry, setItemRegistry] = useState<ItemRegistry | null>(null);
  const [selectedRow, setSelectedRow] = useState<SkillProfitRow | null>(null);
  const loadedStorageKeyRef = useRef<string | null>(null);

  const activeProfileId = activeProfile?.id || null;
  const storageKey = useMemo(
    () => getProfileStorageKey(STORAGE_KEY, activeProfileId),
    [activeProfileId],
  );
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const effectiveToolSelections = useMemo(
    () => activeProfile
      ? {
          Woodcutting: activeProfile.tools.woodcutting ?? "",
          Mining: activeProfile.tools.mining ?? "",
          Fishing: activeProfile.tools.fishing ?? "",
        }
      : settings.tools,
    [activeProfile, settings.tools],
  );
  const effectiveSettings = useMemo<SkillProfitSettings>(
    () => ({ ...settings, tools: effectiveToolSelections }),
    [effectiveToolSelections, settings],
  );
  const deferredSettings = useDeferredValue(effectiveSettings);

  useEffect(() => {
    if (!preferencesLoaded || !loadedStoredState) return;
    const profileTools = activeProfile?.tools || {};
    const profileBarteringBoost = activeProfile ? getProfileBarteringBoost(activeProfile) : 0;
    const syncedTools = activeProfile
      ? {
          Woodcutting: profileTools.woodcutting ?? "",
          Mining: profileTools.mining ?? "",
          Fishing: profileTools.fishing ?? "",
        }
      : {
          ...DEFAULT_TOOL_SELECTIONS,
          ...preferences.skillTools,
        };
    setSettings((current) => ({
      ...current,
      membership: preferences.membership,
      classBonus: activeProfile ? false : preferences.skillClassBonus,
      profileClassName: activeProfile?.className || undefined,
      assaultRank: activeProfile ? getProfileConquestRank(activeProfile) : preferences.assaultRank,
      tools: syncedTools,
      customPrices: preferences.customPrices,
      barteringBoost: profileBarteringBoost,
    }));
  }, [
    activeProfile,
    activeProfile?.tools,
    loadedStoredState,
    preferences.assaultRank,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
    preferencesLoaded,
  ]);

  useEffect(() => {
    loadedStorageKeyRef.current = null;
    setLoadedStoredState(false);
    setSettings(DEFAULT_STATE.settings);
    setActiveSkill(DEFAULT_STATE.activeSkill);
    setSortKey(DEFAULT_STATE.sortKey);
    setSortDesc(DEFAULT_STATE.sortDesc);
    setSearchTerm(DEFAULT_STATE.searchTerm);
    setMinVolume(DEFAULT_STATE.minVolume);
    setAscensionOpen(DEFAULT_STATE.ascensionOpen);
    try {
      const stored = localStorage.getItem(storageKey) || (!activeProfileId ? localStorage.getItem(STORAGE_KEY) : null);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<PersistedState>;
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        tools: { ...DEFAULT_TOOL_SELECTIONS, ...parsed.settings?.tools },
        customPrices: DEFAULT_SETTINGS.customPrices,
      });
      if (parsed.activeSkill) setActiveSkill(parsed.activeSkill);
      if (parsed.sortKey) setSortKey(parsed.sortKey);
      if (typeof parsed.sortDesc === "boolean") setSortDesc(parsed.sortDesc);
      if (typeof parsed.searchTerm === "string") setSearchTerm(parsed.searchTerm);
      if (typeof parsed.minVolume === "number") setMinVolume(parsed.minVolume);
      if (typeof parsed.ascensionOpen === "boolean") setAscensionOpen(parsed.ascensionOpen);
    } catch {
    } finally {
      loadedStorageKeyRef.current = storageKey;
      setLoadedStoredState(true);
    }
  }, [activeProfileId, storageKey]);

  useEffect(() => {
    if (!loadedStoredState) return;
    if (loadedStorageKeyRef.current !== storageKey) return;
    const payload: PersistedState = {
      settings,
      activeSkill,
      sortKey,
      sortDesc,
      searchTerm,
      minVolume,
      ascensionOpen,
    };
    const timeout = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [activeSkill, ascensionOpen, loadedStoredState, minVolume, searchTerm, settings, sortDesc, sortKey, storageKey]);

  useEffect(() => {
    fetch("/gear-data.json")
      .then((res) => (res.ok ? res.json() : null))
      .then(setGearData)
      .catch(() => {});

    fetch("/all-items-db.json")
      .then((res) => (res.ok ? res.json() : null))
      .then(setItemRegistry)
      .catch(() => {});
  }, []);

  const forgeRecipes = useMemo(
    () => buildForgeRecipes(gearData, itemRegistry),
    [gearData, itemRegistry],
  );
  const housingSummary = useMemo(
    () => calculateHousingBuffs(activeProfile?.housing),
    [activeProfile?.housing],
  );
  const housingIdleHoursBySkill = useMemo(() => {
    const entries = SKILLS.map((skill) => {
      const activity = SKILL_TO_HOUSING_ACTIVITY[skill];
      return [skill, activity ? getHousingIdleHoursForActivity(housingSummary, activity) : 0] as const;
    });
    return Object.fromEntries(entries) as Partial<Record<SkillName, number>>;
  }, [housingSummary]);

  const rows = useMemo(
    () => calculateSkillProfitRows(
      marketData,
      allItemsDb,
      { ...deferredSettings, housingIdleHoursBySkill },
      forgeRecipes,
      0,
    ),
    [marketData, allItemsDb, deferredSettings, forgeRecipes, housingIdleHoursBySkill],
  );

  const rowModel = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
    const topBySkill = new Map<SkillName, SkillProfitRow>();
    let topOverall: SkillProfitRow | null = null;

    for (const row of rows) {
      if (!isExcludedFromTop(row, minVolume)) {
        const currentSkillTop = topBySkill.get(row.skill);
        if (!currentSkillTop || row.profitPerHour > currentSkillTop.profitPerHour) {
          topBySkill.set(row.skill, row);
        }
        if (!topOverall || row.profitPerHour > topOverall.profitPerHour) {
          topOverall = row;
        }
      }
    }

    const filtered = rows
      .filter((row) => activeSkill === "All" || row.skill === activeSkill)
      .filter((row) => !normalizedSearch || row.name.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        if (activeSkill === "All" && a.skill !== b.skill) {
          if (a.skill === "Forge") return 1;
          if (b.skill === "Forge") return -1;
        }
        const sortResult = getSortValue(a, sortKey) > getSortValue(b, sortKey)
          ? 1
          : getSortValue(a, sortKey) < getSortValue(b, sortKey)
            ? -1
            : a.name.localeCompare(b.name);
        return sortDesc ? -sortResult : sortResult;
      });

    const counts = new Map<SkillName, number>();
    for (const row of rows) counts.set(row.skill, (counts.get(row.skill) || 0) + 1);

    return { filtered, topBySkill, topOverall, counts };
  }, [activeSkill, deferredSearchTerm, minVolume, rows, sortDesc, sortKey]);

  const buffTotals = useMemo(
    () => getBuffTotals(settings, activeSkill !== "Construction", activeSkill),
    [activeSkill, settings],
  );
  const housingWindowHours = activeSkill !== "All" ? Number(housingIdleHoursBySkill[activeSkill] || 0) : 0;
  const strongestHousingWindow = useMemo(() => {
    let best: { skill: SkillName; hours: number } | null = null;
    for (const skill of SKILLS) {
      const hours = Number(housingIdleHoursBySkill[skill] || 0);
      if (hours > 0 && (!best || hours > best.hours)) best = { skill, hours };
    }
    return best;
  }, [housingIdleHoursBySkill]);
  const housingWindowSub = !activeProfile
    ? "profile needed"
    : housingWindowHours <= 0
      ? "no profile bonus"
      : housingSummary.mode === "guest" || housingSummary.availableAnywhere
        ? "available anywhere"
        : "location-limited";
  const lastUpdated = marketData?._meta?.last_updated;
  const marketAgeMinutes = lastUpdated
    ? Math.max(0, Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000))
    : null;

  const selectedBuffs = useMemo(
    () => settings.ascensionBuffIds
      .map((id) => ASCENSION_BUFFS.find((buff) => buff.id === id))
      .filter((buff): buff is (typeof ASCENSION_BUFFS)[number] => Boolean(buff)),
    [settings.ascensionBuffIds],
  );

  const groupedBuffs = useMemo(() => ({
    Eff: ASCENSION_BUFFS.filter((buff) => buff.type === "Eff"),
    Exp: ASCENSION_BUFFS.filter((buff) => buff.type === "Exp"),
  }), []);

  useEffect(() => {
    if (!selectedRow) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedRow(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRow]);

  const patchSettings = (patch: Partial<SkillProfitSettings>) => {
    setSettings((current) => ({ ...current, ...patch, tools: { ...current.tools, ...patch.tools } }));
    if (activeProfile && (patch.assaultRank || patch.barteringBoost !== undefined)) {
      updateProfile(activeProfile.id, {
        boosts: {
          ...activeProfile.boosts,
          ...(patch.assaultRank ? { conquestRank: patch.assaultRank } : {}),
          ...(patch.barteringBoost !== undefined ? { barteringLevel: Math.min(100, Math.max(0, Math.round((Number(patch.barteringBoost) || 0) / 0.2))) } : {}),
        },
      });
    }
    if ("membership" in patch || "classBonus" in patch || (!activeProfile && "tools" in patch) || "customPrices" in patch) {
      setPreferences({
        ...(typeof patch.membership === "boolean" ? { membership: patch.membership } : {}),
        ...(!activeProfile && typeof patch.classBonus === "boolean" ? { skillClassBonus: patch.classBonus } : {}),
        ...(!activeProfile && patch.tools ? { skillTools: { ...preferences.skillTools, ...patch.tools } } : {}),
        ...(patch.customPrices ? { customPrices: patch.customPrices } : {}),
      });
    }
  };

  const patchTool = (skill: ToolSkill, toolName: string) => {
    if (activeProfile) {
      const profileToolKey = skill === "Woodcutting" ? "woodcutting" : skill === "Mining" ? "mining" : "fishing";
      updateProfile(activeProfile.id, { tools: { ...activeProfile.tools, [profileToolKey]: toolName } });
    }
    patchSettings({ tools: { ...settings.tools, [skill]: toolName } });
  };

  const toggleAscension = (id: string) => {
    setSettings((current) => {
      const isSelected = current.ascensionBuffIds.includes(id);
      if (isSelected) {
        return { ...current, ascensionBuffIds: current.ascensionBuffIds.filter((buffId) => buffId !== id) };
      }
      if (current.ascensionBuffIds.length >= 5) return current;
      return { ...current, ascensionBuffIds: [...current.ascensionBuffIds, id] };
    });
  };

  const handleSort = (key: SkillProfitSortKey) => {
    if (sortKey === key) {
      setSortDesc((current) => !current);
      return;
    }
    setSortKey(key);
    setSortDesc(key !== "name" && key !== "skill" && key !== "level" && key !== "finalDuration");
  };

  return (
    <main className={`container ${styles.shell}`}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>Skill Profit Finder</div>
          <h1 className={styles.title}>
            Live Skill Profit <BarChart3 size={22} />
          </h1>
        </div>
        <div className={styles.heroStats}>
          <Metric label="Top liquid route" value={rowModel.topOverall?.name || "Waiting"} sub={rowModel.topOverall ? `${formatGold(rowModel.topOverall.profitPerHour)}g/hr` : "0g/hr"} tone="profit" />
          <Metric label="Market pulse" value={marketAgeMinutes === null ? "Waiting" : marketAgeMinutes < 1 ? "Fresh" : `${marketAgeMinutes}m`} sub={`${rows.length.toLocaleString()} rows`} />
          <Metric label="Buffs" value={`+${buffTotals.efficiency}% eff / +${buffTotals.experience}% exp`} sub={activeSkill === "Construction" ? "ascension ignored" : "active total"} />
          <Metric
            label="Housing window"
            value={activeSkill === "All"
              ? strongestHousingWindow ? `+${formatHours(strongestHousingWindow.hours)}` : "None"
              : housingWindowHours > 0 ? `+${formatHours(housingWindowHours)}` : "None"}
            sub={activeSkill === "All"
              ? strongestHousingWindow ? `${strongestHousingWindow.skill} bonus` : "choose a skill"
              : housingWindowSub}
          />
        </div>
      </section>

      <section className={styles.toolPanel}>
        {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => {
          const toolValue = effectiveToolSelections[skill] || "";
          const selectedTool = SKILL_TOOLS[skill].find((tool) => tool.name === toolValue);
          return (
            <div className={styles.toolField} key={skill}>
              <span>{skill} tool</span>
              <ToolPicker
                options={SKILL_TOOLS[skill]}
                value={toolValue}
                onChange={(toolName) => patchTool(skill, toolName)}
              />
              <small>
                {selectedTool
                  ? `Lvl ${selectedTool.level} - ${selectedTool.quality}`
                  : activeProfile
                    ? "No tool selected"
                    : "No tool bonus"}
                {activeProfile ? " - synced with profile" : " - global fallback"}
              </small>
            </div>
          );
        })}
      </section>

      <section className={styles.commandBar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search item"
          />
        </div>
        <label className={styles.numberField}>
          <span>Conquest</span>
          <select
            aria-label="Conquest buff"
            className={styles.conquestSelect}
            value={settings.assaultRank}
            onChange={(event) => patchSettings({ assaultRank: event.target.value as AssaultRank })}
          >
            {ASSAULT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className={styles.numberField}>
          <span>Pool EXP</span>
          <input
            type="number"
            min={0}
            max={15}
            value={settings.energizingPoolExp}
            onChange={(event) => patchSettings({ energizingPoolExp: Math.min(15, Math.max(0, Number(event.target.value) || 0)) })}
          />
        </label>
        <label className={styles.numberField}>
          <span>Bartering Level</span>
          <input
            type="number"
            min={0}
            max={100}
            value={activeProfile?.boosts.barteringLevel ?? ""}
            placeholder="0"
            onChange={(event) => {
                const level = event.target.value === "" ? "" : Math.min(100, Math.max(0, Number(event.target.value) || 0));
              if (activeProfile) {
                updateProfile(activeProfile.id, { boosts: { ...activeProfile.boosts, barteringLevel: level } });
              } else {
                patchSettings({ barteringBoost: level === "" ? "" : Math.round(Number(level) * 0.2) });
              }
            }}
          />
        </label>
        <label className={styles.numberField}>
          <span>Min Vol</span>
          <input
            type="number"
            min={0}
            value={minVolume}
            onChange={(event) => setMinVolume(Math.max(0, Number(event.target.value) || 0))}
          />
        </label>
        <button
          className={`${styles.toggle} ${settings.membership ? styles.toggleActive : ""}`}
          onClick={() => patchSettings({ membership: !settings.membership })}
          type="button"
        >
          {settings.membership && <Check size={14} />} Member
        </button>
        <button
          className={`${styles.toggle} ${(activeProfile ? settings.profileClassName : settings.classBonus) ? styles.toggleActive : ""}`}
          onClick={() => {
            if (!activeProfile) patchSettings({ classBonus: !settings.classBonus });
          }}
          disabled={Boolean(activeProfile)}
          title={activeProfile ? `Using ${activeProfile.className} from active profile` : "Fallback class helper when no profile is active"}
          type="button"
        >
          {(activeProfile ? settings.profileClassName : settings.classBonus) && <Check size={14} />} {activeProfile ? activeProfile.className : "Class"}
        </button>
        <div className={`${styles.taxPill} ${settings.membership ? styles.taxMember : ""}`}>
          {settings.membership ? "12% tax" : "15% tax"}
        </div>
      </section>

      <section className={styles.ascensionPanel}>
        <button className={styles.ascensionHeader} onClick={() => setAscensionOpen((open) => !open)} type="button">
          <span><Sparkles size={16} /> Ascension</span>
          <span>{selectedBuffs.length}/5 <ChevronDown size={16} className={ascensionOpen ? styles.chevronOpen : ""} /></span>
        </button>
        <div className={styles.selectedBuffs}>
          {Array.from({ length: 5 }).map((_, index) => {
            const buff = selectedBuffs[index];
            return (
              <button
                key={index}
                className={`${styles.selectedSlot} ${buff ? styles.selectedSlotFilled : ""}`}
                onClick={() => buff && toggleAscension(buff.id)}
                title={buff ? `${buff.label}: +${buff.value}% ${buff.type === "Eff" ? "efficiency" : "experience"}` : "Empty ascension slot"}
                type="button"
              >
                {buff ? `${buff.label.replace("Lvl ", "L")} +${buff.value}% ${buff.type}` : "Empty"}
              </button>
            );
          })}
          {selectedBuffs.length > 0 && (
            <button className={styles.clearBuffs} onClick={() => patchSettings({ ascensionBuffIds: [] })} type="button">
              Clear
            </button>
          )}
        </div>
        {ascensionOpen && (
          <div className={styles.buffGroups}>
            {(["Eff", "Exp"] as const).map((type) => (
              <div className={styles.buffGroup} key={type}>
                <div className={styles.buffGroupTitle}>{type === "Eff" ? "Efficiency" : "Experience"}</div>
                <div className={styles.buffRail}>
                  {groupedBuffs[type].map((buff) => {
                    const selected = settings.ascensionBuffIds.includes(buff.id);
                    const disabled = !selected && settings.ascensionBuffIds.length >= 5;
                    return (
                      <button
                        key={buff.id}
                        className={`${styles.buffButton} ${selected ? styles.buffSelected : ""}`}
                        disabled={disabled}
                        onClick={() => toggleAscension(buff.id)}
                        type="button"
                      >
                        {buff.label.replace("Lvl ", "")}
                        <strong>+{buff.value}%</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.overviewGrid}>
        {SKILLS.map((skill) => {
          const top = rowModel.topBySkill.get(skill);
          return (
            <button
              className={`${styles.skillCard} ${activeSkill === skill ? styles.skillCardActive : ""}`}
              key={skill}
              onClick={() => setActiveSkill(skill)}
              title={skill === "Forge" ? `${forgeRecipes.length} forge recipes loaded for display only` : top ? `${top.name}: ${formatGold(top.profitPerHour)}g/hr` : "No liquid route"}
              type="button"
            >
              <div className={styles.skillCardTop}>
                <span>{skill}</span>
                <span>{(rowModel.counts.get(skill) || 0).toLocaleString()}</span>
              </div>
              <div className={styles.skillCardBody}>
                <span>{skill === "Forge" ? "Info only" : top?.name || "No liquid route"}</span>
                <strong>{skill === "Forge" ? `${forgeRecipes.length} recipes` : top ? `${formatGold(top.profitPerHour)}g/hr` : "0g/hr"}</strong>
              </div>
            </button>
          );
        })}
      </section>

      <section className={styles.tableHeader}>
        <div className={styles.tabRow}>
          {(["All", ...SKILLS] as const).map((skill) => (
            <button
              key={skill}
              className={`${styles.tab} ${activeSkill === skill ? styles.tabActive : ""}`}
              onClick={() => setActiveSkill(skill)}
              type="button"
            >
              {skill}
            </button>
          ))}
        </div>
        <div className={styles.panelMeta}>
          <Filter size={13} /> {rowModel.filtered.length.toLocaleString()} rows
        </div>
      </section>

      <section className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <SortableTh sortKey="name" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} align="left" />
              <SortableTh sortKey="skill" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="level" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="profitPerHour" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="roi" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="expPerHour" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <SortableTh sortKey="volume3d" activeKey={sortKey} sortDesc={sortDesc} onSort={handleSort} />
              <th>Sell</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {rowModel.filtered.map((row) => {
              return (
                <tr key={`${row.skill}-${row.name}`} onClick={() => setSelectedRow(row)}>
                  <td className="left-align">
                    <div className={styles.nameCell}>
                      <button
                        className={styles.itemButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedRow(row);
                        }}
                        onMouseEnter={() => prefetchItem(row.name)}
                        type="button"
                      >
                        <PackageSearch size={14} />
                        {row.name}
                      </button>
                      <span className={styles.itemMeta}>
                        {row.note || `${row.bestSaleSource} net · ${formatGold(row.netRevenue)}g`}
                      </span>
                    </div>
                  </td>
                  <td>{row.skill}</td>
                  <td className="mono">{row.level}</td>
                  <td className={`mono ${row.profitPerHour >= 0 ? styles.positive : styles.negative}`}>{formatGold(row.profitPerHour)}g</td>
                  <td className="mono">{row.roi.toFixed(1)}%</td>
                  <td className="mono">{formatOptionalNumber(row.expPerHour)}</td>
                  <td className="mono">{row.volume3d.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.saleBadge} ${row.bestSaleSource === "vendor" ? styles.saleVendor : row.bestSaleSource === "custom" ? styles.saleCustom : styles.saleMarket}`}>
                      {row.bestSaleSource}
                    </span>
                  </td>
                  <td>
                    {row.skill === "Forge" ? (
                      <span className={`${styles.signal} ${styles.signalInfo}`}><Info size={12} /> Info</span>
                    ) : isLiquid(row, minVolume) ? (
                      <span className={`${styles.signal} ${styles.signalGood}`}><TrendingUp size={12} /> Liquid</span>
                    ) : (
                      <span className={`${styles.signal} ${styles.signalWarn}`}><Eye size={12} /> Thin</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {selectedRow && (
        <SkillStrategyModal
          row={selectedRow}
          settings={{ ...effectiveSettings, housingIdleHoursBySkill }}
          membership={settings.membership}
          onClose={() => setSelectedRow(null)}
          onOpenItem={(name) => {
            setSelectedRow(null);
            openItemByName(name);
          }}
        />
      )}
    </main>
  );
}

function SortableTh({
  sortKey,
  activeKey,
  sortDesc,
  onSort,
  align,
}: {
  sortKey: SkillProfitSortKey;
  activeKey: SkillProfitSortKey;
  sortDesc: boolean;
  onSort: (key: SkillProfitSortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === activeKey;
  return (
    <th className={`sortable ${align === "left" ? "left-align" : ""}`}>
      <button className={styles.sortButton} onClick={() => onSort(sortKey)} type="button">
        {SORT_LABELS[sortKey]}
        {active && <span>{sortDesc ? "v" : "^"}</span>}
      </button>
    </th>
  );
}

function ToolPicker({
  options,
  value,
  onChange,
}: {
  options: typeof SKILL_TOOLS[ToolSkill];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.name === value) || null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className={`${styles.toolPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        className={styles.toolTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen((current) => !current);
        }}
        type="button"
      >
        <span>
          <strong>{selected?.name || "No tool selected"}</strong>
          <small>{selected ? `+${selected.efficiency}% efficiency` : "No tool bonus"}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.toolMenu}>
          <button
            className={`${styles.toolOption} ${!value ? styles.toolOptionActive : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            type="button"
          >
            <span>
              <strong>No tool selected</strong>
              <small>Use no tool bonus for this profile</small>
            </span>
            <em>+0%</em>
            {!value && <Check size={15} />}
          </button>
          {options.map((option) => (
            <button
              className={`${styles.toolOption} ${option.name === value ? styles.toolOptionActive : ""}`}
              key={option.name}
              onClick={() => {
                onChange(option.name);
                setOpen(false);
              }}
              type="button"
            >
              <span>
                <strong>{option.name}</strong>
                <small>Lvl {option.level} - {option.quality}</small>
              </span>
              <em>+{option.efficiency}%</em>
              {option.name === value && <Check size={15} />}
            </button>
          ))}
          <button className={styles.toolClose} onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function SkillStrategyModal({
  row,
  settings,
  membership,
  onClose,
  onOpenItem,
}: {
  row: SkillProfitRow;
  settings: SkillProfitSettings;
  membership: boolean;
  onClose: () => void;
  onOpenItem: (name: string) => void;
}) {
  const { marketData, allItemsDb } = useData();
  const { preferences, setPreferences } = usePreferences();
  const [scenarioPrices, setScenarioPrices] = useState<Record<string, string>>({});
  const [targetGoldPerHour, setTargetGoldPerHour] = useState("");
  const [scenarioSaved, setScenarioSaved] = useState(false);
  const cleanScenarioPrices = useMemo(() => {
    return Object.fromEntries(
      Object.entries(scenarioPrices)
        .map(([name, value]) => [name, Number(value)] as const)
        .filter(([, value]) => Number.isFinite(value) && value > 0),
    );
  }, [scenarioPrices]);
  const activeRow = useMemo(
    () => calculateSkillProfitRow(row, marketData, allItemsDb, { ...settings, scenarioPrices: cleanScenarioPrices }),
    [allItemsDb, cleanScenarioPrices, marketData, row, settings],
  );
  const taxRate = membership ? 12 : 15;
  const hasScenarioPrices = Object.keys(cleanScenarioPrices).length > 0;
  const isMarketLikeSale = activeRow.saleSource === "market" || activeRow.saleSource === "custom" || activeRow.saleSource === "scenario";
  const grossRevenue = isMarketLikeSale ? activeRow.salePrice : 0;
  const taxPaid = isMarketLikeSale ? grossRevenue - activeRow.marketRevenue : 0;
  const item = allItemsDb?.[activeRow.name];
  const market = marketData?.[activeRow.name] || {};
  const itemStats = item?.stats && typeof item.stats === "object" ? Object.entries(item.stats).filter(([, value]) => value !== null && value !== 0 && value !== "") : [];
  const itemRequirements = item?.requirements && typeof item.requirements === "object" ? Object.entries(item.requirements).filter(([, value]) => value !== null && value !== "") : [];
  const itemEffects = item?.effects
    ? Array.isArray(item.effects)
      ? item.effects.map((effect: any, index: number) => formatEffectEntry(effect, index))
      : Object.entries(item.effects)
        .filter(([, value]) => value !== null && value !== "")
        .map(([key, value]) => [formatType(key), stringifyDetail(value)] as [string, string])
    : [];
  const restorationEntries = [
    ["Health", item?.health_restore ? `+${item.health_restore}` : "0"],
    ["Hunger", item?.hunger_restore ? `+${item.hunger_restore}` : "0"],
  ].filter(([, value]) => value !== "0") as Array<[string, string]>;
  const findSources = Array.isArray(item?.where_to_find) ? item.where_to_find.filter(Boolean).slice(0, 4) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${styles.strategyModalContent}`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{activeRow.name} Strategy</h2>
          <button className="close-btn" onClick={onClose} type="button"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className={styles.modalGrid}>
            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><PackageSearch size={16} /> Inputs</div>
              <div className={styles.materialList}>
                {activeRow.ingredients.length === 0 ? (
                  <div className={styles.materialLine}>
                    <span>Zero input</span>
                    <strong>0g</strong>
                  </div>
                ) : activeRow.ingredientCosts.map((ingredient) => {
                  const canTryBuyPrice = ingredient.source !== "vendor";
                  const target = Number(targetGoldPerHour);
                  const targetPerAction = Number.isFinite(target) && target > 0 ? target / Math.max(activeRow.itemsPerHour, 1) : null;
                  const otherInputCost = activeRow.inputCost - ingredient.unitPrice * ingredient.quantity;
                  const maxUnitForTarget = targetPerAction === null
                    ? null
                    : Math.floor((activeRow.netRevenue - otherInputCost - targetPerAction) / Math.max(ingredient.quantity, 1));
                  return (
                  <div className={styles.materialScenario} key={ingredient.name}>
                  <button
                    className={styles.materialLine}
                    onClick={() => onOpenItem(ingredient.name)}
                    type="button"
                  >
                    <span className={styles.materialName}>
                      <strong>{ingredient.quantity}x {ingredient.name}</strong>
                      <small>{formatGold(ingredient.unitPrice)}g ea - {formatPriceSource(ingredient.source)}</small>
                    </span>
                    <strong>{formatGold(ingredient.totalPrice)}g</strong>
                  </button>
                    {canTryBuyPrice ? (
                      <label className={styles.scenarioInput}>
                        <span>Try buy price</span>
                        <input
                          inputMode="numeric"
                          min={0}
                          placeholder={`${formatGold(ingredient.unitPrice)}g`}
                          type="number"
                          value={scenarioPrices[ingredient.name] ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setScenarioSaved(false);
                            setScenarioPrices((current) => {
                              const next = { ...current };
                              if (value === "") delete next[ingredient.name];
                              else next[ingredient.name] = value;
                              return next;
                            });
                          }}
                        />
                      </label>
                    ) : (
                      <div className={styles.fixedPriceNote}>Fixed vendor price</div>
                    )}
                    {canTryBuyPrice && maxUnitForTarget !== null && (
                      <div className={styles.breakEvenLine}>
                        Max for target: <strong>{maxUnitForTarget > 0 ? `${formatGold(maxUnitForTarget)}g ea` : "not profitable"}</strong>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              <div className={styles.modalTotal}>
                <span>Total input cost</span>
                <strong>{formatGold(activeRow.inputCost)}g</strong>
              </div>
              <label className={styles.targetProfitField}>
                <span>Target gold per hour</span>
                <input
                  inputMode="numeric"
                  min={0}
                  placeholder="Optional"
                  type="number"
                  value={targetGoldPerHour}
                  onChange={(event) => setTargetGoldPerHour(event.target.value)}
                />
              </label>
              {hasScenarioPrices && (
                <div className={styles.scenarioActions}>
                  <button type="button" onClick={() => setScenarioPrices({})}>Clear scenario</button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences({
                        customPrices: {
                          ...preferences.customPrices,
                          ...Object.fromEntries(Object.entries(cleanScenarioPrices).map(([name, price]) => [name, Math.round(price)])),
                        },
                      });
                      setScenarioSaved(true);
                    }}
                  >
                    Save as custom prices
                  </button>
                  {scenarioSaved && <span className={styles.scenarioSaved}>Saved to custom prices</span>}
                </div>
              )}
              {activeRow.inputMissing.length > 0 && (
                <div className={styles.modalWarning}>Missing prices: {activeRow.inputMissing.join(", ")}</div>
              )}
            </section>

            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><Info size={16} /> Calculation</div>
              <div className={styles.calcRows}>
                <CalcRow label={activeRow.saleSource === "custom" ? "Custom gross" : activeRow.saleSource === "scenario" ? "Scenario gross" : "Market gross"} value={isMarketLikeSale ? `${formatGold(grossRevenue)}g` : "No market"} muted={!isMarketLikeSale} />
                <CalcRow label={`Market tax (${taxRate}%)`} value={isMarketLikeSale ? `-${formatGold(taxPaid)}g` : "0g"} muted={!isMarketLikeSale} />
                <CalcRow label="Market net" value={`${formatGold(activeRow.marketRevenue)}g`} muted={activeRow.marketRevenue <= 0} />
                <CalcRow label="Vendor net" value={`${formatGold(activeRow.vendorRevenue)}g`} muted={activeRow.vendorRevenue <= 0} />
                <CalcRow label="Best sell path" value={formatPriceSource(activeRow.bestSaleSource)} tone={activeRow.bestSaleSource === "vendor" ? "good" : undefined} />
                <CalcRow label="Net revenue used" value={`${formatGold(activeRow.netRevenue)}g`} />
                <CalcRow label="Input cost" value={`-${formatGold(activeRow.inputCost)}g`} />
                <CalcRow label="Profit each" value={`${activeRow.profitEach >= 0 ? "+" : ""}${formatGold(activeRow.profitEach)}g`} tone={activeRow.profitEach >= 0 ? "good" : "bad"} />
                <CalcRow label="Items per hour" value={activeRow.itemsPerHour.toLocaleString()} />
                {activeRow.housingWindowHours > 0 && (
                  <>
                    <CalcRow label="Housing window" value={formatHours(activeRow.housingWindowHours)} />
                    <CalcRow label="Actions per housing window" value={activeRow.itemsPerHousingWindow.toLocaleString()} />
                    <CalcRow label="Gold per housing window" value={`${formatGold(activeRow.profitPerHousingWindow)}g`} tone={activeRow.profitPerHousingWindow >= 0 ? "good" : "bad"} />
                  </>
                )}
                {activeRow.toolBonus > 0 && <CalcRow label="Tool efficiency" value={`+${activeRow.toolBonus}%`} />}
                <CalcRow label="Gold per hour" value={`${formatGold(activeRow.profitPerHour)}g`} tone={activeRow.profitPerHour >= 0 ? "good" : "bad"} />
                <CalcRow label="EXP per second" value={activeRow.expPerSecond === null ? "Unknown" : activeRow.expPerSecond.toFixed(2)} muted={activeRow.expPerSecond === null} />
                <CalcRow label="3-day volume" value={activeRow.volume3d.toLocaleString()} />
              </div>
              <div className={styles.formula}>
                ({formatGold(activeRow.netRevenue)}g net - {formatGold(activeRow.inputCost)}g input) x {activeRow.itemsPerHour.toLocaleString()} actions/hr = {formatGold(activeRow.profitPerHour)}g/hr
              </div>
              <button className={styles.openItemButton} onClick={() => onOpenItem(activeRow.name)} type="button">
                Open item database details
              </button>
            </section>

            <section className={`${styles.modalPanel} ${styles.itemDetailsPanel}`}>
              <div className={styles.modalPanelTitle}><Eye size={16} /> Result Item Details</div>
              <div className={styles.itemDetailHeader}>
                {item?.image_url && <img src={item.image_url} alt="" />}
                <div>
                  <strong>{activeRow.name}</strong>
                  <span>{item?.description || activeRow.note || "No item description available in the local database."}</span>
                </div>
              </div>
              <div className={styles.detailGrid}>
                <DetailPill label="Skill" value={activeRow.skill} />
                <DetailPill label="Level" value={activeRow.level.toLocaleString()} />
                <DetailPill label="Base Time" value={`${formatNumber(activeRow.baseDuration)}s`} />
                <DetailPill label="Final Time" value={`${formatNumber(activeRow.finalDuration)}s`} />
                <DetailPill label="Base EXP" value={formatOptionalNumber(activeRow.experience)} muted={activeRow.experience === null} />
                <DetailPill label="EXP/hr" value={formatOptionalNumber(activeRow.expPerHour)} muted={activeRow.expPerHour === null} />
                <DetailPill label="Type" value={formatType(item?.type)} muted={!item?.type} />
                <DetailPill label="Quality" value={formatType(item?.quality)} muted={!item?.quality} />
                <DetailPill label="Tradeable" value={item ? (item.is_tradeable ? "Yes" : "No") : "Unknown"} muted={!item} />
                <DetailPill label="Vendor Base" value={item?.vendor_price ? `${formatGold(item.vendor_price)}g` : "None"} muted={!item?.vendor_price} />
                <DetailPill label="3d Avg" value={market?.avg_3 ? `${formatGold(market.avg_3)}g` : "No data"} muted={!market?.avg_3} />
                <DetailPill label="7d Avg" value={market?.avg_7 ? `${formatGold(market.avg_7)}g` : "No data"} muted={!market?.avg_7} />
                <DetailPill label="30d Avg" value={market?.avg_30 ? `${formatGold(market.avg_30)}g` : "No data"} muted={!market?.avg_30} />
                <DetailPill label="3d Volume" value={activeRow.volume3d.toLocaleString()} muted={activeRow.volume3d <= 0} />
              </div>

              {(itemRequirements.length > 0 || itemStats.length > 0 || itemEffects.length > 0 || findSources.length > 0 || item?.health_restore || item?.hunger_restore) && (
                <div className={styles.extraDetailGrid}>
                  {itemRequirements.length > 0 && <DetailList title="Requirements" entries={itemRequirements} />}
                  {itemStats.length > 0 && <DetailList title="Stats" entries={itemStats} />}
                  {itemEffects.length > 0 && <DetailList title="Effects" entries={itemEffects} />}
                  {(item?.health_restore || item?.hunger_restore) && (
                    <DetailList
                      title="Restoration"
                      entries={restorationEntries}
                    />
                  )}
                  {findSources.length > 0 && (
                    <DetailList
                      title="Where To Find"
                      entries={findSources.map((source: any, index: number) => [
                        source?.type || source?.name || `Source ${index + 1}`,
                        source?.name || source?.location || stringifyDetail(source),
                      ])}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailPill({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={styles.detailPill}>
      <span>{label}</span>
      <strong className={muted ? styles.mutedValue : ""}>{value}</strong>
    </div>
  );
}

function DetailList({ title, entries }: { title: string; entries: Array<[string, any]> }) {
  return (
    <div className={styles.detailList}>
      <strong>{title}</strong>
      {entries.map(([label, value]) => (
        <div key={`${title}-${label}`}>
          <span>{formatType(label)}</span>
          <em>{stringifyDetail(value)}</em>
        </div>
      ))}
    </div>
  );
}

function stringifyDetail(value: any): string {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(stringifyDetail).join(", ");
  if (typeof value === "object") {
    const name = value.name || value.item_name || value.type || value.location || value.value;
    if (name) return String(name);
    return Object.entries(value)
      .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "")
      .slice(0, 3)
      .map(([entryKey, entryValue]) => `${formatType(entryKey)}: ${stringifyDetail(entryValue)}`)
      .join(", ");
  }
  return String(value);
}

function formatEffectEntry(effect: any, index: number): [string, string] {
  if (!effect || typeof effect !== "object") return [`Effect ${index + 1}`, stringifyDetail(effect)];
  const target = effect.target ? formatType(effect.target) : "";
  const attribute = effect.attribute ? formatType(effect.attribute) : effect.name || effect.type || `Effect ${index + 1}`;
  const label = [target, attribute].filter(Boolean).join(" ");
  const rawValue = Number(effect.value);
  const prefix = Number.isFinite(rawValue) && rawValue > 0 ? "+" : "";
  const suffix = effect.value_type === "percentage"
    ? "%"
    : effect.value_type
      ? ` ${formatType(effect.value_type).toLowerCase()}`
      : "";
  const value = Number.isFinite(rawValue) ? `${prefix}${rawValue.toLocaleString()}${suffix}` : stringifyDetail(effect);
  return [label || `Effect ${index + 1}`, value];
}

function formatType(value: any): string {
  if (!value) return "Unknown";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPriceSource(value: string): string {
  if (value === "scenario") return "Scenario";
  if (value === "custom") return "Custom";
  if (value === "market") return "Market";
  if (value === "vendor") return "Vendor";
  return "Missing";
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatOptionalNumber(value: number | null): string {
  return value === null ? "Unknown" : formatNumber(value);
}

function CalcRow({ label, value, tone, muted }: { label: string; value: string; tone?: "good" | "bad"; muted?: boolean }) {
  return (
    <div className={styles.calcRow}>
      <span>{label}</span>
      <strong className={tone === "good" ? styles.positive : tone === "bad" ? styles.negative : muted ? styles.mutedValue : ""}>{value}</strong>
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "profit" }) {
  return (
    <div className={styles.metric} title={`${label}: ${value} (${sub})`}>
      <span>{label}</span>
      <strong className={tone === "profit" ? styles.metricProfit : ""}>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function isLiquid(row: SkillProfitRow, minVolume: number) {
  return row.saleSource !== "market" || row.volume3d >= minVolume;
}

function isExcludedFromTop(row: SkillProfitRow, minVolume: number) {
  return row.skill === "Forge" || !isLiquid(row, minVolume);
}

function getSortValue(row: SkillProfitRow, key: SkillProfitSortKey) {
  if (key === "name") return row.name.toLowerCase();
  if (key === "skill") return row.skill;
  return row[key] ?? -Infinity;
}

