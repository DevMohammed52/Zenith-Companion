"use client";

import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  NumberInput,
  type BadgeVariant,
} from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import type { ForgeState } from "../../types";
import styles from "../../Forge.module.css";

export function ForgePlanSection({ state }: { state: ForgeState }) {
  const {
    plan,
    recipes,
    focusedEntryKey,
    setFocusedEntryKey,
    setStatusMessage,
    updateLine,
    removeLine,
    openItemByName,
    prefetchItem,
    warningCount,
  } = state;

  return (
    <section className={styles.queueList} id="forge-plan" aria-label="Planned forge crafts">
      <div className={styles.sectionTopRow}>
        <div>
          <span className={styles.kicker}>
            <Icon name="craftingQueue" size="xs" aria-hidden="true" /> Planned crafts
          </span>
          <h2 className={styles.sectionTitle}>
            {plan.entries.length
              ? `${plan.entries.length} ${plan.entries.length === 1 ? "recipe" : "recipes"}`
              : "No recipes planned"}
          </h2>
        </div>

        <div className={styles.actionsCluster} aria-label="Forge plan health">
          <Badge variant="neutral" size="sm">{recipes.length.toLocaleString()} recipes indexed</Badge>
          {plan.missingMaterialTypes > 0 && (
            <Badge variant="neutral" size="sm">{plan.missingMaterialTypes.toLocaleString()} missing</Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="warning" size="sm">{warningCount.toLocaleString()} warnings</Badge>
          )}
        </div>
      </div>

      {plan.entries.length === 0 ? (
        <EmptyState
          variant="no-data"
          icon="scroll"
          title="Add a saved recipe to start planning."
          description="Pick any Forge recipe above to calculate exact recipe copies, missing materials, XP yield, and output value."
        />
      ) : (
        <div className={styles.queueList}>
          {plan.entries.map((entry) => {
            const isFocused = focusedEntryKey === entry.recipe.recipeName;
            const rarityVariant = entry.recipe.quality.toLowerCase() as BadgeVariant;

            return (
              <Card
                key={entry.key}
                padding="md"
                variant={isFocused ? "elevated" : "default"}
                accent={entry.warnings.length > 0 ? "warning" : undefined}
                onMouseEnter={() => prefetchItem(entry.recipe.resultName)}
              >
                {entry.warnings.length > 0 && (
                  <div style={{ marginBottom: "0.65rem" }}>
                    <Banner variant="warning">
                      <strong>Check before bulk crafting:</strong> {entry.warnings.slice(0, 2).join(" | ")}
                    </Banner>
                  </div>
                )}

                <div className={styles.queueItemTop}>
                  <div className={styles.matCellIdentity}>
                    <div className={styles.itemThumb}>
                      <GameImage
                        src={entry.recipe.resultImageUrl || entry.recipe.imageUrl}
                        alt=""
                        width={28}
                        height={28}
                      />
                    </div>
                    <div className={styles.matCellText}>
                      <div className={styles.actionsCluster}>
                        <button
                          type="button"
                          className={styles.itemTitleBtn}
                          onClick={() => {
                            setFocusedEntryKey(isFocused ? "" : entry.recipe.recipeName);
                            setStatusMessage(`${entry.recipe.resultName} details toggled.`);
                          }}
                        >
                          <QualityText value={entry.recipe.quality}>{entry.recipe.resultName}</QualityText>
                        </button>
                        <Badge variant={rarityVariant} size="sm">{entry.recipe.quality}</Badge>
                        <span className={styles.syncText}>
                          Lv. {entry.recipe.levelRequired} | {entry.recipe.resultType || "Forge"}
                        </span>
                      </div>
                      <div className={styles.matCellMeta}>
                        <span>{entry.recipe.sourceSummary}</span>
                        <span aria-hidden="true">|</span>
                        <span>{entry.liquidity.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.actionsCluster}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icon name="items" size="xs" aria-hidden="true" />}
                      aria-label={`Open result item details for ${entry.recipe.resultName}`}
                      onClick={() => openItemByName(entry.recipe.resultName)}
                    >
                      Result
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icon name="scroll" size="xs" aria-hidden="true" />}
                      aria-label={`Open recipe item details for ${entry.recipe.recipeName}`}
                      onClick={() => openItemByName(entry.recipe.recipeName)}
                    >
                      Recipe
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Icon name="trash" size="xs" aria-hidden="true" />}
                      aria-label={`Remove ${entry.recipe.resultName} from forge plan`}
                      onClick={() => removeLine(entry.recipe.recipeName)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className={styles.entryControlsGrid}>
                  <NumberInput
                    label="Crafts"
                    min={0}
                    max={999999}
                    value={entry.quantity === 0 ? 0 : entry.quantity || 0}
                    onChange={(val) => updateLine(entry.recipe.recipeName, "quantity", String(val))}
                    aria-label={`Craft quantity for ${entry.recipe.recipeName}`}
                  />
                  <NumberInput
                    label="Owned recipes"
                    min={0}
                    max={999999}
                    value={entry.ownedRecipes === 0 ? 0 : entry.ownedRecipes || 0}
                    onChange={(val) => updateLine(entry.recipe.recipeName, "ownedRecipes", String(val))}
                    aria-label={`Owned recipe copies for ${entry.recipe.recipeName}`}
                  />
                </div>

                <div className={styles.statStrip} style={{ marginTop: "0.65rem" }}>
                  <div className={styles.statStripCell}>
                    <span className={styles.statLabel}>Recipes Needed</span>
                    <strong className={styles.statValue}>
                      {entry.recipeCopiesMissing}/{entry.recipeCopiesNeeded} missing
                    </strong>
                  </div>
                  <div className={styles.statStripCell}>
                    <span className={styles.statLabel}>Missing Cost</span>
                    <strong className={styles.statValue}>
                      {formatGold(entry.totalMissingCost)}
                      <GoldIcon size={11} />
                    </strong>
                  </div>
                  <div className={styles.statStripCell}>
                    <span className={styles.statLabel}>Output ({entry.outputSource})</span>
                    <strong className={styles.statValue}>
                      {formatGold(entry.outputValueTotal)}
                      <GoldIcon size={11} />
                    </strong>
                    <span className={styles.statSub}>{formatGold(entry.outputValueEach)} ea</span>
                  </div>
                  {entry.forgeExpTotal > 0 && (
                    <div className={styles.statStripCell}>
                      <span className={styles.statLabel}>EXP Yield</span>
                      <strong className={`${styles.statValue} ${styles.statValueGood}`}>
                        +{entry.forgeExpTotal.toLocaleString()} Forge
                      </strong>
                      {entry.strengthExpTotal > 0 && (
                        <span className={styles.statSub}>+{entry.strengthExpTotal.toLocaleString()} Str</span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
