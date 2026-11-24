"use client";

import React from "react";
import {
  Coins,
  Egg,
  ExternalLink,
  Gauge,
  Search,
  Shield,
  Swords,
  Zap,
} from "lucide-react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GameImage } from "@/components/GameImage";
import { useItemModal } from "@/context/ItemModalContext";
import { getQualityPalette } from "@/lib/quality";
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
import styles from "./PetDetailModal.module.css";

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
  const pet = selectedRow.pet;
  const bestZone = getBestBattleZone(pet, battleProfitMode, foodPolicy);

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={pet.name}
      maxWidth="md"
    >
      <div className={styles.modalContent}>
        {/* 1. Hero Block */}
        <div className={styles.heroBlock}>
          <PetImage pet={pet} size={56} />
          <div className={styles.heroInfo}>
            <div className={styles.heroNameRow}>
              <h2 className={styles.heroTitle}>{pet.name}</h2>
              {(() => {
                const palette = getQualityPalette(pet.quality);
                return (
                  <Badge
                    variant="neutral"
                    size="sm"
                    style={{
                      color: palette.textColor,
                      borderColor: palette.border,
                      backgroundColor: palette.background,
                    }}
                  >
                    {qualityLabel(pet.quality)}
                  </Badge>
                );
              })()}
            </div>
            <p className={styles.heroSubtitle}>{getPetSourceLabel(pet)}</p>
          </div>
        </div>

        {/* 2. Key Metrics Banner */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricTile}>
            <span className={styles.metricLabel}>
              <Swords size={13} aria-hidden="true" /> Total Power
            </span>
            <span className={styles.metricValue}>{formatNumber(selectedRow.totalPower)}</span>
          </div>

          <div className={styles.metricTile}>
            <span className={styles.metricLabel}>
              <Gauge size={13} aria-hidden="true" /> Movement
            </span>
            <span className={styles.metricValue}>{formatNumber(selectedRow.stats.movement_speed, 2)}m/s</span>
          </div>

          <div className={styles.metricTile}>
            <span className={styles.metricLabel}>
              <Search size={13} aria-hidden="true" /> Hunt Duration
            </span>
            <span className={styles.metricValue}>{secondsToDuration(selectedRow.huntingTime)}</span>
          </div>
        </div>

        {/* 3. Combat Stats (All 9 Core Attributes) */}
        <section className={styles.section} aria-label="Combat statistics">
          <h3 className={styles.sectionTitle}>
            <Shield size={14} aria-hidden="true" /> Combat Attributes
          </h3>
          <div className={styles.statGrid}>
            {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => (
              <div key={key} className={styles.statBox}>
                <span className={styles.statBoxLabel}>{STAT_LABELS[key]}</span>
                <span className={styles.statBoxValue}>
                  {key === "movement_speed" ||
                  key === "critical_damage" ||
                  key === "critical_chance"
                    ? formatNumber(selectedRow.stats[key], 2)
                    : formatNumber(selectedRow.stats[key])}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Acquisition & Egg Bridge */}
        <section className={styles.section} aria-label="Acquisition and egg details">
          <h3 className={styles.sectionTitle}>
            <Egg size={14} aria-hidden="true" /> Acquisition & Egg
          </h3>

          {pet.egg ? (
            <button
              type="button"
              className={styles.eggCard}
              onClick={() => {
                onClose();
                if (pet.egg?.hashedId) openItem(pet.egg.hashedId);
                else if (pet.egg?.name) openItemByName(pet.egg.name);
              }}
              aria-label={`Open item details for ${pet.egg.name}`}
            >
              <div className={styles.eggLeft}>
                <GameImage
                  src={pet.egg.imageUrl}
                  alt=""
                  width={34}
                  height={34}
                  sizes="34px"
                  fallback={<Egg size={18} />}
                />
                <div>
                  <div className={styles.eggName}>{pet.egg.name}</div>
                  <div className={styles.eggBoss}>
                    {pet.egg.worldBosses?.map((b) => b.name).join(", ") || "Hatchable Egg"}
                  </div>
                </div>
              </div>
              <ExternalLink size={14} style={{ color: "var(--text-tertiary)" }} />
            </button>
          ) : (
            <p style={{ color: "var(--text-tertiary)", fontSize: 13, margin: 0 }}>
              No linked egg item found in the active catalog.
            </p>
          )}

          {pet.acquisition?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {pet.acquisition.map((entry, idx) => (
                <div key={`${entry.boss || entry.location}-${idx}`} className={styles.acquisitionRow}>
                  <span className={styles.acquisitionSource}>
                    {entry.boss || entry.location || "World Encounter"}
                  </span>
                  <span className={styles.acquisitionDetail}>
                    {entry.chancePercent ? `${entry.chancePercent}% drop chance` : "Chance pending"} · {entry.levelRequirement || "No level requirement"}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* 5. Companion Exchange Marketplace */}
        <section className={styles.section} aria-label="Exchange market data">
          <h3 className={styles.sectionTitle}>
            <Coins size={14} aria-hidden="true" /> Companion Exchange
          </h3>
          <div className={styles.exchangeGrid}>
            <div className={styles.exchangeBox}>
              <span className={styles.exchangeBoxLabel}>Active Listings</span>
              <span className={styles.exchangeBoxValue}>{pet.exchange?.listingCount || 0}</span>
            </div>
            <div className={styles.exchangeBox}>
              <span className={styles.exchangeBoxLabel}>Lowest Listing</span>
              <span className={styles.exchangeBoxValue}>{formatGold(pet.exchange?.minPrice)}</span>
            </div>
            <div className={styles.exchangeBox}>
              <span className={styles.exchangeBoxLabel}>Median Listing</span>
              <span className={styles.exchangeBoxValue}>{formatGold(pet.exchange?.medianPrice)}</span>
            </div>
            <div className={styles.exchangeBox}>
              <span className={styles.exchangeBoxLabel}>Average Listing</span>
              <span className={styles.exchangeBoxValue}>{formatGold(pet.exchange?.averagePrice)}</span>
            </div>
          </div>
        </section>

        {/* 6. Battle Combat Preview */}
        <section className={styles.section} aria-label="Combat zone analysis">
          <h3 className={styles.sectionTitle}>
            <Zap size={14} aria-hidden="true" /> Combat Zones
          </h3>
          {pet.battle?.zones?.length ? (
            <div className={styles.battleCard}>
              <div className={styles.battleHeader}>
                <div>
                  <span className={styles.battleZoneName}>{bestZone?.zone || "Citadel"}</span>
                  <p className={styles.battleNotice}>
                    Recommended zone for {BATTLE_PROFIT_OPTIONS.find((o) => o.value === battleProfitMode)?.label}
                  </p>
                </div>
                {bestZone && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Zap size={13} />}
                    onClick={() => {
                      onClose();
                      onSelectBattle({ pet, zone: bestZone });
                    }}
                  >
                    Open Combat Data
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-tertiary)", fontSize: 13, margin: 0 }}>
              No combat zone data available for this companion.
            </p>
          )}
        </section>
      </div>
    </ModalSheet>
  );
}
