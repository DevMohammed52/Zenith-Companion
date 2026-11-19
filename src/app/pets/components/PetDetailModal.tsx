"use client";

import { createPortal } from "react-dom";
import {
  BadgeInfo,
  Database,
  Egg,
  Gauge,
  Search,
  Shield,
  Swords,
  X,
  Zap,
} from "lucide-react";
import { GameImage } from "@/components/GameImage";
import { useItemModal } from "@/context/ItemModalContext";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { getQualityTextStyle } from "@/lib/quality";
import {
  BATTLE_PROFIT_OPTIONS,
  STAT_LABELS,
  type BattleProfitMode,
  type BattleSelection,
  type FoodPolicy,
  type PetRow,
  type StatKey,
} from "../types";
import {
  formatGold,
  formatNumber,
  getBestBattleZone,
  getMerchantPrice,
  getPetSourceLabel,
  qualityLabel,
  secondsToDuration,
} from "../utils/pet-helpers";
import { PetImage } from "./PetImage";

export function PetDetailModal({
  selectedRow,
  battleProfitMode,
  foodPolicy,
  onClose,
  onSelectBattle,
}: {
  selectedRow: PetRow;
  battleProfitMode: BattleProfitMode;
  foodPolicy: FoodPolicy;
  onClose: () => void;
  onSelectBattle: (selection: BattleSelection) => void;
}) {
  const { openItem, openItemByName } = useItemModal();
  const petDetailDialogRef = useModalA11y<HTMLDivElement>(true, onClose);

  return createPortal(
    <div className="pet-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="pet-detail pet-modal"
        aria-labelledby="pet-detail-title"
        aria-modal="true"
        ref={petDetailDialogRef}
        role="dialog"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="pet-detail-close"
          type="button"
          aria-label="Close pet details"
          onClick={onClose}
          title="Close pet details"
        >
          <X size={16} />
        </button>
        <div className="pet-detail-head">
          <PetImage pet={selectedRow.pet} />
          <div>
            <span
              className="pet-quality-line"
              style={getQualityTextStyle(selectedRow.pet.quality)}
            >
              {qualityLabel(selectedRow.pet.quality)}
            </span>
            <h2 id="pet-detail-title">{selectedRow.pet.name}</h2>
            <p>{getPetSourceLabel(selectedRow.pet)}</p>
          </div>
        </div>

        <div className="pet-detail-metrics">
          <div>
            <Swords size={15} />
            <span>Total Power</span>
            <strong>{formatNumber(selectedRow.totalPower)}</strong>
          </div>
          <div>
            <Gauge size={15} />
            <span>Movement</span>
            <strong>{formatNumber(selectedRow.stats.movement_speed, 2)}m/s</strong>
          </div>
          <div>
            <Search size={15} />
            <span>Hunt Time</span>
            <strong>{secondsToDuration(selectedRow.huntingTime)}</strong>
          </div>
        </div>

        <div className="pet-detail-section">
          <h3>
            <Shield size={15} /> Stats
          </h3>
          <div className="pet-stat-grid">
            {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => (
              <div key={key}>
                <span>{STAT_LABELS[key]}</span>
                <strong>
                  {key === "movement_speed" ||
                  key === "critical_damage" ||
                  key === "critical_chance"
                    ? formatNumber(selectedRow.stats[key], 2)
                    : formatNumber(selectedRow.stats[key])}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="pet-detail-section">
          <h3>
            <Egg size={15} /> Source
          </h3>
          {selectedRow.pet.egg ? (
            <button
              className="pet-egg-button"
              onClick={() => {
                const egg = selectedRow.pet.egg;
                if (!egg) return;
                onClose();
                if (egg.hashedId) openItem(egg.hashedId);
                else openItemByName(egg.name);
              }}
            >
              <GameImage
                src={selectedRow.pet.egg.imageUrl}
                alt=""
                width={34}
                height={34}
                sizes="34px"
                fallback={<Egg size={18} />}
              />
              <span>{selectedRow.pet.egg.name}</span>
              <strong>
                {selectedRow.pet.egg.worldBosses?.map((boss) => boss.name).join(", ") ||
                  "Open item"}
              </strong>
            </button>
          ) : (
            <p className="pet-muted">No linked egg item in the current public item database.</p>
          )}
          {selectedRow.pet.sourceOverride ? (
            <div className="pet-source-override">
              <span>{selectedRow.pet.sourceOverride.label}</span>
              {selectedRow.pet.sourceOverride.merchant?.url ? (
                <a
                  href={selectedRow.pet.sourceOverride.merchant.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {getMerchantPrice(selectedRow.pet.sourceOverride)}
                </a>
              ) : null}
              {selectedRow.pet.sourceOverride.notes?.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          ) : null}
          {selectedRow.pet.acquisition?.length ? (
            <div className="pet-source-list">
              {selectedRow.pet.acquisition.map((entry, index) => (
                <div key={`${entry.egg}-${index}`}>
                  <span>{entry.boss || entry.location || "Unknown source"}</span>
                  <strong>
                    {entry.chancePercent ? `${entry.chancePercent}%` : "Chance pending"} -{" "}
                    {entry.levelRequirement || "No level data"}
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pet-detail-section">
          <h3>
            <Database size={15} /> Exchange Listings
          </h3>
          <p className="pet-section-note">
            These are Companion Exchange listing snapshots, not guaranteed sale prices. Use
            the lowest listing as a market floor and the median/average as context when enough
            listings exist.
          </p>
          <div className="pet-source-list">
            <div>
              <span>Companion Exchange listings</span>
              <strong>{selectedRow.pet.exchange?.listingCount || 0}</strong>
            </div>
            <div>
              <span>Lowest listing</span>
              <strong>{formatGold(selectedRow.pet.exchange?.minPrice)}</strong>
            </div>
            <div>
              <span>Median listing</span>
              <strong>{formatGold(selectedRow.pet.exchange?.medianPrice)}</strong>
            </div>
            <div>
              <span>Average listing</span>
              <strong>{formatGold(selectedRow.pet.exchange?.averagePrice)}</strong>
            </div>
          </div>
          {selectedRow.pet.valuation ? (
            <div className="pet-source-list pet-source-list-spaced">
              <div>
                <span>Value model egg price</span>
                <strong>{formatGold(selectedRow.pet.valuation.eggPrice)}</strong>
              </div>
              <div>
                <span>Level 100 bonus</span>
                <strong>{formatGold(selectedRow.pet.valuation.level100Bonus)}</strong>
              </div>
              <div>
                <span>Sample estimate</span>
                <strong>
                  {formatGold(selectedRow.pet.valuation.samples?.[0]?.roughEstimate)}
                </strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className="pet-detail-section">
          <h3>
            <Zap size={15} /> Battle Context
          </h3>
          <p className="pet-section-note">
            Zone rows are deeper research data, not standalone pet ROI. They are useful for
            comparing pet fit, but actual profit depends more on the character doing combat than
            on the pet alone.
          </p>
          {selectedRow.pet.battle?.zones?.length ? (
            (() => {
              const bestZone = getBestBattleZone(selectedRow.pet, battleProfitMode, foodPolicy);
              return (
                <>
                  <div className="pet-battle-preview">
                    <div>
                      <span>Best sample zone</span>
                      <strong>{bestZone?.zone || "Sample pending"}</strong>
                    </div>
                    <div>
                      <span>Selected mode</span>
                      <strong>
                        {
                          BATTLE_PROFIT_OPTIONS.find((option) => option.value === battleProfitMode)
                            ?.label
                        }
                      </strong>
                    </div>
                    {bestZone ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectBattle({ pet: selectedRow.pet, zone: bestZone });
                        }}
                      >
                        Open best zone
                      </button>
                    ) : null}
                  </div>
                  <details className="pet-battle-details">
                    <summary>
                      <span>
                        {selectedRow.pet.battle.zones.length} zone
                        {selectedRow.pet.battle.zones.length === 1 ? "" : "s"} with battle samples
                      </span>
                      <strong>View all zones</strong>
                    </summary>
                    <div className="pet-zone-list">
                      {selectedRow.pet.battle.zones.map((zone) => (
                        <button
                          type="button"
                          className="pet-zone-button"
                          key={zone.zone}
                          onClick={() => {
                            onClose();
                            onSelectBattle({ pet: selectedRow.pet, zone });
                          }}
                        >
                          <span>{zone.zone}</span>
                          <strong>
                            {secondsToDuration(zone.battleTimeSeconds)} -{" "}
                            {zone.enemiesBattled || "-"} enemies
                          </strong>
                        </button>
                      ))}
                    </div>
                  </details>
                </>
              );
            })()
          ) : (
            <p className="pet-muted">No battle data is available for this pet yet.</p>
          )}
        </div>

        <div className="pet-research-note">
          <BadgeInfo size={15} />
          <span>
            Pet stats update from the scenario controls above. Listing prices, value estimates,
            and battle returns are separate data sources and should not be read as the same type
            of value.
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
