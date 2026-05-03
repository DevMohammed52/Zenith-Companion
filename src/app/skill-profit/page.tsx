"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
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

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredSettings = useDeferredValue(settings);

  useEffect(() => {
    if (!preferencesLoaded) return;
    setSettings((current) => ({
      ...current,
      membership: preferences.membership,
      classBonus: preferences.skillClassBonus,
      assaultRank: preferences.assaultRank,
      tools: { ...DEFAULT_TOOL_SELECTIONS, ...preferences.skillTools },
      customPrices: preferences.customPrices,
      barteringBoost: preferences.barteringBoost,
    }));
  }, [
    preferences.assaultRank,
    preferences.barteringBoost,
    preferences.customPrices,
    preferences.membership,
    preferences.skillClassBonus,
    preferences.skillTools,
    preferencesLoaded,
  ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<PersistedState>;
      setSettings({
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        tools: { ...DEFAULT_TOOL_SELECTIONS, ...parsed.settings?.tools },
        customPrices: preferences.customPrices,
      });
      if (parsed.activeSkill) setActiveSkill(parsed.activeSkill);
      if (parsed.sortKey) setSortKey(parsed.sortKey);
      if (typeof parsed.sortDesc === "boolean") setSortDesc(parsed.sortDesc);
      if (typeof parsed.searchTerm === "string") setSearchTerm(parsed.searchTerm);
      if (typeof parsed.minVolume === "number") setMinVolume(parsed.minVolume);
      if (typeof parsed.ascensionOpen === "boolean") setAscensionOpen(parsed.ascensionOpen);
    } catch {
    } finally {
      setLoadedStoredState(true);
    }
  }, []);

  useEffect(() => {
    if (!loadedStoredState) return;
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [activeSkill, ascensionOpen, loadedStoredState, minVolume, searchTerm, settings, sortDesc, sortKey]);

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

  const rows = useMemo(
    () => calculateSkillProfitRows(marketData, allItemsDb, deferredSettings, forgeRecipes, 0),
    [marketData, allItemsDb, deferredSettings, forgeRecipes],
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
    if ("membership" in patch || "classBonus" in patch || "assaultRank" in patch || "tools" in patch || "barteringBoost" in patch || "customPrices" in patch) {
      setPreferences({
        ...(typeof patch.membership === "boolean" ? { membership: patch.membership } : {}),
        ...(typeof patch.classBonus === "boolean" ? { skillClassBonus: patch.classBonus } : {}),
        ...(patch.assaultRank ? { assaultRank: patch.assaultRank } : {}),
        ...(patch.tools ? { skillTools: { ...preferences.skillTools, ...patch.tools } } : {}),
        ...(patch.customPrices ? { customPrices: patch.customPrices } : {}),
        ...(patch.barteringBoost !== undefined ? { barteringBoost: patch.barteringBoost } : {}),
      });
    }
  };

  const patchTool = (skill: ToolSkill, toolName: string) => {
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
        </div>
      </section>

      <section className={styles.toolPanel}>
        {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => {
          const selectedTool = SKILL_TOOLS[skill].find((tool) => tool.name === settings.tools[skill]);
          return (
            <label className={styles.toolField} key={skill}>
              <span>{skill} tool</span>
              <select value={settings.tools[skill]} onChange={(event) => patchTool(skill, event.target.value)}>
                {SKILL_TOOLS[skill].map((tool) => (
                  <option key={tool.name} value={tool.name}>
                    {tool.name} (+{tool.efficiency}% eff)
                  </option>
                ))}
              </select>
              <small>{selectedTool ? `Lvl ${selectedTool.level} · ${selectedTool.quality}` : "No tool bonus"}</small>
            </label>
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
          className={`${styles.toggle} ${settings.classBonus ? styles.toggleActive : ""}`}
          onClick={() => patchSettings({ classBonus: !settings.classBonus })}
          type="button"
        >
          {settings.classBonus && <Check size={14} />} Class
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
                  <td className="mono">{row.expPerHour.toLocaleString()}</td>
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

function SkillStrategyModal({
  row,
  membership,
  onClose,
  onOpenItem,
}: {
  row: SkillProfitRow;
  membership: boolean;
  onClose: () => void;
  onOpenItem: (name: string) => void;
}) {
  const { marketData, allItemsDb } = useData();
  const taxRate = membership ? 12 : 15;
  const grossRevenue = row.saleSource === "market" || row.saleSource === "custom" ? row.salePrice : 0;
  const taxPaid = row.saleSource === "market" || row.saleSource === "custom" ? grossRevenue - row.marketRevenue : 0;
  const item = allItemsDb?.[row.name];
  const market = marketData?.[row.name] || {};
  const itemStats = item?.stats && typeof item.stats === "object" ? Object.entries(item.stats).filter(([, value]) => value !== null && value !== 0 && value !== "") : [];
  const itemRequirements = item?.requirements && typeof item.requirements === "object" ? Object.entries(item.requirements).filter(([, value]) => value !== null && value !== "") : [];
  const itemEffects = item?.effects
    ? Array.isArray(item.effects)
      ? item.effects.map((effect: any, index: number) => [`Effect ${index + 1}`, effect?.name || effect?.type || stringifyDetail(effect)] as [string, string])
      : Object.entries(item.effects).filter(([, value]) => value !== null && value !== "")
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
          <h2>{row.name} Strategy</h2>
          <button className="close-btn" onClick={onClose} type="button"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className={styles.modalGrid}>
            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><PackageSearch size={16} /> Inputs</div>
              <div className={styles.materialList}>
                {row.ingredients.length === 0 ? (
                  <div className={styles.materialLine}>
                    <span>Zero input</span>
                    <strong>0g</strong>
                  </div>
                ) : row.ingredientCosts.map((ingredient) => (
                  <button
                    className={styles.materialLine}
                    key={ingredient.name}
                    onClick={() => onOpenItem(ingredient.name)}
                    type="button"
                  >
                    <span className={styles.materialName}>
                      <strong>{ingredient.quantity}x {ingredient.name}</strong>
                      <small>{formatGold(ingredient.unitPrice)}g ea · {ingredient.source}</small>
                    </span>
                    <strong>{formatGold(ingredient.totalPrice)}g</strong>
                  </button>
                ))}
              </div>
              <div className={styles.modalTotal}>
                <span>Total input cost</span>
                <strong>{formatGold(row.inputCost)}g</strong>
              </div>
              {row.inputMissing.length > 0 && (
                <div className={styles.modalWarning}>Missing prices: {row.inputMissing.join(", ")}</div>
              )}
            </section>

            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><Info size={16} /> Calculation</div>
              <div className={styles.calcRows}>
                <CalcRow label={row.saleSource === "custom" ? "Custom gross" : "Market gross"} value={row.saleSource === "market" || row.saleSource === "custom" ? `${formatGold(grossRevenue)}g` : "No market"} muted={row.saleSource !== "market" && row.saleSource !== "custom"} />
                <CalcRow label={`Market tax (${taxRate}%)`} value={row.saleSource === "market" || row.saleSource === "custom" ? `-${formatGold(taxPaid)}g` : "0g"} muted={row.saleSource !== "market" && row.saleSource !== "custom"} />
                <CalcRow label="Market net" value={`${formatGold(row.marketRevenue)}g`} muted={row.marketRevenue <= 0} />
                <CalcRow label="Vendor net" value={`${formatGold(row.vendorRevenue)}g`} muted={row.vendorRevenue <= 0} />
                <CalcRow label="Best sell path" value={row.bestSaleSource.toUpperCase()} tone={row.bestSaleSource === "vendor" ? "good" : undefined} />
                <CalcRow label="Net revenue used" value={`${formatGold(row.netRevenue)}g`} />
                <CalcRow label="Input cost" value={`-${formatGold(row.inputCost)}g`} />
                <CalcRow label="Profit each" value={`${row.profitEach >= 0 ? "+" : ""}${formatGold(row.profitEach)}g`} tone={row.profitEach >= 0 ? "good" : "bad"} />
                <CalcRow label="Items per hour" value={row.itemsPerHour.toLocaleString()} />
                {row.toolBonus > 0 && <CalcRow label="Tool efficiency" value={`+${row.toolBonus}%`} />}
                <CalcRow label="Gold per hour" value={`${formatGold(row.profitPerHour)}g`} tone={row.profitPerHour >= 0 ? "good" : "bad"} />
                <CalcRow label="EXP per second" value={row.expPerSecond.toFixed(2)} />
                <CalcRow label="3-day volume" value={row.volume3d.toLocaleString()} />
              </div>
              <div className={styles.formula}>
                ({formatGold(row.netRevenue)}g net - {formatGold(row.inputCost)}g input) x {row.itemsPerHour.toLocaleString()} actions/hr = {formatGold(row.profitPerHour)}g/hr
              </div>
              <button className={styles.openItemButton} onClick={() => onOpenItem(row.name)} type="button">
                Open item database details
              </button>
            </section>

            <section className={`${styles.modalPanel} ${styles.itemDetailsPanel}`}>
              <div className={styles.modalPanelTitle}><Eye size={16} /> Result Item Details</div>
              <div className={styles.itemDetailHeader}>
                {item?.image_url && <img src={item.image_url} alt="" />}
                <div>
                  <strong>{row.name}</strong>
                  <span>{item?.description || row.note || "No item description available in the local database."}</span>
                </div>
              </div>
              <div className={styles.detailGrid}>
                <DetailPill label="Skill" value={row.skill} />
                <DetailPill label="Level" value={row.level.toLocaleString()} />
                <DetailPill label="Base Time" value={`${formatNumber(row.baseDuration)}s`} />
                <DetailPill label="Final Time" value={`${formatNumber(row.finalDuration)}s`} />
                <DetailPill label="Base EXP" value={formatNumber(row.experience)} />
                <DetailPill label="EXP/hr" value={formatNumber(row.expPerHour)} />
                <DetailPill label="Type" value={formatType(item?.type)} muted={!item?.type} />
                <DetailPill label="Quality" value={formatType(item?.quality)} muted={!item?.quality} />
                <DetailPill label="Tradeable" value={item ? (item.is_tradeable ? "Yes" : "No") : "Unknown"} muted={!item} />
                <DetailPill label="Vendor Base" value={item?.vendor_price ? `${formatGold(item.vendor_price)}g` : "None"} muted={!item?.vendor_price} />
                <DetailPill label="3d Avg" value={market?.avg_3 ? `${formatGold(market.avg_3)}g` : "No data"} muted={!market?.avg_3} />
                <DetailPill label="7d Avg" value={market?.avg_7 ? `${formatGold(market.avg_7)}g` : "No data"} muted={!market?.avg_7} />
                <DetailPill label="30d Avg" value={market?.avg_30 ? `${formatGold(market.avg_30)}g` : "No data"} muted={!market?.avg_30} />
                <DetailPill label="3d Volume" value={row.volume3d.toLocaleString()} muted={row.volume3d <= 0} />
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

function formatType(value: any): string {
  if (!value) return "Unknown";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
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
  return row[key];
}

