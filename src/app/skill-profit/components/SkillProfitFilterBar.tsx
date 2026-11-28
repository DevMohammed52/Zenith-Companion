"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Button,
  Drawer,
  Icon,
  NumberInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SearchInput,
  SegmentedControl,
  Select,
  Switch,
  Tag,
} from "@/components/ui";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import { formatHours } from "@/lib/housing";
import { getEssenceOptionsForSkill, SUPPORTED_ESSENCE_SKILLS } from "@/lib/essences";
import {
  ASCENSION_BUFFS,
  SKILL_TOOLS,
  type AssaultRank,
  type SaleMode,
  type SkillProfitSortKey,
  type ToolSkill,
} from "@/lib/skill-profit";
import styles from "../page.module.css";
import { EssencePicker, OptionPicker, ToolPicker } from "./SkillProfitControls";
import {
  CONQUEST_PICKER_OPTIONS,
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  SALE_MODE_OPTIONS,
  type RateMode,
  type UseSkillProfitCalculationsReturn,
  type UseSkillProfitStateReturn,
  type ViewMode,
} from "../types";

export interface SkillProfitFilterBarProps {
  state: UseSkillProfitStateReturn;
  calc: UseSkillProfitCalculationsReturn;
}

const TOOL_FALLBACK_ICONS: Record<ToolSkill, "skillWoodcutting" | "skillMining" | "skillFishing"> = {
  Woodcutting: "skillWoodcutting",
  Mining: "skillMining",
  Fishing: "skillFishing",
};

const SORT_SELECT_OPTIONS = [
  { value: "profitPerHour:desc", label: "Gold/hr (high–low)" },
  { value: "profitPerHour:asc", label: "Gold/hr (low–high)" },
  { value: "expPerHour:desc", label: "EXP/hr (high–low)" },
  { value: "profitEach:desc", label: "Profit/ea (high–low)" },
  { value: "inputCost:asc", label: "Cost (low–high)" },
  { value: "volume3d:desc", label: "3d Volume (high–low)" },
  { value: "level:asc", label: "Level (low–high)" },
  { value: "level:desc", label: "Level (high–low)" },
  { value: "name:asc", label: "Item Name (A–Z)" },
  { value: "skill:asc", label: "Skill (A–Z)" },
];

export function SkillProfitFilterBar({ state, calc }: SkillProfitFilterBarProps) {
  const {
    searchTerm,
    setSearchTerm,
    deferredSearchTerm,
    settings,
    patchSettings,
    minVolume,
    setMinVolume,
    hideAboveLevel,
    setHideAboveLevel,
    liquidOnly,
    setLiquidOnly,
    profitableOnly,
    setProfitableOnly,
    rateMode,
    setRateMode,
    viewMode,
    setViewMode,
    drawerOpen,
    setDrawerOpen,
    sortKey,
    setSortKey,
    sortDesc,
    setSortDesc,
    resetRouteFilters,
    barteringLevelDraft,
    commitBarteringLevel,
    handleToolPickerOpenChange,
    handleEssencePickerOpenChange,
    handleCommandPickerOpenChange,
    patchTool,
    patchEssence,
    toggleAscension,
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
    idleActionHoursBySkill,
    baseIdleActionHours,
    hasAnyLocationLimitedHousing,
    housingSummary,
    essenceSessionsBySkill,
    allItemsDb,
    marketData,
  } = calc;

  const activeFilterCount = [
    deferredSearchTerm.trim().length > 0,
    activeSkill !== "All",
    minVolume !== DEFAULT_STATE.minVolume,
    hideAboveLevel,
    liquidOnly,
    profitableOnly,
    sortKey !== DEFAULT_STATE.sortKey || sortDesc !== DEFAULT_STATE.sortDesc,
    (settings.saleMode || "best") !== DEFAULT_SETTINGS.saleMode,
  ].filter(Boolean).length;

  const selectedBuffs = useMemo(
    () =>
      settings.ascensionBuffIds
        .map((id) => ASCENSION_BUFFS.find((buff) => buff.id === id))
        .filter((buff): buff is (typeof ASCENSION_BUFFS)[number] => Boolean(buff)),
    [settings.ascensionBuffIds],
  );

  const groupedBuffs = useMemo(
    () => ({
      Eff: ASCENSION_BUFFS.filter((buff) => buff.type === "Eff"),
      Exp: ASCENSION_BUFFS.filter((buff) => buff.type === "Exp"),
    }),
    [],
  );

  return (
    <>
      <section className={styles.toolbarPanel} aria-label="Skill profit filters and view controls">
        <div className={styles.toolbarPrimaryRow}>
          <div className={styles.searchWrap}>
            <SearchInput
              id="skill-profit-search"
              ariaLabel="Search skill profit items"
              placeholder="Search item, skill, or material..."
              value={searchTerm}
              onChange={setSearchTerm}
              showShortcutHint={false}
            />
          </div>

          <SegmentedControl<SaleMode>
            ariaLabel="Sell mode"
            value={(settings.saleMode || "best") as SaleMode}
            onChange={(value) => patchSettings({ saleMode: value })}
            options={SALE_MODE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <SegmentedControl<RateMode>
            ariaLabel="Rate display mode"
            value={rateMode}
            onChange={setRateMode}
            options={[
              { value: "hourly", label: "Hourly" },
              { value: "session", label: "Session" },
            ]}
          />

          <div className={styles.sortSelectWrap}>
            <Select
              ariaLabel="Sort routes"
              options={SORT_SELECT_OPTIONS}
              value={`${sortKey}:${sortDesc ? "desc" : "asc"}`}
              onChange={(combined) => {
                const [key, dir] = combined.split(":") as [SkillProfitSortKey, "asc" | "desc"];
                setSortKey(key);
                setSortDesc(dir === "desc");
              }}
            />
          </div>

          <div className={styles.viewModeWrap}>
            <SegmentedControl<ViewMode>
              ariaLabel="Result layout"
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "table", label: "Table" },
                { value: "cards", label: "Cards" },
              ]}
            />
          </div>
        </div>

        <div className={styles.toolbarSecondaryRow}>
          <div className={styles.quickFilters} aria-label="Quick route filters">
            <Tag
              label="Liquid only"
              selected={liquidOnly}
              onSelect={() => setLiquidOnly((v) => !v)}
            />
            <Tag
              label="Profitable"
              selected={profitableOnly}
              onSelect={() => setProfitableOnly((v) => !v)}
            />
            {hasProfileSkills && (
              <Tag
                label={activeSkillLevel !== null ? `My level (≤ Lv ${activeSkillLevel})` : "My level"}
                selected={hideAboveLevel}
                onSelect={() => setHideAboveLevel((v) => !v)}
              />
            )}

            <Popover placement="bottom-start">
              <PopoverTrigger>
                <Button variant="ghost" size="sm" icon={<Icon name="filter" size="xs" aria-hidden="true" />}>
                  Min Vol: {minVolume.toLocaleString()}
                </Button>
              </PopoverTrigger>
              <PopoverContent ariaLabel="Minimum 3-day market volume filter">
                <div className={styles.popoverBody}>
                  <p className={styles.popoverHeading}>Minimum 3-day Volume</p>
                  <NumberInput
                    label="Volume threshold"
                    min={0}
                    max={100000}
                    step={50}
                    value={minVolume}
                    onChange={(nextVal) => setMinVolume(Math.max(0, nextVal))}
                    showSteppers
                  />
                  <div className={styles.popoverPresets}>
                    {[0, 100, 300, 1000].map((preset) => (
                      <Tag
                        key={preset}
                        label={preset === 0 ? "Any" : `${preset.toLocaleString()}+`}
                        selected={minVolume === preset}
                        onSelect={() => setMinVolume(preset)}
                      />
                    ))}
                  </div>
                  <p className={styles.popoverHint}>
                    Applies to &ldquo;Liquid only&rdquo; and chooses the Best Route recommendation.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className={styles.toolbarRightMeta}>
            <span className={styles.statusCount} aria-live="polite">
              {rowModel.filtered.length.toLocaleString()} of {rows.length.toLocaleString()} routes
            </span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="undo" size="xs" aria-hidden="true" />}
                onClick={resetRouteFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="right"
        title="Loadout & Boosts"
        description="Configure character buffs, gathering tools, essence crystals, and ascension perks."
        className={styles.loadoutDrawer}
      >
        <div className={styles.drawerBody}>
          <div className={styles.drawerSyncRow}>
            <span>
              {configuredProfile
                ? `Synced with ${configuredProfile.name || "active profile"}`
                : "Using global fallback settings"}
            </span>
            <Link href="/profiles" className={styles.profileJumpLink} onClick={() => setDrawerOpen(false)}>
              <span>{configuredProfile ? "Edit profile" : "Load a profile"}</span>
              <Icon name="arrowRight" size="xs" aria-hidden="true" />
            </Link>
          </div>

          <section className={styles.drawerSection} aria-label="Character and exchange modifiers">
            <h3 className={styles.drawerSectionTitle}>
              <Icon name="membership" size="sm" aria-hidden="true" />
              <span>Character &amp; Market</span>
            </h3>

            <Switch
              label="IdleMMO Membership"
              description="12% market tax (vs 15%), +10% efficiency, +15% EXP"
              checked={Boolean(effectiveSettings.membership)}
              onChange={(event) => patchSettings({ membership: event.target.checked })}
            />

            <Switch
              label={configuredProfile ? `Class: ${configuredProfile.className}` : "Class Bonus (+10% matching skill)"}
              description={configuredProfile ? "Synced automatically from your active character" : "Fallback class efficiency when no profile is active"}
              checked={Boolean(configuredProfile ? effectiveSettings.profileClassName : effectiveSettings.classBonus)}
              disabled={Boolean(configuredProfile)}
              onChange={(event) => {
                if (!configuredProfile) patchSettings({ classBonus: event.target.checked });
              }}
            />

            <div className={styles.drawerField}>
              <span className={styles.drawerFieldLabel}>Guild Conquest Rank</span>
              <OptionPicker
                ariaLabel="Guild Conquest rank"
                options={CONQUEST_PICKER_OPTIONS}
                value={effectiveSettings.assaultRank}
                onChange={(value) => patchSettings({ assaultRank: value as AssaultRank })}
                onOpenChange={handleCommandPickerOpenChange}
              />
            </div>

            <div className={styles.drawerTwoCol}>
              <NumberInput
                label="Pool EXP %"
                min={0}
                max={15}
                step={1}
                value={settings.energizingPoolExp}
                onChange={(val) => patchSettings({ energizingPoolExp: Math.min(15, Math.max(0, val)) })}
                helperText="Energizing pool (0–15%)"
                showSteppers
              />
              <NumberInput
                label="Bartering Lv"
                min={0}
                max={100}
                step={1}
                value={Number(barteringLevelDraft) || 0}
                onChange={(val) => commitBarteringLevel(String(Math.min(100, Math.max(0, val))))}
                helperText={`+${Math.round((Number(barteringLevelDraft) || 0) * 0.2)}% vendor bonus (+0.2%/lv)`}
                showSteppers
              />
            </div>
          </section>

          <section className={styles.drawerSection} aria-label="Gathering tools">
            <h3 className={styles.drawerSectionTitle}>
              <Icon name="craftTool" size="sm" aria-hidden="true" />
              <span>Gathering Tools</span>
            </h3>
            <div className={styles.pickerList}>
              {(["Woodcutting", "Mining", "Fishing"] as ToolSkill[]).map((skill) => {
                const toolValue = effectiveToolSelections[skill] || "";
                const selectedTool = SKILL_TOOLS[skill].find(
                  (tool) => tool.name.toLowerCase() === toolValue.trim().toLowerCase(),
                );
                return (
                  <div className={styles.drawerField} key={skill}>
                    <span className={styles.drawerFieldLabel}>{skill} tool</span>
                    <ToolPicker
                      ariaLabel={`${skill} tool`}
                      allItemsDb={allItemsDb as Record<string, any> | null}
                      options={SKILL_TOOLS[skill]}
                      value={toolValue}
                      onChange={(toolName) => patchTool(skill, toolName)}
                      onOpenChange={handleToolPickerOpenChange}
                      fallbackIcon={TOOL_FALLBACK_ICONS[skill]}
                    />
                    <span className={styles.drawerFieldHint}>
                      {selectedTool ? (
                        <>
                          Lv {selectedTool.level} |{" "}
                          <QualityText value={selectedTool.quality}>{selectedTool.quality}</QualityText>
                        </>
                      ) : (
                        "No tool bonus"
                      )}
                      {configuredProfile ? " | synced with profile" : " | global fallback"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.drawerSection} aria-label="Essence crystals">
            <h3 className={styles.drawerSectionTitle}>
              <Icon name="mythicAlchemy" size="sm" aria-hidden="true" />
              <span>Essence Crystals</span>
            </h3>
            <p className={styles.drawerFieldHint}>
              {configuredProfile
                ? `1 crystal per start (${formatHours(baseIdleActionHours)} base${hasAnyLocationLimitedHousing ? `, +house at ${housingSummary.location || "house"}` : " + global house"}).`
                : "Amortizes over an 8h base idle window when no profile is active."}
            </p>
            <div className={styles.pickerList}>
              {SUPPORTED_ESSENCE_SKILLS.map((skill) => {
                const selectedName = settings.essenceBySkill?.[skill] || "";
                const session = essenceSessionsBySkill[skill];
                const actionHours = idleActionHoursBySkill[skill] || baseIdleActionHours;
                return (
                  <div className={styles.drawerField} key={skill}>
                    <span className={styles.drawerFieldLabel}>{skill}</span>
                    <EssencePicker
                      allItemsDb={allItemsDb as Record<string, any> | null}
                      label={`${skill} essence`}
                      options={getEssenceOptionsForSkill(skill, allItemsDb, marketData, preferences.customPrices)}
                      value={selectedName}
                      onChange={(essenceName) => patchEssence(skill, essenceName)}
                      onOpenChange={handleEssencePickerOpenChange}
                    />
                    <span className={styles.drawerFieldHint}>
                      {session?.active
                        ? session.needsPrice
                          ? "Needs market or custom price"
                          : `${formatGold(session.costPerStart)}g/start | ${formatGold(session.costPerHour || 0)}g/hr`
                        : `No crystal | ${formatHours(actionHours)} timer`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.drawerSection} aria-label="Ascension perks">
            <div className={styles.buffGroupHeader}>
              <h3 className={styles.drawerSectionTitle}>
                <Icon name="xp" size="sm" aria-hidden="true" />
                <span>Ascension Perks ({selectedBuffs.length}/5)</span>
              </h3>
              {selectedBuffs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => patchSettings({ ascensionBuffIds: [] })}>
                  Clear all
                </Button>
              )}
            </div>

            {selectedBuffs.length > 0 && (
              <div className={styles.buffActiveSummary}>
                {selectedBuffs.map((buff) => (
                  <Tag
                    key={buff.id}
                    label={`${buff.label.replace("Lvl ", "L")} +${buff.value}% ${buff.type}`}
                    selected
                    onRemove={() => toggleAscension(buff.id)}
                    removeAriaLabel={`Remove ${buff.label}`}
                  />
                ))}
              </div>
            )}

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
                          aria-pressed={selected}
                          className={`${styles.buffButton} ${selected ? styles.buffSelected : ""}`}
                          disabled={disabled}
                          onClick={() => toggleAscension(buff.id)}
                          type="button"
                        >
                          <span>{buff.label.replace("Lvl ", "L")}</span>
                          <strong>+{buff.value}%</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Drawer>
    </>
  );
}
