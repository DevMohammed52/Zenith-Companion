"use client";

import React from "react";
import {
  Badge,
  Banner,
  Button,
  ModalSheet,
  NumberInput,
  SegmentedControl,
  Slider,
  Tag,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatStatName } from "@/lib/profile-calculations";
import { formatCompactGold, formatGold, qualityBadgeVariant, slotLabel } from "../types";
import type { UseBisStateResult } from "../hooks/useBisState";
import styles from "../page.module.css";

interface BisCompareModalProps {
  state: UseBisStateResult;
}

export function BisCompareModal({ state }: BisCompareModalProps) {
  const { selected, selectedOptimal } = state;

  if (!selected) return null;

  const optTier = selectedOptimal?.optimalTier || 1;
  const maxTier = state.selectedMaxTier;
  const isDualDaggerCandidate =
    state.selectedType === "DAGGER" && state.activeCombatStyle === "dualDaggers";

  return (
    <ModalSheet
      isOpen={state.isCompareOpen}
      onClose={() => state.setIsCompareOpen(false)}
      title={selected.item.name}
      maxWidth="md"
    >
      <div className={styles.modalBody}>
        <div className={styles.modalHeaderCard}>
          <GameImage
            src={selected.item.image_url}
            alt=""
            width={48}
            height={48}
            className={styles.modalIcon}
          />
          <div>
            <Badge variant={qualityBadgeVariant(selected.item.quality)} size="sm">
              {selected.item.quality}
            </Badge>
            <div style={{ marginTop: "0.2rem", fontSize: "1.05rem", fontWeight: 700 }}>
              <QualityText value={selected.item.quality}>{selected.item.name}</QualityText>
            </div>
            <div className={styles.modalMetaRow}>
              <span>{slotLabel(selected.item.type)}</span>
              <span className={styles.hairlineV} aria-hidden="true" />
              <span>Lv. {selected.requirementLevel}</span>
              <span className={styles.hairlineV} aria-hidden="true" />
              <span>
                {selected.price && selected.priceLabel === "Market" ? (
                  <span className={styles.goldCell}>
                    <GoldIcon size={12} />
                    {formatCompactGold(selected.price)}
                  </span>
                ) : (
                  <span className={styles.mutedCell}>No market listings</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {!selected.eligible && (
          <Banner variant="warning">Requires {selected.unmet.join(", ")} to equip.</Banner>
        )}

        {isDualDaggerCandidate && (
          <SegmentedControl
            value={state.daggerSlotTarget}
            onChange={(val) => state.setDaggerSlotTarget(val as "weapon" | "offhandWeapon")}
            options={[
              { value: "weapon", label: "Main Dagger" },
              { value: "offhandWeapon", label: "Offhand Dagger" },
            ]}
            ariaLabel="Dual dagger slot"
          />
        )}

        {/* Tier Slider + Quick Presets */}
        <div className={styles.tierControlsBox}>
          <div className={styles.tierHeaderRow}>
            <span>Inspect Tier</span>
            <strong>
              T{state.effectiveCandidateTier} of {maxTier}
              {state.effectiveCandidateTier > 1 ? ` (+${state.effectiveCandidateTier - 1} upgrades)` : ""}
            </strong>
          </div>

          {maxTier > 1 && (
            <>
              <Slider
                value={state.effectiveCandidateTier}
                min={1}
                max={maxTier}
                step={1}
                valueFormat={(v) => `T${v}`}
                aria-label="Gear upgrade tier"
                onChange={(val) => state.setCandidateTier(Number(val))}
              />
              <div className={styles.tierPresetRow}>
                <Tag
                  label="Base T1"
                  selected={state.effectiveCandidateTier === 1}
                  onSelect={() => state.setCandidateTier(1)}
                />
                {optTier > 1 && optTier < maxTier && (
                  <Tag
                    label={`Optimal T${optTier}`}
                    selected={state.effectiveCandidateTier === optTier}
                    onSelect={() => state.setCandidateTier(optTier)}
                  />
                )}
                <Tag
                  label={`Max T${maxTier}`}
                  selected={state.effectiveCandidateTier === maxTier}
                  onSelect={() => state.setCandidateTier(maxTier)}
                />
              </div>
            </>
          )}

          {state.currentProfileItem && (
            <div className={styles.baselineStrip}>
              <div className={styles.baselineHeader}>
                <span className={styles.baselineLabel}>Your Equipped Item</span>
                <strong className={styles.baselineName}>{state.currentProfileItem.name}</strong>
              </div>
              {state.currentMaxTier > 1 ? (
                <NumberInput
                  aria-label="Equipped gear tier"
                  value={state.effectiveCompareTier}
                  min={1}
                  max={state.currentMaxTier}
                  onChange={state.setCompareTier}
                />
              ) : (
                <Badge variant="neutral" size="sm">T1</Badge>
              )}
            </div>
          )}
        </div>

        {/* Optimal Tier Advice + Upgrade Stone Cost */}
        {selectedOptimal && (
          <div className={styles.optimalCallout}>
            <div className={styles.optimalHead}>
              <span>Optimal Upgrade Target: T{selectedOptimal.optimalTier}</span>
              <Badge
                variant={selectedOptimal.costTag === "High Soulstone cost" ? "warning" : "refined"}
                size="sm"
              >
                {selectedOptimal.costTag}
              </Badge>
            </div>
            <p className={styles.optimalCopy}>{selectedOptimal.reason}</p>

            {state.effectiveCandidateTier > 1 &&
              state.candidateUpgradeCost.materials.some((m) => m.quantity > 0) && (
              <div className={styles.stoneCostList}>
                {state.candidateUpgradeCost.materials
                  .filter((mat) => mat.quantity > 0)
                  .map((mat) => (
                  <span key={mat.hashedId} className={styles.stonePill}>
                    {mat.imageUrl && (
                      <GameImage
                        src={mat.imageUrl}
                        alt=""
                        width={16}
                        height={16}
                        className={styles.stoneImg}
                      />
                    )}
                    <span>
                      {mat.quantity.toLocaleString()}x {mat.name}
                    </span>
                  </span>
                ))}
                {state.candidateUpgradeCost.hasAllPrices && state.candidateUpgradeCost.totalStoneCost > 0 && (
                  <span className={styles.goldCell}>
                    <GoldIcon size={13} />
                    {formatGold(state.candidateUpgradeCost.totalStoneCost)} stones
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Plain Stat Comparison */}
        <div className={styles.statTableWrap}>
          <table className={styles.compareTable} aria-label="Stat comparison vs equipped gear">
            <thead>
              <tr>
                <th scope="col">Stat</th>
                <th scope="col">{state.currentProfileItem ? "Selected" : "Value"}</th>
                {state.currentProfileItem && (
                  <>
                    <th scope="col">Equipped</th>
                    <th scope="col">Gain</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {state.statComparison.map((row) => {
                const suffix = row.key === "critical_chance" ? "%" : "";
                return (
                  <tr key={row.key}>
                    <td>{formatStatName(row.key)}</td>
                    <td>{`${row.candidate.toLocaleString()}${suffix}`}</td>
                    {state.currentProfileItem && (
                      <>
                        <td>{`${row.current.toLocaleString()}${suffix}`}</td>
                        <td
                          className={
                            row.delta > 0 ? styles.posText : row.delta < 0 ? styles.negText : styles.neutralText
                          }
                        >
                          {row.delta > 0
                            ? `+${row.delta.toLocaleString()}${suffix}`
                            : `${row.delta.toLocaleString()}${suffix}`}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.modalActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => state.openItemByName(selected.item.name)}
          >
            <Icon name="view" size="sm" aria-hidden="true" />
            Item Details
          </Button>

          {state.activeProfile && isDualDaggerCandidate ? (
            (["weapon", "offhandWeapon"] as const).map((slotKey) => {
              const slotName =
                state.activeProfile?.gear?.[slotKey] || "";
              const slotTier = Number(state.activeProfile?.gearTiers?.[slotKey] || 1);
              const sameItem = slotName.toLowerCase() === selected.item.name.toLowerCase();
              const sameTier = sameItem && slotTier === state.effectiveCandidateTier;
              const label = slotKey === "weapon" ? "Main" : "Offhand";

              if (sameTier) {
                return (
                  <Button
                    key={slotKey}
                    variant="secondary"
                    size="sm"
                    onClick={() => state.unequipSlot(slotKey, selected.item.name)}
                  >
                    <Icon name="check" size="sm" aria-hidden="true" />
                    Unequip {label}
                  </Button>
                );
              }

              return (
                <Button
                  key={slotKey}
                  variant={state.daggerSlotTarget === slotKey ? "primary" : "secondary"}
                  size="sm"
                  disabled={!selected.eligible}
                  onClick={() =>
                    state.saveGearToSlot(selected.item, state.effectiveCandidateTier, slotKey)
                  }
                >
                  {sameItem ? `Update ${label} (T${state.effectiveCandidateTier})` : `Save ${label}`}
                </Button>
              );
            })
          ) : state.activeProfile && state.selectedProfileSlot ? (
            (() => {
              const sameItem =
                state.currentProfileItem?.hashed_id === selected.item.hashed_id;
              const sameTier = sameItem && state.effectiveCompareTier === state.effectiveCandidateTier;
              if (sameTier) {
                return (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => state.unequipSlot(state.selectedProfileSlot, selected.item.name)}
                  >
                    <Icon name="check" size="sm" aria-hidden="true" />
                    Equipped (Unequip)
                  </Button>
                );
              }
              return (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selected.eligible}
                  onClick={() =>
                    state.saveGearToSlot(
                      selected.item,
                      state.effectiveCandidateTier,
                      state.selectedProfileSlot,
                    )
                  }
                >
                  {sameItem ? `Update to T${state.effectiveCandidateTier}` : "Equip to Profile"}
                </Button>
              );
            })()
          ) : null}
        </div>
      </div>
    </ModalSheet>
  );
}
