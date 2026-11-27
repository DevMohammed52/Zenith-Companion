"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Combobox,
  EmptyState,
  Icon,
  NumberInput,
  Select,
  Tag,
  type ComboboxOption,
  type TagRarity,
} from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import { getMarketTaxMultiplier } from "@/lib/preferences";
import type { UseForgeLessonsReturn } from "../../hooks/useForgeLessons";
import styles from "../../Forge.module.css";

function formatBurnDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

export function InventoryOptimizer({
  lessons,
  onSwitchSubView,
}: {
  lessons: UseForgeLessonsReturn;
  onSwitchSubView?: (view: "session" | "planner" | "catalog" | "inventory") => void;
}) {
  const {
    ownedMaterials,
    updateOwnedMaterial,
    clearOwnedMaterials,
    allCalculatedMaterials,
    addToQueue,
    queueAllOwned,
    fillSessionWithMaterial,
    hasMembershipBuff,
    forgeLevel,
  } = lessons;

  const [selectedMatName, setSelectedMatName] = useState<string>(allCalculatedMaterials[0]?.name || "Coal Ore");
  const [comboboxSearch, setComboboxSearch] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(100);
  const [sortBy, setSortBy] = useState<"exp" | "value" | "count" | "name">("exp");

  const taxMultiplier = getMarketTaxMultiplier(hasMembershipBuff);
  const feePercentLabel = hasMembershipBuff ? "12% fee" : "15% fee";

  const materialsMap = useMemo(() => {
    return new Map(allCalculatedMaterials.map((m) => [m.name, m]));
  }, [allCalculatedMaterials]);

  const selectedMat = useMemo(() => {
    return materialsMap.get(selectedMatName) || allCalculatedMaterials[0] || null;
  }, [selectedMatName, materialsMap, allCalculatedMaterials]);

  const comboboxOptions: ComboboxOption[] = useMemo(() => {
    return allCalculatedMaterials.map((mat) => ({
      id: mat.name,
      label: mat.name,
      description: `Lv. ${mat.reqLvl} · ${mat.mob || mat.category.replace("_", " ")} · ${mat.goldPerExp.toFixed(2)}g/EXP`,
      meta: formatGold(mat.liveMarketPrice) + "g",
      rarity: mat.quality.toLowerCase(),
      icon: <GameImage src={mat.imageUrl} alt="" width={20} height={20} />,
    }));
  }, [allCalculatedMaterials]);

  const inventoryAnalysis = useMemo(() => {
    let totalInventoryExp = 0;
    let totalBurnSeconds = 0;
    let totalNetMarketValue = 0;

    const rows = Object.entries(ownedMaterials)
      .map(([name, qty]) => {
        const mat = materialsMap.get(name);
        if (!mat || qty <= 0) return null;

        const itemExp = Number((mat.effectiveExp * qty).toFixed(2));
        const itemDuration = mat.timeSeconds * qty;
        const grossValue = mat.liveMarketPrice * qty;
        const netValue = Math.floor(grossValue * taxMultiplier);

        totalInventoryExp += itemExp;
        totalBurnSeconds += itemDuration;
        totalNetMarketValue += netValue;

        const isPoorGoldEfficiency = mat.goldPerExp > 10;
        const hasHeavyPenalty = mat.hasPenalty && mat.displayedEff <= 50;
        const shouldSell = (isPoorGoldEfficiency || hasHeavyPenalty) && mat.liveMarketPrice >= 100;
        const recommendation: "burn" | "sell" = shouldSell ? "sell" : "burn";

        return {
          name,
          qty,
          mat,
          itemExp,
          itemDuration,
          netValue,
          recommendation,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return {
      rows,
      totalInventoryExp: Math.floor(totalInventoryExp),
      totalBurnSeconds,
      totalNetMarketValue,
    };
  }, [ownedMaterials, materialsMap, taxMultiplier]);

  const sortedRows = useMemo(() => {
    return [...inventoryAnalysis.rows].sort((a, b) => {
      if (sortBy === "exp") return b.itemExp - a.itemExp;
      if (sortBy === "value") return b.netValue - a.netValue;
      if (sortBy === "count") return b.qty - a.qty;
      return a.name.localeCompare(b.name);
    });
  }, [inventoryAnalysis.rows, sortBy]);

  const quickSuggestions = useMemo(() => {
    return allCalculatedMaterials
      .filter((m) => m.displayedEff >= 80 && m.reqLvl <= forgeLevel + 12)
      .sort((a, b) => Math.abs(a.reqLvl - forgeLevel) - Math.abs(b.reqLvl - forgeLevel))
      .slice(0, 6);
  }, [allCalculatedMaterials, forgeLevel]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMat?.name || addQty <= 0) return;
    const current = ownedMaterials[selectedMat.name] || 0;
    updateOwnedMaterial(selectedMat.name, current + addQty);
  };

  return (
    <section className={styles.queueList} aria-label="Inventory burn vs sell optimizer">
      <div className={styles.sectionTopRow}>
        <div>
          <span className={styles.kicker}>
            <Icon name="items" size="xs" aria-hidden="true" /> Inventory Optimizer
          </span>
          <h2 className={styles.sectionTitle}>Owned Materials</h2>
        </div>

        {inventoryAnalysis.rows.length > 0 && (
          <div className={styles.actionsCluster}>
            <Button
              variant="primary"
              size="sm"
              icon={<Icon name="critDamage" size="xs" aria-hidden="true" />}
              onClick={() => {
                queueAllOwned();
                onSwitchSubView?.("catalog");
              }}
            >
              Queue All in Lesson
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Icon name="trash" size="xs" aria-hidden="true" />}
              onClick={() => clearOwnedMaterials()}
              aria-label="Clear stored inventory"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Add Material Form */}
      <Card padding="md" overflowVisible>
        <form className={styles.inventoryAddForm} onSubmit={handleAddSubmit}>
          <div className={styles.comboboxWrapper}>
            <span className={styles.fieldLabel}>Material ({selectedMat?.name || "Select"})</span>
            <Combobox
              options={comboboxOptions}
              value={comboboxSearch}
              onChange={setComboboxSearch}
              onSelect={(opt) => {
                setSelectedMatName(String(opt.id));
                setComboboxSearch(opt.label);
              }}
              placeholder={selectedMat ? selectedMat.name : "Search material..."}
              aria-label="Select owned material"
            />
          </div>

          <NumberInput
            label="Quantity"
            min={1}
            max={1000000}
            value={addQty}
            onChange={(val) => setAddQty(val)}
          />

          <Button type="submit" variant="primary" size="md" icon={<Icon name="plus" size="sm" aria-hidden="true" />}>
            Add Stock
          </Button>
        </form>

        <div className={styles.actionsCluster} style={{ marginTop: "0.75rem" }}>
          {[10, 100, 1000].map((amt) => (
            <Button
              key={amt}
              variant="ghost"
              size="sm"
              onClick={() => setAddQty((prev) => Math.min(1000000, prev + amt))}
            >
              +{amt.toLocaleString()}
            </Button>
          ))}
        </div>
      </Card>

      {inventoryAnalysis.rows.length > 0 ? (
        <>
          <div className={styles.statStrip}>
            <div className={styles.statStripCell}>
              <span className={styles.statLabel}>Burnable EXP</span>
              <strong className={`${styles.statValue} ${styles.statValueGood}`}>
                +{inventoryAnalysis.totalInventoryExp.toLocaleString()}
              </strong>
            </div>
            <div className={styles.statStripCell}>
              <span className={styles.statLabel}>Total Burn Time</span>
              <strong className={styles.statValue}>{formatBurnDuration(inventoryAnalysis.totalBurnSeconds)}</strong>
            </div>
            <div className={styles.statStripCell}>
              <span className={styles.statLabel}>Net Market Value ({feePercentLabel})</span>
              <strong className={styles.statValue}>
                {formatGold(inventoryAnalysis.totalNetMarketValue)}
                <GoldIcon size={12} />
              </strong>
            </div>
            <div className={styles.statStripCell}>
              <span className={styles.statLabel}>Sort Stock</span>
              <Select
                options={[
                  { value: "exp", label: "Highest EXP" },
                  { value: "value", label: "Highest Market Value" },
                  { value: "count", label: "Quantity" },
                  { value: "name", label: "Name" },
                ]}
                value={sortBy}
                onChange={(val) => setSortBy(val as typeof sortBy)}
                ariaLabel="Sort owned inventory"
              />
            </div>
          </div>

          <div className={styles.queueList}>
            {sortedRows.map((row) => (
              <Card key={row.name} padding="sm" accent={row.recommendation === "sell" ? "warning" : undefined}>
                <div className={styles.inventoryRow}>
                  <div className={styles.matCellIdentity}>
                    <div className={styles.itemThumb}>
                      <GameImage src={row.mat.imageUrl} alt={row.name} width={28} height={28} />
                    </div>
                    <div className={styles.matCellText}>
                      <div className={styles.actionsCluster}>
                        <QualityText value={row.mat.quality}>{row.name}</QualityText>
                        <Badge variant="neutral" size="sm">{row.qty.toLocaleString()}x</Badge>
                        {row.recommendation === "sell" ? (
                          <Badge variant="warning" size="sm">Sell on Market</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Burn for EXP</Badge>
                        )}
                      </div>
                      <div className={styles.matCellMeta}>
                        <span>+{Math.floor(row.itemExp).toLocaleString()} EXP</span>
                        <span>·</span>
                        <span>
                          Net Sale: <strong>{formatGold(row.netValue)}</strong>
                          <GoldIcon size={11} />
                        </span>
                        <span>·</span>
                        <span>Eff: {row.mat.displayedEff}%</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.actionsCluster}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateOwnedMaterial(row.name, Math.max(0, row.qty - 10))}
                      aria-label={`Decrease ${row.name} count by 10`}
                    >
                      -10
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateOwnedMaterial(row.name, Math.min(1000000, row.qty + 10))}
                      aria-label={`Increase ${row.name} count by 10`}
                    >
                      +10
                    </Button>
                  </div>

                  <div className={styles.actionsCluster}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Icon name="speed" size="xs" aria-hidden="true" />}
                      onClick={() => fillSessionWithMaterial(row.name)}
                    >
                      Fill Session
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => addToQueue(row.name, row.qty)}
                    >
                      Queue All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icon name="close" size="xs" aria-hidden="true" />}
                      onClick={() => updateOwnedMaterial(row.name, 0)}
                      aria-label={`Remove ${row.name} from inventory`}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          variant="no-data"
          icon="items"
          title="No Owned Stock Tracked"
          description="Add your banked ores, bars, logs, or monster drops to compare burn EXP vs. after-tax market sale value."
        >
          {quickSuggestions.length > 0 && (
            <div className={styles.chipGroup} style={{ marginTop: "0.75rem", justifyContent: "center" }}>
              {quickSuggestions.map((m) => (
                <Tag
                  key={m.name}
                  label={`${m.name} (Lv. ${m.reqLvl})`}
                  rarity={m.quality.toLowerCase() as TagRarity}
                  selected={selectedMatName === m.name}
                  onSelect={() => {
                    setSelectedMatName(m.name);
                    setComboboxSearch(m.name);
                    setAddQty(100);
                  }}
                />
              ))}
            </div>
          )}
        </EmptyState>
      )}
    </section>
  );
}
