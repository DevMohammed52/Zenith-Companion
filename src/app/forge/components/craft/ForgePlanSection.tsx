"use client";

import { AlertTriangle, Layers, Package, ReceiptText, Trash2 } from "lucide-react";
import QualityText from "@/components/QualityText";
import { formatGold } from "@/lib/format";
import { getTrustedGameImageUrl } from "@/lib/trusted-image";
import type { ForgeState } from "../../types";
import { NumberField, Stat } from "./ForgeControls";

export function ForgePlanSection({ state }: { state: ForgeState }) {
  const {
    plan,
    recipes,
    focusedEntryKey,
    setFocusedEntryKey,
    setStatusMessage,
    draft,
    updateLine,
    removeLine,
    openItemByName,
    prefetchItem,
    selectedEntry,
    warningCount,
  } = state;

  return (
    <section className={`plan-shell ${selectedEntry ? "" : "no-side"}`} id="forge-plan" aria-label="Planned forge crafts">
      <div className="plan-main">
        <div className="section-heading">
          <div>
            <p className="panel-kicker"><Layers size={15} /> Planned crafts</p>
            <h2>{plan.entries.length ? `${plan.entries.length} recipe${plan.entries.length === 1 ? "" : "s"}` : "No recipes planned"}</h2>
          </div>
          <div className="plan-summary-pills" aria-label="Forge plan health">
            <span>{recipes.length.toLocaleString()} recipes indexed</span>
            <span>{plan.missingMaterialTypes.toLocaleString()} material gaps</span>
            <span className={warningCount > 0 ? "warn" : ""}>{warningCount.toLocaleString()} warnings</span>
          </div>
        </div>

        {plan.entries.length === 0 ? (
          <div className="empty-panel">
            <ReceiptText size={24} />
            <strong>Add a saved recipe to start planning.</strong>
            <p>Use this for stored legendary/mythic recipes, limited-use copies, and bulk material gathering before you craft.</p>
          </div>
        ) : (
          <div className="entry-list">
            {plan.entries.map((entry) => (
              <article
                key={entry.key}
                className={`plan-entry ${focusedEntryKey === entry.recipe.recipeName ? "focused" : ""}`}
                onMouseEnter={() => prefetchItem(entry.recipe.resultName)}
              >
                {entry.warnings.length > 0 && (
                  <div className="warning-row">
                    <AlertTriangle size={15} />
                    <div>
                      <strong>Check before bulk crafting</strong>
                      <p>{entry.warnings.slice(0, 2).join(" | ")}</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="entry-title"
                  onClick={() => {
                    setFocusedEntryKey(entry.recipe.recipeName);
                    setStatusMessage(`${entry.recipe.resultName} details updated below.`);
                  }}
                >
                  <img
                    src={getTrustedGameImageUrl(entry.recipe.resultImageUrl || entry.recipe.imageUrl) || "/favicon.ico"}
                    alt=""
                    width={42}
                    height={42}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
                    }}
                  />
                  <span>
                    <strong>{entry.recipe.resultName}</strong>
                    <small><QualityText value={entry.recipe.quality}>{entry.recipe.quality}</QualityText> | Lv.{entry.recipe.levelRequired} | {entry.recipe.resultType || "Forge result"}</small>
                  </span>
                </button>

                <div className="entry-controls">
                  <NumberField
                    label="Crafts"
                    ariaLabel={`Craft quantity for ${entry.recipe.recipeName}`}
                    value={entry.quantity ?? ""}
                    onChange={(value) => updateLine(entry.recipe.recipeName, "quantity", value)}
                  />
                  <NumberField
                    label="Owned recipes"
                    ariaLabel={`Owned recipe copies for ${entry.recipe.recipeName}`}
                    value={entry.ownedRecipes ?? ""}
                    onChange={(value) => updateLine(entry.recipe.recipeName, "ownedRecipes", value)}
                  />
                </div>

                <div className="entry-stats">
                  <Stat label="Recipe copies" value={`${entry.recipeCopiesMissing}/${entry.recipeCopiesNeeded} missing`} />
                  <Stat label="Missing materials" value={`${entry.materials.filter((row) => row.missing > 0).length} types`} />
                  <Stat label="Missing cost" value={`${formatGold(entry.totalMissingCost)}g`} />
                  <Stat label="Output value" value={`${formatGold(entry.outputValueTotal)}g`} />
                </div>

                <div className="entry-actions">
                  <button type="button" aria-label={`Open result item details for ${entry.recipe.resultName}`} onClick={() => openItemByName(entry.recipe.resultName)}>
                    <Package size={15} /> Result
                  </button>
                  <button type="button" aria-label={`Open recipe item details for ${entry.recipe.recipeName}`} onClick={() => openItemByName(entry.recipe.recipeName)}>
                    <ReceiptText size={15} /> Recipe
                  </button>
                  <button type="button" className="danger" aria-label={`Remove ${entry.recipe.resultName} from forge plan`} onClick={() => removeLine(entry.recipe.recipeName)}>
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedEntry && (
        <aside className="plan-side" aria-label="Selected forge details">
          <div className="detail-card hero-detail">
            <img
              src={getTrustedGameImageUrl(selectedEntry.recipe.resultImageUrl || selectedEntry.recipe.imageUrl) || "/favicon.ico"}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/favicon.ico";
              }}
            />
            <div>
              <p><QualityText value={selectedEntry.recipe.quality}>{selectedEntry.recipe.quality}</QualityText></p>
              <h3>{selectedEntry.recipe.resultName}</h3>
              <span>{selectedEntry.recipe.description || "Forge recipe result"}</span>
            </div>
          </div>
          <div className="detail-card">
            <h3>Recipe source</h3>
            <p>{selectedEntry.recipe.sourceSummary}</p>
          </div>
          <div className="detail-card">
            <h3>Sell reference</h3>
            <div className="side-stat"><span>Best output value</span><strong>{formatGold(selectedEntry.outputValueEach)}g ea</strong></div>
            <div className="side-stat"><span>Path</span><strong>{selectedEntry.outputSource}</strong></div>
            <div className="side-stat"><span>Liquidity</span><strong>{selectedEntry.liquidity.label}</strong></div>
            <p className="muted">{selectedEntry.liquidity.note}</p>
          </div>
        </aside>
      )}
    </section>
  );
}
