"use client";

import { AlertTriangle, Clock, Home, Package, Route, Search, TrendingUp } from "lucide-react";
import { formatEssenceBuff } from "@/lib/essences";
import { formatGoldUnit, formatHours, formatPayback, formatSignedGold, formatStarts } from "@/lib/format";
import { getHousingActivityLabel } from "@/lib/housing";
import { COST_SHARE_OPTIONS, getDailyGainNote, getExtraIdleTimeNote } from "../types";
import { ChoicePicker } from "./ChoicePicker";
import type { HousingState } from "../hooks/useHousingState";

export function HousingProfitTab({ state }: { state: HousingState }) {
  const {
    activeProfile,
    housing,
    saveHousing,
    summary,
    plannerBaseIdleHours,
    plannerOfflineHours,
    profitPlannerFamily,
    setProfitPlannerFamily,
    idleRoomFamilies,
    openPicker,
    setOpenPicker,
    selectedRoute,
    routeRows,
    setProfitPlannerRoute,
    plannerSkill,
    profitPlannerEssence,
    essenceOptions,
    setProfitPlannerEssence,
    plannerPlaytimeHours,
    roomCostShare,
    setRoomCostShare,
    plannerActivity,
    plannerTopTierRow,
    selectedEssenceHasPrice,
    selectedEssenceCost,
    selectedEssenceBuff,
    plannerRows,
    existingRoomFamilyId,
    selectedRoomFamilyCount,
    roomProfitHorizons,
    repairDecayDays,
  } = state;

  if (!activeProfile) return null;

  if (housing.mode !== "owner") {
    return (
      <section
        id="housing-tab-panel-profit"
        className="housing-panel guest-disabled-panel"
        role="tabpanel"
        aria-labelledby="housing-tab-profit"
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Room Profit</p>
            <h2>Owner mode required</h2>
            <p>Room ROI compares your own foundation, slots, room costs, and Skill Profit routes. Guest mode only tracks received buffs.</p>
          </div>
          <button className="ghost-button" type="button" onClick={() => saveHousing({ mode: "owner" })}>
            <Home size={16} /> Use Owner Mode
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="housing-tab-panel-profit"
      className="housing-panel room-profit-panel"
      role="tabpanel"
      aria-labelledby="housing-tab-profit"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow"><TrendingUp size={15} /> Room Profit</p>
          <h2>Idle-Time Value</h2>
          <p>
            Compare room tiers by timer length, starts per day, essence cost, daily gain, and build cost.
          </p>
        </div>
        <div className="room-profit-summary">
          <span>{activeProfile?.kind === "main" ? "Main profile" : "Alt profile"}</span>
          <strong>{formatHours(plannerBaseIdleHours)} base</strong>
          <small>{formatHours(plannerOfflineHours)} daily gap before housing</small>
        </div>
      </div>

      <div className="room-profit-controls">
        <ChoicePicker
          label="Room"
          value={profitPlannerFamily}
          options={idleRoomFamilies}
          open={openPicker === "room-profit-family"}
          setOpen={(open) => setOpenPicker(open ? "room-profit-family" : null)}
          onChange={(family) => {
            setProfitPlannerFamily(family);
            setProfitPlannerRoute("");
          }}
        />
        <ChoicePicker
          label="Skill Route"
          value={selectedRoute?.name || ""}
          options={routeRows.map((row) => ({
            value: row.name,
            label: row.name,
            hint: `${row.skill} - ${formatGoldUnit(row.profitPerHour)}/hr`,
          }))}
          open={openPicker === "room-profit-route"}
          setOpen={(open) => setOpenPicker(open ? "room-profit-route" : null)}
          onChange={setProfitPlannerRoute}
          placeholder={plannerSkill ? "No profitable route" : "No profit source"}
        />
        <ChoicePicker
          label="Essence"
          value={profitPlannerEssence}
          options={essenceOptions}
          open={openPicker === "room-profit-essence"}
          setOpen={(open) => setOpenPicker(open ? "room-profit-essence" : null)}
          onChange={setProfitPlannerEssence}
          placeholder="No essence"
        />
      </div>

      <div className="room-profit-context">
        <span><Clock size={15} /> Profile coverage {formatHours(plannerPlaytimeHours)}/day</span>
        <span><Route size={15} /> {plannerSkill || "No Skill Profit source"}</span>
        <span><Package size={15} /> {housing.foundationBuilt ? `${summary.freeSlots} free slot${summary.freeSlots === 1 ? "" : "s"}` : "Foundation needed"}</span>
      </div>

      <div className="cost-share-card">
        <div>
          <span>Build cost split</span>
          <strong>{roomCostShare === 1 ? "Solo" : `${roomCostShare} ways`}</strong>
          <small>Manual scenario only. Splits one-time build cost; daily profit stays per profile.</small>
        </div>
        <div className="cost-share-row" role="group" aria-label="Build cost split">
          {COST_SHARE_OPTIONS.map((share) => (
            <button
              key={share}
              type="button"
              className={roomCostShare === share ? "active" : ""}
              aria-pressed={roomCostShare === share}
              onClick={() => setRoomCostShare(share)}
            >
              {share === 1 ? "Solo" : `${share}x`}
            </button>
          ))}
        </div>
      </div>
      {roomCostShare > summary.guestCapacity + 1 && (
        <div className="room-profit-capacity-warning">
          <AlertTriangle size={15} />
          <span>Current Guest Quarters support owner + {summary.guestCapacity} guest{summary.guestCapacity === 1 ? "" : "s"}; this split is a manual what-if.</span>
        </div>
      )}

      {!plannerSkill ? (
        <div className="planner-empty-state compact-empty-state">
          <Route size={24} />
          <strong>No profit source yet</strong>
          <span>{plannerActivity ? `${getHousingActivityLabel(plannerActivity)} room value needs a reliable profit source before ROI can be estimated.` : "Choose an idle room to estimate ROI."}</span>
        </div>
      ) : !selectedRoute ? (
        <div className="planner-empty-state compact-empty-state">
          <Search size={24} />
          <strong>No reliable route found</strong>
          <span>This skill has no profitable route with complete prices and enough market activity right now.</span>
        </div>
      ) : (
        <>
          <div className="room-profit-explainer">
            <strong>What this is showing</strong>
            <span>
              Daily value starts from the profile hours already covered before housing. Room timer bonus can cover more of the remaining daily gap; if an essence is selected, one crystal is counted per start.
            </span>
          </div>
          <div className="route-value-card">
            <div>
              <span>Route value</span>
              <strong>{selectedRoute.name}</strong>
              <small>{formatGoldUnit(selectedRoute.profitPerHour)}/hr after current prices and profile buffs</small>
            </div>
            <div>
              <span>24h route value</span>
              <strong>{formatGoldUnit(plannerTopTierRow?.projection.fullDayProfit || 0)}</strong>
              <small>Before essence cost and uncovered profile time.</small>
            </div>
            <div>
              <span>Essence cost</span>
              <strong>{profitPlannerEssence ? selectedEssenceHasPrice ? formatGoldUnit(selectedEssenceCost) : "Needs price/data" : "None"}</strong>
              <small>{profitPlannerEssence || "Select one to include crystal savings."}</small>
            </div>
            <div>
              <span>Start change</span>
              <strong>
                {plannerTopTierRow
                  ? `${formatStarts(plannerTopTierRow.projection.baseStartsPerDay)} -> ${formatStarts(plannerTopTierRow.projection.roomStartsPerDay)}`
                  : "-"}
              </strong>
              <small>Tier V comparison for this room.</small>
            </div>
            <div>
              <span>Price data</span>
              <strong>{selectedRoute.priceWarning ? "Spike-safe" : selectedRoute.bestSaleSource === "vendor" ? "Vendor value" : selectedRoute.bestSaleSource === "custom" ? "Custom price" : "Market value"}</strong>
              <small>Custom prices are included where saved.</small>
            </div>
            <div>
              <span>Essence boost</span>
              <strong>{profitPlannerEssence ? selectedEssenceHasPrice ? formatEssenceBuff(selectedEssenceBuff) : "Needs price/data" : "None selected"}</strong>
              <small>
                {profitPlannerEssence
                  ? selectedEssenceHasPrice
                    ? "Included in the route value."
                    : "Add custom or market price data before using the boost."
                  : "Select a matching essence to include its boost."}
              </small>
            </div>
          </div>

          <div className="room-profit-grid">
            {plannerRows.map((row) => {
              const canEstimate = row.missingMaterials.length === 0;
              const isBase = row.tier === 0;
              return (
                <article key={row.label} className={`room-profit-card ${isBase ? "baseline" : ""}`}>
                  <div className="room-profit-card-head">
                    <div>
                      <span>{row.label}</span>
                      <strong>{formatHours(row.projection.roomActionHours)} timer</strong>
                    </div>
                    <small>{formatStarts(row.projection.roomStartsPerDay)}</small>
                  </div>

                  <div className="room-profit-metrics">
                    <div>
                      <span>{roomCostShare === 1 ? "Build cost" : "Your build share"}</span>
                      <strong className={`gold-value ${canEstimate ? "" : "needs-data"}`}>
                        {isBase ? "0g" : canEstimate ? formatGoldUnit(row.projection.buildCostShare) : "Needs price/data"}
                      </strong>
                      {!isBase && row.prerequisiteCost > 0 && <small>Includes {formatGoldUnit(row.prerequisiteCost)} prerequisites</small>}
                      {!isBase && roomCostShare > 1 && <small>{formatGoldUnit(row.projection.fullBuildCost)} full build split {row.projection.costShare} ways</small>}
                      {!isBase && existingRoomFamilyId && selectedRoomFamilyCount > 0 && <small>No refund or upgrade discount assumed</small>}
                    </div>
                    <div>
                      <span>Starts per day</span>
                      <strong>{formatStarts(row.projection.roomStartsPerDay)}</strong>
                      <small>{isBase ? "Current timer." : row.projection.savedStartsPerDay > 0 ? `${row.projection.savedStartsPerDay} fewer than no room.` : "Same as no room."}</small>
                    </div>
                    <div>
                      <span>Essence cost per day</span>
                      <strong className={`gold-value ${profitPlannerEssence && !selectedEssenceHasPrice ? "needs-data" : ""}`}>
                        {profitPlannerEssence ? selectedEssenceHasPrice ? formatGoldUnit(row.projection.roomEssenceCostPerDay) : "Needs price/data" : "0g"}
                      </strong>
                      <small>
                        {profitPlannerEssence
                          ? selectedEssenceHasPrice
                            ? `${row.projection.roomStartsPerDay} x ${formatGoldUnit(row.projection.essenceCost)}`
                            : "Custom or live market price required."
                          : "No essence selected."}
                      </small>
                    </div>
                    <div>
                      <span>Essence saved per day</span>
                      <strong className="gold-value">{formatGoldUnit(row.projection.essenceSavingsPerDay)}</strong>
                      <small>{profitPlannerEssence ? row.projection.essenceSavingsPerDay > 0 ? `${row.projection.savedStartsPerDay} fewer crystal${row.projection.savedStartsPerDay === 1 ? "" : "s"}.` : "No crystal savings." : "Select an essence to count savings."}</small>
                    </div>
                    <div>
                      <span>Daily value after idle gaps</span>
                      <strong className="gold-value">{formatGoldUnit(row.projection.roomDailyNetAfterEssence)}</strong>
                      <small>
                        {`${formatHours(row.projection.roomCoveredHoursPerDay)} covered`}
                        {profitPlannerEssence ? ` - ${formatGoldUnit(row.projection.roomEssenceCostPerDay)} essence` : ""}
                      </small>
                    </div>
                    <div>
                      <span>Extra covered idle time</span>
                      <strong>{formatHours(row.projection.extraHoursPerDay)}</strong>
                      <small>{getExtraIdleTimeNote(row.projection.extraHoursPerDay, row.projection.extraProfitPerDay)}</small>
                    </div>
                    <div>
                      <span>Daily net gain vs no room</span>
                      <strong className="gold-value">{formatGoldUnit(row.projection.netGainPerDay)}</strong>
                      <small>{getDailyGainNote(row.projection, Boolean(profitPlannerEssence && selectedEssenceHasPrice))}</small>
                    </div>
                    <div>
                      <span>Payback from your share</span>
                      <strong>{isBase ? "-" : canEstimate ? formatPayback(row.projection.paybackDays) : "Needs price/data"}</strong>
                    </div>
                  </div>

                  {!canEstimate && (
                    <div className="room-profit-warning">
                      Missing prices: {row.missingMaterials.slice(0, 3).join(", ")}
                      {row.missingMaterials.length > 3 ? ` +${row.missingMaterials.length - 3} more` : ""}
                    </div>
                  )}

                  {isBase ? (
                    <div className="room-profit-note">Baseline: this is what the profile already has before adding this room.</div>
                  ) : canEstimate && row.projection.netGainPerDay > 0 ? (
                    <div className="horizon-list">
                      {roomProfitHorizons.map((days) => {
                        const horizon = row.projection.horizons.find((candidate) => candidate.days === days);
                        return (
                          <div key={`${row.label}-${days}`} className="horizon-row">
                            <span>{days === repairDecayDays ? `${days}d cycle` : `${days}d`}</span>
                            <strong className="gold-value">{formatGoldUnit(horizon?.grossProfit || 0)} gain</strong>
                            <em className={`gold-value ${(horizon?.netProfit || 0) >= 0 ? "positive" : "negative"}`}>
                              {formatSignedGold(horizon?.netProfit || 0)} after cost
                            </em>
                          </div>
                        );
                      })}
                    </div>
                  ) : canEstimate ? (
                    <div className="room-profit-note">
                      {row.projection.savedStartsPerDay > 0
                        ? "This tier reduces starts. Select an essence to price the saved crystals."
                        : "This tier does not reduce starts or cover extra sleep/offline time with the current setup."}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
