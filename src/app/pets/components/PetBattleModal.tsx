"use client";

import React from "react";
import {
  Clock,
  Coins,
  HeartPulse,
  Package,
  Swords,
  Zap,
} from "lucide-react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import {
  type BattleDrop,
  type BattleProfitMode,
  type BattleSelection,
  type FoodPolicy,
} from "../types";
import {
  formatGold,
  formatNumber,
  formatPercent,
  getZoneProfitValue,
  secondsToDuration,
} from "../utils/pet-helpers";
import { PetImage } from "./PetImage";
import styles from "./PetBattleModal.module.css";

export function PetBattleModal({
  selectedBattle,
  selectedBattleDrops,
  battleProfitMode,
  foodPolicy,
  beastmaster,
  onClose,
}: {
  selectedBattle: BattleSelection;
  selectedBattleDrops: BattleDrop[];
  battleProfitMode: BattleProfitMode;
  foodPolicy: FoodPolicy;
  beastmaster: boolean;
  onClose: () => void;
}) {
  const zone = selectedBattle.zone;
  const pet = selectedBattle.pet;

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={`${pet.name} · ${zone.zone}`}
      maxWidth="md"
    >
      <div className={styles.modalContent}>
        {/* 1. Header */}
        <div className={styles.heroBlock}>
          <PetImage pet={pet} size={52} />
          <div className={styles.heroInfo}>
            <h2 className={styles.heroTitle}>{pet.name}</h2>
            <p className={styles.heroSubtitle}>{zone.zone}</p>
          </div>
        </div>

        {/* 2. Key Combat Metrics Grid */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>
              <Clock size={12} aria-hidden="true" /> Battle Time
            </span>
            <span className={styles.metricBoxValue}>
              {secondsToDuration(zone.battleTimeSeconds)}
            </span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>
              <Swords size={12} aria-hidden="true" /> Enemies
            </span>
            <span className={styles.metricBoxValue}>
              {formatNumber(zone.enemiesBattled)}
            </span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>
              <Coins size={12} aria-hidden="true" /> Profit / Hour
            </span>
            <span className={`${styles.metricBoxValue} ${styles.metricBoxGold}`}>
              {formatGold(getZoneProfitValue(zone, battleProfitMode, foodPolicy))}
            </span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>
              <HeartPulse size={12} aria-hidden="true" /> Food Cost / Hr
            </span>
            <span className={styles.metricBoxValue}>
              {formatGold(zone.foodCostPerHourCheapest)}
            </span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>
              <Zap size={12} aria-hidden="true" /> Drain / Battle
            </span>
            <span className={styles.metricBoxValue}>
              {formatNumber(zone.cycle?.staminaDrainPerBattle)} stamina
            </span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>
              <Package size={12} aria-hidden="true" /> Total Drops
            </span>
            <span className={styles.metricBoxValue}>
              {formatNumber(zone.lootPieces)}
            </span>
          </div>
        </div>

        {/* 3. Expected Drops Table */}
        <h3 className={styles.sectionTitle}>Combat Zone Drops</h3>
        {selectedBattleDrops.length > 0 ? (
          <div className={styles.dropTableWrap}>
            <table className={styles.dropTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: "right" }}>Drop Rate</th>
                  <th style={{ textAlign: "right" }}>Market Price</th>
                  <th style={{ textAlign: "right" }}>Best Net Value</th>
                </tr>
              </thead>
              <tbody>
                {selectedBattleDrops.map((drop, idx) => (
                  <tr key={`${drop.itemName}-${idx}`}>
                    <td>{drop.itemName}</td>
                    <td className={styles.numCell}>
                      {formatPercent(drop.expectedDropPercent)}
                    </td>
                    <td className={`${styles.numCell} ${styles.goldText}`}>
                      {formatGold(drop.prices?.marketPrice)}
                    </td>
                    <td className={`${styles.numCell} ${styles.goldText}`}>
                      {formatGold(drop.prices?.bestAfterTaxSellValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--text-tertiary)", fontSize: 13, margin: 0 }}>
            No item drops recorded for this combat sample.
          </p>
        )}
      </div>
    </ModalSheet>
  );
}
