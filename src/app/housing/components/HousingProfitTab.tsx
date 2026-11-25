"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Icon } from "@/components/ui/Icon";
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
    plannerEssenceImage,
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
            <Icon name="housing" size="md" aria-hidden="true" /> Use Owner Mode
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
          <p className="eyebrow"><Icon name="skillProfit" size="sm" aria-hidden="true" /> Room Profit</p>
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
        <span><Icon name="timer" size="sm" aria-hidden="true" /> Profile coverage {formatHours(plannerPlaytimeHours)}/day</span>
        <span><Icon name="route" size="sm" aria-hidden="true" /> {plannerSkill || "No Skill Profit source"}</span>
        <span><Icon name="items" size="sm" aria-hidden="true" /> {housing.foundationBuilt ? `${summary.freeSlots} free slot${summary.freeSlots === 1 ? "" : "s"}` : "Foundation needed"}</span>
      </div>

      <div className="cost-share-card">
        <div className="cost-share-info">
          <div className="cost-share-title">
            <span>Build cost split</span>
            <span className="cost-share-badge">{roomCostShare === 1 ? "Solo" : `${roomCostShare} ways`}</span>
          </div>
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
          <Icon name="warning" size="sm" aria-hidden="true" />
          <span>Current Guest Quarters support owner + {summary.guestCapacity} guest{summary.guestCapacity === 1 ? "" : "s"}; this split is a manual what-if.</span>
        </div>
      )}

      {!plannerSkill ? (
        <div className="planner-empty-state compact-empty-state">
          <Icon name="route" size="xl" aria-hidden="true" />
          <strong>No profit source yet</strong>
          <span>{plannerActivity ? `${getHousingActivityLabel(plannerActivity)} room value needs a reliable profit source before ROI can be estimated.` : "Choose an idle room to estimate ROI."}</span>
        </div>
      ) : !selectedRoute ? (
        <div className="planner-empty-state compact-empty-state">
          <Icon name="search" size="xl" aria-hidden="true" />
          <strong>No reliable route found</strong>
          <span>This skill has no profitable route with complete prices and enough market activity right now.</span>
        </div>
      ) : (
        <>
          <div className="room-profit-explainer">
            <Icon name="info" size="sm" aria-hidden="true" />
            <div>
              <strong>What this is showing</strong>
              <span>
                Daily value starts from the profile hours already covered before housing. Room timer bonus can cover more of the remaining daily gap; if an essence is selected, one crystal is counted per start.
              </span>
            </div>
          </div>
          <div className="route-value-card">
            <div>
              <span>Route value</span>
              <strong>{selectedRoute.name}</strong>
              <small className="inline-gold-value">
                <GoldIcon size={12} />
                <span>{formatGoldUnit(selectedRoute.profitPerHour)}/hr after current prices and profile buffs</span>
              </small>
            </div>
            <div>
              <span>24h route value</span>
              <strong className="inline-gold-value">
                <GoldIcon size={14} />
                <span>{formatGoldUnit(plannerTopTierRow?.projection.fullDayProfit || 0)}</span>
              </strong>
              <small>Before essence cost and uncovered profile time.</small>
            </div>
            <div>
              <span>Essence cost</span>
              <strong className={profitPlannerEssence && !selectedEssenceHasPrice ? "needs-data-text" : "inline-gold-value"}>
                {profitPlannerEssence && selectedEssenceHasPrice && <GoldIcon size={14} />}
                <span>{profitPlannerEssence ? selectedEssenceHasPrice ? formatGoldUnit(selectedEssenceCost) : "Needs price/data" : "None"}</span>
              </strong>
              <small className={plannerEssenceImage ? "inline-gold-value" : undefined}>
                {plannerEssenceImage && (
                  <GameImage
                    src={plannerEssenceImage}
                    alt={profitPlannerEssence}
                    width={14}
                    height={14}
                    className="material-item-icon"
                    sizes="14px"
                    aria-hidden="true"
                  />
                )}
                <span>{profitPlannerEssence || "Select one to include crystal savings."}</span>
              </small>
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
              const cycleHorizon = row.projection.horizons.find((candidate) => candidate.days === repairDecayDays);
              const isRoiPositive = !isBase && canEstimate && row.projection.netGainPerDay > 0 && (cycleHorizon?.netProfit || 0) >= 0;
              return (
                <article key={row.label} className={`room-profit-card ${isBase ? "baseline" : ""} ${isRoiPositive ? "roi-positive" : ""}`}>
                  <div className="room-profit-card-head">
                    <div>
                      <span>{row.label}</span>
                      <strong>{formatHours(row.projection.roomActionHours)} timer</strong>
                    </div>
                    <small className="starts-pill">{formatStarts(row.projection.roomStartsPerDay)}</small>
                  </div>

                  <div className="room-profit-metrics">
                    <div>
                      <span>{roomCostShare === 1 ? "Build cost" : "Your build share"}</span>
                      <strong className={`gold-value inline-gold-value ${canEstimate ? "" : "needs-data"}`}>
                        {!isBase && canEstimate && <GoldIcon size={13} />}
                        <span>{isBase ? "0g" : canEstimate ? formatGoldUnit(row.projection.buildCostShare) : "Needs price/data"}</span>
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
                      <strong className={`gold-value inline-gold-value ${profitPlannerEssence && !selectedEssenceHasPrice ? "needs-data" : ""}`}>
                        {(!profitPlannerEssence || selectedEssenceHasPrice) && <GoldIcon size={13} />}
                        <span>{profitPlannerEssence ? selectedEssenceHasPrice ? formatGoldUnit(row.projection.roomEssenceCostPerDay) : "Needs price/data" : "0g"}</span>
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
                      <strong className="gold-value inline-gold-value">
                        <GoldIcon size={13} />
                        <span>{formatGoldUnit(row.projection.essenceSavingsPerDay)}</span>
                      </strong>
                      <small>{profitPlannerEssence ? row.projection.essenceSavingsPerDay > 0 ? `${row.projection.savedStartsPerDay} fewer crystal${row.projection.savedStartsPerDay === 1 ? "" : "s"}.` : "No crystal savings." : "Select an essence to count savings."}</small>
                    </div>
                    <div>
                      <span>Daily value after idle gaps</span>
                      <strong className="gold-value inline-gold-value">
                        <GoldIcon size={13} />
                        <span>{formatGoldUnit(row.projection.roomDailyNetAfterEssence)}</span>
                      </strong>
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
                      <strong className="gold-value inline-gold-value">
                        <GoldIcon size={13} />
                        <span>{formatGoldUnit(row.projection.netGainPerDay)}</span>
                      </strong>
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
                            <strong className="gold-value inline-gold-value">
                              <GoldIcon size={12} />
                              <span>{formatGoldUnit(horizon?.grossProfit || 0)} gain</span>
                            </strong>
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
