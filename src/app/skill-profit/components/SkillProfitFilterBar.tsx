"use client";

import { useMemo } from "react";
import { Check, ChevronDown, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { formatGold } from "@/lib/format";
import { formatHours } from "@/lib/housing";
import { getEssenceOptionsForSkill, SUPPORTED_ESSENCE_SKILLS } from "@/lib/essences";
import {
  ASCENSION_BUFFS,
  type AssaultRank,
  SKILL_TOOLS,
  type SkillProfitSortKey,
  type ToolSkill,
} from "@/lib/skill-profit";
import QualityText from "@/components/QualityText";
import styles from "../page.module.css";
import { OptionPicker, ToolPicker, EssencePicker } from "./SkillProfitControls";
import {
  CONQUEST_PICKER_OPTIONS,
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  SALE_MODE_OPTIONS,
  type UseSkillProfitCalculationsReturn,
  type UseSkillProfitStateReturn,
} from "../types";

export interface SkillProfitFilterBarProps {
  state: UseSkillProfitStateReturn;
  calc: UseSkillProfitCalculationsReturn;
}

export function SkillProfitFilterBar({ state, calc }: SkillProfitFilterBarProps) {
  const {
    searchTerm,
    setSearchTerm,
    deferredSearchTerm,
    settings,
    patchSettings,
    poolExpDraft,
    setPoolExpDraft,
    barteringLevelDraft,
    setBarteringLevelDraft,
    commitBarteringLevel,
    minVolumeDraft,
    setMinVolumeDraft,
    minVolume,
    setMinVolume,
    hideAboveLevel,
    setHideAboveLevel,
    includeForgeInfoRows,
    setIncludeForgeInfoRows,
    sortKey,
    sortDesc,
    setSortKey,
    setSortDesc,
    resetRouteFilters,
    mobileSetupOpen,
    setMobileSetupOpen,
    activeDropdownLayer,
    handleCommandPickerOpenChange,
    handleToolPickerOpenChange,
    handleEssencePickerOpenChange,
    patchTool,
    patchEssence,
    toggleAscension,
    ascensionOpen,
    setAscensionOpen,
    essenceOpen,
    setEssenceOpen,
    configuredProfile,
    hasProfileSkills,
    activeSkillLevel,
    activeSkill,
    preferences,
  } = state;

  const {
    effectiveSettings,
    effectiveToolSelections,
    rowModel,
    rows,
    liquidRouteCount,
    needsPriceCount,
    activeEssenceCount,
    idleActionHoursBySkill,
    baseIdleActionHours,
    hasAnyLocationLimitedHousing,
    essenceSessionsBySkill,
    allItemsDb,
    marketData,
  } = calc;

  const routeFilterCount = [
    deferredSearchTerm.trim().length > 0,
    activeSkill !== "All",
    minVolume !== DEFAULT_STATE.minVolume,
    includeForgeInfoRows,
    hideAboveLevel,
    sortKey !== DEFAULT_STATE.sortKey || sortDesc !== DEFAULT_STATE.sortDesc,
    (settings.saleMode || "best") !== DEFAULT_SETTINGS.saleMode,
  ].filter(Boolean).length;

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

  return (
    <>
      <section className={`${styles.commandBar} ${activeDropdownLayer === "command" ? styles.dropdownLayerActive : ""}`}>
        <div className={styles.filterRow} aria-label="Skill profit route filters">
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              aria-label="Search skill profit items"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search item or material"
              spellCheck={false}
            />
            {searchTerm.trim().length > 0 && (
              <button
                aria-label="Clear skill profit search"
                className={styles.searchClear}
                onClick={() => setSearchTerm("")}
                type="button"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className={`${styles.numberField} ${styles.conquestField}`}>
            <span>Guild Conquest</span>
            <OptionPicker
              options={CONQUEST_PICKER_OPTIONS}
              value={effectiveSettings.assaultRank}
              onChange={(value) => patchSettings({ assaultRank: value as AssaultRank })}
              onOpenChange={handleCommandPickerOpenChange}
            />
          </div>
          <label className={styles.numberField}>
            <span>Pool EXP</span>
            <input
              aria-label="Energizing pool EXP bonus"
              type="number"
              min={0}
              max={15}
              value={poolExpDraft}
              placeholder="0"
              onChange={(event) => {
                const rawValue = event.target.value;
                setPoolExpDraft(rawValue);
                if (rawValue === "") return;
                patchSettings({ energizingPoolExp: Math.min(15, Math.max(0, Number(rawValue) || 0)) });
              }}
              onBlur={() => {
                if (poolExpDraft === "") {
                  patchSettings({ energizingPoolExp: 0 });
                  setPoolExpDraft("0");
                }
              }}
            />
          </label>
          <label className={styles.numberField}>
            <span>Bartering Level</span>
            <input
              aria-label="Bartering Level"
              type="number"
              min={0}
              max={100}
              value={barteringLevelDraft}
              placeholder="0"
              onChange={(event) => {
                setBarteringLevelDraft(event.target.value);
              }}
              onBlur={() => {
                commitBarteringLevel(barteringLevelDraft);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitBarteringLevel(barteringLevelDraft);
                }
              }}
            />
          </label>
          <label className={styles.numberField}>
            <span>Min Vol</span>
            <input
              aria-label="Minimum stable volume"
              type="number"
              min={0}
              value={minVolumeDraft}
              placeholder="0"
              onChange={(event) => {
                const rawValue = event.target.value;
                setMinVolumeDraft(rawValue);
                if (rawValue === "") return;
                setMinVolume(Math.max(0, Number(rawValue) || 0));
              }}
              onBlur={() => {
                if (minVolumeDraft === "") {
                  setMinVolume(0);
                  setMinVolumeDraft("0");
                }
              }}
            />
          </label>
          <div className={styles.saleModeField}>
            <span>Sell mode</span>
            <div className={styles.segmentGroup} role="group" aria-label="Skill profit sell mode">
              {SALE_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  aria-pressed={(settings.saleMode || "best") === option.value}
                  className={`${styles.segmentButton} ${(settings.saleMode || "best") === option.value ? styles.segmentActive : ""}`}
                  onClick={() => patchSettings({ saleMode: option.value })}
                  title={option.hint}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.toggleRow} aria-label="Skill profit route toggles">
          <button
            className={`${styles.toggle} ${effectiveSettings.membership ? styles.toggleActive : ""}`}
            onClick={() => patchSettings({ membership: !effectiveSettings.membership })}
            type="button"
          >
            {effectiveSettings.membership && <Check size={14} />} Member
          </button>
          <button
            className={`${styles.toggle} ${(configuredProfile ? effectiveSettings.profileClassName : effectiveSettings.classBonus) ? styles.toggleActive : ""}`}
            onClick={() => {
              if (!configuredProfile) patchSettings({ classBonus: !effectiveSettings.classBonus });
            }}
            disabled={Boolean(configuredProfile)}
            title={configuredProfile ? `Using ${configuredProfile.className} from active profile` : "Fallback class helper when no profile is active"}
            type="button"
          >
            {(configuredProfile ? effectiveSettings.profileClassName : effectiveSettings.classBonus) && <Check size={14} />} {configuredProfile ? configuredProfile.className : "Class"}
          </button>
          <button
            aria-pressed={hideAboveLevel}
            className={`${styles.toggle} ${hideAboveLevel ? styles.toggleActive : ""}`}
            disabled={!hasProfileSkills}
            onClick={() => setHideAboveLevel((current) => !current)}
            title={hasProfileSkills
              ? (activeSkillLevel !== null
                ? `Only show ${activeSkill} routes requiring Lv ${activeSkillLevel} or below`
                : "Only show routes requiring a skill level your character has reached")
              : configuredProfile
                ? "No skill levels recorded on this profile. Import character data to filter routes."
                : "Import or select a character profile to filter routes by skill level"}
            type="button"
          >
            {hideAboveLevel && <Check size={14} />} {activeSkillLevel !== null ? `Within Lv ${activeSkillLevel}` : "Within level"}
          </button>
          <div className={`${styles.taxPill} ${effectiveSettings.membership ? styles.taxMember : ""}`}>
            {effectiveSettings.membership ? "12% tax" : "15% tax"}
          </div>
          <button
            aria-pressed={includeForgeInfoRows}
            className={`${styles.toggle} ${includeForgeInfoRows ? styles.toggleActive : ""}`}
            onClick={() => setIncludeForgeInfoRows((current) => !current)}
            title="Show Forge informational recipes in the All results table. The Forge tab always stays available."
            type="button"
          >
            {includeForgeInfoRows && <Check size={14} />} Forge rows
          </button>
        </div>
        <div className={styles.commandStatus} aria-live="polite">
          <div className={styles.commandStat}>
            <span>Showing</span>
            <strong>{rowModel.filtered.length.toLocaleString()} / {rows.length.toLocaleString()}</strong>
          </div>
          <div className={styles.commandStat}>
            <span>Liquid</span>
            <strong>{liquidRouteCount.toLocaleString()} routes</strong>
          </div>
          <div className={`${styles.commandStat} ${needsPriceCount > 0 ? styles.commandStatWarning : ""}`}>
            <span>Needs data</span>
            <strong>{needsPriceCount > 0 ? `${needsPriceCount.toLocaleString()} routes` : "Clear"}</strong>
          </div>
          <label className={styles.commandStat} style={{ cursor: "pointer" }}>
            <span>Sort</span>
            <select
              aria-label="Sort routes"
              value={`${sortKey}:${sortDesc ? "desc" : "asc"}`}
              onChange={(event) => {
                const [key, dir] = event.target.value.split(":") as [SkillProfitSortKey, "asc" | "desc"];
                setSortKey(key);
                setSortDesc(dir === "desc");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-main)",
                font: "inherit",
                fontSize: "0.82rem",
                fontWeight: 700,
                padding: 0,
                margin: 0,
                height: "auto",
                cursor: "pointer",
                width: "100%",
                outline: "none",
              }}
            >
              <option value="profitPerHour:desc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Gold/Hr (high to low)</option>
              <option value="profitPerHour:asc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Gold/Hr (low to high)</option>
              <option value="profitEach:desc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Profit/Piece (high to low)</option>
              <option value="profitEach:asc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Profit/Piece (low to high)</option>
              <option value="inputCost:asc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Cost (low to high)</option>
              <option value="inputCost:desc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Cost (high to low)</option>
              <option value="volume3d:desc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Volume (high to low)</option>
              <option value="volume3d:asc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Volume (low to high)</option>
              <option value="level:asc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Level (low to high)</option>
              <option value="level:desc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Level (high to low)</option>
              <option value="name:asc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Item Name (A-Z)</option>
              <option value="name:desc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Item Name (Z-A)</option>
              <option value="skill:asc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Skill (A-Z)</option>
              <option value="skill:desc" style={{ background: "var(--bg-panel)", color: "var(--text-main)" }}>Skill (Z-A)</option>
            </select>
          </label>
          <button
            className={styles.resetFilters}
            disabled={routeFilterCount === 0}
            onClick={resetRouteFilters}
            type="button"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </section>

      <section className={styles.mobileSetupSummary} aria-label="Profile and buff setup summary">
        <div>
          <strong>Profile and buffs</strong>
          <span>
            {configuredProfile ? `${configuredProfile.name || "Active profile"} synced` : "Global fallback"}
            {" - "}
            {activeEssenceCount > 0 ? `${activeEssenceCount} essence${activeEssenceCount === 1 ? "" : "s"}` : "No essences"}
            {" - "}
            {selectedBuffs.length}/5 ascension
          </span>
        </div>
        <button
          type="button"
          aria-expanded={mobileSetupOpen}
          onClick={() => setMobileSetupOpen((open) => !open)}
        >
          {mobileSetupOpen ? "Hide setup" : "Edit setup"}
          <ChevronDown size={16} className={mobileSetupOpen ? styles.chevronOpen : ""} />
        </button>
      </section>

      <div className={styles.setupGrid}>
        <section className={`${styles.toolPanel} ${activeDropdownLayer === "tools" ? styles.dropdownLayerActive : ""}`}>
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
                  onOpenChange={handleToolPickerOpenChange}
                />
                <small>
                  {selectedTool ? (
                    <>
                      Lvl {selectedTool.level} - <QualityText value={selectedTool.quality}>{selectedTool.quality}</QualityText>
                    </>
                  ) : configuredProfile
                      ? "No tool selected"
                      : "No tool bonus"}
                  {configuredProfile ? " - synced with profile" : " - global fallback"}
                </small>
              </div>
            );
          })}
        </section>

        <section className={`${styles.essencePanel} ${activeDropdownLayer === "essences" ? styles.dropdownLayerActive : ""}`}>
          <button className={styles.essenceHeader} onClick={() => setEssenceOpen((open) => !open)} type="button">
            <span><Sparkles size={16} /> Essences</span>
            <span>
              {activeEssenceCount > 0 ? `${activeEssenceCount}/5 active` : "No essence"}
              <ChevronDown size={16} className={essenceOpen ? styles.chevronOpen : ""} />
            </span>
          </button>
          {essenceOpen && (
            <div className={styles.essenceGrid}>
              {SUPPORTED_ESSENCE_SKILLS.map((skill) => {
                const selectedName = settings.essenceBySkill?.[skill] || "";
                const session = essenceSessionsBySkill[skill];
                const actionHours = idleActionHoursBySkill[skill] || baseIdleActionHours;
                return (
                  <div className={styles.essenceField} key={skill}>
                    <span>{skill}</span>
                    <EssencePicker
                      label={`${skill} essence`}
                      options={getEssenceOptionsForSkill(skill, allItemsDb, marketData, preferences.customPrices)}
                      value={selectedName}
                      onChange={(essenceName) => patchEssence(skill, essenceName)}
                      onOpenChange={handleEssencePickerOpenChange}
                    />
                    <small>
                      {session?.active
                        ? session.needsPrice
                          ? "Needs price/data"
                          : `${formatGold(session.costPerStart)}g per start - ${formatGold(session.costPerHour || 0)}g/hr`
                        : `No essence - ${formatHours(actionHours)} timer`}
                    </small>
                  </div>
                );
              })}
            </div>
          )}
          <p className={styles.essenceNote}>
            {(configuredProfile
              ? `Cost is counted once per idle start. The timer is ${formatHours(baseIdleActionHours)} base${hasAnyLocationLimitedHousing ? "; location-limited housing time is not added on this page." : ", plus housing time when it is available anywhere."}`
              : "No active profile is loaded, so essence costs use an 8h fallback timer.")}
            {" "}Dungeon, combat, hunting, and world boss potions are future support.
          </p>
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
                  disabled={!buff}
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
      </div>
    </>
  );
}
