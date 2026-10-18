"use client";

import { Check, Clock, Coins, Home, Package, Search, ShieldCheck, X } from "lucide-react";
import {
  CATEGORY_OPTIONS,
  formatCostStatus,
  formatFullDecayDate,
  formatKnownCost,
  formatMaterialPrice,
  getConditionFromRepairGold,
  getCycleMonthlyValue,
} from "../types";
import { formatCondition, formatGold, formatGoldUnit, formatHours } from "@/lib/format";
import {
  estimateHousingRepairCostSummary,
  getComponentBuildCost,
  getComponentCostBreakdown,
  getHousingActivityLabel,
  getHousingBuildCostSummary,
  normalizeHousingCondition,
  normalizeHousingRepairGold,
} from "@/lib/housing";
import { ChoicePicker } from "./ChoicePicker";
import type { HousingState } from "../hooks/useHousingState";

export function HousingComponentsTab({ state }: { state: HousingState }) {
  const {
    activeProfile,
    housing,
    summary,
    slotOverage,
    foundationComponent,
    selectedBuildCost,
    selectedCostStatus,
    selectedRepairEstimate,
    repairDecayDays,
    repairConditionCards,
    componentConditions,
    componentRepairGold,
    materialPrices,
    removeComponent,
    conditionSliderDrafts,
    updateComponentConditionSliderDraft,
    commitComponentConditionSliderDraft,
    conditionDrafts,
    updateComponentConditionInput,
    resetComponentConditionInput,
    updateComponentRepairGold,
    search,
    setSearch,
    category,
    setCategory,
    openPicker,
    setOpenPicker,
    componentGroups,
    selected,
    setComponentTier,
    toggleComponent,
  } = state;

  if (!activeProfile) return null;

  return (
    <>
      {housing.mode === "owner" && (
        <section className="housing-panel selected-setup-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Selected Setup</p>
              <h2>Built Components</h2>
            </div>
            <div className={`slot-meter ${slotOverage ? "warning" : ""}`}>
              <span>Slots used</span>
              <strong>{summary.activeComponentCount}/{summary.slotCapacity}</strong>
            </div>
          </div>

          {slotOverage > 0 && (
            <div className="slot-warning">
              <ShieldCheck size={17} />
              <span>This setup is {slotOverage} slot{slotOverage === 1 ? "" : "s"} over capacity. Remove components or build more slots.</span>
            </div>
          )}
          <div className="cost-model-strip">
            <div>
              <span>Foundation</span>
              <strong>{formatGoldUnit(foundationComponent?.goldCost || 25000)} + 6h</strong>
              <small>Needed before slots, components, and material gathering access.</small>
            </div>
            <div>
              <span>Build total</span>
              <strong className={selectedBuildCost.missingMaterials.length ? "needs-data-text" : ""}>{selectedCostStatus}</strong>
              <small>Fixed gold plus current material prices for this saved setup.</small>
            </div>
            <div>
              <span>Repair now</span>
              <strong className={selectedRepairEstimate.missingMaterials.length ? "needs-data-text" : ""}>
                {formatKnownCost(selectedRepairEstimate.totalCost, selectedRepairEstimate.missingMaterials)}
              </strong>
              <small>
                {selectedRepairEstimate.missingMaterials.length
                  ? "Material prices incomplete."
                  : `${formatGoldUnit(selectedRepairEstimate.goldCost)} gold + ${formatGoldUnit(selectedRepairEstimate.materialCost)} materials.`}
              </small>
            </div>
          </div>
          <div className="repair-data-note">
            <ShieldCheck size={16} />
            <span>Set each component condition below. Repair planning uses the 90-day decay cycle for repaired components.</span>
          </div>
          <div className="setup-cost-panel">
            <div className="setup-cost-head">
              <div>
                <span>Build materials</span>
                <strong>{selectedBuildCost.materials.length ? `${selectedBuildCost.materials.length} material${selectedBuildCost.materials.length === 1 ? "" : "s"}` : "Gold only"}</strong>
              </div>
              <div className="repair-cycle-pill">
                <Clock size={15} />
                <span>{repairDecayDays}-day after repair</span>
              </div>
            </div>
            <div className="selected-material-breakdown setup-breakdown">
              <span><Coins size={13} /> Fixed gold <strong>{formatGoldUnit(selectedBuildCost.goldCost)}</strong></span>
              {selectedBuildCost.materials.map((material) => (
                <span key={`build-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                  {material.quantity.toLocaleString()} {material.name}
                  <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                </span>
              ))}
              {!selectedBuildCost.materials.length && <span>No construction materials recorded for this setup yet.</span>}
            </div>
            <div className="selected-material-breakdown setup-breakdown repair-breakdown">
              <span><ShieldCheck size={13} /> Repair total <strong className={selectedRepairEstimate.missingMaterials.length ? "needs-data-text" : ""}>{formatKnownCost(selectedRepairEstimate.totalCost, selectedRepairEstimate.missingMaterials)}</strong></span>
              <span><Coins size={13} /> Repair gold <strong>{formatGoldUnit(selectedRepairEstimate.goldCost)}</strong></span>
              {selectedRepairEstimate.materials.map((material) => (
                <span key={`repair-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                  {material.quantity.toLocaleString()} {material.name}
                  <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                </span>
              ))}
              {!selectedRepairEstimate.materials.length && <span>No repairable materials until rooms or special components are selected.</span>}
            </div>
          </div>

          <div className="selected-component-grid">
            {repairConditionCards.length ? repairConditionCards.map(({ component, quantity = 1, detail, removable }) => {
              const fullGoldCost = component.goldCost * quantity;
              const repairGoldOverride = normalizeHousingRepairGold(componentRepairGold[component.id]);
              const calibratedCondition = getConditionFromRepairGold(fullGoldCost, repairGoldOverride);
              const condition = calibratedCondition ?? normalizeHousingCondition(componentConditions[component.id], 100);
              const cost = getHousingBuildCostSummary([{ component, quantity }], materialPrices);
              const repairCost = estimateHousingRepairCostSummary(
                [{ component, quantity, conditionPercent: condition, repairGoldOverride }],
                materialPrices,
                100,
              );
              const decayDays = repairDecayDays;
              const fullDecayDate = formatFullDecayDate(condition, decayDays);
              const cycleMonthlyCost = getCycleMonthlyValue(cost.totalCost, decayDays);
              const cycleDailyCost = Math.round(cost.totalCost / Math.max(1, decayDays));
              return (
                <article key={component.id} className="selected-component-row">
                  <div>
                    <strong>{component.family}</strong>
                    <span>{detail}</span>
                  </div>
                  <div className="selected-row-meta">
                    <small>{cost.missingMaterials.length ? "Build cost needs price/data" : `Build ${formatGoldUnit(cost.totalCost)}`}</small>
                    {removable ? (
                      <button type="button" onClick={() => removeComponent(component.id)} aria-label={`Remove ${component.family}`}>
                        <X size={14} /> Remove
                      </button>
                    ) : (
                      <span className="selected-row-lock">Setup</span>
                    )}
                  </div>
                  <div className="component-condition-panel">
                    <div className="condition-readout">
                      <span>Condition</span>
                      <strong>{formatCondition(condition)}%</strong>
                      <small>
                        {repairGoldOverride !== undefined
                          ? `Repair gold matched; decays ${fullDecayDate}`
                          : condition <= 0
                            ? "Fully decayed"
                            : `Fully decays ${fullDecayDate}`}
                      </small>
                    </div>
                    <label className="condition-slider">
                      <span className="sr-only">{component.family} condition</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={conditionSliderDrafts[component.id] ?? condition}
                        aria-label={`${component.family} condition`}
                        onChange={(event) => updateComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber)}
                        onBlur={(event) => commitComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber)}
                        onPointerUp={(event) => commitComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber)}
                        onKeyUp={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            commitComponentConditionSliderDraft(component.id, event.currentTarget.valueAsNumber);
                          }
                        }}
                      />
                    </label>
                    <label className="condition-number">
                      <span className="sr-only">{component.family} condition percent</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={conditionDrafts[component.id] ?? condition}
                        aria-label={`${component.family} condition percent`}
                        onChange={(event) => updateComponentConditionInput(component.id, event.currentTarget.value)}
                        onBlur={() => resetComponentConditionInput(component.id)}
                      />
                      <span>%</span>
                    </label>
                    <label className="repair-gold-calibration">
                      <span>Game repair gold</span>
                      <input
                        type="number"
                        min="0"
                        max={fullGoldCost}
                        step="1"
                        value={repairGoldOverride ?? ""}
                        placeholder="Optional"
                        aria-label={`${component.family} game repair gold`}
                        onChange={(event) => updateComponentRepairGold(component.id, event.currentTarget.value, fullGoldCost)}
                      />
                    </label>
                  </div>
                  <details className="component-ledger-details">
                    <summary>
                      <span>Build and upkeep details</span>
                      <strong>{repairCost.missingMaterials.length ? "Needs price/data" : `Repair ${formatGoldUnit(repairCost.totalCost)}`}</strong>
                    </summary>
                    <div className="selected-material-breakdown">
                      <span><Coins size={13} /> Fixed gold {formatGoldUnit(cost.goldCost)}</span>
                      {cost.materials.length ? cost.materials.map((material) => (
                        <span key={`${component.id}-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                          {material.quantity.toLocaleString()} {material.name}
                          <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                        </span>
                      )) : <span>No construction materials recorded.</span>}
                      <span className={`repair-cost-placeholder ${repairCost.missingMaterials.length ? "needs-data" : ""}`}>
                        Repair now
                        <strong className={repairCost.missingMaterials.length ? "needs-data-text" : ""}>
                          {formatKnownCost(repairCost.totalCost, repairCost.missingMaterials)}
                        </strong>
                        <em>{formatGoldUnit(repairCost.goldCost)} gold + {repairCost.missingMaterials.length ? "material prices needed" : `${formatGoldUnit(repairCost.materialCost)} materials`}</em>
                      </span>
                    </div>
                    <div className="selected-material-breakdown repair-requirement-breakdown">
                      <span><ShieldCheck size={13} /> Repair materials <strong>{repairCost.materials.length ? `${repairCost.materials.length} types` : "None"}</strong></span>
                      {repairCost.materials.map((material) => (
                        <span key={`${component.id}-repair-${material.name}`} className={material.missingPrice ? "needs-data" : ""}>
                          {material.quantity.toLocaleString()} {material.name}
                          <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                        </span>
                      ))}
                      <span className={repairCost.missingMaterials.length ? "needs-data" : ""}>
                        Material market value
                        <strong>{repairCost.missingMaterials.length ? "Needs price/data" : formatGoldUnit(repairCost.materialCost)}</strong>
                      </span>
                    </div>
                    <div className="selected-material-breakdown repair-cycle-breakdown">
                      <span className={cost.missingMaterials.length ? "needs-data" : ""}>
                        Full 90d upkeep value
                        <strong>{formatKnownCost(cost.totalCost, cost.missingMaterials)}</strong>
                        <em>{decayDays}d from 100% to 0%</em>
                      </span>
                      <span className={cost.missingMaterials.length ? "needs-data" : ""}>
                        Average full-cycle upkeep
                        <strong>{formatKnownCost(cycleMonthlyCost, cost.missingMaterials)} / month</strong>
                        <em>{cost.missingMaterials.length ? "Material prices needed" : `${formatGoldUnit(cycleDailyCost)} / day`}</em>
                      </span>
                      <span className={repairCost.missingMaterials.length ? "needs-data" : ""}>
                        Current missing condition
                        <strong>{formatCondition(repairCost.repairPercent)}%</strong>
                        <em>Immediate repair uses the current condition only.</em>
                      </span>
                    </div>
                  </details>
                </article>
              );
            }) : (
              <div className="selected-empty">
                <Package size={20} />
                <span>No components selected yet. Build the foundation, then add rooms or special components from the planner.</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section
        id="housing-tab-panel-components"
        className={`housing-panel planner-panel ${housing.mode !== "owner" ? "planner-disabled" : ""}`}
        role="tabpanel"
        aria-labelledby="housing-tab-components"
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Planner</p>
            <h2>Components</h2>
            {housing.mode !== "owner" && (
              <p className="planner-mode-note">Choose Owner mode to build a foundation, add slots, and plan components. Guest mode uses received buffs instead.</p>
            )}
          </div>
          {housing.mode === "owner" && (
            <div className="planner-controls">
              <label className="search-box">
                <Search size={17} />
                <input aria-label="Search housing components" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search component, buff, material..." />
              </label>
              <ChoicePicker
                value={category}
                options={[...CATEGORY_OPTIONS]}
                open={openPicker === "category"}
                setOpen={(open) => setOpenPicker(open ? "category" : null)}
                onChange={setCategory}
              />
            </div>
          )}
        </div>

        {housing.mode === "owner" ? (
          <div className="component-grid">
            {componentGroups.map((group) => {
              const component = group.variants.find((variant) => variant.id === group.selectedId) || group.variants[0];
              if (!component) return null;
              const cost = getComponentBuildCost(component, materialPrices);
              const materialBreakdown = getComponentCostBreakdown(component, materialPrices);
              const isSelected = selected.has(component.id);
              const canAdd = isSelected || (housing.foundationBuilt && summary.freeSlots > 0);
              return (
                <article key={group.key} className={`component-card ${isSelected ? "selected" : ""}`}>
                  <div className="component-head">
                    <div className="component-icon"><Package size={19} /></div>
                    <div>
                      <h3>{group.family}</h3>
                      <p>{component.activity ? `${getHousingActivityLabel(component.activity)} +${formatHours(component.idleHours || 0)}` : component.description}</p>
                    </div>
                  </div>

                  {group.variants.length > 1 && (
                    <div className="tier-selector" role="group" aria-label={`${group.family} tier`}>
                      {group.variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          className={variant.id === component.id ? "active" : ""}
                          aria-pressed={variant.id === component.id}
                          onClick={() => setComponentTier(group.family, variant.id)}
                        >
                          {variant.tier ? `T${variant.tier}` : variant.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="component-meta">
                    <span><Coins size={14} /> Fixed gold {formatGold(component.goldCost)}</span>
                    {component.levelRequired && <span>Level {component.levelRequired}</span>}
                    {component.guestCapacity && <span>{component.guestCapacity} guest{component.guestCapacity > 1 ? "s" : ""}</span>}
                  </div>

                  <div className="material-list cost-breakdown-list">
                    {materialBreakdown.length ? materialBreakdown.map((material) => (
                      <span key={material.name} className={material.missingPrice ? "needs-data" : ""}>
                        {material.quantity.toLocaleString()} {material.name}
                        <strong>{formatMaterialPrice(material.unitPrice, material.quantity)}</strong>
                      </span>
                    )) : <span>No material data needed</span>}
                  </div>

                  <div className="component-footer">
                    <div>
                      <span className={cost.missingMaterials.length ? "needs-data" : ""}>
                        {cost.missingMaterials.length ? "Needs price/data" : formatGold(cost.totalCost)}
                      </span>
                      <small>{cost.missingMaterials.length ? `${cost.missingMaterials.length} missing prices` : "Build cost: gold + materials"}</small>
                    </div>
                    <button
                      type="button"
                      className={isSelected ? "selected-button" : "add-button"}
                      disabled={!canAdd}
                      onClick={() => toggleComponent(component.id)}
                    >
                      {isSelected ? <><Check size={15} /> Selected</> : !housing.foundationBuilt && housing.mode === "owner" ? "Build foundation first" : summary.freeSlots <= 0 && housing.mode === "owner" ? "No free slot" : "Add"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="planner-empty-state">
            <Home size={24} />
            <strong>{housing.mode === "guest" ? "Guest buffs are entered above" : "Housing buffs are disabled"}</strong>
            <span>{housing.mode === "guest" ? "Component slots are only needed when this profile owns a house." : "Switch back to Owner or Guest to reactivate the preserved setup."}</span>
          </div>
        )}
      </section>
    </>
  );
}
