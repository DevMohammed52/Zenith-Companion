"use client";

import React from "react";
import {
  Button,
  EmptyState,
  SearchInput,
  SegmentedControl,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import {
  SLOT_FILTERS,
  SLOT_ICON_NAMES,
  SORT_OPTIONS,
  formatCompactGold,
  slotLabel,
  type GearType,
  type SortKey,
} from "../types";
import type { TierMode } from "../utils/bis-math";
import type { UseBisStateResult } from "../hooks/useBisState";
import styles from "../page.module.css";

interface BisTableTabProps {
  state: UseBisStateResult;
}

const WEAPON_SLOTS = new Set<GearType>(["SWORD", "DAGGER", "BOW"]);

function formatPrimaryReq(requirements: Record<string, number | null> | null | undefined, fallbackLv: number) {
  if (!requirements) return `Lv ${fallbackLv}`;
  const combat = Number(requirements.combat || 0);
  const str = Number(requirements.strength || 0);
  const dex = Number(requirements.dexterity || 0);
  const def = Number(requirements.defence || 0);
  const parts: string[] = [];
  if (combat > 0) parts.push(`Lv ${combat}`);
  if (str > 0) parts.push(`Str ${str}`);
  if (dex > 0) parts.push(`Dex ${dex}`);
  if (def > 0) parts.push(`Def ${def}`);
  return parts.length > 0 ? parts.join(" / ") : `Lv ${fallbackLv}`;
}

export function BisTableTab({ state }: BisTableTabProps) {
  const isWeapon = WEAPON_SLOTS.has(state.slotFilter);
  const slotTabs = SLOT_FILTERS.filter((opt): opt is { id: GearType; label: string } => opt.id !== "ALL");

  return (
    <>
      {/* 9-Slot Horizontal Bar */}
      <div className={styles.slotTabsRow} role="group" aria-label="Equipment slot">
        {slotTabs.map((opt) => {
          const isActive = state.slotFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`${styles.slotTabBtn} ${isActive ? styles.slotTabBtnActive : ""}`}
              aria-pressed={isActive}
              onClick={() => state.changeSlotTab(opt.id)}
            >
              <Icon name={SLOT_ICON_NAMES[opt.id]} size="sm" aria-hidden="true" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Compact Single Toolbar */}
      <section className={styles.tableToolbar} aria-label="Gear table filters">
        <SearchInput
          ref={state.searchInputRef}
          value={state.search}
          onChange={state.setSearch}
          onClear={() => state.setSearch("")}
          placeholder={`Search ${slotLabel(state.slotFilter).toLowerCase()}s, rarity, or stat...`}
          ariaLabel={`Search ${slotLabel(state.slotFilter)} catalog`}
          showShortcutHint={false}
        />

        <SegmentedControl
          value={state.tierMode}
          onChange={(val) => state.setTierMode(val as TierMode)}
          options={[
            { value: "base", label: "T1 Base" },
            { value: "optimal", label: "Optimal" },
            { value: "max", label: "Max Tier" },
          ]}
          ariaLabel="Tier level shown"
        />

        <Select
          aria-label="Sort gear"
          value={state.sortKey}
          onChange={(val) => {
            const key = val as SortKey;
            state.setSortKey(key);
            if (key === "stats" || key === "quality") state.setDirection("desc");
            if (key === "level" || key === "price" || key === "name") state.setDirection("asc");
          }}
          options={SORT_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
        />

        <Button
          variant="secondary"
          size="sm"
          className={styles.sortDirBtn}
          aria-label={`Sort ${state.direction === "asc" ? "ascending" : "descending"}`}
          onClick={() => state.setDirection((d) => (d === "asc" ? "desc" : "asc"))}
        >
          <Icon name={state.direction === "asc" ? "sortAsc" : "sortDesc"} size="sm" aria-hidden="true" />
        </Button>

        <Tag
          label={`Usable (Lv ${state.levels.combat})`}
          selected={state.usableOnly}
          onSelect={() => state.setUsableOnly((v) => !v)}
        />
      </section>

      {state.slotGearRows.length === 0 ? (
        <EmptyState
          variant="search-empty"
          title={`No ${slotLabel(state.slotFilter).toLowerCase()}s match`}
          description="Clear your search text or show locked items above your current level."
          action={{
            label: "Reset Filters",
            onClick: () => {
              state.setSearch("");
              state.setUsableOnly(false);
            },
          }}
        />
      ) : (
        <>
          {/* Clean Scannable Desktop Table */}
          <div className={styles.desktopTableWrap}>
            <TableContainer>
              <Table aria-label={`${slotLabel(state.slotFilter)} comparison table`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equip</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead align="right">Tier</TableHead>
                    <TableHead align="right">Cost</TableHead>
                    <TableHead align="right">Agi</TableHead>
                    <TableHead align="right">Acc</TableHead>
                    <TableHead align="right">{isWeapon ? "AP" : "Prot"}</TableHead>
                    {isWeapon && <TableHead align="right">Crit %</TableHead>}
                    {isWeapon && <TableHead align="right">Crit Dmg</TableHead>}
                    <TableHead align="right">Total</TableHead>
                    <TableHead align="right">Gold / Stat</TableHead>
                    <TableHead align="right">Req.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.slotGearRows.map((row) => {
                    const { view } = row;
                    const agi = Number(view.stats.agility || 0);
                    const acc = Number(view.stats.accuracy || 0);
                    const mainVal = isWeapon
                      ? Number(view.stats.attack_power || 0)
                      : Number(view.stats.protection || 0);
                    const critChance = Number(view.stats.critical_chance || 0);
                    const critDmg = Number(view.stats.critical_damage || 0);
                    const displayCost =
                      state.tierMode === "base"
                        ? view.priceLabel === "Market"
                          ? view.price
                          : null
                        : row.totalBuildCost;

                    return (
                      <TableRow
                        key={view.item.hashed_id}
                        className={styles.tableRowInteractive}
                        onClick={() => state.openCompareFor(view.item, view.effectiveTier)}
                        onMouseEnter={() => state.prefetchGearItem(view.item.name)}
                      >
                        <TableCell>
                          <button
                            type="button"
                            className={`${styles.equipBtn} ${row.isEquipped ? styles.equipBtnActive : ""}`}
                            aria-label={
                              row.isEquipped
                                ? `${view.item.name} is equipped`
                                : `Equip ${view.item.name} to profile`
                            }
                            aria-pressed={row.isEquipped}
                            onClick={(e) => {
                              e.stopPropagation();
                              state.toggleEquipFromTable(view.item, view.effectiveTier);
                            }}
                          >
                            <Icon name={row.isEquipped ? "check" : "plus"} size="sm" aria-hidden="true" />
                          </button>
                        </TableCell>

                        <TableCell>
                          <div className={styles.itemCell}>
                            <GameImage
                              src={view.item.image_url}
                              alt=""
                              width={34}
                              height={34}
                              className={styles.itemThumb}
                            />
                            <div className={styles.itemNameBlock}>
                              <div className={styles.itemNameRow}>
                                <QualityText value={view.item.quality} className={styles.itemNameText}>
                                  {view.item.name}
                                </QualityText>
                                {row.overallRank <= 3 && (
                                  <span className={`${styles.bisPill} ${row.overallRank === 1 ? styles.bisPillGold : ""}`}>
                                    BiS #{row.overallRank}
                                  </span>
                                )}
                                {row.overallRank > 3 && row.qualityRank === 1 && (
                                  <span className={styles.bisPill}>
                                    {String(view.item.quality).slice(0, 3)} #1
                                  </span>
                                )}
                              </div>
                              {row.isEquipped && (
                                <span className={styles.equippedTag}>
                                  Equipped T{row.equippedTier}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell align="right">
                          <span className={view.effectiveTier > 1 ? styles.totalStatCell : styles.mutedCell}>
                            T{view.effectiveTier}
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          {displayCost ? (
                            <span className={styles.goldCell}>
                              <GoldIcon size={12} />
                              {formatCompactGold(displayCost)}
                            </span>
                          ) : (
                            <span className={styles.mutedCell}>-</span>
                          )}
                        </TableCell>

                        <TableCell align="right">{agi || "-"}</TableCell>
                        <TableCell align="right">{acc || "-"}</TableCell>
                        <TableCell align="right">{mainVal || "-"}</TableCell>

                        {isWeapon && (
                          <>
                            <TableCell align="right">
                              {critChance > 0 ? `${critChance}%` : "-"}
                            </TableCell>
                            <TableCell align="right">
                              {critDmg > 0 ? critDmg.toLocaleString() : "-"}
                            </TableCell>
                          </>
                        )}

                        <TableCell align="right" className={styles.totalStatCell}>
                          {view.statTotal.toLocaleString()}
                        </TableCell>

                        <TableCell align="right">
                          {row.goldPerStat !== null ? (
                            formatCompactGold(row.goldPerStat)
                          ) : (
                            <span className={styles.mutedCell}>-</span>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <span className={view.eligible ? styles.reqMet : styles.reqLocked}>
                            {formatPrimaryReq(view.item.requirements, view.requirementLevel)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Mobile Responsive Card List (< 768px) */}
          <div className={styles.mobileCardList} aria-label={`${slotLabel(state.slotFilter)} mobile list`}>
            {state.slotGearRows.map((row) => {
              const { view } = row;
              const mainStatLabel = isWeapon ? "AP" : "Prot";
              const mainStatVal = isWeapon
                ? Number(view.stats.attack_power || 0)
                : Number(view.stats.protection || 0);
              const displayCost =
                state.tierMode === "base"
                  ? view.priceLabel === "Market"
                    ? view.price
                    : null
                  : row.totalBuildCost;

              return (
                <article key={view.item.hashed_id} className={styles.mobileCard}>
                  <div className={styles.mobileCardTop}>
                    <button
                      type="button"
                      className={styles.mobileCardBtn}
                      onClick={() => state.openCompareFor(view.item, view.effectiveTier)}
                    >
                      <GameImage
                        src={view.item.image_url}
                        alt=""
                        width={36}
                        height={36}
                        className={styles.itemThumb}
                      />
                      <span className={styles.itemNameBlock}>
                        <span className={styles.itemNameRow}>
                          <QualityText value={view.item.quality} className={styles.itemNameText}>
                            {view.item.name}
                          </QualityText>
                          {row.overallRank <= 3 && (
                            <span className={`${styles.bisPill} ${row.overallRank === 1 ? styles.bisPillGold : ""}`}>
                              BiS #{row.overallRank}
                            </span>
                          )}
                        </span>
                        <span className={view.eligible ? styles.reqMet : styles.reqLocked}>
                          T{view.effectiveTier} | {formatPrimaryReq(view.item.requirements, view.requirementLevel)}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.equipBtn} ${row.isEquipped ? styles.equipBtnActive : ""}`}
                      aria-label={`Equip ${view.item.name}`}
                      onClick={() => state.toggleEquipFromTable(view.item, view.effectiveTier)}
                    >
                      <Icon name={row.isEquipped ? "check" : "plus"} size="sm" aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.mobileCardStats}>
                    <div className={styles.mobileStatBox}>
                      <span>{mainStatLabel}</span>
                      <strong>{mainStatVal}</strong>
                    </div>
                    <div className={styles.mobileStatBox}>
                      <span>Total</span>
                      <strong className={styles.totalStatCell}>{view.statTotal}</strong>
                    </div>
                    <div className={styles.mobileStatBox}>
                      <span>Cost</span>
                      <strong>{displayCost ? formatCompactGold(displayCost) : "-"}</strong>
                    </div>
                    <div className={styles.mobileStatBox}>
                      <span>Gold/Stat</span>
                      <strong>{row.goldPerStat !== null ? formatCompactGold(row.goldPerStat) : "-"}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
