"use client";

import { useState, type ReactNode } from "react";
import { Badge, Button, Card, Icon, NumberInput, type BadgeVariant } from "@/components/ui";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import type {
  ForgeMaterialNeed,
  ForgePlannerOwnedMaterials,
  ForgeQuality,
  ForgeRecipeNeed,
  ForgeState,
} from "../../types";
import styles from "../../Forge.module.css";

export function NeedTable({
  title,
  icon,
  rows,
  ownedMaterials,
  onOwnedChange,
  onOpenItem,
}: {
  title: string;
  icon: ReactNode;
  rows: Array<ForgeMaterialNeed & {
    imageUrl: string;
    quality: ForgeQuality;
    unitPrice: number;
    totalCost: number;
    source: string;
  }>;
  ownedMaterials: ForgePlannerOwnedMaterials;
  onOwnedChange: (name: string, value: string) => void;
  onOpenItem: (name: string) => void;
}) {
  return (
    <Card padding="md" aria-label={title}>
      <div className={styles.sectionTopRow} style={{ marginBottom: "0.75rem" }}>
        <div>
          <span className={styles.kicker}>{icon}<span>{title}</span></span>
          <h2 className={styles.sectionTitle}>{rows.filter((row) => row.missing > 0).length} missing types</h2>
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <div className={styles.needTableRow} key={row.name}>
            <div className={styles.needCardTop}>
              <button
                type="button"
                className={styles.itemTitleBtn}
                aria-label={`Open item details for ${row.name}`}
                onClick={() => onOpenItem(row.name)}
              >
                <GameImage src={row.imageUrl} alt="" width={28} height={28} />
                <span className={styles.matCellText}>
                  <QualityText value={row.quality}>{row.name}</QualityText>
                  <small className={styles.matCellMeta}>
                    <Badge variant={row.quality.toLowerCase() as BadgeVariant} size="sm">{row.quality}</Badge> · {row.source}
                  </small>
                </span>
              </button>

              <div className={styles.costCell}>
                <span className={styles.statLabel}>Cost</span>
                <strong className={styles.statValue}>
                  {formatGold(row.totalCost)}
                  <GoldIcon size={11} />
                </strong>
              </div>
            </div>

            <div className={styles.needCardBottom}>
              <div className={styles.needMetricsInline}>
                <div className={styles.costCell} style={{ textAlign: "left" }}>
                  <span className={styles.statLabel}>Required</span>
                  <strong>{row.required.toLocaleString()}</strong>
                </div>
                <div className={styles.costCell} style={{ textAlign: "left" }}>
                  <span className={styles.statLabel}>Missing</span>
                  <strong>{row.missing.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ width: "164px" }}>
                <NumberInput
                  label="Owned"
                  min={0}
                  max={999999}
                  value={ownedMaterials[row.name] || 0}
                  onChange={(val) => onOwnedChange(row.name, String(val))}
                  aria-label={`Owned quantity for ${row.name}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RecipeNeedTable({
  title,
  rows,
  onOpenItem,
}: {
  title: string;
  rows: Array<ForgeRecipeNeed & {
    imageUrl: string;
    quality: ForgeQuality;
    unitPrice: number;
    totalCost: number;
    source: string;
  }>;
  onOpenItem: (name: string) => void;
}) {
  return (
    <Card padding="md" aria-label={title}>
      <div className={styles.sectionTopRow} style={{ marginBottom: "0.75rem" }}>
        <div>
          <span className={styles.kicker}>
            <Icon name="scroll" size="xs" aria-hidden="true" /> <span>{title}</span>
          </span>
          <h2 className={styles.sectionTitle}>
            {rows.reduce((sum, row) => sum + row.missingCopies, 0).toLocaleString()} copies missing
          </h2>
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <div className={styles.recipeNeedRow} key={row.recipeName}>
            <div className={styles.needCardTop}>
              <button
                type="button"
                className={styles.itemTitleBtn}
                aria-label={`Open item details for ${row.recipeName}`}
                onClick={() => onOpenItem(row.recipeName)}
              >
                <GameImage src={row.imageUrl} alt="" width={28} height={28} />
                <span className={styles.matCellText}>
                  <QualityText value={row.quality}>{row.recipeName}</QualityText>
                  <small className={styles.matCellMeta}>
                    <Badge variant={row.quality.toLowerCase() as BadgeVariant} size="sm">{row.quality}</Badge> · {row.source}
                  </small>
                </span>
              </button>

              <div className={styles.costCell}>
                <span className={styles.statLabel}>Cost</span>
                <strong className={styles.statValue}>
                  {formatGold(row.totalCost)}
                  <GoldIcon size={11} />
                </strong>
              </div>
            </div>

            <div className={styles.recipeNeedStats}>
              <div className={styles.costCell} style={{ textAlign: "left" }}>
                <span className={styles.statLabel}>Needed</span>
                <strong>{row.copiesNeeded.toLocaleString()}</strong>
              </div>
              <div className={styles.costCell} style={{ textAlign: "left" }}>
                <span className={styles.statLabel}>Owned</span>
                <strong>{row.ownedCopies.toLocaleString()}</strong>
              </div>
              <div className={styles.costCell} style={{ textAlign: "left" }}>
                <span className={styles.statLabel}>Missing</span>
                <strong>{row.missingCopies.toLocaleString()}</strong>
              </div>
              <div className={styles.costCell} style={{ textAlign: "left" }}>
                <span className={styles.statLabel}>Unit</span>
                <strong>{formatGold(row.unitPrice)}g</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ForgeShoppingSection({ state }: { state: ForgeState }) {
  const { plan, draft, setOwnedMaterial, openItemByName } = state;
  const [copied, setCopied] = useState(false);

  if (plan.entries.length === 0) return null;

  const handleCopyList = () => {
    const lines: string[] = ["=== IdleMMO Forge Shopping List ==="];
    const missingMats = plan.materialNeeds.filter((m) => m.missing > 0);
    if (missingMats.length > 0) {
      lines.push("\nMaterials Needed:");
      for (const m of missingMats) {
        lines.push(`• ${m.name} x${m.missing.toLocaleString()} (${formatGold(m.totalCost)}g)`);
      }
    }
    const missingRecipes = plan.recipeNeeds.filter((r) => r.missingCopies > 0);
    if (missingRecipes.length > 0) {
      lines.push("\nRecipe Copies Needed:");
      for (const r of missingRecipes) {
        lines.push(`• ${r.recipeName} x${r.missingCopies.toLocaleString()} (${formatGold(r.totalCost)}g)`);
      }
    }
    if (plan.totalMissingCost > 0) {
      lines.push(`\nTotal Missing Cost: ${formatGold(plan.totalMissingCost)}g`);
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className={styles.queueList} aria-label="Shopping lists and missing requirements">
      <div className={styles.sectionTopRow} style={{ alignItems: "center" }}>
        <div>
          <span className={styles.kicker}>
            <Icon name="market" size="xs" aria-hidden="true" /> Shopping Requirements
          </span>
          <p className={styles.syncText} style={{ margin: "0.2rem 0 0" }}>
            {plan.materialNeeds.filter((m) => m.missing > 0).length} missing materials ·{" "}
            {formatGold(plan.totalMissingCost)}g required
          </p>
        </div>

        <Button
          variant={copied ? "primary" : "secondary"}
          size="sm"
          icon={<Icon name={copied ? "check" : "copy"} size="xs" aria-hidden="true" />}
          onClick={handleCopyList}
          aria-label="Copy shopping list to clipboard"
        >
          {copied ? "Copied to Clipboard" : "Copy Shopping List"}
        </Button>
      </div>

      <NeedTable
        title="Missing Materials"
        icon={<Icon name="market" size="xs" aria-hidden="true" />}
        rows={plan.materialNeeds}
        ownedMaterials={draft.ownedMaterials}
        onOwnedChange={setOwnedMaterial}
        onOpenItem={openItemByName}
      />

      <RecipeNeedTable
        title="Recipe Copies"
        rows={plan.recipeNeeds}
        onOpenItem={openItemByName}
      />
    </section>
  );
}
