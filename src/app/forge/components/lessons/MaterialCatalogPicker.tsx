"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  Pagination,
  SearchInput,
  SegmentedControl,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  type BadgeVariant,
  type ItemRarity,
} from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import { useItemModal } from "@/context/ItemModalContext";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import {
  FORGE_LESSON_CATEGORIES,
  FORGE_LESSON_SORTS,
  type ForgeLessonCategory,
  type ForgeLessonSort,
} from "../../types";
import { MaterialCard } from "./MaterialCard";
import styles from "../../Forge.module.css";

const QUALITY_OPTIONS: Array<{ value: string; label: string; rarity?: ItemRarity }> = [
  { value: "ALL", label: "All tiers" },
  { value: "STANDARD", label: "Standard", rarity: "standard" },
  { value: "REFINED", label: "Refined", rarity: "refined" },
  { value: "PREMIUM", label: "Premium", rarity: "premium" },
  { value: "EPIC", label: "Epic", rarity: "epic" },
  { value: "LEGENDARY", label: "Legendary", rarity: "legendary" },
  { value: "MYTHIC", label: "Mythic", rarity: "mythic" },
];

const PAGE_SIZE = 20;

function useSafeItemModal() {
  try {
    return useItemModal();
  } catch {
    return { openItemByName: () => {}, prefetchItem: () => {} };
  }
}

export function MaterialCatalogPicker({
  lessons,
}: {
  lessons: UseForgeLessonsReturn;
  onOpenQueueTab?: () => void;
}) {
  const { openItemByName, prefetchItem } = useSafeItemModal();
  const {
    categoryFilter,
    setCategoryFilter,
    qualityFilter,
    setQualityFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    showExpPerItem,
    setShowExpPerItem,
    visibleMaterials,
    allCalculatedMaterials,
    addToQueue,
    fillSessionWithMaterial,
    lessonQueue,
    ownedMaterials,
    forgeLevel,
  } = lessons;

  const [usableOnly, setUsableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zenith_forge_catalog_view");
      if (saved === "table" || saved === "cards") {
        setViewMode(saved);
      } else if (saved === "list") {
        setViewMode("table");
      }
    }
  }, []);

  const handleSetViewMode = (mode: "table" | "cards") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("zenith_forge_catalog_view", mode);
      } catch {}
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, qualityFilter, usableOnly, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allCalculatedMaterials.length, ORES: 0, BARS: 0, LOGS: 0, MOB_DROPS: 0 };
    for (const m of allCalculatedMaterials) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, [allCalculatedMaterials]);

  const usableCount = useMemo(() => {
    return allCalculatedMaterials.filter((m) => m.reqLvl <= forgeLevel && !m.hasPenalty).length;
  }, [allCalculatedMaterials, forgeLevel]);

  const displayMaterials = useMemo(() => {
    if (!usableOnly) return visibleMaterials;
    return visibleMaterials.filter((m) => m.reqLvl <= forgeLevel && !m.hasPenalty);
  }, [visibleMaterials, usableOnly, forgeLevel]);

  const totalPages = Math.max(1, Math.ceil(displayMaterials.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMaterials = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return displayMaterials.slice(start, start + PAGE_SIZE);
  }, [displayMaterials, safePage]);

  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== "ALL" || qualityFilter !== "ALL" || usableOnly;

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setQualityFilter("ALL");
    setUsableOnly(false);
  };

  const renderCards = (
    <div className={styles.materialsGrid} aria-label="Materials catalog cards">
      {paginatedMaterials.map((mat) => (
        <MaterialCard
          key={mat.name}
          mat={mat}
          ownedCount={ownedMaterials[mat.name] || 0}
          inQueueCount={lessonQueue[mat.name] || 0}
          showExpPerItem={showExpPerItem}
          onOpenItem={openItemByName}
          onAddToQueue={addToQueue}
          onFillSession={fillSessionWithMaterial}
        />
      ))}
    </div>
  );

  return (
    <section className={styles.queueList} aria-label="Forge lesson material catalog">
      <div className={styles.filterBar}>
        <div className={styles.filterPrimaryRow}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search material, enemy, or source..."
            ariaLabel="Search material catalog"
            showShortcutHint={false}
          />

          <Select
            options={FORGE_LESSON_SORTS.map((s) => ({ value: s.id, label: s.label }))}
            value={sortBy}
            onChange={(val) => setSortBy(val as ForgeLessonSort)}
            ariaLabel="Sort lesson materials by"
          />

          <Select
            options={QUALITY_OPTIONS}
            value={qualityFilter}
            onChange={(val) => setQualityFilter(val)}
            ariaLabel="Filter by material quality"
          />

          <div className={styles.desktopOnlyTable}>
            <SegmentedControl
              ariaLabel="Catalog view mode"
              value={viewMode}
              onChange={(val) => handleSetViewMode(val as "table" | "cards")}
              size="sm"
              options={[
                { value: "table", label: "Table", icon: <Icon name="menu" size="xs" aria-hidden="true" /> },
                { value: "cards", label: "Cards", icon: <Icon name="archiveLayers" size="xs" aria-hidden="true" /> },
              ]}
            />
          </div>
        </div>

        <div className={styles.filterSecondaryRow}>
          <div className={styles.chipGroup} role="group" aria-label="Material categories">
            <span className="sr-only">Material Catalog</span>
            {FORGE_LESSON_CATEGORIES.map((cat) => (
              <Tag
                key={cat.id}
                label={cat.label}
                count={categoryCounts[cat.id] || 0}
                selected={categoryFilter === cat.id}
                onSelect={() => setCategoryFilter(cat.id as ForgeLessonCategory)}
              />
            ))}
            <Tag
              label={`Usable (Lv. ${forgeLevel})`}
              count={usableCount}
              selected={usableOnly}
              onSelect={() => setUsableOnly((prev) => !prev)}
            />
          </div>

          <div className={styles.actionsCluster}>
            <Switch
              label="Show EXP per item"
              checked={showExpPerItem}
              onChange={(e) => setShowExpPerItem(e.target.checked)}
            />
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="undo" size="xs" aria-hidden="true" />}
                onClick={handleResetFilters}
                aria-label="Reset all filters"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {displayMaterials.length === 0 ? (
        <EmptyState
          variant="search-empty"
          title="No matching materials"
          description="Try clearing the rarity, usable-level, or search filters."
          action={
            hasActiveFilters
              ? {
                  label: "Clear Filters",
                  onClick: handleResetFilters,
                }
              : undefined
          }
        />
      ) : viewMode === "cards" ? (
        renderCards
      ) : (
        <>
          <div className={styles.desktopOnlyTable}>
            <TableContainer ariaLabel="Forge lesson material catalog table">
              <Table density="compact" hoverable>
                <TableHeader sticky={false}>
                  <TableRow>
                    <TableHead>Material ({displayMaterials.length})</TableHead>
                    <TableHead align="right">EXP / hr</TableHead>
                    <TableHead align="right">Gold / EXP</TableHead>
                    <TableHead align="right">{showExpPerItem ? "Market | EXP/ea" : "Market"}</TableHead>
                    <TableHead align="right">Burn | Eff</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMaterials.map((mat, rowIndex) => {
                    const hourlyExp = Math.round(mat.expPerSecond * 3600);
                    const ownedCount = ownedMaterials[mat.name] || 0;
                    const inQueueCount = lessonQueue[mat.name] || 0;
                    const rarityVariant = mat.quality.toLowerCase() as BadgeVariant;
                    const rowClass = inQueueCount > 0
                      ? styles.tableRowQueued
                      : mat.hasPenalty
                      ? styles.tableRowPenalized
                      : "";

                    return (
                      <TableRow key={`mat-row-${rowIndex}`} className={rowClass} selected={inQueueCount > 0}>
                        <TableCell>
                          <div className={styles.matCellIdentity}>
                            <div className={styles.itemThumb}>
                              <GameImage src={mat.imageUrl} alt={mat.name} width={28} height={28} />
                            </div>
                            <div className={styles.matCellText}>
                              <div className={styles.actionsCluster}>
                                <button
                                  type="button"
                                  className={styles.itemTitleBtn}
                                  onMouseEnter={() => prefetchItem(mat.name)}
                                  onClick={() => openItemByName(mat.name)}
                                >
                                  <QualityText value={mat.quality}>{mat.name}</QualityText>
                                </button>
                                <Badge variant={rarityVariant} size="sm">{mat.quality}</Badge>
                                {inQueueCount > 0 && (
                                  <Badge variant="success" size="sm">{inQueueCount.toLocaleString()} queued</Badge>
                                )}
                              </div>
                              <div className={styles.matCellMeta}>
                                <span>Lv. {mat.reqLvl}</span>
                                <span aria-hidden="true">|</span>
                                <span>{mat.mob || mat.category.replace("_", " ")}</span>
                                {ownedCount > 0 && (
                                  <>
                                    <span aria-hidden="true">|</span>
                                    <span>{ownedCount.toLocaleString()} in stock</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell align="right" numeric>
                          <strong>~{hourlyExp.toLocaleString()}</strong>
                        </TableCell>

                        <TableCell align="right" numeric>
                          <span className={mat.goldPerExp <= 2.5 ? styles.numGood : ""}>
                            {mat.goldPerExp.toFixed(2)}
                            <GoldIcon size={11} />
                          </span>
                        </TableCell>

                        <TableCell align="right" numeric>
                          <span>
                            {formatGold(mat.liveMarketPrice)}
                            <GoldIcon size={11} />
                          </span>
                          {showExpPerItem && (
                            <span className={styles.syncText}> | {mat.effectiveExp.toFixed(1)} EXP</span>
                          )}
                        </TableCell>

                        <TableCell align="right" numeric>
                          <span className={mat.hasPenalty ? styles.numWarn : ""}>
                            {mat.timeSeconds.toFixed(1).replace(/\.0$/, "")}s | {mat.displayedEff}%
                          </span>
                        </TableCell>

                        <TableCell align="right">
                          <div className={styles.tableActionPair}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => fillSessionWithMaterial(mat.name)}
                              aria-label={`Fill session with ${mat.name}`}
                            >
                              Fill
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => addToQueue(mat.name, 100)}
                              aria-label={`Add 100 ${mat.name} to queue`}
                            >
                              +100
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <div className={styles.mobileOnlyCards} aria-label="Mobile materials catalog cards">
            {paginatedMaterials.map((mat) => (
              <MaterialCard
                key={mat.name}
                mat={mat}
                ownedCount={ownedMaterials[mat.name] || 0}
                inQueueCount={lessonQueue[mat.name] || 0}
                showExpPerItem={showExpPerItem}
                onOpenItem={openItemByName}
                onAddToQueue={addToQueue}
                onFillSession={fillSessionWithMaterial}
              />
            ))}
          </div>
        </>
      )}

      {displayMaterials.length > PAGE_SIZE && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={displayMaterials.length}
          pageSize={PAGE_SIZE}
          itemLabel="materials"
        />
      )}
    </section>
  );
}
