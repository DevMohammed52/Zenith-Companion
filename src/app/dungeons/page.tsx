"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Castle,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  ExternalLink,
  MapPin,
  PackageOpen,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { getItemTrueValueBreakdown } from "@/lib/ev-logic";
import { getSafeMarketPrice } from "@/lib/market-pricing";
import { useData } from "@/context/DataContext";
import { useItemModal } from "@/context/ItemModalContext";
import { usePreferences } from "@/lib/preferences";
import { getProfileDungeonStatTotal, useProfiles } from "@/lib/profiles";
import { getProfileBarteringBoost } from "@/lib/profile-calculations";
import { getProfileStorageKey } from "@/lib/profile-storage";
import MobileSortControls from "@/components/MobileSortControls";
import LoreThreadPanel from "@/components/LoreThreadPanel";
import { getLoreHintsForNames } from "@/lib/lore-links";

type ReadinessFilter = "all" | "ready" | "blocked";
const DUNGEON_COMPLETIONS_STORAGE_KEY = "zenith_dungeon_completed_runs_v1";

const formatGold = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value).toLocaleString()}g`;
const formatPlainGold = (value: number) => `${Math.round(value).toLocaleString()}g`;
const formatNumber = (value: number) => Number.isFinite(value) ? Math.round(value).toLocaleString() : "-";

const VALUE_PATH_LABELS: Record<string, string> = {
  market: "Sell on market",
  vendor: "Sell to vendor",
  chest_ev: "Open alchemy chest",
  recipe_craft: "Craft output and sell",
  missing: "Missing price",
};

function getValuePathLabel(path?: string) {
  return VALUE_PATH_LABELS[path || ""] || "Value";
}

function getDungeonLengthMinutes(dungeon: any) {
  if (Number.isFinite(Number(dungeon.length_minutes))) return Number(dungeon.length_minutes);
  if (Number.isFinite(Number(dungeon.length))) return Math.round(Number(dungeon.length) / 60000);
  if (Number.isFinite(Number(dungeon.length_ms))) return Math.round(Number(dungeon.length_ms) / 60000);
  return 0;
}

function getDungeonKey(dungeon: any) {
  return String(dungeon?.id || dungeon?.name || "").trim();
}

function getReadinessText(row: any, hasProfile: boolean) {
  if (!hasProfile) return "No profile";
  if (row.profileReady) return "Ready";
  if (row.statGap > 0 && row.dungeoneeringGap > 0) return `Need ${row.statGap} stats +${row.dungeoneeringGap} dung`;
  if (row.statGap > 0) return `Need ${row.statGap} stats`;
  return `Dungeoneering +${row.dungeoneeringGap}`;
}

function getProfileIdleActionHours(profile: ReturnType<typeof useProfiles>["activeProfile"]) {
  if (!profile) return 0;
  return profile.kind === "main" ? 8 : 4;
}

function getOptionalNumber(value: number | "") {
  return value === "" ? null : Number(value);
}

function DungeonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { marketData, staticData, allItemsDb } = useData();
  const { preferences } = usePreferences();
  const { activeProfile } = useProfiles();
  const { openItemByName, prefetchItem } = useItemModal();
  const [selectedDungeon, setSelectedDungeon] = useState<any>(null);
  const [sortCol, setSortCol] = useState<string>("netProfitPerHour");
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("all");
  const [minimumProfit, setMinimumProfit] = useState<number | "">("");
  const [dungeonEfficiency, setDungeonEfficiency] = useState<number | "">("");
  const [dungeonMagicFind, setDungeonMagicFind] = useState<number | "">("");
  const [completedRunsByDungeon, setCompletedRunsByDungeon] = useState<Record<string, number | "">>({});
  const [includeMagicFindEv, setIncludeMagicFindEv] = useState(false);
  const completionsStorageKey = useMemo(
    () => getProfileStorageKey(DUNGEON_COMPLETIONS_STORAGE_KEY, activeProfile?.id),
    [activeProfile?.id],
  );

  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) setSearchTerm(searchParam);
  }, [searchParams]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedDungeon(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(completionsStorageKey) ?? (activeProfile?.id ? null : localStorage.getItem(DUNGEON_COMPLETIONS_STORAGE_KEY));
      if (stored) setCompletedRunsByDungeon(JSON.parse(stored));
      else setCompletedRunsByDungeon({});
    } catch {}
  }, [activeProfile?.id, completionsStorageKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(completionsStorageKey, JSON.stringify(completedRunsByDungeon));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [completedRunsByDungeon, completionsStorageKey]);

  const completionMagicFindBonus = useMemo(() => {
    if (!staticData?.dungeons) return 0;
    return (staticData.dungeons || []).filter((dungeon: any) => {
      const requirement = Number(dungeon.completion_requirement || 0);
      const completed = Number(completedRunsByDungeon[getDungeonKey(dungeon)] || 0);
      return requirement > 0 && completed >= requirement;
    }).length;
  }, [completedRunsByDungeon, staticData?.dungeons]);

  const rows = useMemo(() => {
    if (!staticData?.dungeons || !marketData || !allItemsDb) return [];
    const calculated = [];
    const evOptions = {
      customPrices: preferences.customPrices,
      marketTaxMultiplier: preferences.membership ? 0.88 : 0.85,
      barteringBoost: activeProfile ? getProfileBarteringBoost(activeProfile) : 0,
    };
    const profileDungeonStats = getProfileDungeonStatTotal(activeProfile);
    const profileDungeoneering = Number(activeProfile?.levels.dungeoneering || 0);
    const playtimeHours = Math.max(0, Number(activeProfile?.timers.activeHours || 0));
    const idleActionLimitHours = getProfileIdleActionHours(activeProfile);
    const manualEfficiency = getOptionalNumber(dungeonEfficiency);
    const manualMagicFind = getOptionalNumber(dungeonMagicFind);
    const efficiency = Math.max(0, manualEfficiency ?? Number(activeProfile?.efficiency.dungeon || 0));
    const totalMagicFind = Math.max(
      0,
      (manualMagicFind ?? Number(activeProfile?.magicFind.dungeon || 0)) + completionMagicFindBonus,
    );

    for (const dungeon of staticData.dungeons) {
      let totalEv = 0;
      let combinedDropChance = 0;
      const lootDetails = (dungeon.loot || []).map((drop: any) => {
        const valueBreakdown = getItemTrueValueBreakdown(drop.name, marketData, allItemsDb, 0, evOptions);
        const trueValue = valueBreakdown.value;
        const marketPriceInfo = getSafeMarketPrice(marketData[drop.name]);
        const marketPrice = marketPriceInfo.value;
        const baseChancePercent = Number(drop.chance) || 0;
        const adjustedChancePercent = includeMagicFindEv
          ? Math.min(100, baseChancePercent * (1 + totalMagicFind / 100))
          : baseChancePercent;
        const dropChance = adjustedChancePercent / 100;
        const expectedVal = dropChance * (Number(drop.quantity) || 1) * trueValue;
        totalEv += expectedVal;
        combinedDropChance += dropChance;
        return { ...drop, trueValue, marketPrice, expectedVal, valueBreakdown, marketPriceInfo, baseChancePercent, adjustedChancePercent };
      });

      const durationMins = getDungeonLengthMinutes(dungeon);
      const durationHours = durationMins / 60;
      const effectiveDurationMins = durationMins / (1 + efficiency / 100);
      const effectiveDurationHours = effectiveDurationMins / 60;
      const entryCost = Number(dungeon.cost || 0);
      const netProfitPerRun = totalEv - entryCost;
      const netProfitPerHour = effectiveDurationHours > 0 ? netProfitPerRun / effectiveDurationHours : 0;
      const runsToDrop = combinedDropChance > 0 ? 1 / combinedDropChance : Infinity;
      const requiredDungeonStats = Math.ceil(Number(dungeon.difficulty || 0) * 0.7);
      const statGap = Math.max(0, requiredDungeonStats - profileDungeonStats);
      const dungeoneeringGap = Math.max(0, Number(dungeon.level_required || 0) - profileDungeoneering);
      const runsInIdleAction = idleActionLimitHours > 0 && effectiveDurationHours > 0 ? Math.floor(idleActionLimitHours / effectiveDurationHours) : 0;
      const dailyRunsByPlaytime = runsInIdleAction > 0 && playtimeHours > 0 && effectiveDurationHours > 0
        ? Math.floor(playtimeHours / effectiveDurationHours)
        : 0;
      const actionsNeededForDailyRuns = runsInIdleAction > 0 && dailyRunsByPlaytime > 0
        ? Math.ceil(dailyRunsByPlaytime / runsInIdleAction)
        : 0;
      const idleActionBaseHours = durationHours * runsInIdleAction;
      const idleActionEffectiveHours = effectiveDurationHours * runsInIdleAction;
      const idleActionCost = entryCost * runsInIdleAction;
      const idleActionNetProfit = netProfitPerRun * runsInIdleAction;
      const idleActionGapHours = Math.max(0, idleActionLimitHours - idleActionEffectiveHours);
      const completionRequirement = Number(dungeon.completion_requirement || 0);
      const completedRuns = Number(completedRunsByDungeon[getDungeonKey(dungeon)] || 0);
      const completionMagicFindActive = completionRequirement > 0 && completedRuns >= completionRequirement;

      calculated.push({
        ...dungeon,
        ev: totalEv,
        durationMins,
        durationHours,
        effectiveDurationMins,
        effectiveDurationHours,
        entryCost,
        netProfitPerRun,
        netProfitPerHour,
        runsToDrop,
        requiredDungeonStats,
        profileDungeonStats,
        profileDungeoneering,
        profileReady: Boolean(activeProfile) && statGap === 0 && dungeoneeringGap === 0,
        statGap,
        dungeoneeringGap,
        dropsCount: lootDetails.length,
        lootDetails,
        playtimeHours,
        idleActionLimitHours,
        runsInIdleAction,
        dailyRunsByPlaytime,
        actionsNeededForDailyRuns,
        idleActionBaseHours,
        idleActionEffectiveHours,
        idleActionCost,
        idleActionNetProfit,
        idleActionGapHours,
        completedRuns,
        completionRequirement,
        completionMagicFindActive,
        completedDungeonBonus: completionMagicFindBonus,
        dungeonEfficiency: efficiency,
        dungeonMagicFind: totalMagicFind,
        includeMagicFindEv,
        combatExp: Number(dungeon.experience?.skills?.combat || 0),
        dungeoneeringExp: Number(dungeon.experience?.skills?.dungeoneering || 0),
      });
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = calculated.filter((row) => {
      const matchesSearch = !normalizedSearch ||
        row.name.toLowerCase().includes(normalizedSearch) ||
        (row.location?.name || "").toLowerCase().includes(normalizedSearch);
      const matchesReadiness =
        readinessFilter === "all" ||
        (readinessFilter === "ready" && row.profileReady) ||
        (readinessFilter === "blocked" && activeProfile && !row.profileReady);
      const matchesProfit = minimumProfit === "" || row.netProfitPerRun >= Number(minimumProfit);
      return matchesSearch && matchesReadiness && matchesProfit;
    });

    filtered.sort((a, b) => {
      let valA: any = a[sortCol];
      let valB: any = b[sortCol];
      if (sortCol === "location") {
        valA = a.location?.name || "";
        valB = b.location?.name || "";
      }
      if (sortCol === "readiness") {
        valA = a.profileReady ? 0 : a.statGap + a.dungeoneeringGap * 1000;
        valB = b.profileReady ? 0 : b.statGap + b.dungeoneeringGap * 1000;
      }
      if (typeof valA === "string") {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortDesc ? valB - valA : valA - valB;
    });

    return filtered;
  }, [
    activeProfile,
    allItemsDb,
    completionMagicFindBonus,
    completedRunsByDungeon,
    dungeonEfficiency,
    dungeonMagicFind,
    includeMagicFindEv,
    marketData,
    minimumProfit,
    preferences.customPrices,
    preferences.membership,
    readinessFilter,
    searchTerm,
    sortCol,
    sortDesc,
    staticData,
  ]);

  const autoOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (rows.length === 0) return;
    const dungeonParam = searchParams.get("dungeon") || searchParams.get("search");
    if (dungeonParam) {
      if (dungeonParam === autoOpenedRef.current) return;
      const found = rows.find((row) => row.name.toLowerCase() === dungeonParam.toLowerCase());
      if (found) {
        setSelectedDungeon(found);
        autoOpenedRef.current = dungeonParam;
      }
    } else {
      autoOpenedRef.current = null;
    }
  }, [rows, searchParams]);

  const summary = useMemo(() => {
    const readyRows = rows.filter((row) => row.profileReady);
    const bestProfit = rows.reduce((best, row) => row.netProfitPerHour > (best?.netProfitPerHour ?? -Infinity) ? row : best, null as any);
    const bestReady = readyRows.reduce((best, row) => row.netProfitPerHour > (best?.netProfitPerHour ?? -Infinity) ? row : best, null as any);
    const cheapest = rows.reduce((best, row) => row.entryCost < (best?.entryCost ?? Infinity) ? row : best, null as any);
    return { readyRows, bestProfit, bestReady, cheapest };
  }, [rows]);

  const selectedDungeonLore = useMemo(() => {
    if (!selectedDungeon) return [];
    return getLoreHintsForNames([
      { name: selectedDungeon.name, source: "entity" },
      { name: selectedDungeon.location?.name, source: "location" },
      ...(selectedDungeon.lootDetails || []).map((drop: any) => ({ name: drop.name, source: "drop" as const })),
    ], 5);
  }, [selectedDungeon]);

  const openLoreThread = (entryId: string) => {
    setSelectedDungeon(null);
    router.push(`/lore?thread=${entryId}`);
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDesc((current) => !current);
    else {
      setSortCol(col);
      setSortDesc(col !== "name" && col !== "location" && col !== "readiness");
    }
  };

  const renderSortIcon = (col: string) => {
    if (sortCol !== col) return null;
    return sortDesc ? <ChevronDown size={14} /> : <ChevronUp size={14} />;
  };

  return (
    <main className="container dungeons-page">
      <div className="header">
        <h1 className="header-title">
          <Castle size={24} color="var(--text-accent)" /> ZENITH DUNGEONS
        </h1>
        <div className="header-status">
          <div className="status-dot"></div>
          <span className="mono">{activeProfile ? `${activeProfile.name} - ` : ""}{rows.length} FILTERED</span>
        </div>
      </div>

      <section className="dungeon-command">
        <div className="dungeon-command-main">
          <span className="dungeon-eyebrow"><ShieldCheck size={14} /> Dungeon Planner</span>
          <h2>{summary.bestReady?.name || summary.bestProfit?.name || "Build a dungeon plan"}</h2>
          <p>
            Compare entry readiness, expected value, run costs, speed-style dungeon efficiency, and optional magic-find adjusted EV.
          </p>
        </div>
        <div className="dungeon-command-stats">
          <div><span>Ready</span><strong>{activeProfile ? `${summary.readyRows.length}/${rows.length}` : "No profile"}</strong></div>
          <div><span>Best Ready</span><strong>{summary.bestReady ? formatGold(summary.bestReady.netProfitPerHour) + "/hr" : "-"}</strong></div>
          <div><span>Cheapest</span><strong>{summary.cheapest ? formatPlainGold(summary.cheapest.entryCost) : "-"}</strong></div>
        </div>
      </section>

      <section className="dungeon-planner">
        <div className="dungeon-planner-field dungeon-search-field">
          <label className="control-label">Search</label>
          <div className="dungeon-input-icon">
            <Search size={14} />
            <input
              type="text"
              className="control-input"
              placeholder="Dungeon or location..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        <div className="dungeon-planner-field dungeon-readonly-field dungeon-action-limit-field">
          <span className="control-label">Idle Action Limit</span>
          <strong>{getProfileIdleActionHours(activeProfile).toLocaleString()}h</strong>
          <small>{activeProfile?.kind === "main" ? "Main profile queue cap." : activeProfile ? "Alt profile queue cap." : "Select a profile."}</small>
        </div>
        <div className="dungeon-planner-field dungeon-readonly-field dungeon-playtime-field">
          <span className="control-label">Playtime</span>
          <strong>{Number(activeProfile?.timers.activeHours || 0).toLocaleString()}h/day</strong>
          <small>Used for daily repeat capacity, not one queued action.</small>
        </div>
        <label className="dungeon-planner-field dungeon-profit-field">
          <span className="control-label">Min Profit / Run</span>
          <input className="control-input" type="number" value={minimumProfit} onChange={(event) => setMinimumProfit(event.target.value === "" ? "" : Number(event.target.value))} />
        </label>
        <label className="dungeon-planner-field dungeon-efficiency-field">
          <span className="control-label">Dungeon Efficiency</span>
          <input className="control-input" type="number" min="0" value={dungeonEfficiency} placeholder={activeProfile?.efficiency.dungeon ? String(activeProfile.efficiency.dungeon) : "0"} onChange={(event) => setDungeonEfficiency(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))} />
        </label>
        <label className="dungeon-planner-field dungeon-mf-field">
          <span className="control-label">Dungeon MF</span>
          <input className="control-input" type="number" min="0" value={dungeonMagicFind} placeholder={activeProfile?.magicFind.dungeon ? String(activeProfile.magicFind.dungeon) : "0"} onChange={(event) => setDungeonMagicFind(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))} />
        </label>
        <div className="dungeon-planner-field dungeon-readonly-field dungeon-completion-field">
          <span className="control-label">Completion MF</span>
          <strong>+{completionMagicFindBonus}%</strong>
          <small>One point per completed dungeon requirement met.</small>
        </div>
        <div className="dungeon-planner-field dungeon-filter-field">
          <span className="control-label">Profile Filter</span>
          <div className="dungeon-segmented">
            {(["all", "ready", "blocked"] as ReadinessFilter[]).map((mode) => (
              <button key={mode} type="button" className={readinessFilter === mode ? "active" : ""} onClick={() => setReadinessFilter(mode)}>
                {mode === "all" ? "All" : mode === "ready" ? "Ready" : "Blocked"}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`dungeon-check-toggle dungeon-mf-toggle ${includeMagicFindEv ? "active" : ""}`}
          aria-pressed={includeMagicFindEv}
          onClick={() => setIncludeMagicFindEv((value) => !value)}
        >
          <span className="dungeon-check-box">{includeMagicFindEv && <Check size={13} />}</span>
          <span>
            <strong>Apply dungeon MF</strong>
            <small>Adjust loot EV with profile and completion magic find.</small>
          </span>
        </button>
      </section>

      <section className="dungeon-insights">
        <button type="button" className="dungeon-insight" onClick={() => summary.bestProfit && setSelectedDungeon(summary.bestProfit)}>
          <BarChart3 size={16} />
          <span>Best EV/hr</span>
          <strong>{summary.bestProfit ? summary.bestProfit.name : "-"}</strong>
          <small>{summary.bestProfit ? formatGold(summary.bestProfit.netProfitPerHour) + "/hr" : "No data"}</small>
        </button>
        <button type="button" className="dungeon-insight" onClick={() => summary.bestReady && setSelectedDungeon(summary.bestReady)}>
          <ShieldCheck size={16} />
          <span>Best Ready</span>
          <strong>{summary.bestReady ? summary.bestReady.name : "-"}</strong>
          <small>{summary.bestReady ? getReadinessText(summary.bestReady, Boolean(activeProfile)) : "No ready dungeon"}</small>
        </button>
        <div className="dungeon-insight passive">
          <Timer size={16} />
          <span>Action Limit</span>
          <strong>{getProfileIdleActionHours(activeProfile).toLocaleString()}h {activeProfile?.kind || "profile"} action</strong>
          <small>Runs fit in one queued action after dungeon efficiency.</small>
        </div>
      </section>

      <section className="table-wrapper dungeon-table-wrapper">
        <div className="desktop-only">
          <div className="table-container dungeon-table">
            <table>
              <thead>
                <tr>
                  <th className="sortable left-align" onClick={() => handleSort("name")}>Dungeon {renderSortIcon("name")}</th>
                  <th className="sortable left-align" onClick={() => handleSort("location")}>Location {renderSortIcon("location")}</th>
                  <th className="sortable" onClick={() => handleSort("readiness")}>Profile {renderSortIcon("readiness")}</th>
                  <th className="sortable" onClick={() => handleSort("netProfitPerRun")}>EV / Run {renderSortIcon("netProfitPerRun")}</th>
                  <th className="sortable" onClick={() => handleSort("netProfitPerHour")}>EV / Hr {renderSortIcon("netProfitPerHour")}</th>
                  <th className="sortable" onClick={() => handleSort("runsInIdleAction")}>Runs / Action {renderSortIcon("runsInIdleAction")}</th>
                  <th>Done</th>
                  <th className="sortable" onClick={() => handleSort("runsToDrop")}>Runs / Drop {renderSortIcon("runsToDrop")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id || row.name}
                    className="clickable-row"
                    onClick={() => setSelectedDungeon(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedDungeon(row);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="item-name left-align">
                      <div className="dungeon-name-cell">
                        {row.image_url && <img src={row.image_url} alt="" />}
                        <div>
                          <span>{row.name}</span>
                          <small>Lv {row.level_required || 0} - {row.durationMins}m - {row.dropsCount} drops</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted left-align">{row.location?.name || "Unknown"}</td>
                    <td><span className={`dungeon-readiness ${row.profileReady ? "ready" : activeProfile ? "blocked" : "neutral"}`}>{getReadinessText(row, Boolean(activeProfile))}</span></td>
                    <td className={`mono ${row.netProfitPerRun >= 0 ? "profit-positive" : "profit-negative"}`}>{formatGold(row.netProfitPerRun)}</td>
                    <td className={`mono ${row.netProfitPerHour >= 0 ? "profit-positive" : "profit-negative"}`}>{formatGold(row.netProfitPerHour)}</td>
                    <td className="mono text-muted">{row.runsInIdleAction}</td>
                    <td>
                      <input
                        aria-label={`${row.name} completed runs`}
                        className="dungeon-completed-input"
                        type="number"
                        min="0"
                        value={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                        placeholder={`/${row.completionRequirement || 0}`}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0);
                          setCompletedRunsByDungeon((current) => ({ ...current, [getDungeonKey(row)]: value }));
                        }}
                      />
                    </td>
                    <td className="mono text-muted">{row.runsToDrop === Infinity ? "-" : row.runsToDrop.toFixed(1)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="dungeon-empty-state">
                        <strong>No dungeons match these filters.</strong>
                        <span>Relax the profile filter, search term, or minimum profit target.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mobile-only">
          <MobileSortControls
            label="Sort Dungeons"
            value={sortCol}
            descending={sortDesc}
            onSort={handleSort}
            onToggleDirection={() => setSortDesc((prev) => !prev)}
            options={[
              { value: "netProfitPerHour", label: "EV / Hr" },
              { value: "netProfitPerRun", label: "EV / Run" },
              { value: "runsInIdleAction", label: "Runs / Action" },
              { value: "readiness", label: "Profile Gap" },
              { value: "durationMins", label: "Duration" },
              { value: "name", label: "Name" },
            ]}
          />
          <div className="dungeon-mobile-grid">
            {rows.length === 0 && (
              <div className="dungeon-empty-state">
                <strong>No dungeons match these filters.</strong>
                <span>Relax the profile filter, search term, or minimum profit target.</span>
              </div>
            )}
            {rows.map((row) => (
              <div
                key={row.id || row.name}
                role="button"
                tabIndex={0}
                className="dungeon-card"
                onClick={() => setSelectedDungeon(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedDungeon(row);
                  }
                }}
              >
                <div className="dungeon-card-top">
                  <div className="dungeon-name-cell">
                    {row.image_url && <img src={row.image_url} alt="" />}
                    <div>
                      <strong>{row.name}</strong>
                          <small>{row.location?.name || "Unknown"} - {Math.round(row.effectiveDurationMins)}m</small>
                    </div>
                  </div>
                  <span className={`dungeon-readiness ${row.profileReady ? "ready" : activeProfile ? "blocked" : "neutral"}`}>
                    {row.profileReady ? "Ready" : activeProfile ? "Blocked" : "No Profile"}
                  </span>
                </div>
                <div className="dungeon-card-stats">
                  <span><small>EV/run</small><strong className={row.netProfitPerRun >= 0 ? "profit-positive" : "profit-negative"}>{formatGold(row.netProfitPerRun)}</strong></span>
                  <span><small>EV/hr</small><strong className={row.netProfitPerHour >= 0 ? "profit-positive" : "profit-negative"}>{formatGold(row.netProfitPerHour)}</strong></span>
                  <span><small>Runs / Action</small><strong>{row.runsInIdleAction}</strong></span>
                  <span><small>Daily Runs</small><strong>{row.dailyRunsByPlaytime}</strong></span>
                  <span><small>Cost</small><strong>{formatPlainGold(row.entryCost)}</strong></span>
                </div>
                <label className="dungeon-mobile-completed" onClick={(event) => event.stopPropagation()}>
                  <span>Completed runs</span>
                  <input
                    type="number"
                    min="0"
                    value={completedRunsByDungeon[getDungeonKey(row)] ?? ""}
                    placeholder={`Requirement ${row.completionRequirement || 0}`}
                    onKeyDown={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      const value = event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0);
                      setCompletedRunsByDungeon((current) => ({ ...current, [getDungeonKey(row)]: value }));
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedDungeon && (
        <div className="modal-overlay" onClick={() => setSelectedDungeon(null)}>
          <div className="modal-content dungeon-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="dungeon-modal-title">
                {selectedDungeon.image_url && <img src={selectedDungeon.image_url} alt="" />}
                <div>
                  <h2>{selectedDungeon.name}</h2>
                  <div className="dungeon-modal-tags">
                    <span><MapPin size={12} /> {selectedDungeon.location?.name || "Unknown"}</span>
                    <span><Zap size={12} /> Difficulty {selectedDungeon.difficulty}</span>
                    <span><Clock size={12} /> {selectedDungeon.durationMins}m</span>
                  </div>
                </div>
              </div>
              <button className="close-btn" type="button" aria-label="Close dungeon details" onClick={() => setSelectedDungeon(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="stats-grid dungeon-modal-stats">
                <div className="stat-card">
                  <div className="stat-label">Entry Cost</div>
                  <div className="stat-value" style={{ color: "#f87171" }}>-{formatPlainGold(selectedDungeon.entryCost)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">EV / Run</div>
                  <div className="stat-value" style={{ color: selectedDungeon.netProfitPerRun >= 0 ? "var(--text-success)" : "#f87171" }}>{formatGold(selectedDungeon.netProfitPerRun)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">EV / Hour</div>
                  <div className="stat-value" style={{ color: selectedDungeon.netProfitPerHour >= 0 ? "var(--text-success)" : "#f87171" }}>{formatGold(selectedDungeon.netProfitPerHour)}</div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-label">Action Net</div>
                  <div className="stat-value" style={{ color: selectedDungeon.idleActionNetProfit >= 0 ? "var(--text-success)" : "#f87171" }}>{formatGold(selectedDungeon.idleActionNetProfit)}</div>
                </div>
              </div>

              <div className="dungeon-modal-grid">
                <section className="dungeon-modal-panel">
                  <h3><ShieldCheck size={15} /> Profile Readiness</h3>
                  <div className="dungeon-detail-row"><span>Status</span><strong>{getReadinessText(selectedDungeon, Boolean(activeProfile))}</strong></div>
                  <div className="dungeon-detail-row"><span>Profile stats</span><strong>{formatNumber(selectedDungeon.profileDungeonStats)}</strong></div>
                  <div className="dungeon-detail-row"><span>Required stats</span><strong>{formatNumber(selectedDungeon.requiredDungeonStats)}</strong></div>
                  <div className="dungeon-detail-row"><span>Dungeoneering</span><strong>{selectedDungeon.profileDungeoneering || 0} / {selectedDungeon.level_required || 0}</strong></div>
                </section>
                <section className="dungeon-modal-panel">
                  <h3><Target size={15} /> Idle Action Plan</h3>
                  <div className="dungeon-detail-row"><span>Action limit</span><strong>{selectedDungeon.idleActionLimitHours.toFixed(1)}h</strong></div>
                  <div className="dungeon-detail-row"><span>Playtime</span><strong>{selectedDungeon.playtimeHours.toFixed(1)}h/day</strong></div>
                  <div className="dungeon-detail-row"><span>Runs fit</span><strong>{selectedDungeon.runsInIdleAction}</strong></div>
                  <div className="dungeon-detail-row"><span>Daily repeat capacity</span><strong>{selectedDungeon.dailyRunsByPlaytime} runs in {selectedDungeon.actionsNeededForDailyRuns} actions</strong></div>
                  <div className="dungeon-detail-row"><span>Base time used</span><strong>{selectedDungeon.idleActionBaseHours.toFixed(1)}h</strong></div>
                  <div className="dungeon-detail-row"><span>Effective time used</span><strong>{selectedDungeon.idleActionEffectiveHours.toFixed(1)}h</strong></div>
                  <div className="dungeon-detail-row"><span>Action gap</span><strong>{selectedDungeon.idleActionGapHours.toFixed(1)}h</strong></div>
                </section>
                <section className="dungeon-modal-panel">
                  <h3><Sparkles size={15} /> Rewards</h3>
                  <div className="dungeon-detail-row"><span>Combat EXP</span><strong>{formatNumber(selectedDungeon.combatExp)}</strong></div>
                  <div className="dungeon-detail-row"><span>Dungeoneering EXP</span><strong>{formatNumber(selectedDungeon.dungeoneeringExp)}</strong></div>
                  <div className="dungeon-detail-row"><span>Shards</span><strong>{formatNumber(Number(selectedDungeon.shards || 0))}</strong></div>
                  <div className="dungeon-detail-row"><span>Completion requirement</span><strong>{selectedDungeon.completedRuns || 0} / {selectedDungeon.completionRequirement || 0}</strong></div>
                  <div className="dungeon-detail-row"><span>Completion MF</span><strong>{selectedDungeon.completionMagicFindActive ? "+1% active" : "Not active"}</strong></div>
                </section>
                <section className="dungeon-modal-panel">
                  <h3><Coins size={15} /> Cost Model</h3>
                  <div className="dungeon-detail-row"><span>Queued action entry cost</span><strong>{formatPlainGold(selectedDungeon.idleActionCost)}</strong></div>
                  <div className="dungeon-detail-row"><span>Gross EV / run</span><strong>{formatPlainGold(selectedDungeon.ev)}</strong></div>
                  <div className="dungeon-detail-row"><span>Dungeon MF in EV</span><strong>{selectedDungeon.includeMagicFindEv ? `${selectedDungeon.dungeonMagicFind}%` : "Off"}</strong></div>
                  <div className="dungeon-detail-row"><span>Runs / any drop</span><strong>{selectedDungeon.runsToDrop === Infinity ? "-" : selectedDungeon.runsToDrop.toFixed(1)}</strong></div>
                </section>
              </div>

              <LoreThreadPanel hints={selectedDungeonLore} title="Dungeon Lore Thread" onOpenThread={openLoreThread} />

              <h3 className="dungeon-loot-heading"><PackageOpen size={16} /> Loot Table</h3>
              <div className="dungeon-loot-list">
                {[...(selectedDungeon.lootDetails || [])]
                  .sort((a: any, b: any) => (b.expectedVal || 0) - (a.expectedVal || 0))
                  .map((drop: any, index: number) => (
                    <button
                      key={`${drop.name}-${index}`}
                      type="button"
                      className="dungeon-loot-row"
                      onClick={() => openItemByName(drop.name)}
                      onMouseEnter={() => prefetchItem(drop.name)}
                    >
                      <div className="dungeon-loot-main">
                        {drop.image_url && <img src={drop.image_url} alt="" />}
                        <div>
                          <strong>{drop.name} <span>x{drop.quantity || 1}</span></strong>
                          <small>{drop.adjustedChancePercent !== drop.baseChancePercent ? `${drop.baseChancePercent}% -> ${drop.adjustedChancePercent.toFixed(2)}%` : `${drop.chance}% drop`} - {drop.quality || "Unknown"}</small>
                        </div>
                      </div>
                      <div className="dungeon-loot-value">
                        <strong>{formatPlainGold(drop.expectedVal || 0)}</strong>
                        <span>
                          {getValuePathLabel(drop.valueBreakdown?.chosenPath)} {formatPlainGold(drop.trueValue || 0)}
                          {drop.marketPriceInfo?.adjusted ? " safe" : ""} <ExternalLink size={10} />
                        </span>
                        {drop.valueBreakdown?.recipe && (
                          <small>
                            Crafted item value: {formatPlainGold(drop.valueBreakdown.recipe.resultValue)}
                            {" - "}
                            material cost {formatPlainGold(drop.valueBreakdown.recipe.materialCost)}
                          </small>
                        )}
                        {drop.valueBreakdown?.chest && (
                          <small>
                            Chest contents EV: {formatPlainGold(drop.valueBreakdown.chest.expectedValue)}
                          </small>
                        )}
                      </div>
                      {drop.valueBreakdown?.chest && (
                        <div className="dungeon-chest-breakdown" onClick={(event) => event.stopPropagation()}>
                          <div className="dungeon-chest-summary">
                            <span>
                              <strong>Alchemy chest breakdown</strong>
                              <small>Each row is chance x quantity x best item value.</small>
                            </span>
                            <em>{formatPlainGold(drop.valueBreakdown.chest.expectedValue)} total</em>
                          </div>
                          {[...drop.valueBreakdown.chest.drops]
                            .sort((a: any, b: any) => (b.expectedValue || 0) - (a.expectedValue || 0))
                            .slice(0, 6)
                            .map((chestDrop: any) => (
                              <div className="dungeon-chest-row" key={`${drop.name}-${chestDrop.name}`}>
                                <span>
                                  <strong>{chestDrop.name}</strong>
                                  <small>{getValuePathLabel(chestDrop.path)}</small>
                                </span>
                                <span>
                                  <em>{formatPlainGold(chestDrop.expectedValue)}</em>
                                  <small>{Number(chestDrop.chance || 0)}% x {chestDrop.quantity || 1} x {formatPlainGold(chestDrop.value || 0)}</small>
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dungeons-page {
          max-width: 1460px;
        }
        .dungeon-command,
        .dungeon-planner,
        .dungeon-insights {
          margin-bottom: 1rem;
          animation: settingsPanelIn 220ms ease both;
        }
        .dungeon-command {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(22rem, 0.75fr);
          gap: 1rem;
          padding: 1.25rem;
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(56,189,248,0.08), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.012));
        }
        .dungeon-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-accent);
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .dungeon-command h2 {
          margin: 0;
          color: #fff;
          font-size: clamp(1.45rem, 2.5vw, 2.2rem);
        }
        .dungeon-command p {
          margin: 0.65rem 0 0;
          color: var(--text-muted);
          max-width: 620px;
          line-height: 1.5;
        }
        .dungeon-command-stats,
        .dungeon-insights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .dungeon-command-stats div,
        .dungeon-insight {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          padding: 0.85rem;
        }
        .dungeon-command-stats span,
        .dungeon-insight span {
          display: block;
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }
        .dungeon-command-stats strong,
        .dungeon-insight strong {
          color: #fff;
          font-size: 1rem;
          overflow-wrap: anywhere;
        }
        .dungeon-planner {
          display: grid;
          grid-template-columns: minmax(17rem, 1.35fr) repeat(4, minmax(10rem, 1fr));
          grid-template-areas:
            "search action playtime profit efficiency"
            "mf completion filter toggle toggle";
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-panel);
          align-items: stretch;
        }
        .dungeon-search-field { grid-area: search; }
        .dungeon-action-limit-field { grid-area: action; }
        .dungeon-playtime-field { grid-area: playtime; }
        .dungeon-profit-field { grid-area: profit; }
        .dungeon-efficiency-field { grid-area: efficiency; }
        .dungeon-mf-field { grid-area: mf; }
        .dungeon-completion-field { grid-area: completion; }
        .dungeon-filter-field { grid-area: filter; }
        .dungeon-mf-toggle { grid-area: toggle; }
        .dungeon-planner-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          min-width: 0;
          justify-content: flex-end;
        }
        .dungeon-planner-field .control-input {
          width: 100%;
          min-width: 0;
          min-height: 42px;
        }
        .dungeon-readonly-field {
          justify-content: center;
          min-height: 4.4rem;
          padding: 0.55rem 0.7rem;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.025);
        }
        .dungeon-readonly-field strong {
          color: #fff;
          font-family: var(--font-mono);
          font-size: 0.95rem;
        }
        .dungeon-readonly-field small {
          color: var(--text-muted);
          font-size: 0.68rem;
          line-height: 1.25;
        }
        .dungeon-check-toggle {
          display: grid;
          grid-template-columns: 1.8rem minmax(0, 1fr);
          align-items: center;
          gap: 0.65rem;
          min-height: 4.4rem;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: rgba(255,255,255,0.025);
          color: var(--text-muted);
          text-align: left;
          cursor: pointer;
          transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
        }
        .dungeon-check-toggle:hover,
        .dungeon-check-toggle.active {
          border-color: color-mix(in srgb, var(--text-accent), transparent 48%);
          background: color-mix(in srgb, var(--text-accent), transparent 90%);
        }
        .dungeon-check-toggle:active {
          transform: translateY(1px);
        }
        .dungeon-check-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.35rem;
          height: 1.35rem;
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 50%);
          border-radius: 5px;
          color: #000;
          background: rgba(0,0,0,0.24);
        }
        .dungeon-check-toggle.active .dungeon-check-box {
          background: var(--text-accent);
        }
        .dungeon-check-toggle strong {
          display: block;
          color: #fff;
          font-size: 0.78rem;
          line-height: 1.2;
        }
        .dungeon-check-toggle small {
          display: block;
          margin-top: 0.15rem;
          color: var(--text-muted);
          font-size: 0.68rem;
          line-height: 1.25;
        }
        .dungeon-input-icon {
          position: relative;
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          min-height: 42px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), var(--bg-base);
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .dungeon-input-icon:focus-within {
          border-color: var(--text-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-accent), transparent 84%);
        }
        .dungeon-input-icon svg {
          position: absolute;
          left: 0.85rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          z-index: 1;
          pointer-events: none;
        }
        .dungeon-input-icon .control-input {
          display: block;
          height: 40px;
          min-height: 40px;
          padding-left: 2.45rem;
          border: 0;
          background: transparent;
          box-shadow: none;
        }
        .dungeon-input-icon .control-input:focus {
          box-shadow: none;
        }
        .dungeon-segmented {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          min-height: 38px;
          padding: 0.25rem;
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          background: var(--bg-base);
        }
        .dungeon-segmented button {
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.74rem;
          font-weight: 900;
          cursor: pointer;
        }
        .dungeon-segmented button.active {
          background: var(--text-accent);
          color: #000;
        }
        .dungeon-insight {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          column-gap: 0.75rem;
          text-align: left;
          color: inherit;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .dungeon-insight:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--text-accent), transparent 65%);
        }
        .dungeon-insight svg {
          grid-row: span 3;
          color: var(--text-accent);
          margin-top: 0.1rem;
        }
        .dungeon-insight span,
        .dungeon-insight strong,
        .dungeon-insight small {
          grid-column: 2;
          min-width: 0;
        }
        .dungeon-insight strong {
          line-height: 1.15;
        }
        .dungeon-insight small {
          display: block;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .dungeon-insight.passive {
          cursor: default;
        }
        .dungeon-insight.passive:hover {
          transform: none;
        }
        .dungeon-table-wrapper {
          margin-top: 1rem;
        }
        .dungeon-table th,
        .dungeon-table td {
          vertical-align: middle;
        }
        .dungeon-completed-input,
        .dungeon-mobile-completed input {
          width: 6.5rem;
          min-width: 0;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-base);
          color: #fff;
          padding: 0.45rem 0.55rem;
          font-family: var(--font-mono);
          font-size: 0.82rem;
        }
        .dungeon-name-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        .dungeon-name-cell img {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          flex: 0 0 auto;
        }
        .dungeon-name-cell div {
          min-width: 0;
        }
        .dungeon-name-cell span,
        .dungeon-name-cell strong {
          color: #fff;
          overflow-wrap: anywhere;
        }
        .dungeon-name-cell small {
          display: block;
          color: var(--text-muted);
          margin-top: 0.2rem;
          font-size: 0.7rem;
        }
        .dungeon-readiness {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          max-width: 13rem;
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          border: 1px solid var(--border-subtle);
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: normal;
        }
        .dungeon-readiness.ready {
          color: #86efac;
          border-color: rgba(34,197,94,0.28);
          background: rgba(34,197,94,0.1);
        }
        .dungeon-readiness.blocked {
          color: #fca5a5;
          border-color: rgba(239,68,68,0.26);
          background: rgba(239,68,68,0.09);
        }
        .dungeon-readiness.neutral {
          color: var(--text-muted);
          background: rgba(255,255,255,0.03);
        }
        .dungeon-mobile-grid {
          display: grid;
          gap: 0.75rem;
        }
        .dungeon-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          min-height: 8rem;
          padding: 1.25rem;
          color: var(--text-muted);
          text-align: center;
          border: 1px dashed var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
        }
        .dungeon-empty-state strong {
          color: #fff;
          font-size: 0.95rem;
        }
        .dungeon-empty-state span {
          font-size: 0.8rem;
        }
        .dungeon-card {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          width: 100%;
          padding: 0.9rem;
          text-align: left;
          color: inherit;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
        }
        .dungeon-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .dungeon-card-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .dungeon-card-stats span {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding: 0.55rem;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: rgba(255,255,255,0.02);
        }
        .dungeon-card-stats small {
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .dungeon-card-stats strong {
          color: #fff;
          font-family: var(--font-mono);
        }
        .dungeon-mobile-completed {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.6fr);
          align-items: center;
          gap: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          color: var(--text-muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .dungeon-modal {
          max-width: min(980px, calc(100vw - 2rem));
        }
        .dungeon-modal-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
        }
        .dungeon-modal-title img {
          width: 52px;
          height: 52px;
          border-radius: 8px;
          object-fit: cover;
          flex: 0 0 auto;
        }
        .dungeon-modal-title h2 {
          margin: 0;
          overflow-wrap: anywhere;
        }
        .dungeon-modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-top: 0.5rem;
        }
        .dungeon-modal-tags span {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          border: 1px solid var(--border-subtle);
          border-radius: 5px;
          color: var(--text-muted);
          background: rgba(255,255,255,0.03);
          padding: 0.2rem 0.5rem;
          font-size: 0.75rem;
        }
        .dungeon-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .dungeon-modal-panel {
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.025);
          padding: 1rem;
        }
        .dungeon-modal-panel h3,
        .dungeon-loot-heading {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0 0 0.75rem;
          color: var(--text-accent);
          font-size: 0.86rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .dungeon-detail-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.45rem 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .dungeon-detail-row span {
          color: var(--text-muted);
        }
        .dungeon-detail-row strong {
          color: #fff;
          text-align: right;
        }
        .dungeon-loot-heading {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-subtle);
        }
        .dungeon-loot-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .dungeon-loot-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(10rem, auto);
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 1rem;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          color: inherit;
          text-align: left;
          cursor: pointer;
        }
        .dungeon-loot-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }
        .dungeon-loot-main img {
          width: 34px;
          height: 34px;
          border-radius: 6px;
          object-fit: cover;
          flex: 0 0 auto;
        }
        .dungeon-loot-main strong {
          color: #fff;
          overflow-wrap: anywhere;
        }
        .dungeon-loot-main span,
        .dungeon-loot-main small {
          color: var(--text-muted);
        }
        .dungeon-loot-main small {
          display: block;
          margin-top: 0.2rem;
        }
        .dungeon-loot-value {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
          min-width: 9rem;
          text-align: right;
        }
        .dungeon-loot-value strong {
          color: var(--text-success);
        }
        .dungeon-loot-value span {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-muted);
          font-size: 0.72rem;
        }
        .dungeon-loot-value small {
          display: block;
          color: var(--text-muted);
          font-size: 0.66rem;
          line-height: 1.25;
        }
        .dungeon-chest-breakdown {
          grid-column: 1 / -1;
          display: grid;
          gap: 0.55rem;
          padding: 0.8rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-radius: 7px;
          background: rgba(56,189,248,0.045);
        }
        .dungeon-chest-summary,
        .dungeon-chest-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(9rem, auto);
          align-items: center;
          gap: 0.75rem;
        }
        .dungeon-chest-summary {
          padding-bottom: 0.55rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .dungeon-chest-summary strong {
          color: var(--text-accent);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .dungeon-chest-summary small,
        .dungeon-chest-row small {
          display: block;
          margin-top: 0.15rem;
          color: var(--text-muted);
          font-size: 0.66rem;
          line-height: 1.25;
        }
        .dungeon-chest-summary em {
          justify-self: end;
          color: #fff;
          font-style: normal;
          font-family: var(--font-mono);
          font-weight: 900;
        }
        .dungeon-chest-row {
          padding: 0.55rem 0.65rem;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          background: rgba(0,0,0,0.14);
        }
        .dungeon-chest-row strong {
          color: #fff;
          overflow-wrap: anywhere;
        }
        .dungeon-chest-row em {
          justify-self: end;
          color: var(--text-success);
          font-style: normal;
          font-family: var(--font-mono);
          font-weight: 900;
          white-space: nowrap;
        }
        .dungeon-chest-row span:last-child {
          text-align: right;
        }
        @media (max-width: 1100px) {
          .dungeon-command,
          .dungeon-planner {
            grid-template-columns: 1fr;
          }
          .dungeon-planner {
            grid-template-areas:
              "search"
              "action"
              "playtime"
              "profit"
              "efficiency"
              "mf"
              "completion"
              "filter"
              "toggle";
          }
          .dungeon-command-stats,
          .dungeon-insights {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (min-width: 1101px) and (max-width: 1380px) {
          .dungeon-planner {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-template-areas:
              "search action playtime"
              "mf completion filter"
              "profit efficiency toggle";
          }
        }
        @media (max-width: 720px) {
          .dungeon-command,
          .dungeon-planner {
            padding: 1rem;
          }
          .dungeon-command-stats,
          .dungeon-insights,
          .dungeon-modal-grid {
            grid-template-columns: 1fr;
          }
          .dungeon-card-top,
          .dungeon-loot-row {
            align-items: stretch;
          }
          .dungeon-loot-row {
            grid-template-columns: 1fr;
          }
          .dungeon-card-stats {
            grid-template-columns: 1fr;
          }
          .dungeon-loot-value {
            align-items: flex-start;
            min-width: 0;
            text-align: left;
          }
          .dungeon-chest-summary,
          .dungeon-chest-row {
            grid-template-columns: 1fr;
          }
          .dungeon-chest-summary em,
          .dungeon-chest-row em,
          .dungeon-chest-row span:last-child {
            justify-self: start;
            text-align: left;
          }
          .dungeon-readiness {
            max-width: none;
          }
        }
      `}</style>
    </main>
  );
}

export default function DungeonsPage() {
  return (
    <Suspense fallback={<div>Loading Dungeons...</div>}>
      <DungeonsContent />
    </Suspense>
  );
}
