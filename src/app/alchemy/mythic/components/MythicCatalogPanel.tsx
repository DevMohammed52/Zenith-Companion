"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  SearchInput,
  SegmentedControl,
  Select,
  Tab,
  TabList,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@/components/ui";
import {
  MYTHIC_CATALOG_SORT_OPTIONS,
  MYTHIC_CATEGORY_TABS,
  type AlchemyCategory,
  type MythicCatalogRow,
  type MythicCatalogSortKey,
  type MythicRecipe,
  type MythicViewMode,
} from "../types";
import {
  formatCraftWindow,
  formatGold,
  formatSignedGold,
  getBestPathLabel,
  getBestPathVariant,
  getLiquidityBadgeVariant,
} from "../utils/mythic-helpers";
import styles from "../page.module.css";

interface MythicCatalogPanelProps {
  rows: MythicCatalogRow[];
  totalCount: number;
  categoryCounts: Record<AlchemyCategory, number>;
  category: AlchemyCategory;
  onCategoryChange: (next: AlchemyCategory) => void;
  search: string;
  onSearchChange: (next: string) => void;
  sortCol: MythicCatalogSortKey;
  sortDesc: boolean;
  onSort: (col: MythicCatalogSortKey) => void;
  onSortSelect: (composite: string) => void;
  onToggleSortDirection: () => void;
  viewMode: MythicViewMode;
  onViewModeChange: (next: MythicViewMode) => void;
  includeScrollCost: boolean;
  onToggleIncludeScrollCost: (next: boolean) => void;
  onlyProfitable: boolean;
  onToggleOnlyProfitable: () => void;
  hideMissing: boolean;
  onToggleHideMissing: () => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onPinRecipe: (recipe: MythicRecipe) => void;
  onRemovePinned: (resultName: string) => void;
  onOpenItem: (name: string) => void;
  onPrefetchItem: (name: string) => void;
}

export function MythicCatalogPanel({
  rows,
  totalCount,
  categoryCounts,
  category,
  onCategoryChange,
  search,
  onSearchChange,
  sortCol,
  sortDesc,
  onSort,
  onSortSelect,
  onToggleSortDirection,
  viewMode,
  onViewModeChange,
  includeScrollCost,
  onToggleIncludeScrollCost,
  onlyProfitable,
  onToggleOnlyProfitable,
  hideMissing,
  onToggleHideMissing,
  hasActiveFilters,
  onResetFilters,
  onPinRecipe,
  onRemovePinned,
  onOpenItem,
  onPrefetchItem,
}: MythicCatalogPanelProps) {
  const activeSortComposite = `${sortCol}:${sortDesc ? "desc" : "asc"}`;
  const sortSelectValue = MYTHIC_CATALOG_SORT_OPTIONS.some((o) => o.value === activeSortComposite)
    ? activeSortComposite
    : `${sortCol}:desc`;

  const renderSortHead = (
    col: MythicCatalogSortKey,
    label: string,
    align: "left" | "right" = "right",
  ) => {
    const isActive = sortCol === col;
    const direction = isActive ? (sortDesc ? "descending" : "ascending") : "none";
    return (
      <TableHead align={align} aria-sort={direction}>
        <button
          type="button"
          className={styles.sortButton}
          aria-label={`Sort by ${label}`}
          onClick={() => onSort(col)}
        >
          <span>{label}</span>
          <Icon
            name={!isActive ? "sort" : sortDesc ? "sortDesc" : "sortAsc"}
            size="xs"
            aria-hidden="true"
          />
        </button>
      </TableHead>
    );
  };

  const renderActionButtons = (row: MythicCatalogRow, compact = false) => (
    <div className={styles.inlineActionGroup}>
      {row.isPinned ? (
        <Button
          size={compact ? "sm" : "sm"}
          variant="secondary"
          aria-label={`Unpin ${row.recipe.resultName} from active projects`}
          onClick={() => onRemovePinned(row.recipe.resultName)}
        >
          <Icon name="check" size="xs" aria-hidden="true" />
          <span>Pinned</span>
        </Button>
      ) : (
        <Button
          size={compact ? "sm" : "sm"}
          variant="primary"
          aria-label={`Pin ${row.recipe.resultName} to active projects`}
          onClick={() => onPinRecipe(row.recipe)}
        >
          <Icon name="plus" size="xs" aria-hidden="true" />
          <span>Pin</span>
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        aria-label={`Inspect ${row.recipe.resultName}`}
        onClick={() => onOpenItem(row.recipe.resultName)}
      >
        Details
      </Button>
    </div>
  );

  return (
    <div className={styles.sectionStack}>
      <section className={styles.toolbarCard} aria-label="Mythic catalog filters and controls">
        <div className={styles.toolbarTopRow}>
          <Tabs
            value={category}
            onValueChange={(next) => onCategoryChange(next as AlchemyCategory)}
            variant="pill"
            sharedPanelId="mythic-catalog-results"
            className={styles.categoryTabs}
          >
            <TabList aria-label="Mythic recipe categories">
              {MYTHIC_CATEGORY_TABS.map((tab) => (
                <Tab key={tab.id} value={tab.id}>
                  {tab.label} ({categoryCounts[tab.id]})
                </Tab>
              ))}
            </TabList>
          </Tabs>

          <div className={styles.toolbarControlsGroup}>
            <SegmentedControl
              ariaLabel="Recipe cost amortization basis"
              size="sm"
              value={includeScrollCost ? "scroll" : "owned"}
              onChange={(val) => onToggleIncludeScrollCost(val === "scroll")}
              options={[
                { value: "scroll", label: "30-Use Recipe" },
                { value: "owned", label: "Owned Recipe" },
              ]}
            />
            <div className={styles.desktopViewToggle}>
              <SegmentedControl
                ariaLabel="Catalog display layout"
                size="sm"
                value={viewMode}
                onChange={(val) => onViewModeChange(val as MythicViewMode)}
                options={[
                  { value: "table", label: "Table" },
                  { value: "cards", label: "Cards" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className={styles.toolbarFilterRow}>
          <div className={styles.searchWrap}>
            <SearchInput
              aria-label="Search mythic recipes"
              placeholder="Search potion, recipe, or ingredient..."
              value={search}
              onChange={onSearchChange}
              showShortcutHint={false}
            />
          </div>

          <div className={styles.sortCluster}>
            <div className={styles.sortSelectWrap}>
              <Select
                ariaLabel="Sort mythic catalog"
                value={sortSelectValue}
                onChange={onSortSelect}
                options={MYTHIC_CATALOG_SORT_OPTIONS}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              className={styles.iconSquareBtn}
              aria-label={`Sort direction: ${sortDesc ? "descending" : "ascending"}`}
              onClick={onToggleSortDirection}
            >
              <Icon name={sortDesc ? "sortDesc" : "sortAsc"} size="sm" aria-hidden="true" />
            </Button>
          </div>

          <div className={styles.filterTagsGroup}>
            <Tag
              label="Profitable only"
              selected={onlyProfitable}
              onSelect={onToggleOnlyProfitable}
            />
            <Tag
              label="Hide missing prices"
              selected={hideMissing}
              onSelect={onToggleHideMissing}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onResetFilters}>
                Reset
              </Button>
            )}
          </div>

          <div className={styles.filterCount}>
            <span>
              Showing {rows.length} of {totalCount}
            </span>
          </div>
        </div>
      </section>

      <div id="mythic-catalog-results">
        {rows.length === 0 ? (
          <EmptyState
            variant="search-empty"
            title="No Mythic recipes match these filters"
            description="Clear your search text or toggle off Profitable only / Hide missing prices to see all 21 Lv 90 recipes."
            action={{
              label: "Reset Filters",
              icon: "undo",
              onClick: onResetFilters,
            }}
          />
        ) : (
          <>
            <div className={styles.desktopOnly}>
              {viewMode === "table" ? (
                <TableContainer ariaLabel="Mythic Alchemy 21-recipe comparison table" scrollShadows>
                  <Table density="compact" hoverable>
                    <TableHeader sticky>
                      <TableRow>
                        {renderSortHead("name", "Recipe", "left")}
                        <TableHead align="left">Path</TableHead>
                        {renderSortHead("recipePrice", "Recipe (30u)", "right")}
                        {renderSortHead("totalCostPerCraft", "Craft Cost", "right")}
                        {renderSortHead("profitPerHour", "Profit / Hr", "right")}
                        {renderSortHead("totalBatchProfit", "30-Use Net", "right")}
                        {renderSortHead("expPerHour", "EXP / Hr", "right")}
                        <TableHead align="left">Liquidity</TableHead>
                        <TableHead align="right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.recipe.resultName}>
                          <TableCell align="left">
                            <div className={styles.tableRecipeCell}>
                              {row.recipe.imageUrl && (
                                <GameImage
                                  src={row.recipe.imageUrl}
                                  alt={row.recipe.resultName}
                                  width={34}
                                  height={34}
                                  className={styles.tableRecipeIcon}
                                />
                              )}
                              <div className={styles.tableRecipeText}>
                                <button
                                  type="button"
                                  className={styles.tableItemBtn}
                                  onMouseEnter={() => onPrefetchItem(row.recipe.resultName)}
                                  onClick={() => onOpenItem(row.recipe.resultName)}
                                >
                                  <QualityText value={row.recipe.resultQuality}>
                                    {row.recipe.resultName}
                                  </QualityText>
                                </button>
                                <span className={styles.recipeSubline}>
                                  Lv {row.recipe.level} | {formatCraftWindow(row.craftTimeSeconds)} |{" "}
                                  {row.recipe.materials
                                    .map((mat) => `${mat.qty}x ${mat.name}`)
                                    .join(", ")}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell align="left">
                            <Badge size="sm" variant={getBestPathVariant(row.bestPath)}>
                              {getBestPathLabel(row.bestPath)}
                            </Badge>
                          </TableCell>

                          <TableCell align="right" numeric>
                            {!includeScrollCost ? (
                              <span className={styles.mutedText}>Owned</span>
                            ) : row.recipePrice > 0 ? (
                              <div className={styles.numericStack}>
                                <span className={styles.goldValue}>
                                  <GoldIcon size={12} />
                                  <span>{formatGold(row.recipePrice)}g</span>
                                </span>
                                <span className={styles.recipeSubline}>
                                  {formatGold(row.recipeCostPerCraft)}g / ea
                                </span>
                              </div>
                            ) : (
                              <Badge size="sm" variant="warning">
                                No recipe price
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell align="right" numeric>
                            <span className={styles.goldValue}>
                              <GoldIcon size={12} />
                              <span>{formatGold(row.totalCostPerCraft)}g</span>
                            </span>
                          </TableCell>

                          <TableCell align="right" numeric>
                            {row.isComplete ? (
                              <div className={styles.numericStack}>
                                <span
                                  className={`${styles.goldValue} ${
                                    row.profitPerHour >= 0 ? "text-success" : "text-danger"
                                  }`}
                                >
                                  <GoldIcon size={12} />
                                  <strong>{formatSignedGold(row.profitPerHour)}/hr</strong>
                                </span>
                                <span className={styles.recipeSubline}>
                                  {formatSignedGold(row.profit)}/ea
                                </span>
                              </div>
                            ) : (
                              <Badge size="sm" variant="warning">
                                {row.missingPriceCount} missing
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell align="right" numeric>
                            {row.isComplete ? (
                              <span
                                className={`${styles.goldValue} ${
                                  row.totalBatchProfit >= 0 ? "text-success" : "text-danger"
                                }`}
                              >
                                <GoldIcon size={12} />
                                <span>{formatSignedGold(row.totalBatchProfit)}</span>
                              </span>
                            ) : (
                              <span className={styles.mutedText}>--</span>
                            )}
                          </TableCell>

                          <TableCell align="right" numeric>
                            <div className={styles.numericStack}>
                              <strong>{formatGold(row.expPerHour)}/hr</strong>
                              <span className={styles.recipeSubline}>
                                +{formatGold(row.speedExpPerHour)} Spd/hr
                              </span>
                            </div>
                          </TableCell>

                          <TableCell align="left">
                            <div className={styles.liquidityCell}>
                              <Badge size="sm" variant={getLiquidityBadgeVariant(row.outputLiquidity.tone)}>
                                {row.outputLiquidity.label}
                              </Badge>
                              <span className={styles.recipeSubline}>
                                {row.stableVol_3.toLocaleString()} 3d vol
                              </span>
                            </div>
                          </TableCell>

                          <TableCell align="right">{renderActionButtons(row)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <div className={styles.catalogCardsGrid}>
                  {rows.map((row) => (
                    <CatalogCard
                      key={row.recipe.resultName}
                      row={row}
                      includeScrollCost={includeScrollCost}
                      onOpenItem={onOpenItem}
                      actionButtons={renderActionButtons(row, true)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.mobileOnly}>
              <div className={styles.catalogCardsGrid}>
                {rows.map((row) => (
                  <CatalogCard
                    key={row.recipe.resultName}
                    row={row}
                    includeScrollCost={includeScrollCost}
                    onOpenItem={onOpenItem}
                    actionButtons={renderActionButtons(row, true)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CatalogCard({
  row,
  includeScrollCost,
  onOpenItem,
  actionButtons,
}: {
  row: MythicCatalogRow;
  includeScrollCost: boolean;
  onOpenItem: (name: string) => void;
  actionButtons: React.ReactNode;
}) {
  return (
    <Card className={styles.catalogCard}>
      <div className={styles.catalogCardHead}>
        <div className={styles.catalogCardTitleGroup}>
          {row.recipe.imageUrl && (
            <GameImage
              src={row.recipe.imageUrl}
              alt={row.recipe.resultName}
              width={40}
              height={40}
              className={styles.catalogCardIcon}
            />
          )}
          <div className={styles.tableRecipeText}>
            <button
              type="button"
              className={styles.tableItemBtn}
              onClick={() => onOpenItem(row.recipe.resultName)}
            >
              <QualityText value={row.recipe.resultQuality}>{row.recipe.resultName}</QualityText>
            </button>
            <div className={styles.inlineGroup}>
              <Badge size="sm" variant={getBestPathVariant(row.bestPath)}>
                {getBestPathLabel(row.bestPath)}
              </Badge>
              <Badge size="sm" variant={getLiquidityBadgeVariant(row.outputLiquidity.tone)}>
                {row.outputLiquidity.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className={styles.catalogCardRate}>
          {row.isComplete ? (
            <>
              <span className={`${styles.goldValue} ${row.profitPerHour >= 0 ? "text-success" : "text-danger"}`}>
                <GoldIcon size={13} />
                <strong>{formatSignedGold(row.profitPerHour)}/hr</strong>
              </span>
              <span className={styles.recipeSubline}>{formatSignedGold(row.profit)}/ea</span>
            </>
          ) : (
            <Badge size="sm" variant="warning">
              {row.missingPriceCount} missing
            </Badge>
          )}
        </div>
      </div>

      <div className={styles.catalogMetricStrip}>
        <div className={styles.metricStripCell}>
          <span className={styles.metricLabel}>Recipe (30u)</span>
          <span className={styles.metricValue}>
            {!includeScrollCost ? (
              "Owned"
            ) : row.recipePrice > 0 ? (
              <>
                <GoldIcon size={12} />
                <span>{formatGold(row.recipePrice)}g</span>
              </>
            ) : (
              "Missing"
            )}
          </span>
        </div>

        <div className={styles.metricStripCell}>
          <span className={styles.metricLabel}>Craft Cost</span>
          <span className={styles.metricValue}>
            <GoldIcon size={12} />
            <span>{formatGold(row.totalCostPerCraft)}g</span>
          </span>
        </div>

        <div className={styles.metricStripCell}>
          <span className={styles.metricLabel}>30-Use Net</span>
          <span
            className={`${styles.metricValue} ${
              row.isComplete
                ? row.totalBatchProfit >= 0
                  ? "text-success"
                  : "text-danger"
                : ""
            }`}
          >
            {row.isComplete ? (
              <>
                <GoldIcon size={12} />
                <span>{formatSignedGold(row.totalBatchProfit)}</span>
              </>
            ) : (
              "--"
            )}
          </span>
        </div>

        <div className={styles.metricStripCell}>
          <span className={styles.metricLabel}>EXP / Hr</span>
          <span className={styles.metricValue}>{formatGold(row.expPerHour)}/hr</span>
        </div>
      </div>

      <div className={styles.catalogCardFooter}>
        <span className={styles.recipeSubline}>
          {row.recipe.materials.map((m) => `${m.qty}x ${m.name}`).join(", ")}
        </span>
        {actionButtons}
      </div>
    </Card>
  );
}
