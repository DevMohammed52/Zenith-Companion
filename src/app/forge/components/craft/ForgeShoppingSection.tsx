"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, ReceiptText, ShoppingCart } from "lucide-react";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import { GoldIcon } from "@/components/GoldIcon";
import { getTrustedGameImageUrl } from "@/lib/trusted-image";
import type {
  ForgeMaterialNeed,
  ForgePlannerOwnedMaterials,
  ForgeQuality,
  ForgeRecipeNeed,
  ForgeState,
} from "../../types";
import { NumberField } from "./ForgeControls";

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
    <section aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="panel-kicker">{icon}<span>{title}</span></p>
          <h2>{rows.filter((row) => row.missing > 0).length} missing types</h2>
        </div>
      </div>
      <div className="need-list">
        {rows.map((row) => (
          <div className="need-row" key={row.name}>
            <button type="button" className="need-name" aria-label={`Open item details for ${row.name}`} onClick={() => onOpenItem(row.name)}>
              <img
                src={getTrustedGameImageUrl(row.imageUrl) || "/favicon.ico"}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                }}
              />
              <span>
                <strong>{row.name}</strong>
                <small><QualityText value={row.quality}>{row.quality}</QualityText> | {row.source}</small>
              </span>
            </button>
            <div className="need-stat"><span>Required</span><strong>{row.required.toLocaleString()}</strong></div>
            <NumberField
              label="Owned"
              ariaLabel={`Owned quantity for ${row.name}`}
              value={ownedMaterials[row.name] || ""}
              onChange={(value) => onOwnedChange(row.name, value)}
            />
            <div className="need-stat"><span>Missing</span><strong>{row.missing.toLocaleString()}</strong></div>
            <div className="need-stat">
              <span>Cost</span>
              <strong className="cost-with-coin">
                {formatGold(row.totalCost)}
                <GoldIcon size={11} />
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <section aria-label={title}>
      <div className="section-heading">
        <div>
          <p className="panel-kicker"><ReceiptText size={16} /> <span>{title}</span></p>
          <h2>{rows.reduce((sum, row) => sum + row.missingCopies, 0).toLocaleString()} copies missing</h2>
        </div>
      </div>
      <div className="need-list">
        {rows.map((row) => (
          <div className="need-row" key={row.recipeName}>
            <button type="button" className="need-name" aria-label={`Open item details for ${row.recipeName}`} onClick={() => onOpenItem(row.recipeName)}>
              <img
                src={getTrustedGameImageUrl(row.imageUrl) || "/favicon.ico"}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                }}
              />
              <span>
                <strong>{row.recipeName}</strong>
                <small><QualityText value={row.quality}>{row.quality}</QualityText> | {row.source}</small>
              </span>
            </button>
            <div className="need-stat"><span>Needed</span><strong>{row.copiesNeeded.toLocaleString()}</strong></div>
            <div className="need-stat"><span>Owned</span><strong>{row.ownedCopies.toLocaleString()}</strong></div>
            <div className="need-stat"><span>Missing</span><strong>{row.missingCopies.toLocaleString()}</strong></div>
            <div className="need-stat">
              <span>Cost</span>
              <strong className="cost-with-coin">
                {formatGold(row.totalCost)}
                <GoldIcon size={11} />
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <section className="shopping-layout" aria-label="Shopping lists and missing requirements">
      <div className="shopping-header-bar">
        <div className="shopping-title-group">
          <p className="panel-kicker"><ShoppingCart size={14} aria-hidden="true" /> Shopping Requirements</p>
          <span className="shopping-subtext">
            {plan.materialNeeds.filter((m) => m.missing > 0).length} missing materials · {formatGold(plan.totalMissingCost)}g required
          </span>
        </div>
        <button
          type="button"
          className="copy-shopping-btn"
          onClick={handleCopyList}
          aria-label="Copy shopping list to clipboard"
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          <span>{copied ? "Copied to Clipboard" : "Copy Shopping List"}</span>
        </button>
      </div>
      <NeedTable
        title="Missing Materials"
        icon={<ShoppingCart size={16} />}
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
