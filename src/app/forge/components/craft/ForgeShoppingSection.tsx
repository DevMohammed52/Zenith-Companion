"use client";

import type { ReactNode } from "react";
import { ReceiptText, ShoppingCart } from "lucide-react";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
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
            <div className="need-stat"><span>Cost</span><strong>{formatGold(row.totalCost)}g</strong></div>
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
            <div className="need-stat"><span>Cost</span><strong>{formatGold(row.totalCost)}g</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ForgeShoppingSection({ state }: { state: ForgeState }) {
  const { plan, draft, setOwnedMaterial, openItemByName } = state;

  if (plan.entries.length === 0) return null;

  return (
    <section className="shopping-layout" aria-label="Shopping lists and missing requirements">
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
